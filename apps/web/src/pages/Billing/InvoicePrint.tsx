import React, { useEffect, useRef } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface InvoicePrintProps {
  billing: any;
}

export const InvoicePrint = React.forwardRef<HTMLDivElement, InvoicePrintProps>(({ billing }, ref) => {
  if (!billing) return null;

  const clinicName = billing.clinic?.name || billing.hospitalSetting?.centerName || 'Dr. Muazzem Medical Diagnostic Center';
  const clinicAddress = billing.clinic?.address || billing.hospitalSetting?.address || '82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka';
  const clinicPhone = billing.clinic?.phone || billing.hospitalSetting?.phone || '01234567890, 01234567899';
  const clinicEmail = billing.clinic?.email || billing.hospitalSetting?.email || 'dmdc.contact@gmail.com';
  const binNumber = billing.clinic?.bin || billing.hospitalSetting?.bin || '001234567-0101';
  const musakForm = billing.clinic?.musakForm || billing.hospitalSetting?.musakForm || 'Mushak-6.3 (মূসক-৬.৩)';

  const patientName = billing.patient?.name || `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() || 'Unknown';
  const subtotal = Number(billing.subtotal || 0);
  const discountAmount = Number(billing.discountAmount || 0);
  const taxableAmount = Number(
    billing.taxableAmount !== undefined && billing.taxableAmount !== null
      ? billing.taxableAmount
      : Math.max(0, subtotal - discountAmount)
  );
  const vatRate = Number(billing.vatRate || 0);
  const vatAmount = Number(billing.vatAmount || 0);
  const additionalCharges = Number(billing.additionalCharges || 0);
  const totalAmount = Number(billing.totalAmount || 0);
  const paidAmount = Number(billing.paidAmount || 0);
  const waivedAmount = Number(billing.waivedAmount || 0);
  const dueAmount = Number(billing.dueAmount || 0);

  const authorizerName = billing.authorizedBy
    ? `${billing.authorizedBy.firstName || ''} ${billing.authorizedBy.lastName || ''}`.trim() || billing.authorizedBy.name || billing.authorizedBy.email
    : billing.createdBy
      ? `${billing.createdBy.firstName || ''} ${billing.createdBy.lastName || ''}`.trim() || billing.createdBy.name
      : 'Authorized Staff';

  const authorizerRole = billing.authorizedBy?.role?.replace(/_/g, ' ') || billing.createdBy?.role?.replace(/_/g, ' ') || 'Billing Desk';

  return (
    <div
      id="invoice-print"
      ref={ref}
      className="bg-white text-slate-800 font-sans mx-auto w-[148mm] min-h-[210mm] p-3 flex flex-col justify-between box-border text-[8px] leading-tight"
    >
      <style type="text/css" media="print">
        {`
          @page { size: A5; margin: 3mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: ui-sans-serif, system-ui, sans-serif; }
          * { box-sizing: border-box; }
        `}
      </style>

      <div className="space-y-2">
        {/* Header Banner */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-1.5 gap-2">
          {/* Logo & Center Details */}
          <div className="flex items-center gap-2 flex-1">
            <div className="shrink-0 w-9 h-9 rounded-full bg-slate-900 text-white flex flex-col items-center justify-center border border-slate-700 shadow-xs">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400" fill="currentColor">
                <path
                  d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2zM12 12v9M9 15h6M8 18h8"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
              <span className="text-[6px] font-bold tracking-wider text-white leading-none">
                DMDC
              </span>
            </div>

            <div>
              <h1 className="text-[10px] font-bold text-slate-900 uppercase tracking-tight leading-snug">
                {clinicName}
              </h1>
              <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                {clinicAddress}
              </p>
              <div className="flex flex-wrap gap-x-2 text-[8px] text-slate-500 mt-0.5 font-mono">
                <span>Tel: {clinicPhone}</span>
                <span>•</span>
                <span>Email: {clinicEmail}</span>
              </div>
            </div>
          </div>

          {/* MUSAK & BIN Official Tax Box */}
          <div className="shrink-0 text-right bg-slate-50 border border-slate-300 rounded px-2 py-1 space-y-0.5">
            <div className="text-[9px] font-bold text-slate-900 tracking-wide uppercase">
              {musakForm}
            </div>
            <div className="text-[8px] text-slate-700 font-mono">
              BIN: <strong className="font-bold text-slate-950">{binNumber}</strong>
            </div>
            <div className="text-[8px] text-slate-500">
              NBR Tax Invoice / কর চালানপত্র
            </div>
          </div>
        </div>

        {/* Invoice Title & Meta Bar */}
        <div className="flex justify-between items-center bg-slate-100/90 border border-slate-200 px-2 py-1 rounded">
          <div className="flex items-center gap-1.5">
            <FileText size={12} className="text-emerald-700" />
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
              PATIENT INVOICE
            </h2>
            <span className="text-[8px] text-slate-400">|</span>
            <span className="text-[8px] text-slate-600">
              Bill No: <strong className="font-mono text-slate-900">{billing.billNumber || billing.id?.substring(0, 8)}</strong>
            </span>
            {billing.musakChallanNumber && (
              <>
                <span className="text-[8px] text-slate-400">|</span>
                <span className="text-[8px] text-slate-600">
                  Challan: <strong className="font-mono text-slate-900">{billing.musakChallanNumber}</strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {billing.patient?.patientId && (
              <div className="scale-90 origin-right">
                <Barcode value={billing.patient.patientId} />
              </div>
            )}
            <div className="text-right text-[8px]">
              <span className="text-slate-500 block">Invoice Date</span>
              <span className="font-mono font-bold text-slate-900">
                {billing.createdAt ? new Date(billing.createdAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }) : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Details Card */}
        <div className="border border-slate-200 rounded px-2 py-1 bg-white">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-0.5 mb-1 flex items-center justify-between">
            <span>Patient Information / রোগীর বিবরণ</span>
            <span className="text-[8px] font-normal text-slate-500 font-mono">
              Type: {billing.patientType === 'OUTSIDE' ? 'Outside / Walk-in' : 'Registered Patient'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[8px]">
            <div>
              <span className="text-slate-500">Patient ID: </span>
              <strong className="font-mono text-slate-900">{billing.patient?.patientId || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Name: </span>
              <strong className="text-slate-900">{patientName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Age / Gender: </span>
              <strong className="text-slate-900">{billing.patient?.age || '-'} Y / {billing.patient?.gender || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Contact: </span>
              <strong className="font-mono text-slate-900">{billing.patient?.phone || 'N/A'}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Referred By: </span>
              <strong className="text-slate-900 truncate inline-block max-w-[200px] align-bottom">
                {billing.referredBy || (billing.doctor ? `Dr. ${billing.doctor.name}` : 'Self / Direct')}
              </strong>
            </div>
          </div>
        </div>

        {/* Billable Items Table */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
            Billable Items & Services / সেবাসমূহ
          </div>
          <TableOfTestList billing={billing} count={10} start={0} />
        </div>

        {/* Summary & Financial Breakdown */}
        <div className="flex justify-between items-start gap-3 pt-1">
          {/* Terms & Payment Notice */}
          <div className="flex-1 space-y-1 text-[8px] text-slate-500 pt-0.5 pr-2">
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50/60 space-y-0.5">
              <p className="font-semibold text-slate-700 text-[8px]">Notice & Terms:</p>
              <p>• Please collect test reports within 3 days. Bring this invoice at delivery.</p>
              <p>• Mushak-6.3 tax invoice issued under Bangladesh VAT & Supplementary Duty Act.</p>
              <p>• Amounts once paid are non-refundable.</p>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-slate-600 font-medium">Payment Status:</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                billing.paymentStatus === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : billing.paymentStatus === 'Partial'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {billing.paymentStatus || 'UNPAID'}
              </span>
            </div>
          </div>

          {/* Totals Table */}
          <div className="w-[62mm] border border-slate-300 rounded bg-white overflow-hidden shrink-0">
            <div className="bg-slate-100 px-2 py-0.5 border-b border-slate-300 font-bold text-[9px] text-slate-800 uppercase tracking-wide">
              Payment Summary
            </div>
            <div className="p-1.5 space-y-1 text-[8px]">
              <div className="flex justify-between text-slate-600">
                <span className="text-[9px]">Subtotal:</span>
                <span className="font-mono text-[8px] font-semibold">{subtotal.toFixed(2)} BDT</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span className="text-[9px]">
                    Discount {billing.discountType === 'PERCENTAGE' ? `(${billing.discount}%)` : ''}:
                  </span>
                  <span className="font-mono text-[8px] font-semibold">- {discountAmount.toFixed(2)} BDT</span>
                </div>
              )}

              <div className="flex justify-between bg-slate-50 px-1 py-0.5 rounded text-slate-700 border border-slate-200">
                <span className="text-[9px] font-semibold">Taxable Amount:</span>
                <span className="font-mono text-[8px] font-bold">{taxableAmount.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span className="text-[9px]">VAT ({vatRate}%):</span>
                <span className="font-mono text-[8px] font-semibold">
                  {vatAmount > 0 ? `+ ${vatAmount.toFixed(2)}` : '0.00'} BDT
                </span>
              </div>

              {additionalCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span className="text-[9px]">Additional Charges:</span>
                  <span className="font-mono text-[8px] font-semibold">+ {additionalCharges.toFixed(2)} BDT</span>
                </div>
              )}

              <div className="flex justify-between border-t-2 border-slate-800 pt-1 text-slate-900 font-bold">
                <span className="text-[10px] uppercase">Invoice Total:</span>
                <span className="font-mono text-[10px]">{totalAmount.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-bold pt-0.5">
                <span className="text-[9px]">Amount Paid:</span>
                <span className="font-mono text-[8px]">{paidAmount.toFixed(2)} BDT</span>
              </div>

              {waivedAmount > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span className="text-[9px]">Waived / Settled:</span>
                  <span className="font-mono text-[8px]">- {waivedAmount.toFixed(2)} BDT</span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span className={`text-[9px] ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  Outstanding Due:
                </span>
                <span className={`font-mono text-[9px] ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {dueAmount.toFixed(2)} BDT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Signature & Authorization Section */}
      <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between items-end">
        <div className="text-[8px] text-slate-400">
          <p>Software Generated Invoice • Dr. Muazzem Medical Diagnostic Center</p>
        </div>

        <div className="text-right">
          <div className="w-40 border-b border-slate-600 mb-1 ml-auto"></div>
          <div className="text-[10px] font-bold text-slate-900 flex items-center justify-end gap-1">
            <ShieldCheck size={11} className="text-emerald-600" />
            <span>Authorized By</span>
          </div>
          <p className="text-[9px] font-semibold text-slate-800">
            {authorizerName}
          </p>
          <p className="text-[8px] text-slate-500 uppercase font-mono">
            {authorizerRole}
          </p>
          {billing.authorizedAt && (
            <p className="text-[8px] text-slate-400 font-mono mt-0.5">
              Signed: {new Date(billing.authorizedAt).toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short'
              })}
            </p>
          )}
        </div>
      </div>

      {billing?.items?.length > 10 && (
        <div className="pt-3 page-break-before">
          <TableOfTestList billing={billing} count={999} start={10} />
        </div>
      )}
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';

const TableOfTestList = ({
  billing,
  count = 10,
  start = 0,
}: {
  billing: any;
  count?: number;
  start?: number;
}) => {
  const items = billing.items?.slice(start, start + count) || [];

  return (
    <div className="w-full border border-slate-300 rounded overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-800 text-white text-[9px] uppercase tracking-wider font-semibold">
            <th className="py-1 px-1.5 w-8 text-center border-r border-slate-700">SL</th>
            <th className="py-1 px-2 border-r border-slate-700">Test / Service Description</th>
            <th className="py-1 px-1.5 text-center w-12 border-r border-slate-700">Qty</th>
            <th className="py-1 px-2 text-right w-20 border-r border-slate-700">Rate (BDT)</th>
            <th className="py-1 px-2 text-right w-24">Amount (BDT)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-[8px]">
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-2 text-center text-slate-400">
                No billable items on this invoice.
              </td>
            </tr>
          ) : (
            items.map((item: any, index: number) => {
              const price = Number(item.price || 0);
              const qty = Number(item.quantity || 1);
              const rowTotal = price * qty;

              return (
                <tr key={item.id || index} className="hover:bg-slate-50/50">
                  <td className="py-1 px-1.5 text-center text-slate-500 font-mono border-r border-slate-200">
                    {index + 1 + start}
                  </td>
                  <td className="py-1 px-2 font-medium text-slate-900 border-r border-slate-200">
                    {item.test?.name || item.name || item.description || 'Medical Consultation / Service'}
                  </td>
                  <td className="py-1 px-1.5 text-center text-slate-600 font-mono border-r border-slate-200">
                    {qty}
                  </td>
                  <td className="py-1 px-2 text-right text-slate-600 font-mono border-r border-slate-200">
                    {price.toFixed(2)}
                  </td>
                  <td className="py-1 px-2 text-right font-bold text-slate-900 font-mono">
                    {rowTotal.toFixed(2)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

function Barcode({ value }: { value: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: 'CODE128',
          width: 1.1,
          height: 18,
          displayValue: true,
          fontSize: 8,
          margin: 0,
          background: 'transparent',
          lineColor: '#0f172a',
        });
      } catch (e) {
        console.warn('Failed to render barcode:', e);
      }
    }
  }, [value]);

  return (
    <div className="flex flex-col items-end">
      <svg ref={barcodeRef}></svg>
    </div>
  );
}