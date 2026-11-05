import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    RefreshCw,
    Eye,
    Clock,
    CheckCircle2,
    X,
    User,
    FlaskConical,
    ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ResultReview } from './ResultReview';

interface PatientGroup {
    groupKey: string;
    patient: any;
    billing: any;
    billNumber: string;
    patientName: string;
    patientId: string;
    results: any[];
    overallStatus: 'Pending' | 'Verified' | 'Delivered' | string;
    testCount: number;
}

export const PathologistDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [pendingResults, setPendingResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResult, setSelectedResult] = useState<any | null>(null);
    const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

    const fetchPendingResults = async () => {
        setLoading(true);
        try {
            const res = await api.get('/lab-result/pending-review');
            setPendingResults(res.data || []);
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

    // Group pending tests by patient and bill so each patient appears only once in the main table
    const groupedPatients = useMemo<PatientGroup[]>(() => {
        const map = new Map<string, PatientGroup>();

        pendingResults.forEach((result) => {
            const patientId = result.patient?.patientId || result.patient?.id || result.patientId || 'unknown';
            const billNumber = result.billing?.billNumber || result.billingId || '-';
            const groupKey = `${patientId}_${billNumber}`;

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    groupKey,
                    patient: result.patient,
                    billing: result.billing,
                    billNumber,
                    patientName: result.patient?.name || 'Unknown Patient',
                    patientId: result.patient?.patientId || result.patient?.id || '-',
                    results: [],
                    overallStatus: 'Pending',
                    testCount: 0,
                });
            }

            const group = map.get(groupKey)!;
            group.results.push(result);
            group.testCount = group.results.length;

            const allDelivered = group.results.every((r) => r.report?.isDelivered);
            const allVerified = group.results.every((r) => r.status === 'VERIFIED');
            const anyPending = group.results.some((r) => r.status === 'COMPLETED' || r.status === 'PENDING');

            if (allDelivered) {
                group.overallStatus = 'Delivered';
            } else if (allVerified) {
                group.overallStatus = 'Verified';
            } else if (anyPending) {
                group.overallStatus = 'Pending';
            } else {
                group.overallStatus = result.status || 'Pending';
            }
        });

        return Array.from(map.values());
    }, [pendingResults]);

    // Filter by search query (patient name, patient id, bill id, or test name)
    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return groupedPatients;
        const q = searchTerm.toLowerCase();
        return groupedPatients.filter((g) =>
            g.patientName.toLowerCase().includes(q) ||
            g.patientId.toLowerCase().includes(q) ||
            g.billNumber.toLowerCase().includes(q) ||
            g.results.some((r) => r.test?.name?.toLowerCase().includes(q))
        );
    }, [groupedPatients, searchTerm]);

    // Active patient group to show in modal (persists when reviewing individual tests so Back returns to the modal)
    const previewGroup = useMemo(() => {
        if (!activeGroupKey) return null;
        return groupedPatients.find((g) => g.groupKey === activeGroupKey) || null;
    }, [groupedPatients, activeGroupKey]);

    // If reviewing a specific test result, render the review component
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
            {/* Header with Title and Search/Refresh */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {user?.role === 'lab_technician'
                            ? 'Lab Review & Verification Workspace'
                            : 'Pathologist & Lab Review Workspace'}
                    </h1>
                    <p className="text-slate-500 mt-1 text-xs sm:text-sm">
                        Review, verify, and finalize completed laboratory test results
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by Patient or Bill..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-xs sm:text-sm bg-white"
                        />
                    </div>
                    <button
                        onClick={fetchPendingResults}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Standard Application Table Container */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-0 max-[999px]:min-w-[600px] text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4 w-16 text-center">SL</th>
                                <th className="p-4">PTN Name &amp; PTNID</th>
                                <th className="p-4">Bill ID</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right w-28">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Loading pending results...
                                    </td>
                                </tr>
                            ) : filteredGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        {searchTerm ? 'No results match your search query.' : 'No pending results for review.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredGroups.map((group, index) => {
                                    const slNo = String(index + 1).padStart(2, '0');
                                    const isDelivered = group.overallStatus === 'Delivered';
                                    const isVerified = group.overallStatus === 'Verified';

                                    return (
                                        <tr
                                            key={group.groupKey}
                                            className="hover:bg-slate-50/80 transition-colors"
                                        >
                                            {/* 1. SL */}
                                            <td className="p-4 text-center text-slate-500 font-mono font-medium">
                                                {slNo}
                                            </td>

                                            {/* 2. PTN Name & PTNID */}
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-900 leading-snug">
                                                    {group.patientName}
                                                </div>
                                                <div className="text-slate-500 text-xs font-mono mt-0.5">
                                                    {group.patientId}
                                                </div>
                                            </td>

                                            {/* 3. Bill ID */}
                                            <td className="p-4 font-mono text-slate-700 font-medium">
                                                {group.billNumber}
                                            </td>

                                            {/* 4. Status */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                            isDelivered
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : isVerified
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}
                                                    >
                                                        {isDelivered || isVerified ? (
                                                            <CheckCircle2 size={12} />
                                                        ) : (
                                                            <Clock size={12} />
                                                        )}
                                                        <span>{group.overallStatus}</span>
                                                    </span>

                                                    {group.testCount > 1 && (
                                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                            {group.testCount} Tests
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 5. Action (Set as LAST column) */}
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setActiveGroupKey(group.groupKey)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    <span>View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Preview Modal: Shows All Tests For The Selected Patient */}
            {previewGroup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setActiveGroupKey(null);
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
                        {/* Modal Header (Pinned) */}
                        <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                                    <User size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                                        {previewGroup.patientName}
                                    </h2>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5 truncate">
                                        PTN ID: {previewGroup.patientId} · Bill ID: {previewGroup.billNumber}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveGroupKey(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                                aria-label="Close Preview"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Patient Summary Strip (Pinned) */}
                        <div className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-50/40 border-b border-blue-100/60 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-slate-600">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <div>
                                    <span className="text-slate-400 mr-1.5">Age / Gender:</span>
                                    <span className="font-semibold text-slate-800">
                                        {previewGroup.patient?.age ? `${previewGroup.patient.age} Yrs` : '-'}
                                        {previewGroup.patient?.gender ? ` / ${previewGroup.patient.gender}` : ''}
                                    </span>
                                </div>
                                {previewGroup.patient?.phone && (
                                    <div>
                                        <span className="text-slate-400 mr-1.5">Phone:</span>
                                        <span className="font-semibold text-slate-800">{previewGroup.patient.phone}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full text-xs">
                                    {previewGroup.results.length} {previewGroup.results.length === 1 ? 'Test' : 'Tests'}
                                </span>
                            </div>
                        </div>

                        {/* All Tests Table For This Patient (Scrollable vertically if multiple tests) */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
                                <table className="w-full text-left border-collapse whitespace-nowrap min-w-0 max-[999px]:min-w-[550px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                                            <th className="py-3 px-3.5 w-12 text-center">SL</th>
                                            <th className="py-3 px-3.5">Test Name</th>
                                            <th className="py-3 px-3.5">Bill ID</th>
                                            <th className="py-3 px-3.5">Performed By</th>
                                            <th className="py-3 px-3.5 text-center">Status</th>
                                            <th className="py-3 px-3.5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                        {previewGroup.results.map((res: any, idx: number) => {
                                            const sl = String(idx + 1).padStart(2, '0');
                                            const billNo = res.billing?.billNumber || res.billingId || previewGroup.billNumber || '-';
                                            const techName = res.performedBy
                                                ? `${res.performedBy.firstName || ''} ${res.performedBy.lastName || ''}`.trim()
                                                : '-';
                                            return (
                                                <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-3.5 text-center font-mono text-slate-500">
                                                        {sl}
                                                    </td>
                                                    <td className="py-3 px-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <FlaskConical size={14} className="text-blue-600 shrink-0" />
                                                            <div>
                                                                <div className="font-semibold text-slate-900 leading-snug">
                                                                    {res.test?.name || 'Unknown Test'}
                                                                </div>
                                                                {res.test?.category && (
                                                                    <div className="text-[11px] text-slate-500">
                                                                        {res.test.category}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3.5 font-mono text-xs text-slate-700 font-medium">
                                                        {billNo}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-xs text-slate-700">
                                                        {techName}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock size={11} />
                                                            <span>{res.status || 'Pending'}</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right">
                                                        <button
                                                            onClick={() => setSelectedResult(res)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                                        >
                                                            <span>Review</span>
                                                            <ArrowRight size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer (Pinned) */}
                        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">
                                {previewGroup.results.length} {previewGroup.results.length === 1 ? 'test record' : 'test records'}
                            </span>
                            <button
                                onClick={() => setActiveGroupKey(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
