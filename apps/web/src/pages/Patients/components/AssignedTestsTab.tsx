import React from 'react';
import { Activity, Search, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface AssignedTestsTabProps {
    testsData: any;
    testsLoading: boolean;
    search: string;
    setSearch: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const AssignedTestsTab: React.FC<AssignedTestsTabProps> = ({
    testsData,
    testsLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage
}) => {
    const renderStatusBadge = (status: string) => {
        let colors = "bg-slate-100 text-slate-700";
        if (status === 'Completed') colors = "bg-emerald-100 text-emerald-700";
        if (status === 'Pending' || status === 'Waiting') colors = "bg-amber-100 text-amber-700";
        if (status === 'In Progress') colors = "bg-blue-100 text-blue-700";
        if (status === 'Sample Collected') colors = "bg-purple-100 text-purple-700";
        if (status === 'Cancelled') colors = "bg-red-100 text-red-700";
        
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${colors}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 sm:p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="text-blue-600" size={20} /> Assigned Tests
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-48">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search test..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Waiting">Waiting</option>
                            <option value="Sample Collected">Sample Collected</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-bold">Test Name</th>
                            <th className="px-6 py-4 font-bold">Assigned Date</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold">Payment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {testsLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    Loading tests...
                                </td>
                            </tr>
                        ) : testsData?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <Activity size={40} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-medium">No assigned tests found</p>
                                </td>
                            </tr>
                        ) : (
                            testsData?.data?.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900">{order.test?.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <Calendar size={14} />
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {order.billing?.paymentStatus === 'Paid' ? (
                                            <span className="text-emerald-600 flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
                                                <CheckCircle size={14} /> Paid
                                            </span>
                                        ) : order.billing?.paymentStatus === 'Partial' ? (
                                            <span className="text-amber-600 flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
                                                <Clock size={14} /> Partial
                                            </span>
                                        ) : (
                                            <span className="text-red-500 flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
                                                <XCircle size={14} /> Unpaid
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {testsData?.meta && testsData.meta.totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                    <span className="text-sm font-medium text-slate-500">
                        Showing page {testsData.meta.page} of {testsData.meta.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === testsData.meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
