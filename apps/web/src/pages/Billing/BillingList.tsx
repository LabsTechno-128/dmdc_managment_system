import React from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';

const fetchBillings = async () => {
  const { data } = await api.get('/billing');
  return data;
};

export const BillingList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: billings, isLoading, isError } = useQuery({
    queryKey: ['billings'],
    queryFn: fetchBillings,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) => 
        api.patch(`/billing/${id}/status`, { paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
    },
  });

  const handleUpdateStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    if (window.confirm(`Mark this invoice as ${newStatus}?`)) {
      updateStatusMutation.mutate({ id, paymentStatus: newStatus });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-slate-500 mt-1">Manage patient invoices and payments</p>
        </div>
        <button
          onClick={() => navigate('/billing/new')}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
        >
          <Plus size={18} />
          <span>New Invoice</span>
        </button>
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
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billings?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  billings?.map((billing: any) => (
                    <tr key={billing.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <FileText size={16} />
                          </div>
                          <span className="font-mono text-sm font-semibold text-slate-700">
                            #{billing.id.substring(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {billing.patient ? `${billing.patient.firstName} ${billing.patient.lastName}` : 'Unknown Patient'}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(billing.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {Number(billing.totalAmount).toLocaleString()} BDT
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          billing.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {billing.paymentStatus === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          <span>{billing.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(billing.id, billing.paymentStatus)}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
