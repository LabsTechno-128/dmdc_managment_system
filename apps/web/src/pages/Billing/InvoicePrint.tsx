import React from 'react';
import { Hospital, MapPin, Phone, Mail, FileText } from 'lucide-react';

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
      <div className="p-10">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl">
              <Hospital className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">DMDC Hospital</h1>
              <p className="text-slate-500 font-medium tracking-wide">Diagnostic & Medical Center</p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-500 space-y-1">
            <p className="flex items-center justify-end gap-1"><MapPin size={14} /> 123 Health Avenue, Medical District</p>
            <p className="flex items-center justify-end gap-1"><Phone size={14} /> +880 1234 567 890</p>
            <p className="flex items-center justify-end gap-1"><Mail size={14} /> billing@dmdchospital.com</p>
          </div>
        </div>

        {/* Title & Info */}
        <div className="flex justify-between items-end mb-8">
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
              <div className="mb-1">
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
        <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Patient Details</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-500">Patient ID:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.patientId || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-500">Name:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.name || `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() || 'Unknown'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-500">Age / Sex:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.age || '-'} / {billing.patient?.gender || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-slate-800">{billing.patient?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-500">Patient Type:</span>
              <span className="font-semibold text-slate-800">{billing.patientType === 'OUTSIDE' ? 'Outside / Walk-in' : 'In-House'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1">
              <span className="text-slate-500">Referred By:</span>
              <span className="font-semibold text-slate-800">Self / Walk-in</span>
            </div>
          </div>
        </div>

        {/* Billing Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white text-sm">
                <th className="py-3 px-4 rounded-tl-lg font-medium w-16 text-center">SL</th>
                <th className="py-3 px-4 font-medium">Test / Service Description</th>
                <th className="py-3 px-4 font-medium text-center w-24">Qty</th>
                <th className="py-3 px-4 font-medium text-right w-32">Rate (BDT)</th>
                <th className="py-3 px-4 rounded-tr-lg font-medium text-right w-32">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {billing.items?.map((item: any, index: number) => (
                <tr key={item.id || index} className="border-b border-slate-200 text-sm">
                  <td className="py-3 px-4 text-center text-slate-500">{index + 1}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.test?.name || item.name || item.description || 'Service / Consultation'}</td>
                  <td className="py-3 px-4 text-center text-slate-600">1</td>
                  <td className="py-3 px-4 text-right text-slate-600">{Number(item.price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{Number(item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
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
        <div className="mt-auto border-t-2 border-slate-200 pt-8 flex justify-between items-end">
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
    </div>
  );
});
InvoicePrint.displayName = 'InvoicePrint';


function Barcode({ value }: { value: string }) {
  const bars = [];
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed += value.charCodeAt(i);

  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = 0; i < 45; i++) {
    bars.push(rand() > 0.5 ? 2.5 : 1.2);
  }

  const totalWidth = bars.reduce((a, b) => a + b, 0) + bars.length * 1.2;

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={180} height={32} viewBox={`0 0 ${totalWidth} 28`} className="print:h-6">
        {(() => {
          let x = 0;
          return bars.map((w, i) => {
            const rect = (
              <rect key={i} x={x} y={0} width={w} height={28} fill="black" />
            );
            x += w + 1.2;
            return rect;
          });
        })()}
      </svg>
      <span className="font-mono text-[9px] tracking-widest text-slate-500 mt-0.5">{value}</span>
    </div>
  );
}