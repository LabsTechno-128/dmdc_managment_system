import React from 'react';
import { FileText } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

interface ReportsTabProps {
    patient: any;
    navigate: NavigateFunction;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ patient, navigate }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {patient.reports?.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Report ID</th>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {patient.reports.map((report: any) => (
                                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/reports?patientId=${patient.id}`)}>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{report.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{new Date(report.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${report.isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {report.isDelivered ? 'Delivered' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors">
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <FileText size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Test Reports</h3>
                    <p className="text-sm text-slate-500 mt-1">This patient has no lab or test reports available.</p>
                </div>
            )}
        </div>
    );
};
