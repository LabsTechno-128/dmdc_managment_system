import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock, Search, Printer, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import { InvoicePrint } from './InvoicePrint';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { useAuthStore } from '../../store/authStore';

const fetchBillings = async (page: number, limit: number, search: string) => {
  const response = await api.get(`/billing?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return response as any;
};

export const BillingList: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeInvoiceId } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(routeInvoiceId || null);
  const [paymentModalData, setPaymentModalData] = useState<any>(null);
  const [paymentInput, setPaymentInput] = useState('');
  const [printingBilling, setPrintingBilling] = useState<any>(null);

  useEffect(() => {
    if (routeInvoiceId) {
      setSelectedInvoiceId(routeInvoiceId);
    }
  }, [routeInvoiceId]);

  const handleCloseDetailsModal = () => {
    setSelectedInvoiceId(null);
    if (routeInvoiceId) {
      navigate('/billing', { replace: true });
    }
  };

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => setPrintingBilling(null),
  });

  useEffect(() => {
    if (printingBilling) {
      setTimeout(() => {
        handlePrintAction();
      }, 500); // Wait for InvoicePrint to render
    }
  }, [printingBilling]);

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ['billings', currentPage, searchTerm],
    queryFn: () => fetchBillings(currentPage, itemsPerPage, searchTerm),
  });

  const billings = responseData?.data || [];
  const meta = responseData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total || 0;

  const [paymentModalTab, setPaymentModalTab] = useState<'PAY' | 'SETTLE'>('PAY');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [settlementReason, setSettlementReason] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      paymentMethod,
      notes,
      paymentDone
    }: {
      id: string;
      amount: number;
      paymentMethod: string;
      notes?: string;
      paymentDone?: boolean;
    }) =>
      api.post(`/billing/${id}/payments`, { amount, paymentMethod, notes, paymentDone }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success(
        variables.paymentDone
          ? 'Payment recorded and balance settled (Paid in full)'
          : 'Payment recorded successfully'
      );
      const updatedBilling = res.data?.data || res.data;
      const originalBilling = billings.find((b: any) => b.id === variables.id);
      setPrintingBilling({ ...originalBilling, ...updatedBilling });
      setPaymentModalData(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    }
  });

  const settleMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
      api.post(`/billing/${id}/settle`, { amount, reason }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success('Balance settled and waived successfully');
      const updatedBilling = res.data?.data || res.data;
      const originalBilling = billings.find((b: any) => b.id === variables.id);
      setPrintingBilling({ ...originalBilling, ...updatedBilling });
      setPaymentModalData(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to settle balance');
    }
  });

  const handleOpenPaymentModal = (billing: any, defaultTab: 'PAY' | 'SETTLE' = 'PAY') => {
    setPaymentModalData(billing);
    setPaymentModalTab(defaultTab);
    setPaymentInput(''); // No default value set
    setPaymentDone(false);
    setPaymentMethod('Cash');
    setPaymentNotes('');
    setSettlementReason('');
  };

  const handleSubmitAction = () => {
    const amt = Number(paymentInput);
    if (!paymentInput || isNaN(amt) || amt <= 0 || amt > paymentModalData.dueAmount) {
      toast.error(`Invalid amount. Please enter a value between 1 and ${paymentModalData.dueAmount}`);
      return;
    }
    if (!Number.isInteger(amt)) {
      toast.error('Payment amount must be a whole number');
      return;
    }

    if (paymentModalTab === 'PAY') {
      updatePaymentMutation.mutate({
        id: paymentModalData.id,
        amount: amt,
        paymentMethod,
        notes: paymentNotes || (paymentDone ? 'Payment against due (marked as Paid)' : 'Payment against due'),
        paymentDone
      });
    } else {
      if (!settlementReason.trim()) {
        toast.error('A mandatory reason is required to settle or waive a balance');
        return;
      }
      settleMutation.mutate({
        id: paymentModalData.id,
        amount: amt,
        reason: settlementReason.trim()
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="hidden">
        <InvoicePrint ref={printRef} billing={printingBilling} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Manage patient invoices, partial payments, and balance settlements</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Bill No or Patient..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={() => navigate('/billing/new')}
            className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm cursor-pointer text-sm"
          >
            <Plus size={18} />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading invoices</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Bill / Challan No</th>
                  <th className="p-3.5">Patient</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Total</th>
                  <th className="p-3.5 text-right">Paid</th>
                  <th className="p-3.5 text-right">Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Authorized By</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  billings.map((billing: any) => {
                    const due = Number(billing.dueAmount || 0);
                    const paid = Number(billing.paidAmount || 0);
                    const total = Number(billing.totalAmount || 0);
                    const authorizer = billing.authorizedBy
                      ? `${billing.authorizedBy.firstName || ''} ${billing.authorizedBy.lastName || ''}`.trim() || billing.authorizedBy.role
                      : billing.createdBy
                        ? `${billing.createdBy.firstName || ''} ${billing.createdBy.lastName || ''}`.trim() || billing.createdBy.role
                        : 'System';

                    return (
                      <tr key={billing.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                              <FileText size={15} />
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-800">
                                {billing.billNumber || `#${billing.id.substring(0, 8)}`}
                              </span>
                              {billing.musakChallanNumber && billing.musakChallanNumber !== billing.billNumber && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  {billing.musakChallanNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800">
                            {billing.patient?.name || `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() || 'Unknown'}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {billing.patient?.patientId || billing.patient?.phone || ''}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-slate-600">
                          {new Date(billing.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right font-semibold font-mono text-slate-800">
                          {total.toLocaleString()} BDT
                        </td>
                        <td className="p-3.5 text-right font-mono text-emerald-600 font-semibold">
                          {paid.toLocaleString()} BDT
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold">
                          <span className={due > 0 ? 'text-rose-600' : 'text-slate-500'}>
                            {due.toLocaleString()} BDT
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${billing.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : billing.paymentStatus === 'Partial'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                            {billing.paymentStatus === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                            <span>{billing.paymentStatus}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-slate-600">
                          <span className="font-medium text-slate-700">{authorizer}</span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {due > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(billing, 'PAY')}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                              title="Record Payment"
                            >
                              Pay Due
                            </button>
                          )}
                          {due > 0 && isAdmin && (
                            <button
                              onClick={() => handleOpenPaymentModal(billing, 'SETTLE')}
                              className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                              title="Settle / Waive Balance"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedInvoiceId(billing.id)}
                            className="inline-flex items-center p-1.5 text-slate-600 hover:text-primary bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="View Invoice Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setPrintingBilling(billing)}
                            className="inline-flex items-center p-1.5 text-slate-600 hover:text-primary bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Print Invoice"
                          >
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !isLoading && !isError && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>–{' '}
              <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
              <span className="font-bold text-slate-700">{totalItems}</span>
            </p>
            <div className="flex items-center gap-1">
              <button disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`cursor-pointer min-w-[36px] rounded-xl px-3 py-2 text-sm font-bold shadow-sm transition-all active:scale-95 ${p === currentPage
                      ? 'bg-blue-600 text-white shadow-blue-600/20'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment / Settlement Modal */}
      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {paymentModalTab === 'PAY' ? 'Receive Payment' : 'Authorized Balance Settlement'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invoice {paymentModalData.billNumber || `#${paymentModalData.id.substring(0, 8)}`}
                </p>
              </div>
              {isAdmin && (
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalTab('PAY');
                      setPaymentInput('');
                      setPaymentDone(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${paymentModalTab === 'PAY' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                      }`}
                  >
                    Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalTab('SETTLE');
                      setPaymentInput('');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${paymentModalTab === 'SETTLE' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                      }`}
                  >
                    Waiver / Settle
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center text-xs">
                <div>
                  <span className="text-slate-500 block">Total</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {Number(paymentModalData.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Paid</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {Number(paymentModalData.paidAmount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Due</span>
                  <span className="font-bold text-red-500 font-mono">
                    {Number(paymentModalData.dueAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {paymentModalTab === 'SETTLE' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 space-y-1">
                  <p className="font-semibold">Settlement / Waiver Policy Notice:</p>
                  <p className="text-purple-700">
                    This authorized action will waive the balance and mark the invoice Paid without distorting cash collections. A settlement transaction and audit record will be preserved.
                  </p>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {paymentModalTab === 'PAY' ? 'Amount to Collect (BDT)' : 'Amount to Settle / Waive (BDT)'}
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Current Due: <span className="font-mono font-bold text-rose-600">{Number(paymentModalData.dueAmount).toLocaleString()} BDT</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={paymentModalData.dueAmount}
                    autoFocus
                    value={paymentInput}
                    onChange={e => setPaymentInput(e.target.value)}
                    placeholder="Enter amount to pay..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none font-mono font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentInput(String(paymentModalData.dueAmount))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Full Balance
                  </button>
                </div>
              </div>

              {paymentModalTab === 'PAY' && (
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={paymentDone}
                      onChange={(e) => setPaymentDone(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950">Payment Done</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          paymentDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                        }`}>
                          {paymentDone ? 'Status: Paid' : 'Status: Partial'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700/80 mt-0.5">
                        Mark invoice as fully settled. If paid amount is less than due, the remaining balance will be settled/waived.
                      </p>
                    </div>
                  </label>

                  {/* Dynamic calculation preview */}
                  {(() => {
                    const entered = Number(paymentInput) || 0;
                    const due = Number(paymentModalData.dueAmount || 0);
                    const remainingDiff = Math.max(0, due - entered);

                    if (entered > 0) {
                      return (
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Amount Paying:</span>
                            <span className="font-mono font-bold text-emerald-600">
                              {entered.toLocaleString()} BDT
                            </span>
                          </div>
                          {paymentDone && remainingDiff > 0 && (
                            <div className="flex justify-between text-purple-700">
                              <span>Settled / Waived Difference:</span>
                              <span className="font-mono font-bold">
                                - {remainingDiff.toLocaleString()} BDT
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1">
                            <span>Remaining Due:</span>
                            <span className={`font-mono ${paymentDone || remainingDiff === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {paymentDone || remainingDiff === 0 ? '0 BDT (Paid in full)' : `${remainingDiff.toLocaleString()} BDT`}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {paymentModalTab === 'PAY' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Notes / Ref</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={e => setPaymentNotes(e.target.value)}
                      placeholder="Optional reference, receipt no. or memo"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Settlement Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={settlementReason}
                    onChange={e => setSettlementReason(e.target.value)}
                    placeholder="e.g. Director approved discount, special charity concession, billing rounding..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-purple-600 focus:outline-none text-xs"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setPaymentModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAction}
                disabled={
                  updatePaymentMutation.isPending ||
                  settleMutation.isPending ||
                  !paymentInput ||
                  Number(paymentInput) <= 0 ||
                  (paymentModalTab === 'SETTLE' && !settlementReason.trim())
                }
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${paymentModalTab === 'SETTLE'
                    ? 'bg-purple-700 hover:bg-purple-800'
                    : 'bg-primary hover:bg-primary-dark'
                  }`}
              >
                {updatePaymentMutation.isPending || settleMutation.isPending
                  ? 'Processing...'
                  : paymentModalTab === 'SETTLE'
                    ? 'Confirm Settlement / Waiver'
                    : paymentDone
                      ? 'Submit & Mark as Paid'
                      : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        invoiceId={selectedInvoiceId}
        isOpen={!!selectedInvoiceId}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
};
