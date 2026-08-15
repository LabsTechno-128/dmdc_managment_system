import React from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';

const fetchReports = async () => {
  const { data } = await api.get('/reports');
  return data;
};

export const ReportsList: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: reports, isLoading, isError } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });

  const deliverMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/reports/${id}/deliver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const handleDeliver = (id: string) => {
    if (window.confirm('Mark this report as delivered to the patient?')) {
      deliverMutation.mutate(id);
    }
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
                          {report.patient ? `${report.patient.firstName} ${report.patient.lastName}` : 'Unknown Patient'}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {report.testOrder?.test?.name || 'Unknown Test'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          report.isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {report.isDelivered ? <CheckCircle size={12} /> : <Clock size={12} />}
                          <span>{report.isDelivered ? 'Delivered' : 'Pending'}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {!report.isDelivered && (
                          <button className="cursor-pointer"
                            onClick={() => handleDeliver(report.id)}
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
      </div>
    </div>
  );
};
