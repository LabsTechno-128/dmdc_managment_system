import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Clock, CheckCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { ConfirmModal } from '../../components/ConfirmModal';

const fetchTestQueue = async ({ queryKey }: any) => {
  const [_key, page, limit] = queryKey;
  const response = await api.get(`/test-counter?page=${page}&limit=${limit}`);
  return response as any;
};

export const TestCounter: React.FC = () => {
  const queryClient = useQueryClient();
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string; status: string } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ['test-queue', currentPage, itemsPerPage],
    queryFn: fetchTestQueue,
    refetchInterval: 30000, // auto-refresh every 30 seconds
  });

  const queue = responseData?.data || [];
  const meta = responseData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total || 0;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/test-counter/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-queue'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] }); // updating to completed creates a report
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleStatusChange = (id: string, currentStatus: string) => {
    let newStatus = 'Waiting';
    if (currentStatus === 'Waiting') newStatus = 'In Progress';
    else if (currentStatus === 'In Progress') newStatus = 'Completed';
    else return; // If already completed, do nothing for now

    setPendingStatusUpdate({ id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={14} />;
      case 'In Progress': return <Activity size={14} className="animate-pulse" />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Counter</h1>
        <p className="text-slate-500 mt-1">Manage the diagnostic test queue and update statuses</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading queue</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                  <th className="p-4">Sl No</th>
                  {/* <th className="p-4">Queue ID</th> */}
                  <th className="p-4">Patient ID</th>
                  <th className="p-4">Patient Name</th>
                  {/* <th className="p-4">Test Name</th> */}
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Ordered Time</th>
                  <th className="p-4">Action</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Queue is currently empty.
                    </td>
                  </tr>
                ) : (
                  queue?.map((order: any, index: number) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      {/* <td className="p-4">
                        <span className="font-mono text-sm font-semibold text-slate-700">
                          #{order.id.substring(0, 8)}
                        </span>
                      </td> */}
                      <td className="p-4">
                        <span className="font-mono text-sm text-slate-600">
                          {order.patientId ? `#${order.patientId.substring(0, 8)}` : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {order.patient?.name || 'Unknown Patient'}
                        </div>
                      </td>
                      {/* <td className="p-4 font-medium text-slate-700">
                        {order.test?.name || 'Unknown Test'}
                      </td> */}
                      <td className="p-4">
                        <span className="font-mono text-sm text-slate-600">
                          {order.billing || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-4 space-x-2">
                        {order.status !== 'Completed' ? (
                          <button onClick={() => handleStatusChange(order.id, order.status)}
                            disabled={updateStatusMutation.isPending}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm transition-colors"
                          >
                            <span>Move to next</span>
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <span className="text-sm font-medium text-slate-400">Done</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{order.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
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

      <ConfirmModal
        isOpen={!!pendingStatusUpdate}
        onClose={() => setPendingStatusUpdate(null)}
        onConfirm={() => {
          if (pendingStatusUpdate) {
            updateStatusMutation.mutate(pendingStatusUpdate, {
              onSettled: () => setPendingStatusUpdate(null)
            });
          }
        }}
        title="Update Test Status"
        message={`Are you sure you want to update the test status to ${pendingStatusUpdate?.status}?`}
        isConfirming={updateStatusMutation.isPending}
        confirmText="Update Status"
      />
    </div>
  );
};
