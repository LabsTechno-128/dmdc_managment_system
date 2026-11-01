import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  ArrowLeft,
  Printer,
  FlaskConical,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Package,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import JsBarcode from 'jsbarcode';

interface UsedItemInput {
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
const SampleQrMatrixSvg: React.FC<{ value: string; size?: number }> = ({
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

export const SampleCollectionInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const singlePrintRef = useRef<HTMLDivElement>(null);

  // Modal State for Collection & Inventory Deduction
  const [selectedSampleForCollection, setSelectedSampleForCollection] = useState<any | null>(null);
  const [usedItems, setUsedItems] = useState<UsedItemInput[]>([]);
  const [collectionNotes, setCollectionNotes] = useState('');
  const [singleSampleToPrint, setSingleSampleToPrint] = useState<any | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sample-collection-billing', id],
    queryFn: async () => {
      const res = await api.get(`/sample-collection/billing/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  // Query available inventory items
  const { data: inventoryItemsData = [] } = useQuery({
    queryKey: ['inventory-items-available'],
    queryFn: async () => {
      const res = await api.get('/inventory/items');
      return res.data;
    }
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/sample-collection/billing/${id}/initialize`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sample collection initialized successfully!');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to initialize');
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      sampleId,
      status,
      notes,
      items
    }: {
      sampleId: string;
      status: string;
      notes?: string;
      items?: UsedItemInput[];
    }) => {
      const res = await api.patch(`/sample-collection/${sampleId}/status`, {
        status,
        notes,
        items
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sample updated and inventory recorded successfully!');
      setSelectedSampleForCollection(null);
      setUsedItems([]);
      setCollectionNotes('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['sample-collection-billing', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items-available'] });
      queryClient.invalidateQueries({ queryKey: ['stock-usages'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to update sample');
    }
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcodes-${data?.billing?.billNumber || 'Print'}`,
    pageStyle: `
      @page {
        size: auto !important;
        margin: 0 !important;
      }
      @media print {
        html, body {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white;
        }
        #print-barcode, #print-single-barcode {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .barcode-label {
          width: 100% !important;
          height: 100vh !important;
          padding: 2mm;
          margin: 0;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: white;
        }
      }
    `
  });

  const handleSinglePrint = useReactToPrint({
    contentRef: singlePrintRef,
    documentTitle: `Barcode-${singleSampleToPrint?.barcode || 'Print'}`,
    pageStyle: `
      @page {
        size: auto !important;
        margin: 0 !important;
      }
      @media print {
        html, body {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white;
        }
        #print-single-barcode {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .barcode-label {
          width: 100% !important;
          height: 100vh !important;
          padding: 2mm;
          margin: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: white;
        }
      }
    `
  });

  const triggerSinglePrint = (sample: any) => {
    setSingleSampleToPrint(sample);
    setTimeout(() => {
      handleSinglePrint();
    }, 50);
  };

  const billing = data?.billing;
  const initialized = data?.initialized;
  const samples = data?.samples;
  const isPaid = billing?.paymentStatus === 'Paid';

  // Calculate collection-wide equipment totals across all samples (called unconditionally above early returns)
  const allCollectionItems: Array<{ id: string; name: string; unit?: string; quantity: number }> =
    React.useMemo(() => {
      if (!samples || !Array.isArray(samples)) return [];
      const itemMap = new Map<string, { id: string; name: string; unit?: string; quantity: number }>();

      for (const sample of samples) {
        if (sample.inventoryItems && Array.isArray(sample.inventoryItems)) {
          for (const si of sample.inventoryItems) {
            const itemId = si.itemId || si.item?.id;
            const name = si.item?.name || 'Equipment / Consumable';
            const unit = si.item?.unit || 'pcs';
            const qty = Number(si.quantity) || 0;
            if (itemId) {
              const existing = itemMap.get(itemId);
              if (existing) {
                existing.quantity += qty;
              } else {
                itemMap.set(itemId, { id: itemId, name, unit, quantity: qty });
              }
            }
          }
        }
      }
      return Array.from(itemMap.values());
    }, [samples]);

  const totalCollectionItemsCount: number = allCollectionItems.reduce(
    (sum: number, item) => sum + item.quantity,
    0
  );

  const openCollectModal = (sample: any) => {
    setSelectedSampleForCollection(sample);
    setUsedItems([{ itemId: '', quantity: 1 }]);
    setCollectionNotes(sample.notes || '');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading billing information...</div>;
  }

  if (!data || !data.billing) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Billing Not Found</h2>
        <button onClick={() => navigate('/sample-collection')} className="mt-4 text-blue-600 hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COLLECTED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
            <CheckCircle size={14} /> Collected
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
            <Clock size={14} /> Pending
          </span>
        );
      case 'RECOLLECTION_REQUIRED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
            <AlertTriangle size={14} /> Recollection
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
            <XCircle size={14} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Used items management in modal
  const handleAddItem = () => {
    setUsedItems(prev => [...prev, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setUsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof UsedItemInput, value: any) => {
    setUsedItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const hasInvalidItems =
    usedItems.length === 0 ||
    usedItems.some(u => {
      if (!u.itemId) return true;
      const inv = inventoryItemsData.find((item: any) => item.id === u.itemId);
      if (!inv) return true;
      return u.quantity <= 0 || u.quantity > inv.currentStock;
    });

  const isCollectionNotesEmpty = !collectionNotes.trim();
  const isCollectionFormInvalid = hasInvalidItems || isCollectionNotesEmpty;

  const handleConfirmCollection = () => {
    if (!selectedSampleForCollection) return;
    if (hasInvalidItems) {
      toast.error('Please add and select at least one valid inventory item');
      return;
    }
    if (isCollectionNotesEmpty) {
      toast.error('Collection notes are required');
      return;
    }

    statusMutation.mutate({
      sampleId: selectedSampleForCollection.id,
      status: 'COLLECTED',
      notes: collectionNotes.trim(),
      items: usedItems
        .filter(u => u.itemId && u.quantity > 0)
        .map(u => ({ itemId: u.itemId, quantity: Number(u.quantity) }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sample-collection')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Sample Collection
            {!initialized && (
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full uppercase ml-2">
                Preview Mode
              </span>
            )}
          </h2>
          <p className="text-slate-500">Invoice: {billing.billNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Patient Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient ID:</span>{' '}
                <span className="font-semibold text-slate-800">{billing.patient?.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>{' '}
                <span className="font-semibold text-slate-800">{billing.patient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age/Gender:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {billing.patient?.age} / {billing.patient?.gender}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {billing.patient?.contactNumber || '-'}
                </span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-6 mb-4 border-b border-slate-100 pb-2">
              Billing Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{billing.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {new Date(billing.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                  {billing.paymentStatus}
                </span>
              </div>
            </div>

            {!initialized && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => initMutation.mutate()}
                  disabled={initMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <FlaskConical size={18} />
                  {initMutation.isPending ? 'Initializing...' : 'Initialize Sample Collection'}
                </button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  Click to generate tracking barcodes and start collection.
                </p>
              </div>
            )}

            {initialized && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => handlePrint()}
                  className="w-full flex justify-center items-center gap-2 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors text-sm"
                >
                  <Printer size={18} />
                  Print All Barcodes
                </button>
              </div>
            )}
          </div>

          {/* Collection Equipment & Supplies Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-blue-600" size={18} />
                Equipment &amp; Supplies Used
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${totalCollectionItemsCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
              >
                {totalCollectionItemsCount} item{totalCollectionItemsCount === 1 ? '' : 's'} total
              </span>
            </div>

            {allCollectionItems.length > 0 ? (
              <div className="space-y-2">
                {allCollectionItems.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package size={14} className="text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono shrink-0 ml-2 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                      {item.quantity} {item.unit || 'pcs'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Package className="mx-auto text-slate-400 mb-1" size={24} />
                <p className="text-xs font-semibold text-slate-600">No equipment logged yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supplies used will be tracked here across all collections &amp; recollections.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 min-w-0">
          <div className="w-full max-w-[1400px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Test List & Samples</h3>
            </div>
            <div className="w-full max-w-[1400px] max-[999px]:overflow-x-auto min-[1400px]:overflow-x-hidden">
              <table className="w-full max-w-[1400px] max-[999px]:min-w-[640px] text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3.5 text-xs font-bold text-slate-500 uppercase">Test Name</th>
                    <th className="p-3.5 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Sample Type</th>
                    {/* <th className="p-3.5 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Barcode</th> */}
                    <th className="p-3.5 text-xs font-bold text-slate-500 uppercase">Items Used</th>
                    <th className="p-3.5 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Status</th>
                    <th className="p-3.5 text-xs font-bold text-slate-500 uppercase text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((sample: any) => {
                    const sampleItems = sample.inventoryItems || [];
                    const groupedMap = new Map<string, { id: string; name: string; unit?: string; quantity: number }>();
                    for (const si of sampleItems) {
                      const key = si.itemId || si.item?.id || si.id;
                      const name = si.item?.name || 'Item';
                      const unit = si.item?.unit || 'pcs';
                      const qty = Number(si.quantity) || 0;
                      const ex = groupedMap.get(key);
                      if (ex) {
                        ex.quantity += qty;
                      } else {
                        groupedMap.set(key, { id: key, name, unit, quantity: qty });
                      }
                    }
                    const groupedList = Array.from(groupedMap.values());
                    const sampleItemsCount = groupedList.reduce((acc, si) => acc + si.quantity, 0);

                    return (
                      <tr
                        key={sample.id || sample.barcodePreview}
                        className={!initialized ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50'}
                      >
                        <td className="p-3.5 font-medium text-slate-800 break-words">{sample.test?.name}</td>
                        <td className="p-3.5 text-slate-600 break-words">
                          {sample.notes?.trim() ? sample.notes.trim() : 'General'}
                        </td>
                        {/* <td className="p-3.5 font-mono text-sm text-slate-600 whitespace-nowrap">
                          sdafsdaf  {sample.barcode || sample.barcodePreview} sdfgdfgdf
                        </td> */}
                        <td className="p-3.5">
                          {groupedList.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                                  <Package size={11} className="text-blue-600" />
                                  {sampleItemsCount} item{sampleItemsCount === 1 ? '' : 's'} used
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {groupedList.map((si: any) => (
                                  <span
                                    key={si.id}
                                    className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                                  >
                                    <Package size={11} className="text-slate-400" />
                                    {si.quantity}x {si.name}
                                  </span>
                                ))}
                              </div>
                              {sample.status === 'COLLECTED' && (
                                <button
                                  type="button"
                                  onClick={() => openCollectModal(sample)}
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                                >
                                  <Plus size={11} /> Add More
                                </button>
                              )}
                            </div>
                          ) : sample.status === 'COLLECTED' ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                                0 items logged
                              </span>
                              <button
                                type="button"
                                onClick={() => openCollectModal(sample)}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                + Log Equipment
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">{getStatusBadge(sample.status)}</td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {initialized && (sample.status === 'PENDING' || sample.status === 'RECOLLECTION_REQUIRED') && (
                            <button
                              onClick={() => openCollectModal(sample)}
                              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer shadow-sm"
                            >
                              Collect
                            </button>
                          )}
                          {initialized && sample.status === 'COLLECTED' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => triggerSinglePrint(sample)}
                                title="Print Label"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer border border-slate-200 flex items-center gap-1 text-xs"
                              >
                                <Printer size={14} />
                              </button>
                              {groupedList.length === 0 && (
                                <button
                                  onClick={() => openCollectModal(sample)}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium transition-colors cursor-pointer border border-blue-200"
                                >
                                  Log Items
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  statusMutation.mutate({
                                    sampleId: sample.id,
                                    status: 'RECOLLECTION_REQUIRED'
                                  })
                                }
                                disabled={statusMutation.isPending}
                                className="px-2.5 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 border border-orange-200"
                              >
                                Recollect
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Collect Sample & Inventory Deduction Modal */}
      {selectedSampleForCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="pr-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FlaskConical className="text-blue-600" size={18} />
                  {selectedSampleForCollection.status === 'COLLECTED'
                    ? 'Log Additional Equipment'
                    : 'Collect Sample'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Test: <span className="font-semibold text-slate-700">{selectedSampleForCollection.test?.name}</span> ({selectedSampleForCollection.notes?.trim() ? selectedSampleForCollection.notes.trim() : 'General'}) &bull; Barcode: <span className="font-mono text-slate-700">{selectedSampleForCollection.barcode}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSampleForCollection(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              {/* Equipment and Inventory Deduction Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-bold text-slate-800">
                        Equipment &amp; Consumables Used <span className="text-red-500">*</span>
                      </label>
                      {usedItems.filter(u => u.itemId).length > 0 && (
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {usedItems.filter(u => u.itemId).reduce((sum, u) => sum + (Number(u.quantity) || 0), 0)} item(s) selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select syringes, collection tubes, or consumables used. Available stock will decrease automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {usedItems.length === 0 ? (
                  <div className="p-4 bg-red-50/60 border border-dashed border-red-300 rounded-xl text-center text-xs text-red-600">
                    <Package className="mx-auto text-red-400 mb-1" size={24} />
                    <p className="font-medium">At least one inventory item is required. Click &quot;Add Item&quot; to select supplies used.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-3">
                    {usedItems.map((usedItem, index) => {
                      const selectedInvItem = inventoryItemsData.find(
                        (i: any) => i.id === usedItem.itemId
                      );
                      const isOutOfStock = selectedInvItem && selectedInvItem.currentStock <= 0;
                      const isOverStock =
                        selectedInvItem && usedItem.quantity > selectedInvItem.currentStock;
                      const isInvalidQty = usedItem.quantity <= 0;

                      return (
                        <div
                          key={index}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                        >
                          <div className="flex gap-2 items-start">
                            {/* Item Selector */}
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Item <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={usedItem.itemId}
                                onChange={e =>
                                  handleItemChange(index, 'itemId', e.target.value)
                                }
                                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                                  !usedItem.itemId
                                    ? 'border-amber-300 focus:ring-blue-500'
                                    : 'border-slate-200 focus:ring-blue-500'
                                }`}
                              >
                                <option value="">-- Select Item --</option>
                                {inventoryItemsData.map((item: any) => (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                    disabled={item.currentStock <= 0}
                                  >
                                    {item.name} ({item.currentStock > 0 ? `Stock: ${item.currentStock} ${item.unit}` : 'Out of Stock'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity Input */}
                            <div className="w-28">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Qty {selectedInvItem ? `(${selectedInvItem.unit})` : ''} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                max={selectedInvItem?.currentStock || 9999}
                                value={usedItem.quantity}
                                onChange={e =>
                                  handleItemChange(
                                    index,
                                    'quantity',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${isOverStock || isInvalidQty
                                  ? 'border-red-400 focus:ring-red-500'
                                  : 'border-slate-200 focus:ring-blue-500'
                                  }`}
                              />
                            </div>

                            {/* Remove Row Button */}
                            <div className="pt-6">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Inline Feedback / Warnings */}
                          {selectedInvItem && (
                            <div className="text-[11px] flex items-center justify-between px-1">
                              <span className="text-slate-500">
                                Current available stock: <span className="font-semibold text-slate-700">{selectedInvItem.currentStock} {selectedInvItem.unit}</span>
                              </span>
                              {isOverStock && (
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  Exceeds available stock
                                </span>
                              )}
                              {isOutOfStock && (
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  Item is out of stock
                                </span>
                              )}
                              {isInvalidQty && (
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  Must be &ge; 1
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Collection Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={collectionNotes}
                  onChange={e => setCollectionNotes(e.target.value)}
                  placeholder="e.g. Left arm venipuncture, fast completed, good sample volume..."
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    isCollectionNotesEmpty
                      ? 'border-amber-300 focus:ring-blue-500'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
                {isCollectionNotesEmpty && (
                  <p className="mt-1 text-xs text-slate-500">
                    Please enter collection notes and select at least one item to confirm collection.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSelectedSampleForCollection(null)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCollection}
                disabled={statusMutation.isPending || isCollectionFormInvalid}
                className="w-full sm:w-auto px-5 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-center"
              >
                {statusMutation.isPending ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm &amp; Collect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                        <div >PTN Name : {patientName}</div>
                        <div>
                          Age: {patientAge}&nbsp;&nbsp;Sex: {patientSex}
                        </div>
                        <div >Phone : {patientPhone}</div>
                        <div >PTN ID : {patientId}</div>
                        <div >Bill ID : {billNo}</div>
                      </div>
                      <div className="shrink-0 flex items-center justify-center pt-1">
                        <SampleQrMatrixSvg
                          value={billNo}
                          size={54}
                        />
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
                    <SampleQrMatrixSvg
                      value={billing.billNumber || '-'}
                      size={54}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
