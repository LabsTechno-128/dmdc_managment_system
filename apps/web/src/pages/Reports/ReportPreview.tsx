import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export const ReportPreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [publishing, setPublishing] = useState(false);

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

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading report...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!report) return <div className="p-8 text-center text-slate-500">Report not found</div>;

    let parsedData = { template: { fields: [] }, results: {}, remarks: '' };
    try {
        if (report.reportData) {
            parsedData = JSON.parse(report.reportData);
        }
    } catch (e) {
        console.error("Failed to parse reportData");
    }

    const { template, results, remarks } = parsedData;
    const patient = report.patient || {};
    const labResult = report.labResult || {};
    const test = labResult.test || {};
    const sample = labResult.sample || {};

    return (
        <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
            {/* Non-printable controls */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden px-4">
                <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800">
                    &larr; Back
                </button>
                <div className="space-x-4 flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${report.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {report.status}
                    </span>
                    {report.status !== 'PUBLISHED' && (
                        <button 
                            onClick={handlePublish} 
                            disabled={publishing}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {publishing ? 'Publishing...' : 'Publish Report'}
                        </button>
                    )}
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900"
                    >
                        Print PDF
                    </button>
                </div>
            </div>

            {/* Printable A4 Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:w-full print:max-w-none">
                <div className="p-12 print:p-8">
                    
                    {/* Header */}
                    <div className="border-b-4 border-slate-800 pb-6 mb-8 text-center">
                        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wider mb-2">Diagnostic Center</h1>
                        <p className="text-slate-600 font-medium text-lg">Pathology Laboratory Report</p>
                    </div>

                    {/* Patient & Sample Info Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                        <div className="space-y-3">
                            <div className="flex border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-600 w-32">Patient Name:</span>
                                <span className="font-bold text-slate-900 uppercase">{patient.name}</span>
                            </div>
                            <div className="flex border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-600 w-32">Patient ID:</span>
                                <span className="text-slate-900">{patient.id}</span>
                            </div>
                            <div className="flex border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-600 w-32">Age / Gender:</span>
                                <span className="text-slate-900">{patient.age} Yrs / {patient.gender}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-600 w-32">Sample ID:</span>
                                <span className="text-slate-900">{sample.barcode}</span>
                            </div>
                            <div className="flex border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-600 w-32">Collection Date:</span>
                                <span className="text-slate-900">{new Date(sample.collectedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-600 w-32">Report Date:</span>
                                <span className="text-slate-900">{new Date(report.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Test Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-slate-800 underline uppercase decoration-2 underline-offset-4">Test: {test.name}</h2>
                    </div>

                    {/* Results Table */}
                    <div className="mb-12">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-y-2 border-slate-800 text-slate-900">
                                    <th className="py-3 font-bold uppercase text-sm">Parameter</th>
                                    <th className="py-3 font-bold uppercase text-sm">Result</th>
                                    <th className="py-3 font-bold uppercase text-sm">Unit</th>
                                    <th className="py-3 font-bold uppercase text-sm">Reference Range</th>
                                </tr>
                            </thead>
                            <tbody>
                                {template?.fields?.map((field: any, idx: number) => {
                                    const val = (results as any)[field.name];
                                    return (
                                        <tr key={idx} className="border-b border-slate-200">
                                            <td className="py-3 font-medium text-slate-800">{field.name}</td>
                                            <td className="py-3 font-bold text-slate-900">{val || '-'}</td>
                                            <td className="py-3 text-slate-700 text-sm">{field.unit || '-'}</td>
                                            <td className="py-3 text-slate-700 text-sm whitespace-pre-line">{field.referenceRange || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Remarks */}
                    {remarks && (
                        <div className="mb-16">
                            <h3 className="font-bold text-slate-900 mb-2">Remarks:</h3>
                            <p className="text-slate-700">{remarks}</p>
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="mt-20 pt-8 flex justify-between">
                        <div className="text-center w-64">
                            <div className="border-t border-slate-400 pt-2 text-sm text-slate-600">
                                <div className="font-bold text-slate-800">
                                    {labResult.performedBy ? `${labResult.performedBy.firstName} ${labResult.performedBy.lastName}` : 'Lab Technician'}
                                </div>
                                <div>Medical Technologist</div>
                            </div>
                        </div>
                        <div className="text-center w-64">
                            <div className="border-t border-slate-400 pt-2 text-sm text-slate-600">
                                <div className="font-bold text-slate-800">
                                    {labResult.verifiedBy ? `Dr. ${labResult.verifiedBy.firstName} ${labResult.verifiedBy.lastName}` : 'Pathologist'}
                                </div>
                                <div>Consultant Pathologist</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-4 border-t-2 border-slate-800 text-center text-xs text-slate-500 font-medium">
                        <p>This is a computer-generated report and does not require a physical signature.</p>
                        <p className="mt-1">End of Report</p>
                    </div>

                </div>
            </div>

            {/* Global print styles to hide everything except the print container */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:bg-white {
                        background-color: white !important;
                    }
                    .print\\:py-0 {
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:w-full {
                        width: 100% !important;
                    }
                    .print\\:max-w-none {
                        max-width: none !important;
                    }
                    .print\\:p-8 {
                        padding: 2rem !important;
                    }
                    .max-w-4xl, .max-w-4xl * {
                        visibility: visible;
                    }
                    .max-w-4xl {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            `}</style>
        </div>
    );
};
