import React, { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { SampleQrMatrixSvg } from '../SampleCollection/components/SampleBarcodeComponents';

export type InvoiceCopyType = 'BOTH' | 'PATIENT' | 'OFFICE';

export interface InvoicePrintProps {
  billing: any;
  copyType?: InvoiceCopyType;
}

export const InvoicePrint = React.forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ billing, copyType = 'BOTH' }, ref) => {
    if (!billing) return null;

    return (
      <div id="invoice-print" ref={ref} className="bg-white text-slate-800">
        <style type="text/css" media="print">
          {`
            @page {
              size: A5 portrait;
              margin: 5mm;
            }
            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-family: 'Inter', 'Noto Sans Bengali', system-ui, sans-serif;
              font-variant-numeric: lining-nums tabular-nums;
              font-feature-settings: 'lnum' 1, 'tnum' 1;
              background: white !important;
            }
            * {
              box-sizing: border-box;
            }
            #invoice-print {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              background: white !important;
            }
            .invoice-sheet {
              width: 100% !important;
              max-width: 138mm !important;
              min-height: 192mm !important;
              max-height: 198mm !important;
              padding: 2mm 3mm !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .invoice-payment-summary {
              width: 58mm !important;
              max-width: 58mm !important;
            }
            #invoice-print table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
            }
            .invoice-page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
          `}
        </style>

        {copyType === 'PATIENT' && (
          <SingleInvoiceSheet billing={billing} copyType="PATIENT" />
        )}

        {copyType === 'OFFICE' && (
          <SingleInvoiceSheet billing={billing} copyType="OFFICE" />
        )}

        {copyType === 'BOTH' && (
          <div className="space-y-6 print:space-y-0">
            <div className="invoice-page-break">
              <SingleInvoiceSheet billing={billing} copyType="PATIENT" />
            </div>
            <div>
              <SingleInvoiceSheet billing={billing} copyType="OFFICE" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

InvoicePrint.displayName = 'InvoicePrint';

interface SingleInvoiceSheetProps {
  billing: any;
  copyType: 'PATIENT' | 'OFFICE';
}

const SingleInvoiceSheet: React.FC<SingleInvoiceSheetProps> = ({ billing, copyType }) => {
  const clinicName =
    billing.clinic?.name ||
    billing.hospitalSetting?.centerName ||
    'Dr. Muazzem Medical Diagnostic Center';
  const clinicAddress =
    billing.clinic?.address ||
    billing.hospitalSetting?.address ||
    '82-83, AS-Salam Tower (2nd Floor), Zoo Road, Mirpur-1, Dhaka-1216';
  const clinicPhone =
    billing.clinic?.phone ||
    billing.hospitalSetting?.phone ||
    '01787-838001, 01313-666037';
  const clinicWeb =
    billing.clinic?.website ||
    billing.hospitalSetting?.website ||
    'dmdc-med.com';
  const clinicEmail =
    billing.clinic?.email ||
    billing.hospitalSetting?.email ||
    'dmdc.contact@gmail.com';

  const patientName =
    billing.patient?.name ||
    `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() ||
    '';
  const patientPhone =
    billing.patient?.phone || billing.patient?.contactNumber || '';
  const sexInitial = billing.patient?.gender
    ? String(billing.patient.gender).trim().charAt(0).toUpperCase()
    : '-';
  const patientAge =
    billing.patient?.age !== undefined && billing.patient?.age !== null && billing.patient?.age !== ''
      ? String(billing.patient.age)
      : '-';

  const patientTypeLabel =
    billing.patientType === 'OUTSIDE'
      ? 'Outside'
      : billing.patientType === 'REGISTERED'
        ? 'Registered'
        : billing.patientType || '';

  const referredByDisplay = billing.referredByDoctor
    ? (() => {
      const docName = `Dr. ${billing.referredByDoctor.firstName || ''} ${billing.referredByDoctor.lastName || ''}`.trim();
      const docSpec = (billing.referredByDoctor.specialization || '').trim();
      if (billing.referredBy && billing.referredBy.trim()) {
        const refText = billing.referredBy.trim();
        return docSpec && !refText.toLowerCase().includes(docSpec.toLowerCase())
          ? `${refText} (${docSpec})`
          : refText;
      }
      return docSpec ? `${docName} (${docSpec})` : docName;
    })()
    : billing.referredBy ||
    (billing.doctor
      ? (() => {
        const docName =
          `Dr. ${billing.doctor.firstName || ''} ${billing.doctor.lastName || ''}`.trim() ||
          billing.doctor.name ||
          '';
        const docSpec = (billing.doctor.specialization || '').trim();
        return docSpec && docName ? `${docName} (${docSpec})` : docName;
      })()
      : '');

  const subtotal = Number(billing.subtotal || 0);
  const discountAmount = Number(billing.discountAmount || 0);
  const additionalCharges = Number(billing.additionalCharges || 0);
  const totalAmount = Number(billing.totalAmount || 0);
  const paidAmount = Number(billing.paidAmount || 0);
  const waivedAmount = Number(billing.waivedAmount || 0);
  const dueAmount = Number(billing.dueAmount || 0);

  const authorizerName = billing.authorizedBy
    ? `${billing.authorizedBy.firstName || ''} ${billing.authorizedBy.lastName || ''}`.trim() ||
    billing.authorizedBy.name ||
    billing.authorizedBy.email
    : billing.createdBy
      ? `${billing.createdBy.firstName || ''} ${billing.createdBy.lastName || ''}`.trim() ||
      billing.createdBy.name
      : 'Authorized Staff';

  const authorizerRole =
    billing.authorizedBy?.role?.replace(/_/g, ' ') ||
    billing.createdBy?.role?.replace(/_/g, ' ') ||
    'Billing Desk';

  const invoiceDateObj = billing.createdAt ? new Date(billing.createdAt) : new Date();
  const dayStr = invoiceDateObj.toLocaleDateString('en-GB', { day: '2-digit' });
  const monthStr = invoiceDateObj.toLocaleDateString('en-GB', { month: 'long' });
  const yearStr = invoiceDateObj.toLocaleDateString('en-GB', { year: 'numeric' });
  const formattedInvoiceDate = `${dayStr} ${monthStr}, ${yearStr}`;

  const rawTimeStr = invoiceDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const formattedInvoiceTime = rawTimeStr.replace(':', ' : ');

  const billNumberText = billing.billNumber || billing.id?.substring(0, 8) || '-';
  const copyLabel = copyType === 'OFFICE' ? 'Office Copy' : 'Patient Copy';
  // const copyLabel = copyType === 'OFFICE' ? 'Office Copy' : 'Patient Copy';

  return (
    <div className="invoice-sheet bg-white text-slate-800 font-sans mx-auto w-full max-w-[148mm] min-h-[195mm] p-3.5 flex flex-col justify-between box-border text-[8.5px] leading-tight print:w-[138mm] print:max-w-[138mm] print:min-h-[192mm] print:max-h-[198mm] print:p-[2mm_3mm]">
      <div className="space-y-2.5">
        {/* Header Banner */}
        <div className="flex justify-between items-center border-b border-[#3b5978] pb-2 gap-2">
          {/* Logo & Center Details */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img
              src="/dmdc_logo.jpeg"
              alt="DMDC Logo"
              className="shrink-0 w-11 h-11 object-contain"
            />

            <div className="min-w-0 flex-1">
              <h1 className="text-[14.5px] font-bold text-black tracking-tight leading-tight truncate">
                {clinicName}
              </h1>
              <p className="text-[7.5px] font-semibold text-black leading-snug mt-0.5">
                {clinicAddress}
              </p>
              <p className="text-[7.5px] font-semibold text-black leading-snug">
                Phone: {clinicPhone}, Web: {clinicWeb}, Email: {clinicEmail}
              </p>
            </div>
          </div>

          {/* MUSAK & BIN Official Tax Box */}
          {/* <div className="shrink-0 text-right bg-slate-50 border border-slate-300 rounded px-2.5 py-1 space-y-0.5">
            <div className="text-[8.5px] font-bold text-slate-900 tracking-wide uppercase">
              {musakForm}
            </div>
            <div className="text-[8px] text-slate-700 font-mono">
              BIN: <strong className="font-bold text-slate-950">{binNumber}</strong>
            </div>
            <div className="text-[7.5px] text-slate-500">
              NBR Tax Invoice / কর চালানপত্র
            </div>
          </div> */}
        </div>

        {/* Patient Invoice Pill Box (Left) & Scannable QR Code (Right) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 bg-[#efefef] rounded-xl overflow-hidden">
            <div className="py-1 px-3 text-center">
              <h2 className="text-[13.5px] font-bold text-black leading-tight">
                Patient Invoice ({copyLabel})
              </h2>
            </div>
            <div className="border-t border-[#3b5978]" />
            <div className="py-1.5 px-3 flex items-center justify-between gap-2 text-[8.5px] font-semibold text-black whitespace-nowrap">
              <span>
                Invoice Date &amp; Time: {formattedInvoiceDate} | {formattedInvoiceTime} |
              </span>
              <span>
                BILL ID: <strong className="font-bold text-black">{billNumberText}</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <SampleQrMatrixSvg value={billNumberText} size={54} />
          </div>
        </div>

        {/* Patient Information Rounded Gray Box */}
        <div className="bg-[#efefef] rounded-2xl overflow-hidden text-[9px] font-semibold text-black">
          {/* Row 1: Patient Information & Patient Type */}
          <div className="px-3 py-1.5 grid grid-cols-12 items-center">
            <div className="col-span-7">Patient Information</div>
            <div className="col-span-5">
              Patient Type:{' '}
              <span className="font-semibold text-black">{patientTypeLabel}</span>
            </div>
          </div>

          <div className="border-t border-[#3b5978]" />

          {/* Row 2: Patient Name, Sex / Age, Phone */}
          <div className="px-3 py-1.5 grid grid-cols-12 items-center">
            <div className="col-span-5 truncate pr-2">
              Patient Name: <span className="font-semibold text-black">{patientName}</span>
            </div>
            <div className="col-span-3 whitespace-nowrap">
              Sex / Age: {sexInitial} ({patientAge})
            </div>
            <div className="col-span-4 truncate pl-4">
              Phone: <span className="font-semibold text-black">{patientPhone}</span>
            </div>
          </div>

          <div className="border-t border-[#3b5978]" />

          {/* Row 3: PTID Barcode & Ref By */}
          <div className="px-3 py-2 grid grid-cols-12 items-center">
            <div className="col-span-6 flex items-center gap-2">
              <span className="shrink-0">PTID:</span>
              {billing.patient?.patientId ? (
                <div className="bg-white px-2.5 py-1 flex items-center justify-center">
                  <Barcode value={billing.patient.patientId} />
                </div>
              ) : (
                <span>N/A</span>
              )}
            </div>
            <div className="col-span-6 self-start pt-0.5 truncate">
              Ref By : <span className="font-semibold text-black">{referredByDisplay}</span>
            </div>
          </div>
        </div>

        {/* Billable Items Table */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            Billable Items &amp; Services / সেবাসমূহ
          </div>
          <TableOfTestList billing={billing} count={10} start={0} />
        </div>

        {/* Summary & Financial Breakdown */}
        <div className="flex justify-between items-start gap-3 pt-1">
          {/* Terms & Payment Notice */}
          <div className="flex-1 space-y-2 text-[8px] text-slate-500 pt-0.5 pr-2">
            {billing.testAvailabilityNote && (
              <div className="border border-slate-300 rounded p-2 bg-amber-50/40 space-y-0.5 text-slate-800">
                <p className="font-bold text-slate-900 text-[8px] uppercase tracking-wide">
                  Test Availability / Expected Report Note:
                </p>
                <p className="whitespace-pre-wrap leading-snug">{billing.testAvailabilityNote}</p>
              </div>
            )}
            <div className="border border-slate-200 rounded p-2 bg-slate-50/60 space-y-0.5">
              <p className="font-semibold text-slate-700 text-[8px]">Notice &amp; Terms:</p>
              <p>• Please collect test reports within 3 days. Bring this invoice at delivery.</p>
              <p>• Mushak-6.3 tax invoice issued under Bangladesh VAT &amp; Supplementary Duty Act.</p>
              <p>• Amounts once paid are non-refundable.</p>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-slate-600 font-medium">Payment Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${billing.paymentStatus === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : billing.paymentStatus === 'Partial'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
              >
                {billing.paymentStatus || 'UNPAID'}
              </span>
            </div>
          </div>

          {/* Totals Table */}
          <div className="invoice-payment-summary w-[62mm] border border-slate-300 rounded bg-white overflow-hidden shrink-0 print:w-[59mm]">
            <div className="bg-slate-100 px-2.5 py-1 border-b border-slate-300 font-bold text-[9px] text-slate-800 uppercase tracking-wide">
              Payment Summary
            </div>
            <div className="p-2 space-y-1.5 text-[8px]">
              <div className="flex justify-between text-slate-600">
                <span className="text-[9px]">Subtotal:</span>
                <span className="font-mono text-[8px] font-semibold">{subtotal.toFixed(0)} BDT</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span className="text-[9px]">
                    Discount{' '}
                    {billing.discountType === 'PERCENTAGE'
                      ? `(${Number(billing?.discount)?.toFixed(0)}%)`
                      : ''}
                    :
                  </span>
                  <span className="font-mono text-[8px] font-semibold">
                    - {discountAmount.toFixed(0)} BDT
                  </span>
                </div>
              )}

              {/* <div className="flex justify-between bg-slate-50 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                <span className="text-[9px] font-semibold">Taxable Amount:</span>
                <span className="font-mono text-[8px] font-bold">
                  {taxableAmount.toFixed(0)} BDT
                </span>
              </div> */}

              {/* <div className="flex justify-between text-slate-600">
                <span className="text-[9px]">VAT ({vatRate}%):</span>
                <span className="font-mono text-[8px] font-semibold">
                  {vatAmount > 0 ? `+ ${vatAmount.toFixed(0)}` : '0.00'} BDT
                </span>
              </div> */}

              {additionalCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span className="text-[9px]">Additional Charges:</span>
                  <span className="font-mono text-[8px] font-semibold">
                    + {additionalCharges.toFixed(0)} BDT
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t-2 border-slate-800 pt-1 text-slate-900 font-bold">
                <span className="text-[10px] uppercase">Invoice Total:</span>
                <span className="font-mono text-[10px]">{totalAmount.toFixed(0)} BDT</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-bold pt-0.5">
                <span className="text-[9px]">Amount Paid:</span>
                <span className="font-mono text-[8px]">{paidAmount.toFixed(0)} BDT</span>
              </div>

              {waivedAmount > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span className="text-[9px]">Waived / Settled:</span>
                  <span className="font-mono text-[8px]">- {waivedAmount.toFixed(0)} BDT</span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span className={`text-[9px] ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  Outstanding Due:
                </span>
                <span
                  className={`font-mono text-[9px] ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}
                >
                  {dueAmount.toFixed(0)} BDT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Signature & Authorization Section */}
      <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between items-end">
        <div className="text-[8px] text-slate-400">
          <p>
            Software Generated Invoice • Dr. Muazzem Medical Diagnostic Center •{' '}
            <span className="font-semibold text-slate-600">{copyLabel}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="w-40 border-b border-slate-600 mb-1 ml-auto"></div>
          <div className="text-[10px] font-bold text-slate-900 flex items-center justify-end gap-1">
            <ShieldCheck size={11} className="text-emerald-600" />
            <span>Authorized By</span>
          </div>
          <p className="text-[9px] font-semibold text-slate-800">{authorizerName}</p>
          <p className="text-[8px] text-slate-500 uppercase font-mono">{authorizerRole}</p>
          {billing.authorizedAt && (
            <p className="text-[8px] text-slate-400 font-mono mt-0.5">
              Signed:{' '}
              {new Date(billing.authorizedAt).toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short',
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
};

const TableOfTestList = ({
  billing,
  count,
  start,
}: {
  billing: any;
  count: number;
  start: number;
}) => {
  const items = billing.items || [];
  const visibleItems = items.slice(start, start + count);

  return (
    <div className="border border-slate-300 rounded overflow-hidden">
      <table className="w-full text-left border-collapse text-[8px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[7.5px]">
            <th className="py-1 px-1.5 text-center w-8 border-r border-slate-300">
              #
            </th>
            <th className="py-1 px-2 border-r border-slate-300">
              Description / বিবরণ
            </th>
            <th className="py-1 px-1.5 text-center w-12 border-r border-slate-300">
              Qty
            </th>
            <th className="py-1 px-2 text-right w-16 border-r border-slate-300">
              Rate
            </th>
            <th className="py-1 px-2 text-right w-20">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {visibleItems.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-3 text-center text-slate-400 italic"
              >
                No billable items
              </td>
            </tr>
          ) : (
            visibleItems.map((item: any, index: number) => {
              const qty = Number(item.quantity || 1);
              const price = Number(item.price || 0);
              const rowTotal = Number(item.total || qty * price);

              return (
                <tr key={item.id || index} className="hover:bg-slate-50/50">
                  <td className="py-1.5 px-1.5 text-center text-slate-500 font-mono border-r border-slate-200">
                    {index + 1 + start}
                  </td>
                  <td className="py-1.5 px-2 font-semibold text-slate-900 border-r border-slate-200">
                    {item.test?.name ||
                      item.name ||
                      item.description ||
                      'Medical Consultation / Service'}
                  </td>
                  <td className="py-1.5 px-1.5 text-center text-slate-600 font-mono border-r border-slate-200">
                    {qty}
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-600 font-mono border-r border-slate-200">
                    {price.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-900 font-mono">
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
          width: 1.05,
          height: 14,
          displayValue: true,
          fontSize: 7,
          textMargin: 1,
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
    <div className="flex items-center justify-center shrink-0">
      <svg ref={barcodeRef} className="block max-h-[24px] w-auto"></svg>
    </div>
  );
}
