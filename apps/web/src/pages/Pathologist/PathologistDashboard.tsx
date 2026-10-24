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
                <button onClick={fetchPendingResults} className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium">
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50 border-b">
                            <th className="p-4 font-medium text-slate-600 text-sm">Patient</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Test Name</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Sample ID</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Submitted By</th>
                            <th className="p-4 font-medium text-slate-600 text-sm text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingResults.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                                    No pending results for review.
                                </td>
                            </tr>
                        ) : (
                            pendingResults.map((result) => (
                                <tr key={result.id} className="border-b last:border-0 hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800 text-sm">{result.patient?.name}</div>
                                        <div className="text-xs text-slate-500">{result.patient?.id}</div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800 text-sm">{result.test?.name}</td>
                                    <td className="p-4 text-slate-600 font-mono text-sm">{result.sample?.barcode}</td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        {result.performedBy ? `${result.performedBy.firstName} ${result.performedBy.lastName}` : '-'}
                                        <div className="text-xs text-slate-400">{new Date(result.updatedAt).toLocaleString()}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedResult(result)}
                                            className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-md font-medium text-sm"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
