import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock, Search, Printer } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { useReactToPrint } from 'react-to-print';
import { InvoicePrint } from './InvoicePrint';

const fetchBillings = async (page: number, limit: number, search: string) => {
  const response = await api.get(`/billing?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return response as any;
};

export const BillingList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [paymentModalData, setPaymentModalData] = useState<any>(null);
  const [paymentInput, setPaymentInput] = useState('');
  const [printingBilling, setPrintingBilling] = useState<any>(null);

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

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, paidAmount }: { id: string; paidAmount: number }) =>
      api.patch(`/billing/${id}/payment`, { paidAmount }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      const updatedBilling = res.data?.data || res.data;
      setPrintingBilling(updatedBilling);
    },
  });

  const handleOpenPaymentModal = (billing: any) => {
    setPaymentModalData(billing);
    setPaymentInput('');
  };

  const handleSubmitPayment = () => {
    const amt = Number(paymentInput);
    if (isNaN(amt) || amt <= 0 || amt > paymentModalData.dueAmount) {
      alert(`Invalid amount. Please enter a value between 1 and ${paymentModalData.dueAmount}`);
      return;
    }
    updatePaymentMutation.mutate({ id: paymentModalData.id, paidAmount: amt });
    setPaymentModalData(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="hidden">
        <InvoicePrint ref={printRef} billing={printingBilling} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-slate-500 mt-1">Manage patient invoices and payments</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Bill No..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => navigate('/billing/new')}
            className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                  <th className="p-4">Invoice ID / Bill No</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  billings.map((billing: any) => (
                    <tr key={billing.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <FileText size={16} />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="font-mono text-sm font-semibold text-slate-700">
                              {billing.billNumber || `#${billing.id.substring(0, 8)}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {billing.patient?.name || `${billing.patient?.firstName || ''} ${billing.patient?.lastName || ''}`.trim() || 'Unknown Patient'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${billing.patientType === 'OUTSIDE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {billing.patientType === 'OUTSIDE' ? 'Outside' : 'In-House'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(billing.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {Number(billing.totalAmount).toLocaleString()} BDT
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${billing.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          billing.paymentStatus === 'Partial' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {billing.paymentStatus === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          <span>{billing.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {billing.paymentStatus === 'Partial' && (
                          <button
                            onClick={() => handleOpenPaymentModal(billing)}
                            disabled={updatePaymentMutation.isPending}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg shadow-sm transition-colors"
                          >
                            Edit Pay
                          </button>
                        )}
                        <button
                          onClick={() => setPrintingBilling(billing)}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                          title="Print Invoice"
                        >
                          <Printer size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !isLoading && !isError && (
          <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Receive Payment</h3>
              <p className="text-sm text-slate-500 mt-1">Pay remaining due for Invoice {paymentModalData.billNumber || `#${paymentModalData.id.substring(0, 8)}`}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Bill:</span>
                <span className="font-semibold text-slate-800">{Number(paymentModalData.totalAmount).toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Current Paid:</span>
                <span className="font-semibold text-emerald-600">{Number(paymentModalData.paidAmount).toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Due Amount:</span>
                <span className="font-semibold text-red-500">{Number(paymentModalData.dueAmount).toLocaleString()} BDT</span>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount to Pay (BDT)</label>
                <input
                  type="number"
                  autoFocus
                  value={paymentInput}
                  onChange={e => setPaymentInput(e.target.value)}
                  placeholder={`Max: ${paymentModalData.dueAmount}`}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setPaymentModalData(null)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={updatePaymentMutation.isPending || !paymentInput}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors disabled:opacity-50"
              >
                {updatePaymentMutation.isPending ? 'Processing...' : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
