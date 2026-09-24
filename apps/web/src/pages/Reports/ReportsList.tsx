import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { ConfirmModal } from '../../components/ConfirmModal';

const fetchReports = async (page: number, limit: number) => {
  const { data } = await api.get(`/reports?page=${page}&limit=${limit}`);
  return data;
};

export const ReportsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reportToDeliver, setReportToDeliver] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['reports', page],
    queryFn: () => fetchReports(page, limit),
  });

  const reports = response?.data || (Array.isArray(response) ? response : []);
  const meta = response?.meta || { totalPages: 1, page: 1, total: reports.length };

  const deliverMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/reports/${id}/deliver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const handleDeliver = (id: string) => {
    setReportToDeliver(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Reports</h1>
        <p className="text-slate-500 mt-1">Manage and deliver test reports to patients</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading reports</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                  <th className="p-4">Report ID</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Test Name</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  reports?.map((report: any) => (
                    <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <FileText size={16} />
                          </div>
                          <span className="font-mono text-sm font-semibold text-slate-700">
                            #{report.id.substring(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {report.patient ? report.patient.name : 'Unknown Patient'}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {report.labResult?.test?.name || 'Unknown Test'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${report.isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {report.isDelivered ? <CheckCircle size={12} /> : <Clock size={12} />}
                          <span>{report.isDelivered ? 'Delivered' : 'Pending'}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/reports/${report.id}/preview`)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg shadow-sm transition-colors"
                        >
                          View
                        </button>
                        {!report.isDelivered && (
                          <button onClick={() => handleDeliver(report.id)}
                            disabled={deliverMutation.isPending}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm transition-colors"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {report.isDelivered && (
                          <span className="text-sm font-medium text-slate-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !isError && meta.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-700">{meta.total === 0 ? 0 : (meta.page - 1) * limit + 1}</span>–{' '}
              <span className="font-bold text-slate-700">{Math.min(meta.page * limit, meta.total)}</span> of{' '}
              <span className="font-bold text-slate-700">{meta.total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                let startPage = Math.max(1, meta.page - 2);
                if (startPage + 4 > meta.totalPages) {
                  startPage = Math.max(1, meta.totalPages - 4);
                }
                const p = startPage + i;
                return (
                  <button key={p}
                    onClick={() => setPage(p)}
                    className={`cursor-pointer min-w-[36px] rounded-xl px-3 py-2 text-sm font-bold shadow-sm transition-all active:scale-95 ${p === meta.page
                        ? 'bg-blue-600 text-white shadow-blue-600/20'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!reportToDeliver}
        onClose={() => setReportToDeliver(null)}
        onConfirm={() => {
          if (reportToDeliver) {
            deliverMutation.mutate(reportToDeliver, {
              onSettled: () => setReportToDeliver(null)
            });
          }
        }}
        title="Deliver Report"
        message="Mark this report as delivered to the patient?"
        isConfirming={deliverMutation.isPending}
        confirmText="Mark Delivered"
      />
    </div>
  );
};
