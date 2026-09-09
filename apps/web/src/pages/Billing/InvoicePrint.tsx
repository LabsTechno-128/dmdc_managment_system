import React, { useEffect, useRef } from 'react';
import { Hospital, MapPin, Phone, Mail, FileText } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface InvoicePrintProps {
  billing: any;
}

export const InvoicePrint = React.forwardRef<HTMLDivElement, InvoicePrintProps>(({ billing }, ref) => {
  if (!billing) return null;

  return (
    <div id="invoice-print" ref={ref} className="bg-white text-slate-800 font-sans mx-auto max-w-[210mm] min-h-[297mm]">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>
      <div  >
        {/* Header */}

        <div className="flex justify-between bg-green-600 text-white px-3 py-1 flex items-center gap-3">
          {/* Logo */}
          <div className="shrink-0 w-12 h-12 rounded-full bg-white flex flex-col items-center justify-center border-2 border-white shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600" fill="currentColor">
              <path
                d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2zM12 12v9M9 15h6M8 18h8"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <span className="text-[7px] font-bold tracking-wider text-green-700 leading-none mt-0.5">
              DMDC
            </span>
          </div>

          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold leading-tight">
              Dr. Muazzem Medical Diagnostic Center
            </h1>
            <p className="text-xs md:text-sm mt-0.5 opacity-95">
              82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka.
            </p>
            <div className="flex flex-wrap items-baseline gap-x-4 text-xs md:text-[13px] mt-0.5 opacity-95">
              <span>Phone: 01234567890, 01234567899</span>
              <span>E-mail: dmdc.contact@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Title & Info */}
        <div className="flex justify-between items-end px-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              PATIENT INVOICE
            </h2>
            <p className="text-slate-500 mt-1">
              Bill No: <span className="font-semibold text-slate-700">{billing.billNumber || billing.id?.substring(0, 8)}</span>
            </p>
          </div>
          <div className="flex items-end gap-8 text-right">
            {billing.patient?.patientId && (
              <div className="pt-2">
                <Barcode value={billing.patient.patientId} />
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Date</p>
              <p className="font-semibold text-slate-800">{new Date(billing.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Patient Information Box */}
        <div className="bg-slate-50 rounded-xl px-5  border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider  ">Patient Details</h3>
          <div className="grid grid-cols-2 gap-y-1 gap-x-8 text-sm">
            <div className="flex justify-between border-b border-slate-200/60 ">
              <span className="text-slate-500">Patient ID:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.patientId || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 ">
              <span className="text-slate-500">Name:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.name || `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() || 'Unknown'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 ">
              <span className="text-slate-500">Age / Sex:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.age || '-'} / {billing.patient?.gender || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 ">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 ">
              <span className="text-slate-500">Patient Type:</span>
              <span className="font-semibold text-slate-800">{billing.patientType === 'OUTSIDE' ? 'Outside / Walk-in' : 'In-House'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 ">
              <span className="text-slate-500">Referred By:</span>
              <span className="font-semibold text-slate-800">{billing.referredBy || 'Self / Walk-in'}</span>
            </div>
          </div>
        </div>

        {/* Billing Items Table */}
        <TableOfTestList billing={billing} count={10} start={0} />

        {/* Totals */}
        <div className="flex justify-end mb-4 pt-4 px-5">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{Number(billing.subtotal || 0).toFixed(2)} BDT</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Discount {billing.discountType === 'PERCENTAGE' ? `(${billing.discount}%)` : ''}</span>
              <span className="text-red-500">- {Number(billing.discountAmount || 0).toFixed(2)} BDT</span>
            </div>
            {Number(billing.additionalCharges) > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Additional Charges</span>
                <span>+ {Number(billing.additionalCharges).toFixed(2)} BDT</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-800 border-t-2 border-slate-800 pt-2 mt-2">
              <span>Net Payable</span>
              <span>{Number(billing.totalAmount || 0).toFixed(2)} BDT</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600 pt-2">
              <span>Paid Amount</span>
              <span className="font-semibold text-emerald-600">{Number(billing.paidAmount || 0).toFixed(2)} BDT</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Due Amount</span>
              <span className="font-semibold text-red-500">{Number(billing.dueAmount || 0).toFixed(2)} BDT</span>
            </div>

            <div className="flex justify-between text-sm pt-2">
              <span className="text-slate-500">Payment Status:</span>
              <span className={`font-bold ${billing.paymentStatus === 'Paid' ? 'text-emerald-600' : billing.paymentStatus === 'Partial' ? 'text-blue-600' : 'text-amber-600'}`}>
                {billing.paymentStatus?.toUpperCase() || 'UNPAID'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t-2 border-slate-200 pt-4 flex justify-between items-end pl-8 pr-5  fixed bottom-5 w-full">
          <div className="text-xs text-slate-400 space-y-1">
            <p>1. Please collect report within 3 days.</p>
            <p>2. Bring this invoice at the time of report delivery.</p>
            <p>3. Money once paid is not refundable.</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-2"></div>
            <p className="text-sm font-medium text-slate-600">Authorized Signature</p>
          </div>
        </div>
      </div>

      {billing?.items?.length > 10 && <TableOfTestList billing={billing} count={999} start={10} />}
    </div>
  );
});
InvoicePrint.displayName = 'InvoicePrint';

const TableOfTestList = ({ billing, count = 10, start = 0 }: {
  billing: any,
  count?: number,
  start?: number
}) => {

  return (
    <div className="  pt-4">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-green-600 text-white text-sm">
            <th className="py-3 px-4 rounded-tl-lg font-medium w-16 text-center">SL</th>
            <th className="py-3 px-4 font-medium">Test / Service Description</th>
            <th className="py-3 px-4 font-medium text-center w-24">Qty</th>
            <th className="py-3 px-4 font-medium text-right w-32">Rate (BDT)</th>
            <th className="py-3 px-4 rounded-tr-lg font-medium text-right w-32">Amount (BDT)</th>
          </tr>
        </thead>
        <tbody>
          {billing.items?.slice(start, count).map((item: any, index: number) => (
            <tr key={item.id || index} className="border-b border-slate-200 text-sm">
              <td className="py-3 px-4 text-center text-slate-500">{index + 1 + start}</td>
              <td className="py-3 px-4 font-medium text-slate-800">{item.test?.name || item.name || item.description || 'Service / Consultation'}</td>
              <td className="py-3 px-4 text-center text-slate-600">1</td>
              <td className="py-3 px-4 text-right text-slate-600">{Number(item.price).toFixed(2)}</td>
              <td className="py-3 px-4 text-right font-medium text-slate-800">{Number(item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


function Barcode({ value }: { value: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 12,
        margin: 0,
        background: "transparent",
        lineColor: "#1e293b",
      });
    }
  }, [value]);

  return (
    <div className="flex flex-col items-start w-fit">
      <svg ref={barcodeRef}></svg>
    </div>
  );
}

// function Barcode({ value }: { value: string }) {
//   const bars = [];
//   let seed = 0;
//   for (let i = 0; i < value.length; i++) seed += value.charCodeAt(i);

//   let s = seed;
//   const rand = () => {
//     s = (s * 9301 + 49297) % 233280;
//     return s / 233280;
//   };

//   for (let i = 0; i < 45; i++) {
//     bars.push(rand() > 0.5 ? 2.5 : 1.2);
//   }

//   const totalWidth = bars.reduce((a, b) => a + b, 0) + bars.length * 1.2;

//   return (
//     <div className="flex flex-col items-center select-none">
//       <svg width={180} height={32} viewBox={`0 0 ${totalWidth} 28`} className="print:h-6">
//         {(() => {
//           let x = 0;
//           return bars.map((w, i) => {
//             const rect = (
//               <rect key={i} x={x} y={0} width={w} height={28} fill="black" />
//             );
//             x += w + 1.2;
//             return rect;
//           });
//         })()}
//       </svg>
//       <span className="font-mono text-[9px] tracking-widest text-slate-500 mt-0.5">{value}</span>
//     </div>
//   );
// }