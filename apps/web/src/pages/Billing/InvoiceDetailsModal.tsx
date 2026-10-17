import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Printer,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  RefreshCw,
  Tag
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { api } from '../../lib/api';
import { InvoicePrint } from './InvoicePrint';

interface InvoiceDetailsModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoiceId,
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Fetch invoice details
  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['billing-details', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const res = await api.get(`/billing/${invoiceId}`);
      return res.data?.data || res.data || res;
    },
    enabled: isOpen && !!invoiceId,
    staleTime: 0, // Always fetch fresh data when opening an invoice
  });

  if (!isOpen || !invoiceId) return null;

  const getStatusBadge = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle size={14} className="text-emerald-600" />
          Paid
        </span>
      );
    }
    if (normalized === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <Clock size={14} className="text-blue-600" />
          Partially Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock size={14} className="text-amber-600" />
        {status || 'Unpaid'}
      </span>
    );
  };

  const patientName =
    invoice?.patient?.name ||
    `${invoice?.patient?.firstName || ''} ${invoice?.patient?.lastName || ''}`.trim() ||
    'Unknown Patient';

  const billNumber =
    invoice?.billNumber || (invoice?.id ? `#${invoice.id.substring(0, 8)}` : 'N/A');

  const issueDate = invoice?.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const dueDateText =
    Number(invoice?.dueAmount) > 0 ? 'Due Upon Receipt' : 'Fully Settled';

  const subtotal = Number(invoice?.subtotal || 0);
  const discountAmount = Number(invoice?.discountAmount || 0);
  const additionalCharges = Number(invoice?.additionalCharges || 0);
  const totalAmount = Number(invoice?.totalAmount || 0);
  const paidAmount = Number(invoice?.paidAmount || 0);
  const dueAmount = Number(invoice?.dueAmount || 0);

  const payments = invoice?.payments || [];
  const items = invoice?.items || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      {/* Hidden print template */}
      <div className="hidden">
        {invoice && <InvoicePrint ref={printRef} billing={invoice} />}
      </div>

      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-details-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2
                  id="invoice-details-title"
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                >
                  Invoice Details
                </h2>
                {invoice && getStatusBadge(invoice.paymentStatus)}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5">
                Bill No: <span className="font-semibold text-slate-700">{billNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice && (
              <button
                type="button"
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-primary bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Print invoice"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh invoice details"
            >
              <RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Close modal (Esc)"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="space-y-6 animate-pulse py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
                ))}
              </div>
              <div className="h-36 bg-slate-100 rounded-2xl"></div>
              <div className="h-48 bg-slate-100 rounded-2xl"></div>
            </div>
          ) : isError ? (
            <div className="p-8 text-center bg-red-50/70 border border-red-200 rounded-2xl space-y-3">
              <AlertCircle size={36} className="mx-auto text-red-500" />
              <h3 className="text-base font-bold text-red-800">
                Unable to Load Invoice Details
              </h3>
              <p className="text-sm text-red-600 max-w-md mx-auto">
                {(error as any)?.response?.data?.message ||
                  (error as any)?.message ||
                  'You may not be authorized to view this invoice, or it may have been deleted.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          ) : invoice ? (
            <>
              {/* Financial Snapshot Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total Payable
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900">
                      {totalAmount.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-500">BDT</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {invoice.billingType === 'CONSULTATION'
                      ? 'Doctor Consultation'
                      : 'Diagnostic Services'}
                  </span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4.5 flex flex-col justify-between">
                  <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                    Amount Paid
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-700">
                      {paidAmount.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">BDT</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CreditCard size={12} />
                    Method: {invoice.paymentMethod || 'Cash'}
                  </span>
                </div>

                <div
                  className={`border rounded-2xl p-4.5 flex flex-col justify-between ${
                    dueAmount > 0
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span
                    className={`text-xs font-medium uppercase tracking-wider ${
                      dueAmount > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    Outstanding Due
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span
                      className={`text-2xl font-black ${
                        dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {dueAmount.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        dueAmount > 0 ? 'text-rose-500' : 'text-slate-500'
                      }`}
                    >
                      BDT
                    </span>
                  </div>
                  <span
                    className={`text-[11px] mt-1 ${
                      dueAmount > 0 ? 'text-rose-500 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {dueAmount > 0 ? 'Payment required' : 'No balance due'}
                  </span>
                </div>
              </div>

              {/* Organization & Patient Information (Two Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clinic Information */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Building2 size={18} className="text-primary" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Medical Diagnostic Center
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="font-bold text-slate-900 text-sm">
                      {invoice.clinic?.name || 'Dr. Muazzem Medical Diagnostic Center'}
                    </p>
                    <p className="flex items-start gap-1.5">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {invoice.clinic?.address ||
                          '82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka'}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{invoice.clinic?.phone || '01234567890, 01234567899'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span>{invoice.clinic?.email || 'dmdc.contact@gmail.com'}</span>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">
                      Type: {invoice.billingType || 'DIAGNOSTIC'}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">
                      Patient Type: {invoice.patientType === 'OUTSIDE' ? 'Outside' : 'In-House'}
                    </span>
                  </div>
                </div>

                {/* Patient Information */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User size={18} className="text-primary" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Patient Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Patient Name</span>
                      <span className="font-bold text-slate-800 text-sm">{patientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Patient ID</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {invoice.patient?.patientId || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phone</span>
                      <span className="font-medium text-slate-700">
                        {invoice.patient?.phone || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Age / Gender</span>
                      <span className="font-medium text-slate-700">
                        {invoice.patient?.age ? `${invoice.patient.age} yrs` : '-'} /{' '}
                        {invoice.patient?.gender || '-'}
                      </span>
                    </div>
                    {invoice.patient?.bloodGroup && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Blood Group</span>
                        <span className="font-semibold text-rose-600">
                          {invoice.patient.bloodGroup}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block text-[11px]">Referred By</span>
                      <span className="font-medium text-slate-700">
                        {invoice.doctor?.name || invoice.referredBy || 'Self / Walk-in'}
                      </span>
                    </div>
                  </div>

                  {invoice.patient?.address && (
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{invoice.patient.address}</span>
                    </div>
                  )}

                  {invoice.patient?.emergencyContactName && (
                    <div className="pt-1 text-[11px] text-slate-500">
                      Emergency Contact: {invoice.patient.emergencyContactName} (
                      {invoice.patient.emergencyRelationship || 'Contact'}) -{' '}
                      {invoice.patient.emergencyContactPhone || 'N/A'}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Meta Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={15} className="text-slate-400" />
                  <span>
                    Issue Date: <strong className="text-slate-800">{issueDate}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={15} className="text-slate-400" />
                  <span>
                    Payment Due: <strong className="text-slate-800">{dueDateText}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Tag size={15} className="text-slate-400" />
                  <span>
                    Status: <strong className="text-slate-800">{invoice.paymentStatus || 'Unpaid'}</strong>
                  </span>
                </div>
              </div>

              {/* Itemized Charges Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Itemized Charges</span>
                  <span className="text-xs font-normal text-slate-500 lowercase">
                    {items.length} {items.length === 1 ? 'item' : 'items'} billed
                  </span>
                </h3>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                          <th className="p-3.5 w-12 text-center">#</th>
                          <th className="p-3.5">Service / Test Description</th>
                          <th className="p-3.5 text-center">Category / Code</th>
                          <th className="p-3.5 text-center">Qty</th>
                          <th className="p-3.5 text-right">Unit Price</th>
                          <th className="p-3.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400">
                              No billed items found on this invoice.
                            </td>
                          </tr>
                        ) : (
                          items.map((item: any, idx: number) => {
                            const itemName =
                              item.test?.name || item.description || 'Medical Diagnostic Test';
                            const itemCode = item.test?.code || item.test?.category || '-';
                            const price = Number(item.price || item.test?.price || 0);

                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 text-center font-mono text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="p-3.5 font-medium text-slate-800">
                                  <div>{itemName}</div>
                                  {item.description && item.description !== itemName && (
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {item.description}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3.5 text-center text-slate-500">
                                  <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs">
                                    {itemCode}
                                  </span>
                                </td>
                                <td className="p-3.5 text-center text-slate-600 font-mono">1</td>
                                <td className="p-3.5 text-right text-slate-600 font-mono">
                                  {price.toLocaleString()} BDT
                                </td>
                                <td className="p-3.5 text-right font-semibold text-slate-800 font-mono">
                                  {price.toLocaleString()} BDT
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Itemized Calculation Summary Footer */}
                  <div className="bg-slate-50/80 border-t border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>• Prices include all standard handling and administrative laboratory charges.</p>
                      <p>• All transactions authorized by hospital management.</p>
                    </div>

                    <div className="w-full sm:w-72 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Line Items Subtotal:</span>
                        <span className="font-semibold font-mono text-slate-800">
                          {subtotal.toLocaleString()} BDT
                        </span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>
                            Discount{' '}
                            {invoice.discountType === 'PERCENTAGE'
                              ? `(${invoice.discount}%)`
                              : ''}
                            :
                          </span>
                          <span className="font-semibold font-mono">
                            - {discountAmount.toLocaleString()} BDT
                          </span>
                        </div>
                      )}

                      {additionalCharges > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Additional Charges:</span>
                          <span className="font-semibold font-mono text-slate-800">
                            + {additionalCharges.toLocaleString()} BDT
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-2">
                        <span>Net Payable Amount:</span>
                        <span className="font-mono">{totalAmount.toLocaleString()} BDT</span>
                      </div>

                      <div className="flex justify-between text-xs text-emerald-700 font-semibold pt-1">
                        <span>Total Paid:</span>
                        <span className="font-mono">{paidAmount.toLocaleString()} BDT</span>
                      </div>

                      <div className="flex justify-between text-xs font-bold pt-1 border-t border-dashed border-slate-200">
                        <span className={dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}>
                          Remaining Balance Due:
                        </span>
                        <span
                          className={`font-mono ${
                            dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {dueAmount.toLocaleString()} BDT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History & Transactions Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Payment History & Transactions</span>
                  <span className="text-xs font-normal text-slate-500 lowercase">
                    {payments.length} {payments.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </h3>

                {payments.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                            <th className="p-3.5">Date & Time</th>
                            <th className="p-3.5">Transaction ID</th>
                            <th className="p-3.5">Method</th>
                            <th className="p-3.5">Type</th>
                            <th className="p-3.5">Received By</th>
                            <th className="p-3.5 text-right">Amount</th>
                            <th className="p-3.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payments.map((tx: any) => {
                            const txDate = tx.createdAt
                              ? new Date(tx.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'N/A';
                            const receiver = tx.receivedBy
                              ? `${tx.receivedBy.firstName || ''} ${tx.receivedBy.lastName || ''}`.trim()
                              : 'System / Reception';

                            return (
                              <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 text-slate-600 text-xs">{txDate}</td>
                                <td className="p-3.5 font-mono text-xs font-semibold text-slate-700">
                                  #{tx.id ? tx.id.substring(0, 8) : 'N/A'}
                                </td>
                                <td className="p-3.5 font-medium text-slate-700">
                                  {tx.paymentMethod || 'Cash'}
                                </td>
                                <td className="p-3.5">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                                      tx.type === 'REFUND'
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                  >
                                    {tx.type || 'PAYMENT'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-xs text-slate-600">{receiver}</td>
                                <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                                  {Number(tx.amount || 0).toLocaleString()} BDT
                                </td>
                                <td className="p-3.5 text-center">
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <CheckCircle size={12} />
                                    {tx.status || 'Completed'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-600">
                      No standalone payment transactions recorded yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Initial payment method on file: <strong>{invoice.paymentMethod || 'Cash'}</strong>
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Invoice reference: <span className="font-mono font-medium text-slate-700">{invoice?.id || invoiceId}</span>
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {invoice && (
              <button
                type="button"
                onClick={() => handlePrint()}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
