import React from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';

const fetchTestQueue = async () => {
  const { data } = await api.get('/test-counter');
  return data;
};

export const TestCounter: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: queue, isLoading, isError } = useQuery({
    queryKey: ['test-queue'],
    queryFn: fetchTestQueue,
    refetchInterval: 30000, // auto-refresh every 30 seconds
  });

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

    if (window.confirm(`Update test status to ${newStatus}?`)) {
      updateStatusMutation.mutate({ id, status: newStatus });
    }
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
                  <th className="p-4">Queue ID</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Test Name</th>
                  <th className="p-4">Time Ordered</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Queue is currently empty.
                    </td>
                  </tr>
                ) : (
                  queue?.map((order: any) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-sm font-semibold text-slate-700">
                          #{order.id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {order.patient ? `${order.patient.firstName} ${order.patient.lastName}` : 'Unknown Patient'}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {order.test?.name || 'Unknown Test'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{order.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {order.status !== 'Completed' ? (
                            <button
                                onClick={() => handleStatusChange(order.id, order.status)}
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
