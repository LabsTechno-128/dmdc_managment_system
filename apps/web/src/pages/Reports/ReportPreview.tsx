import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import { useReactToPrint } from 'react-to-print';
import { InvoicePrint } from '../Billing/InvoicePrint';
import { isRichTextEmpty, normalizeInitialContentToHtml } from '../../components/editor/richTextUtils';

export const ReportPreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [viewMode, setViewMode] = useState<'REPORT' | 'INVOICE'>('REPORT');

    const reportPrintRef = useRef<HTMLDivElement>(null);
    const invoicePrintRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/reports/${id}/print`);
                setReport(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load report');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    const handlePublish = async () => {
        setPublishing(true);
        try {
            await api.post(`/reports/${id}/publish`);
            setReport({ ...report, status: 'PUBLISHED', isDelivered: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to publish');
        } finally {
            setPublishing(false);
        }
    };

    const handlePrintReport = useReactToPrint({
        contentRef: reportPrintRef,
    });

    const handlePrintInvoice = useReactToPrint({
        contentRef: invoicePrintRef,
    });

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings');
            return data?.data || data;
        },
        staleTime: 1000 * 60 * 5,
    });

    if (loading) return <div className="p-8 text-center text-slate-500">Loading report...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!report) return <div className="p-8 text-center text-slate-500">Report not found</div>;

    let parsedData = { parameterResults: [], remarks: '' };
    try {
        if (report.reportData) {
            parsedData = JSON.parse(report.reportData);
        }
    } catch (e) {
        console.error("Failed to parse reportData");
    }

    const { parameterResults, remarks } = parsedData;
    const patient = report.patient || {};
    const labResult = report.labResult || {};
    const test = labResult.test || {};
    const sample = labResult.sample || {};

    const clinicName = settings?.centerName || 'Dr. Muazzem Medical Diagnostic Center';
    const clinicAddress = settings?.address || '82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka.';
    const clinicPhone = settings?.phone || '01234567890, 01234567899';
    const clinicEmail = settings?.email || 'dmdc.contact@gmail.com';
    const clinicWeb = settings?.webaddress || settings?.webAddress || '';

    const formatDate = (dateVal: any) => {
        if (!dateVal) return 'N/A';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return 'N/A';
            return format(d, 'dd/MM/yyyy, hh:mm a');
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
            {/* Non-printable controls */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden px-4">
                <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800 font-medium cursor-pointer">
                    &larr; Back
                </button>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${report.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {report.status}
                    </span>
                    {report.status !== 'PUBLISHED' && viewMode === 'REPORT' && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {publishing ? 'Publishing...' : 'Publish Report'}
                        </button>
                    )}
                    <button
                        onClick={() => setViewMode('REPORT')}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded transition-colors cursor-pointer ${viewMode === 'REPORT' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
                    >
                        View Report
                    </button>
                    <button
                        onClick={() => {
                            if (viewMode !== 'REPORT') setViewMode('REPORT');
                            setTimeout(() => handlePrintReport(), 100);
                        }}
                        className="px-3 sm:px-4 py-2 bg-slate-800 text-white text-xs sm:text-sm font-medium rounded hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                        Print/Download Report
                    </button>

                    {labResult.billing && (
                        <>
                            <button
                                onClick={() => setViewMode('INVOICE')}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded transition-colors cursor-pointer ${viewMode === 'INVOICE' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
                            >
                                View Invoice
                            </button>
                            <button
                                onClick={() => handlePrintInvoice()}
                                className="px-3 sm:px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-purple-700 transition-colors cursor-pointer"
                            >
                                Print/Download Invoice
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Hidden invoice for printing */}
            <div className="hidden">
                <InvoicePrint ref={invoicePrintRef} billing={labResult.billing} />
            </div>

            {viewMode === 'REPORT' ? (
                <div ref={reportPrintRef} id="print-report-invoice" className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:w-full print:max-w-none">
                    <div className="p-4 sm:p-8 md:p-12 print:p-0">
                        <style>
                            {`
                                @page {
                                    size: A4 portrait;
                                    margin: 10mm 12mm 12mm 12mm;
                                }
                                @media print {
                                    html, body, #print-report-invoice {
                                        min-height: 0 !important;
                                        height: auto !important;
                                        padding: 0 !important;
                                        margin: 0 !important;
                                        box-shadow: none !important;
                                        background: white !important;
                                    }
                                    .print-layout-table {
                                        width: 100% !important;
                                        border-collapse: collapse !important;
                                        page-break-inside: auto !important;
                                        break-inside: auto !important;
                                    }
                                    .print-layout-table > thead {
                                        display: table-header-group !important;
                                    }
                                    .print-layout-table > tbody {
                                        display: table-row-group !important;
                                    }
                                    .print-layout-table > tbody > tr {
                                        page-break-inside: auto !important;
                                        break-inside: auto !important;
                                    }
                                    .print-layout-table > thead > tr > td,
                                    .print-layout-table > tbody > tr > td {
                                        padding: 0 !important;
                                        border: none !important;
                                    }
                                    .report-inner-table {
                                        width: 100% !important;
                                        border-collapse: collapse !important;
                                        page-break-inside: auto !important;
                                        break-inside: auto !important;
                                        min-width: 0 !important;
                                    }
                                    .report-inner-table tr {
                                        page-break-inside: avoid !important;
                                        break-inside: avoid !important;
                                    }
                                    .print-avoid-break {
                                        page-break-inside: avoid !important;
                                        break-inside: avoid !important;
                                    }
                                }
                            `}
                        </style>

                        <table className="print-layout-table w-full border-collapse">
                            <thead className="table-header-group">
                                <tr>
                                    <td className="p-0 border-0">
                                        {/* ===================== HOSPITAL OFFICIAL HEADER ===================== */}
                                        <div className="border-b-2 border-slate-800 pb-3 sm:pb-4 mb-3 sm:mb-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white flex items-center justify-center p-1">
                                                        <img
                                                            src="/dmdc_logo.jpeg"
                                                            alt="DMDC Logo"
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                        <span className="text-xs font-black text-blue-700 hidden">DMDC</span>
                                                    </div>
                                                    <div>
                                                        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                                            {clinicName}
                                                        </h1>
                                                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                                                            {clinicAddress}
                                                        </p>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 mt-1">
                                                            {clinicPhone && <span>Phone: {clinicPhone}</span>}
                                                            {clinicEmail && <span>E-mail: {clinicEmail}</span>}
                                                            {clinicWeb && <span>Web: {clinicWeb}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded">
                                                        Pathology Report
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                                                        Issue Date: {format(new Date(), 'dd MMM yyyy, HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ===================== PATIENT & SAMPLE INFO GRID ===================== */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 mb-4 text-xs sm:text-sm">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold text-slate-500 w-32 shrink-0">Patient Name:</span>
                                                        <span className="font-bold text-slate-900 uppercase break-words">{patient.name || '-'}</span>
                                                    </div>
                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold text-slate-500 w-32 shrink-0">Patient ID:</span>
                                                        <span className="font-semibold text-slate-800 break-words tabular-nums">{patient.patientId || patient.id || '-'}</span>
                                                    </div>
                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold text-slate-500 w-32 shrink-0">Age / Gender:</span>
                                                        <span className="text-slate-800 font-medium tabular-nums">
                                                            {patient.age ? `${patient.age} Yrs` : '-'} {patient.gender ? `/ ${patient.gender}` : ''}
                                                        </span>
                                                    </div>
                                                    {patient.phone && (
                                                        <div className="flex items-baseline">
                                                            <span className="font-semibold text-slate-500 w-32 shrink-0">Contact:</span>
                                                            <span className="text-slate-800 tabular-nums">{patient.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold text-slate-500 w-32 shrink-0">Sample ID:</span>
                                                        <span className="font-bold text-slate-900 break-words tabular-nums">{sample.barcode || '-'}</span>
                                                    </div>
                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold text-slate-500 w-32 shrink-0">Collection Date:</span>
                                                        <span className="text-slate-800 tabular-nums">{formatDate(sample.collectedAt)}</span>
                                                    </div>
                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold text-slate-500 w-32 shrink-0">Report Date:</span>
                                                        <span className="text-slate-800 tabular-nums">{formatDate(report.updatedAt)}</span>
                                                    </div>
                                                    {(labResult.billing?.doctor?.name || labResult.doctorName) && (
                                                        <div className="flex items-baseline">
                                                            <span className="font-semibold text-slate-500 w-32 shrink-0">Ref. By:</span>
                                                            <span className="text-slate-800 font-medium">{labResult.billing?.doctor?.name || labResult.doctorName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </thead>
                            <tbody className="table-row-group">
                                <tr>
                                    <td className="p-0 border-0">
                                        {/* Test Title */}
                                        <div className="text-center mb-4 sm:mb-6">
                                            <h2 className="text-base sm:text-lg font-black text-slate-900 underline uppercase decoration-2 underline-offset-4 tracking-wide">
                                                Test: {test.name}
                                            </h2>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td className="p-0 border-0">
                                        {/* Results Table */}
                                        <div className="mb-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs print:shadow-none print:border-slate-300 print:rounded-none [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                                            <table className="report-inner-table w-full text-left border-collapse min-w-0 max-[999px]:min-w-[650px] print:min-w-0">
                                                <thead className="bg-slate-100/90 text-slate-800 border-b-2 border-slate-300 print:bg-slate-100">
                                                    <tr>
                                                        <th className="py-3 px-4 font-bold uppercase text-xs tracking-wider w-[35%] print:w-[35%]">Parameter</th>
                                                        <th className="py-3 px-4 font-bold uppercase text-xs tracking-wider w-[20%] print:w-[20%]">Result</th>
                                                        <th className="py-3 px-4 font-bold uppercase text-xs tracking-wider w-[15%] print:w-[15%]">Unit</th>
                                                        <th className="py-3 px-4 font-bold uppercase text-xs tracking-wider w-[30%] print:w-[30%]">Reference Range</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200/80">
                                                    {parameterResults?.map((pr: any, idx: number) => {
                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50/70 even:bg-slate-50/30 transition-colors">
                                                                <td className="py-3 px-4 font-semibold text-slate-800 text-sm">{pr.snapshotParameterName}</td>
                                                                <td className="py-3 px-4 font-bold text-slate-900 text-sm tabular-nums">{pr.resultValue || '-'}</td>
                                                                <td className="py-3 px-4 text-slate-600 text-sm">{pr.snapshotUnit || '-'}</td>
                                                                <td className="py-3 px-4 text-slate-600 text-sm whitespace-pre-line leading-relaxed tabular-nums">{pr.snapshotReferenceValue || '-'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>

                                {/* Remarks */}
                                {remarks && !isRichTextEmpty(remarks) && (
                                    <tr>
                                        <td className="p-0 border-0">
                                            <div className="mb-8 p-4 bg-slate-50/70 rounded-xl border border-slate-200 print:border-slate-300 print:bg-transparent print:p-0">
                                                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">Remarks / Clinical Notes:</h3>
                                                <div
                                                    className="text-slate-700 text-sm leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-50 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-400 [&_blockquote]:pl-3 [&_blockquote]:italic"
                                                    dangerouslySetInnerHTML={{ __html: normalizeInitialContentToHtml(remarks) }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Signatures and Computer Disclaimer */}
                                <tr>
                                    <td className="p-0 border-0">
                                        <div className="print-avoid-break mt-8 pt-4">
                                            <div className="pt-6 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8">
                                                <div className="text-center w-64 max-w-full">
                                                    <div className="border-t border-slate-400 pt-2 text-sm text-slate-600">
                                                        <div className="font-bold text-slate-800">
                                                            {labResult.performedBy ? `${labResult.performedBy.firstName} ${labResult.performedBy.lastName}` : 'Lab Technician'}
                                                        </div>
                                                        <div>Medical Technologist</div>
                                                    </div>
                                                </div>
                                                <div className="text-center w-64 max-w-full">
                                                    <div className="border-t border-slate-400 pt-2 text-sm text-slate-600">
                                                        <div className="font-bold text-slate-800">
                                                            {labResult.verifiedBy ? `Dr. ${labResult.verifiedBy.firstName} ${labResult.verifiedBy.lastName}` : 'Pathologist'}
                                                        </div>
                                                        <div>Consultant Pathologist</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="mt-12 pt-4 border-t-2 border-slate-800 text-center text-xs text-slate-500 font-medium">
                                                <p>This is a computer-generated report and does not require a physical signature.</p>
                                                <p className="mt-1">End of Report</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto bg-white shadow-lg overflow-hidden">
                    <InvoicePrint billing={labResult.billing} />
                </div>
            )}

        </div>
    );
};
