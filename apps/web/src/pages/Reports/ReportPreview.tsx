import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import { useReactToPrint } from 'react-to-print';
import { InvoicePrint } from '../Billing/InvoicePrint';
import { isRichTextEmpty, normalizeInitialContentToHtml } from '../../components/editor/richTextUtils';
import { Clock, ArrowLeft, Printer } from 'lucide-react';

export const ReportPreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [viewMode, setViewMode] = useState<'REPORT' | 'INVOICE'>('REPORT');
    // null = print all tests, number = print only that test's page
    const [singlePrintIdx, setSinglePrintIdx] = useState<number | null>(null);

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
        onAfterPrint: () => setSinglePrintIdx(null),
    });

    // Print only one specific test (its own page with header)
    const handlePrintSingleTest = (testIdx: number) => {
        if (viewMode !== 'REPORT') setViewMode('REPORT');
        setSinglePrintIdx(testIdx);
        // wait for re-render so the other pages are excluded from the print copy
        setTimeout(() => handlePrintReport(), 150);
    };

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
    const billing = report.billing || labResult.billing;

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

    const getReferringDoctorDisplay = () => {
        if (report.referringDoctorName) return report.referringDoctorName;
        if (billing?.referredByDoctor) {
            const doc = billing.referredByDoctor;
            const name = `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`.trim();
            const spec = doc.specialization ? ` (${doc.specialization})` : '';
            return `${name}${spec}` || 'Self';
        }
        if (billing?.referredBy && billing.referredBy.trim()) {
            return billing.referredBy.trim();
        }
        if (labResult.doctorName) {
            return labResult.doctorName;
        }
        return 'Self';
    };

    // Consolidated list of tests for this bill transaction
    const testsList: any[] = (report.tests && report.tests.length > 0)
        ? report.tests
        : [
            {
                testName: test.name || 'Diagnostic Test',
                parameterResults: parameterResults || [],
                remarks: remarks || '',
                performedBy: labResult.performedBy,
                verifiedBy: labResult.verifiedBy,
                isVerified: labResult.status === 'VERIFIED',
            }
        ];

    // Pathologist review information
    const pathologistReview = report.pathologistReview || {
        isReviewed: labResult.status === 'VERIFIED',
        reviewStatus: labResult.status === 'VERIFIED' ? 'Verified / Approved' : 'Pending Review',
        pathologistName: labResult.verifiedBy ? `Dr. ${labResult.verifiedBy.firstName || ''} ${labResult.verifiedBy.lastName || ''}`.trim() : null,
        reviewedAt: labResult.verifiedAt || null,
        remarks: remarks || ''
    };

    const billNumber = report.billNumber || billing?.billNumber || '-';

    const preparedByName = (() => {
        const firstWithTech = testsList.find(t => t.performedBy)?.performedBy;
        if (firstWithTech) {
            return `${firstWithTech.firstName || ''} ${firstWithTech.lastName || ''}`.trim();
        }
        if (labResult.performedBy) {
            return `${labResult.performedBy.firstName || ''} ${labResult.performedBy.lastName || ''}`.trim();
        }
        return 'Medical Technologist';
    })();

    const sampleCollectedAt = (() => {
        const firstWithDate = testsList.find(t => t.sampleCollectedAt)?.sampleCollectedAt;
        return firstWithDate || sample.collectedAt || report.createdAt;
    })();


    const totalPages = testsList.length;

    const fullName = (person: any) =>
        person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : '';

    // Header block repeated at the top of every printed page
    const renderPageHeader = (pageIdx: number) => (
        <>
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
                        {totalPages > 1 && (
                            <p className="text-[11px] text-slate-500 font-semibold tabular-nums">
                                Test {pageIdx + 1} of {totalPages}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ===================== PATIENT & BILL INFO GRID ===================== */}
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
                            <span className="font-semibold text-slate-500 w-32 shrink-0">Bill ID:</span>
                            <span className="font-bold text-slate-900 break-words font-mono tabular-nums">{billNumber}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="font-semibold text-slate-500 w-32 shrink-0">Collection Date:</span>
                            <span className="text-slate-800 tabular-nums">{formatDate(testsList[pageIdx]?.sampleCollectedAt || sampleCollectedAt)}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="font-semibold text-slate-500 w-32 shrink-0">Report Date:</span>
                            <span className="text-slate-800 tabular-nums">{formatDate(report.updatedAt)}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="font-semibold text-slate-500 w-32 shrink-0">Ref. By:</span>
                            <span className="text-slate-800 font-medium break-words">
                                {getReferringDoctorDisplay()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
            {/* Non-printable controls */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden px-4">
                <button
                    onClick={() => navigate('/reports')}
                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 font-medium cursor-pointer text-sm"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Reports List</span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                        report.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {report.status}
                    </span>
                    {report.status !== 'PUBLISHED' && viewMode === 'REPORT' && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {publishing ? 'Publishing...' : 'Publish & Deliver'}
                        </button>
                    )}
                    <button
                        onClick={() => setViewMode('REPORT')}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                            viewMode === 'REPORT'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        View Report ({testsList.length} {testsList.length === 1 ? 'Test' : 'Tests'})
                    </button>
                    <button
                        onClick={() => {
                            if (viewMode !== 'REPORT') setViewMode('REPORT');
                            setSinglePrintIdx(null);
                            setTimeout(() => handlePrintReport(), 100);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                        <Printer size={14} />
                        <span>Print Report</span>
                    </button>

                    {billing && (
                        <>
                            <button
                                onClick={() => setViewMode('INVOICE')}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                    viewMode === 'INVOICE'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                View Invoice
                            </button>
                            <button
                                onClick={() => handlePrintInvoice()}
                                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                            >
                                <Printer size={14} />
                                <span>Print Invoice</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Hidden invoice for printing */}
            <div className="hidden">
                <InvoicePrint ref={invoicePrintRef} billing={billing} />
            </div>

            {viewMode === 'REPORT' ? (
                <div ref={reportPrintRef} id="print-report-invoice" className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:w-full print:max-w-none">
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
                                /* One test per page */
                                .report-page {
                                    margin: 0 !important;
                                    box-shadow: none !important;
                                }
                                .report-page-break {
                                    break-after: page !important;
                                    page-break-after: always !important;
                                }
                                /* Pages excluded when printing a single test, and screen-only toolbars */
                                .report-page-skip,
                                .report-screen-only {
                                    display: none !important;
                                }
                                /* Header (thead) repeats if a single test overflows onto another page */
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

                    {testsList.map((t: any, testIdx: number) => {
                        const params = t.parameterResults || [];
                        const testRemarks = t.remarks || '';
                        const isLastPage = testIdx === totalPages - 1;
                        // When printing a single test, only that page is printed and it is the last printed page
                        const isSkippedInPrint = singlePrintIdx !== null && singlePrintIdx !== testIdx;
                        const isLastPrintedPage = singlePrintIdx !== null ? singlePrintIdx === testIdx : isLastPage;

                        const technologistName = fullName(t.performedBy) || preparedByName;
                        const testVerifierName = fullName(t.verifiedBy);
                        const pathologistName = testVerifierName
                            ? `Dr. ${testVerifierName}`
                            : pathologistReview.pathologistName || (t.isVerified ? 'Consultant Pathologist' : 'Pending Review');
                        const verifiedAt = t.verifiedAt || pathologistReview.reviewedAt;

                        return (
                            <div
                                key={testIdx}
                                className={`report-page bg-white shadow-lg print:shadow-none ${isSkippedInPrint ? 'report-page-skip' : ''} ${!isSkippedInPrint && !isLastPrintedPage ? 'report-page-break' : ''}`}
                            >
                                {/* Screen-only toolbar: print just this test */}
                                <div className="report-screen-only print:hidden flex flex-wrap items-center justify-between gap-2 px-4 sm:px-8 md:px-12 pt-4 -mb-2">
                                    <span className="text-xs font-semibold text-slate-500">
                                        Test {testIdx + 1} of {totalPages}: <span className="text-slate-800">{t.testName}</span>
                                    </span>
                                    <button
                                        onClick={() => handlePrintSingleTest(testIdx)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                        title={`Print only ${t.testName}`}
                                    >
                                        <Printer size={13} />
                                        <span>Print This Test</span>
                                    </button>
                                </div>
                                <div className="p-4 sm:p-8 md:p-12 print:p-0">
                                    <table className="print-layout-table w-full border-collapse">
                                        <thead className="table-header-group">
                                            <tr>
                                                <td className="p-0 border-0">
                                                    {renderPageHeader(testIdx)}
                                                </td>
                                            </tr>
                                        </thead>
                                        <tbody className="table-row-group">
                                            {/* ===================== TEST RESULT (one test per page) ===================== */}
                                            <tr>
                                                <td className="p-0 border-0">
                                                    {/* Test Header */}
                                                    <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-slate-300">
                                                        <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                                                            {t.testName}
                                                        </h2>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            t.isVerified
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {t.isVerified ? 'Verified' : 'Pending Review'}
                                                        </span>
                                                    </div>

                                                    {/* Test Results Table */}
                                                    <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs print:shadow-none print:border-slate-300 print:rounded-none">
                                                        <table className="report-inner-table w-full text-left border-collapse min-w-0 max-[999px]:min-w-[650px] print:min-w-0">
                                                            <thead className="bg-slate-100/90 text-slate-800 border-b-2 border-slate-300 print:bg-slate-100">
                                                                <tr>
                                                                    <th className="py-2.5 px-4 font-bold uppercase text-xs tracking-wider w-[35%] print:w-[35%]">Parameter</th>
                                                                    <th className="py-2.5 px-4 font-bold uppercase text-xs tracking-wider w-[20%] print:w-[20%]">Result</th>
                                                                    <th className="py-2.5 px-4 font-bold uppercase text-xs tracking-wider w-[15%] print:w-[15%]">Unit</th>
                                                                    <th className="py-2.5 px-4 font-bold uppercase text-xs tracking-wider w-[30%] print:w-[30%]">Reference Range</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm">
                                                                {params.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={4} className="py-4 px-4 text-center text-slate-500 italic">
                                                                            No parameters recorded for this test.
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    params.map((pr: any, pIdx: number) => (
                                                                        <tr key={pIdx} className="hover:bg-slate-50/70 even:bg-slate-50/30 transition-colors">
                                                                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                                                                                {pr.snapshotParameterName || pr.name || '-'}
                                                                            </td>
                                                                            <td className="py-2.5 px-4 font-bold text-slate-900 tabular-nums">
                                                                                {pr.resultValue || '-'}
                                                                            </td>
                                                                            <td className="py-2.5 px-4 text-slate-600">
                                                                                {pr.snapshotUnit || pr.unit || '-'}
                                                                            </td>
                                                                            <td className="py-2.5 px-4 text-slate-600 whitespace-pre-line leading-relaxed tabular-nums">
                                                                                {pr.snapshotReferenceValue || pr.referenceRange || '-'}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Individual test notes if applicable */}
                                                    {testRemarks && !isRichTextEmpty(testRemarks) && totalPages > 1 && (
                                                        <div className="mb-4 p-3 bg-slate-50/80 rounded-lg border border-slate-200 print:border-slate-300 print:bg-transparent text-xs sm:text-sm">
                                                            <span className="font-bold text-slate-800">Test Notes: </span>
                                                            <div
                                                                className="text-slate-700 inline [&_p]:inline"
                                                                dangerouslySetInnerHTML={{ __html: normalizeInitialContentToHtml(testRemarks) }}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* ===================== PATHOLOGIST REVIEW (last page) ===================== */}
                                            {isLastPage && (
                                                <tr>
                                                    <td className="p-0 border-0">
                                                        <div className="mt-6 mb-6 p-4 rounded-xl border print:border-slate-300 print:bg-transparent print-avoid-break bg-slate-50/70 border-slate-200">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-200/80 gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                                        Pathologist Review &amp; Clinical Approval
                                                                    </span>
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                                                            pathologistReview.isReviewed
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                                                : 'bg-amber-50 text-amber-700 border-amber-300'
                                                                        }`}
                                                                    >
                                                                        {pathologistReview.reviewStatus || (pathologistReview.isReviewed ? 'Verified / Approved' : 'Pending Review')}
                                                                    </span>
                                                                </div>
                                                                {pathologistReview.reviewedAt && (
                                                                    <span className="text-xs text-slate-500 font-medium">
                                                                        Reviewed On: {formatDate(pathologistReview.reviewedAt)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm mb-2">
                                                                <div>
                                                                    <span className="text-slate-500 font-medium">Reviewed By: </span>
                                                                    <span className="font-bold text-slate-800">
                                                                        {pathologistReview.pathologistName || (pathologistReview.isReviewed ? 'Consultant Pathologist' : 'Pending Review')}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 font-medium">Review Status: </span>
                                                                    <span className={`font-semibold ${pathologistReview.isReviewed ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                                        {pathologistReview.reviewStatus}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {pathologistReview.remarks && !isRichTextEmpty(pathologistReview.remarks) ? (
                                                                <div className="mt-3 pt-2 border-t border-slate-200">
                                                                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                                        Reviewer Comments &amp; Clinical Interpretation:
                                                                    </div>
                                                                    <div
                                                                        className="text-slate-700 text-xs sm:text-sm leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:p-1.5 [&_td]:border [&_td]:border-slate-300 [&_td]:p-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                                        dangerouslySetInnerHTML={{ __html: normalizeInitialContentToHtml(pathologistReview.remarks) }}
                                                                    />
                                                                </div>
                                                            ) : !pathologistReview.isReviewed ? (
                                                                <p className="text-xs text-amber-700 italic mt-1 flex items-center gap-1.5">
                                                                    <Clock size={12} />
                                                                    <span>* This report is currently pending review and verification by a consultant pathologist.</span>
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            {/* ===================== SIGNATURES & FOOTER (every page) ===================== */}
                                            <tr>
                                                <td className="p-0 border-0">
                                                    <div className="print-avoid-break mt-6 pt-4">
                                                        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8">
                                                            <div className="text-center w-64 max-w-full">
                                                                <div className="border-t border-slate-400 pt-2 text-sm text-slate-600">
                                                                    <div className="font-bold text-slate-800">
                                                                        {technologistName}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">Medical Technologist</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-center w-64 max-w-full">
                                                                <div className="border-t border-slate-400 pt-2 text-sm text-slate-600">
                                                                    <div className="font-bold text-slate-800">
                                                                        {pathologistName}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {t.isVerified && verifiedAt
                                                                            ? `Verified: ${formatDate(verifiedAt)}`
                                                                            : 'Consultant Pathologist'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="mt-10 pt-4 border-t-2 border-slate-800 text-center text-xs text-slate-500 font-medium">
                                                            <p>This is a computer-generated medical report and does not require a physical signature.</p>
                                                            <p className="mt-1 font-semibold text-slate-400">
                                                                {isLastPrintedPage ? 'End of Report' : `Test ${testIdx + 1} of ${totalPages} — continued on next page`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto bg-white shadow-lg overflow-hidden">
                    <InvoicePrint billing={billing} />
                </div>
            )}
        </div>
    );
};
