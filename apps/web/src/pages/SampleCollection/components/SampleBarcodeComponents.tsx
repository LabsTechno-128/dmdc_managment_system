import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

export interface UsedItemInput {
  itemId: string;
  quantity: number;
}

// Reusable SVG Barcode generator using JsBarcode
export const BarcodeSvg: React.FC<{ value: string; width?: number; height?: number }> = ({
  value,
  width = 1.3,
  height = 28
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000'
        });
      } catch (err) {
        console.warn('Failed to render barcode:', err);
      }
    }
  }, [value, width, height]);

  return <svg ref={svgRef} className="max-w-full h-auto inline-block" />;
};

// Standard ISO/IEC 18004 Scannable QR Code SVG generator (encodes Bill ID for QR scanners)
export const SampleQrMatrixSvg: React.FC<{ value: string; size?: number }> = ({
  value,
  size = 54
}) => {
  const payload = String(value || '-').trim() || '-';
  const utf8Bytes = Array.from(new TextEncoder().encode(payload)).slice(0, 78);

  // Version 1..4 parameters (Error Correction Level L, single block)
  const versionSpecs = [
    { version: 1, size: 21, dataBytes: 19, ecBytes: 7, align: [] as number[] },
    { version: 2, size: 25, dataBytes: 34, ecBytes: 10, align: [6, 18] },
    { version: 3, size: 29, dataBytes: 55, ecBytes: 15, align: [6, 22] },
    { version: 4, size: 33, dataBytes: 80, ecBytes: 20, align: [6, 26] }
  ];
  const spec =
    versionSpecs.find(s => utf8Bytes.length + 2 <= s.dataBytes) || versionSpecs[3];
  const gridSize = spec.size;

  // 1. Build Byte-mode bit stream (0100 + 8-bit length + bytes + terminator + pad bytes)
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };
  pushBits(0b0100, 4);
  pushBits(utf8Bytes.length, 8);
  for (const b of utf8Bytes) pushBits(b, 8);

  const maxDataBits = spec.dataBytes * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCodewords.push(byte);
  }
  let padToggle = true;
  while (dataCodewords.length < spec.dataBytes) {
    dataCodewords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  // 2. Reed-Solomon Error Correction over GF(256) (primitive poly 0x11d)
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let gfVal = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = gfVal;
    exp[i + 255] = gfVal;
    log[gfVal] = i;
    gfVal <<= 1;
    if (gfVal & 0x100) gfVal ^= 0x11d;
  }
  const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);

  let gen = [1];
  for (let i = 0; i < spec.ecBytes; i++) {
    const nextGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gen[j];
      nextGen[j + 1] ^= gfMul(gen[j], exp[i]);
    }
    gen = nextGen;
  }

  const ecCodewords = new Array(spec.ecBytes).fill(0);
  for (const byte of dataCodewords) {
    const factor = byte ^ ecCodewords[0];
    ecCodewords.shift();
    ecCodewords.push(0);
    if (factor !== 0) {
      for (let j = 0; j < spec.ecBytes; j++) {
        ecCodewords[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }

  const allCodewords = [...dataCodewords, ...ecCodewords];
  const allBits: number[] = [];
  for (const cw of allCodewords) {
    for (let i = 7; i >= 0; i--) allBits.push((cw >>> i) & 1);
  }

  // 3. Initialize matrix & function patterns
  const modules: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const inFinder = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const dark =
          inFinder &&
          (dr === 0 ||
            dr === 6 ||
            dc === 0 ||
            dc === 6 ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        setFunctionModule(topR + dr, leftC + dc, dark);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment pattern for Version >= 2
  if (spec.align.length > 1) {
    const center = spec.align[1];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        setFunctionModule(center + dr, center + dc, dist !== 1);
      }
    }
  }

  // Reserve format info & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunctionModule(8, i, false);
      setFunctionModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, gridSize - 1 - i, false);
  }
  for (let i = 0; i < 7; i++) {
    setFunctionModule(gridSize - 1 - i, 8, false);
  }
  setFunctionModule(gridSize - 8, 8, true);

  // 4. Zigzag data placement with Mask 0 ((r + c) % 2 === 0)
  let bitIndex = 0;
  let upward = true;
  for (let rightCol = gridSize - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5;
    for (let step = 0; step < gridSize; step++) {
      const r = upward ? gridSize - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = rightCol - dc;
        if (!isFunction[r][c]) {
          const dataBit = bitIndex < allBits.length ? allBits[bitIndex++] === 1 : false;
          const maskBit = (r + c) % 2 === 0;
          modules[r][c] = dataBit !== maskBit;
        }
      }
    }
    upward = !upward;
  }

  // 5. Write Format Information for Level L (01) and Mask 0 (000) -> 0x77c4 (MSB=14, LSB=0)
  const formatBits = 0x77c4;
  const getFmtBit = (bitPos: number) => ((formatBits >>> bitPos) & 1) === 1;
  for (let c = 0; c <= 5; c++) modules[8][c] = getFmtBit(14 - c);
  modules[8][7] = getFmtBit(8);
  modules[8][8] = getFmtBit(7);
  modules[7][8] = getFmtBit(6);
  for (let r = 0; r <= 5; r++) modules[r][8] = getFmtBit(r);
  for (let i = 0; i < 7; i++) modules[gridSize - 1 - i][8] = getFmtBit(14 - i);
  for (let i = 0; i < 8; i++) modules[8][gridSize - 8 + i] = getFmtBit(7 - i);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-2 -2 ${gridSize + 4} ${gridSize + 4}`}
      shapeRendering="crispEdges"
      className="shrink-0 block"
    >
      <rect x={-2} y={-2} width={gridSize + 4} height={gridSize + 4} fill="#ffffff" />
      {modules.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#000000" />
          ) : null
        )
      )}
    </svg>
  );
};

// Helper to format items used for a sample
export const getSampleItemsSummary = (sample: any) => {
  if (!sample.inventoryItems || sample.inventoryItems.length === 0) {
    return 'No equipment logged';
  }
  const map = new Map<string, { name: string; quantity: number }>();
  for (const si of sample.inventoryItems) {
    const key = si.itemId || si.item?.id || si.id;
    const name = si.item?.name || 'Equipment';
    const qty = Number(si.quantity) || 0;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      map.set(key, { name, quantity: qty });
    }
  }
  return Array.from(map.values())
    .map(i => `${i.quantity}x ${i.name}`)
    .join(', ');
};

interface SamplePrintLabelsProps {
  printRef: React.RefObject<HTMLDivElement | null>;
  singlePrintRef: React.RefObject<HTMLDivElement | null>;
  initialized: boolean;
  samples: any[];
  billing: any;
  singleSampleToPrint: any | null;
}

export const SamplePrintLabels: React.FC<SamplePrintLabelsProps> = ({
  printRef,
  singlePrintRef,
  initialized,
  samples,
  billing,
  singleSampleToPrint
}) => {
  return (
    <>
      {/* Hidden Print Area - All Barcodes */}
      <div className="hidden">
        <div ref={printRef} id="print-barcode">
          {initialized &&
            samples.map((sample: any) => {
              const patientName =
                billing.patient?.name ||
                `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() ||
                '-';
              const patientAge =
                billing.patient?.age !== undefined && billing.patient?.age !== null
                  ? String(billing.patient.age).padStart(2, '0')
                  : '-';
              const patientSex = billing.patient?.gender
                ? String(billing.patient.gender).charAt(0).toUpperCase()
                : '-';
              const patientPhone =
                billing.patient?.phone || billing.patient?.contactNumber || '-';
              const patientId = billing.patient?.patientId || '-';
              const billNo = billing.billNumber || '-';

              return (
                <div key={sample.id} className="barcode-label">
                  <div className="w-full h-full flex items-center justify-center p-1">
                    <div className="w-full max-w-[260px] rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 flex items-center justify-between gap-3 text-left font-sans text-black">
                      <div className="min-w-0 flex-1 space-y-0.5 text-[8px] font-bold leading-snug text-black">
                        <div>PTN Name : {patientName}</div>
                        <div>
                          Age: {patientAge}&nbsp;&nbsp;Sex: {patientSex}
                        </div>
                        <div>Phone : {patientPhone}</div>
                        <div>PTN ID : {patientId}</div>
                        <div>Bill ID : {billNo}</div>
                      </div>
                      <div className="shrink-0 flex items-center justify-center pt-1">
                        <SampleQrMatrixSvg value={billNo} size={54} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Hidden Print Area - Single Sample Barcode */}
      <div className="hidden">
        <div ref={singlePrintRef} id="print-single-barcode">
          {singleSampleToPrint && (
            <div className="barcode-label">
              <div className="w-full h-full flex items-center justify-center p-1">
                <div className="w-full max-w-[260px] rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 flex items-center justify-between gap-3 text-left font-sans text-black">
                  <div className="min-w-0 flex-1 space-y-0.5 text-[11px] font-bold leading-snug text-black">
                    <div className="truncate">
                      PTN Name :{' '}
                      {billing.patient?.name ||
                        `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() ||
                        '-'}
                    </div>
                    <div>
                      Age:{' '}
                      {billing.patient?.age !== undefined && billing.patient?.age !== null
                        ? String(billing.patient.age).padStart(2, '0')
                        : '-'}
                      &nbsp;&nbsp;Sex:{' '}
                      {billing.patient?.gender
                        ? String(billing.patient.gender).charAt(0).toUpperCase()
                        : '-'}
                    </div>
                    <div className="truncate">
                      Phone : {billing.patient?.phone || billing.patient?.contactNumber || '-'}
                    </div>
                    <div className="truncate">PTN ID : {billing.patient?.patientId || '-'}</div>
                    <div className="truncate">Bill ID : {billing.billNumber || '-'}</div>
                  </div>
                  <div className="shrink-0 flex items-center justify-center pt-1">
                    <SampleQrMatrixSvg value={billing.billNumber || '-'} size={54} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

