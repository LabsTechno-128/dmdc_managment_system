import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ResultReview } from './ResultReview';

export const PathologistDashboard: React.FC = () => {
    const [pendingResults, setPendingResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedResult, setSelectedResult] = useState<any | null>(null);

    const fetchPendingResults = async () => {
        setLoading(true);
        try {
            const res = await api.get('/lab-result/pending-review');
            setPendingResults(res.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load pending results');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingResults();
    }, []);

    if (loading && !selectedResult) {
        return <div className="p-6 text-slate-500">Loading pending results...</div>;
    }

    if (selectedResult) {
        return (
            <ResultReview
                result={selectedResult}
                onClose={() => {
                    setSelectedResult(null);
                    fetchPendingResults();
                }}
            />
        );
    }

    return (
        <div className="-m-3 sm:-m-4 md:-m-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Pathologist Review Workspace</h1>
                <button onClick={fetchPendingResults} className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium cursor-pointer">
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white overflow-x-auto shadow-xs">
                <table className="w-full min-w-[700px] text-left border-collapse border border-slate-700 whitespace-nowrap">
                    <thead>
                        <tr className="bg-white">
                            <th className="border border-slate-700 px-4 py-3 font-bold text-slate-900 text-sm w-16">
                                SL
                            </th>
                            <th className="border border-slate-700 px-4 py-3 font-bold text-slate-900 text-sm">
                                PTN Name &amp; PTNID
                            </th>
                            <th className="border border-slate-700 px-4 py-3 font-bold text-slate-900 text-sm">
                                Bill ID
                            </th>
                            <th className="border border-slate-700 px-4 py-3 font-bold text-slate-900 text-sm w-24">
                                Action
                            </th>
                            <th className="border border-slate-700 px-4 py-3 font-bold text-slate-900 text-sm w-32">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingResults.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="border border-slate-700 p-8 text-center text-slate-500 text-sm">
                                    No pending results for review.
                                </td>
                            </tr>
                        ) : (
                            pendingResults.map((result, index) => {
                                const slNo = String(index + 1).padStart(2, '0');
                                const patientName = result.patient?.name || 'Unknown Patient';
                                const patientId = result.patient?.patientId || result.patient?.id || '-';
                                const billId = result.billing?.billNumber || result.billingId || '-';
                                const statusText = result.report?.isDelivered
                                    ? 'Delivered'
                                    : result.status === 'COMPLETED' || result.status === 'PENDING'
                                    ? 'Pending'
                                    : result.status === 'VERIFIED'
                                    ? 'Verified'
                                    : result.status || 'Pending';

                                return (
                                    <tr key={result.id} className="hover:bg-slate-50/60 transition-colors" title={result.test?.name ? `Test: ${result.test.name}` : undefined}>
                                        <td className="border border-slate-700 px-4 py-3 text-sm text-slate-900 tabular-nums align-middle font-medium">
                                            {slNo}
                                        </td>
                                        <td className="border border-slate-700 px-4 py-3 text-sm text-slate-900 align-middle">
                                            <div className="font-medium text-slate-900 leading-snug">{patientName}</div>
                                            <div className="text-slate-800 text-xs font-mono mt-0.5 tabular-nums">{patientId}</div>
                                        </td>
                                        <td className="border border-slate-700 px-4 py-3 text-sm text-slate-900 tabular-nums align-middle font-mono">
                                            {billId}
                                        </td>
                                        <td className="border border-slate-700 px-4 py-3 text-sm text-slate-900 align-middle">
                                            <button
                                                onClick={() => setSelectedResult(result)}
                                                className="text-slate-900 hover:text-blue-600 font-medium cursor-pointer transition-colors hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                        <td className="border border-slate-700 px-4 py-3 text-sm text-slate-900 align-middle font-medium">
                                            {statusText}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
