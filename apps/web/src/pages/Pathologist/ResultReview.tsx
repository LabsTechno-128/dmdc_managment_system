import React, { useState } from 'react';
import { api } from '../../lib/api';

export const ResultReview: React.FC<{ result: any, onClose: () => void }> = ({ result, onClose }) => {
    const [remarks, setRemarks] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const templateFields = result.templateSnapshot?.fields || [];
    const resultData = result.resultData || {};

    const handleVerify = async () => {
        setProcessing(true);
        try {
            await api.post(`/lab-result/${result.sampleId}/verify`);
            // Automatically finalize report after verify (business logic option)
            // But let's keep it separate or do it in the same action to save clicks
            await api.post(`/reports/finalize/${result.id}`);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to verify');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!remarks.trim()) {
            setError('Remarks are required for rejection to inform the technician.');
            return;
        }
        setProcessing(true);
        try {
            await api.post(`/lab-result/${result.sampleId}/reject`, { remarks });
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        &larr; Back to List
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Review Result: {result.test?.name}</h1>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Patient Info</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Name</span>
                            <span className="font-medium">{result.patient?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Patient ID</span>
                            <span className="font-medium">{result.patient?.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Age / Gender</span>
                            <span className="font-medium">{result.patient?.age} / {result.patient?.gender}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Sample Info</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Barcode</span>
                            <span className="font-mono text-sm font-medium">{result.sample?.barcode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Collected At</span>
                            <span className="font-medium">{new Date(result.sample?.collectedAt || result.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Tested By</span>
                            <span className="font-medium">{result.performedBy ? `${result.performedBy.firstName} ${result.performedBy.lastName}` : '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b">
                    <h2 className="text-lg font-semibold text-slate-800">Test Parameters</h2>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-b">
                            <th className="p-4 font-medium text-slate-600">Parameter</th>
                            <th className="p-4 font-medium text-slate-600">Result</th>
                            <th className="p-4 font-medium text-slate-600">Unit</th>
                            <th className="p-4 font-medium text-slate-600">Reference Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templateFields.map((field: any, idx: number) => {
                            const val = resultData[field.name];
                            
                            // Basic logic to check if out of range for numbers
                            let isAbnormal = false;
                            if (field.type === 'number' && val !== undefined && val !== '') {
                                const numVal = parseFloat(val);
                                if (field.referenceRange && !isNaN(numVal)) {
                                    const match = field.referenceRange.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
                                    if (match) {
                                        const min = parseFloat(match[1]);
                                        const max = parseFloat(match[2]);
                                        if (numVal < min || numVal > max) {
                                            isAbnormal = true;
                                        }
                                    }
                                }
                            }

                            return (
                                <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{field.name}</td>
                                    <td className="p-4">
                                        <span className={`font-semibold ${isAbnormal ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-slate-800'}`}>
                                            {val || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{field.unit || '-'}</td>
                                    <td className="p-4 text-slate-600 text-sm whitespace-pre-line">{field.referenceRange || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {result.remarks && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-1">Technician Remarks</h3>
                    <p className="text-blue-900">{result.remarks}</p>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Reviewer Remarks (Optional if Verifying, Required if Rejecting)</label>
                    <textarea 
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full border rounded-md p-3 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        placeholder="Add your comments here..."
                    ></textarea>
                </div>

                <div className="flex gap-4 pt-2">
                    <button 
                        onClick={handleVerify}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        {processing ? 'Processing...' : 'Verify & Finalize Report'}
                    </button>
                    <button 
                        onClick={handleReject}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {processing ? 'Processing...' : 'Reject / Request Correction'}
                    </button>
                </div>
            </div>
        </div>
    );
};
