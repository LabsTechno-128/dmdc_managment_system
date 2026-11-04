import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Eye,
  Send,
  AlertCircle,
  X,
  User,
  FlaskConical,
  Printer
} from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { ConfirmModal } from '../../components/ConfirmModal';

const fetchReports = async (page: number, limit: number, search: string) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search.trim() ? { search: search.trim() } : {}),
  }).toString();
  const { data } = await api.get(`/reports?${query}`);
  return data;
};

export const ReportsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reportToDeliver, setReportToDeliver] = useState<{ id: string; patientName: string; billNumber: string } | null>(null);
  const [previewRecord, setPreviewRecord] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: response, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['reports', page, debouncedSearch],
    queryFn: () => fetchReports(page, limit, debouncedSearch),
  });

  const reports = response?.data || (Array.isArray(response) ? response : []);
  const meta = response?.meta || { totalPages: 1, page: 1, total: reports.length };

  const deliverMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/reports/${id}/deliver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setReportToDeliver(null);
      if (previewRecord) {
        setPreviewRecord((prev: any) => (prev ? { ...prev, isDelivered: true } : null));
      }
    },
  });

  const handleConfirmDeliver = () => {
    if (reportToDeliver?.id) {
      deliverMutation.mutate(reportToDeliver.id);
    }
  };

  return (
    <div className="-m-3 sm:-m-4 md:-m-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Patient Diagnostic Reports
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Consolidated medical reports grouped by patient visit with review and delivery tracking
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Patient, Bill ID, or Test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-xs sm:text-sm bg-white"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p>Error loading reports. Please try refreshing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-0 max-[999px]:min-w-[700px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3 text-center w-12">SL</th>
                  <th className="p-3">Patient Details</th>
                  <th className="p-3">Bill ID</th>
                  {/* <th className="p-3">Date</th> */}
                  {/* <th className="p-3">Tests Included</th> */}
                  {/* <th className="p-3">Ref. Doctor</th> */}
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[9px] sm:text-xs">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <p>{searchTerm ? 'No reports match your search query.' : 'No diagnostic reports found.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((item: any, idx: number) => {
                    const slNo = String((meta.page - 1) * limit + idx + 1).padStart(2, '0');
                    const patient = item.patient || {};
                    const isDelivered = item.isDelivered;
                    const isVerified = item.isFullyVerified;

                    return (
                      <tr
                        key={item.id || `${item.patientId}_${item.billNumber}_${idx}`}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* 1. SL */}
                        <td className="p-3 text-center text-slate-500 font-mono font-medium">
                          {slNo}
                        </td>

                        {/* 2. Patient Details */}
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {patient.name || 'Unknown Patient'}
                          </div>
                          <div className="text-slate-500 text-[10px] font-mono mt-0.5 flex items-center gap-2">
                            <span>ID: {patient.patientId || item.patientId || '-'}</span>
                            {/* {patient.age && <span>• {patient.age} Y/{patient.gender || '-'}</span>} */}
                          </div>
                          {/* {patient.phone && (
                            <div className="text-slate-400 text-[10px]">{patient.phone}</div>
                          )} */}
                        </td>

                        {/* 3. Bill ID */}
                        <td className="p-3">
                          <div className="font-mono text-slate-800 font-semibold text-[11px]">
                            {item.billNumber || '-'}
                          </div>
                        </td>

                        {/* 4. Date */}
                        {/* <td className="p-3 text-slate-600 font-mono text-[11px]">
                          {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                        </td> */}

                        {/* 5. Tests Included */}
                        {/* <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.tests?.slice(0, 3).map((t: any, tIdx: number) => (
                              <span
                                key={tIdx}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  t.isVerified
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {t.testName}
                              </span>
                            ))}
                            {item.tests?.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                                +{item.tests.length - 3} more
                              </span>
                            )}
                            {(!item.tests || item.tests.length === 0) && (
                              <span className="text-slate-400 italic">No tests listed</span>
                            )}
                          </div>
                        </td> */}

                        {/* 6. Ref. Doctor */}
                        {/* <td className="p-3 text-slate-700">
                          <div className="font-medium max-w-xs truncate" title={item.referringDoctorName || 'Self'}>
                            {item.referringDoctorName || 'Self'}
                          </div>
                        </td> */}

                        {/* 7. Status */}
                        <td className="p-3">
                          <div className="flex flex-col gap-1 items-start">
                            {/* Review Status */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isVerified
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                              <Clock size={10} />
                              <span>{item.reviewStatus || (isVerified ? 'Verified' : 'Pending Review')}</span>
                            </span>

                            {/* Delivery Status */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isDelivered
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                              {isDelivered ? <CheckCircle2 size={10} /> : <Send size={10} />}
                              <span>{isDelivered ? 'Delivered' : 'Pending Delivery'}</span>
                            </span>
                          </div>
                        </td>

                        {/* 8. Actions */}
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* View Button: Opens Patient Test Preview Modal */}
                            <button
                              onClick={() => setPreviewRecord(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="View patient test details"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>

                            {/* Full Report & Print Button */}
                            <button
                              onClick={() => navigate(`/reports/${item.id}/preview`)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-700 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Open full printable diagnostic report"
                            >
                              <Printer size={12} />
                            </button>

                            {!isDelivered ? (
                              <button
                                onClick={() =>
                                  setReportToDeliver({
                                    id: item.id,
                                    patientName: patient.name || 'Patient',
                                    billNumber: item.billNumber || '',
                                  })
                                }
                                disabled={deliverMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                                title="Mark all reports for this transaction delivered"
                              >
                                <CheckCircle2 size={12} />
                                <span>Deliver</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100">
                                Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !isError && meta.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
            <p>
              Showing <span className="font-bold text-slate-700">{meta.total === 0 ? 0 : (meta.page - 1) * limit + 1}</span>–{' '}
              <span className="font-bold text-slate-700">{Math.min(meta.page * limit, meta.total)}</span> of{' '}
              <span className="font-bold text-slate-700">{meta.total}</span> records
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                let startPage = Math.max(1, meta.page - 2);
                if (startPage + 4 > meta.totalPages) {
                  startPage = Math.max(1, meta.totalPages - 4);
                }
                const p = startPage + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`cursor-pointer min-w-[32px] rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all active:scale-95 ${p === meta.page
                      ? 'bg-blue-600 text-white shadow-blue-600/20'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient Test Preview Modal: Shows Patient and all related test records when clicking View */}
      {previewRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewRecord(null);
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
                    {previewRecord.patient?.name || 'Unknown Patient'}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5 truncate">
                    PTN ID: {previewRecord.patient?.patientId || previewRecord.patientId} · Bill ID: {previewRecord.billNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewRecord(null)}
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
                  <span className="text-slate-400 mr-1">Age / Gender:</span>
                  <span className="font-semibold text-slate-800">
                    {previewRecord.patient?.age ? `${previewRecord.patient.age} Yrs` : '-'}
                    {previewRecord.patient?.gender ? ` / ${previewRecord.patient.gender}` : ''}
                  </span>
                </div>
                {previewRecord.patient?.phone && (
                  <div>
                    <span className="text-slate-400 mr-1">Phone:</span>
                    <span className="font-semibold text-slate-800">{previewRecord.patient.phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 mr-1">Ref. Doctor:</span>
                  <span className="font-semibold text-slate-800">{previewRecord.referringDoctorName || 'Self'}</span>
                </div>
                <div>
                  <span className="text-slate-400 mr-1">Date:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {previewRecord.date ? new Date(previewRecord.date).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full text-xs">
                  {previewRecord.tests?.length || 0} {previewRecord.tests?.length === 1 ? 'Test' : 'Tests'}
                </span>
              </div>
            </div>

            {/* Patient Related Data: All Tests Table for This Bill / Date */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-0 max-[999px]:min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3.5 w-12 text-center">SL</th>
                      <th className="py-2.5 px-3.5">Test Name</th>
                      <th className="py-2.5 px-3.5">Bill ID</th>
                      <th className="py-2.5 px-3.5">Performed By</th>
                      <th className="py-2.5 px-3.5 text-center">Review Status</th>
                      <th className="py-2.5 px-3.5 text-center">Delivery</th>
                      <th className="py-2.5 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {previewRecord.tests?.map((t: any, idx: number) => {
                      const sl = String(idx + 1).padStart(2, '0');
                      const techName = t.performedBy
                        ? `${t.performedBy.firstName || ''} ${t.performedBy.lastName || ''}`.trim()
                        : '-';
                      return (
                        <tr key={t.reportId || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 text-center font-mono text-slate-500">
                            {sl}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-2">
                              <FlaskConical size={14} className="text-blue-600 shrink-0" />
                              <div>
                                <div className="font-semibold text-slate-900 leading-snug">
                                  {t.testName}
                                </div>
                                {t.department && (
                                  <div className="text-[10px] text-slate-500">
                                    {t.department}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-xs text-slate-700 font-medium">
                            {previewRecord.billNumber}
                          </td>
                          <td className="py-2.5 px-3.5 text-xs text-slate-600">
                            {techName}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${t.isVerified
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                              <Clock size={10} />
                              <span>{t.isVerified ? 'Verified' : 'Pending Review'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${t.isDelivered
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                              {t.isDelivered ? <CheckCircle2 size={10} /> : <Send size={10} />}
                              <span>{t.isDelivered ? 'Delivered' : 'Pending'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              onClick={() => {
                                setPreviewRecord(null);
                                navigate(`/reports/${t.reportId || previewRecord.id}/preview`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>Preview</span>
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
            <div className="shrink-0 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setPreviewRecord(null)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {!previewRecord.isDelivered && (
                  <button
                    onClick={() => {
                      const rec = previewRecord;
                      setPreviewRecord(null);
                      setReportToDeliver({
                        id: rec.id,
                        patientName: rec.patient?.name || 'Patient',
                        billNumber: rec.billNumber || '',
                      });
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Deliver All Tests</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const id = previewRecord.id;
                    setPreviewRecord(null);
                    navigate(`/reports/${id}/preview`);
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <FileText size={14} />
                  <span>View &amp; Print Full Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Marking Delivered */}
      <ConfirmModal
        isOpen={!!reportToDeliver}
        onClose={() => setReportToDeliver(null)}
        onConfirm={handleConfirmDeliver}
        title="Deliver Medical Report"
        message={`Are you sure you want to mark all test reports for ${reportToDeliver?.patientName} (Bill #${reportToDeliver?.billNumber}) as delivered? This will update the delivery status for all associated tests.`}
        confirmText="Confirm Delivery"
        isConfirming={deliverMutation.isPending}
      />
    </div>
  );
};
