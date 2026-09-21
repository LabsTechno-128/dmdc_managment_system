import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Field {
    id: string;
    name: string;
    dataType: 'NUMERIC' | 'DECIMAL' | 'TEXT' | 'POSITIVE_NEGATIVE' | 'SELECT';
    options?: string[];
    unit?: string;
    referenceValue?: string;
    isRequired: boolean;
}

interface LabResultFormProps {
    sampleId: string;
    testId: number;
    testName: string;
    initialData?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const LabResultForm: React.FC<LabResultFormProps> = ({ sampleId, testId, testName, initialData, onClose, onSuccess }) => {
    const [fields, setFields] = useState<Field[]>([]);
    
    // Map initial parameterResults array to a key-value object: { [testParameterId]: resultValue }
    const initialMap = Array.isArray(initialData?.parameterResults) 
        ? initialData.parameterResults.reduce((acc: any, pr: any) => ({ ...acc, [pr.testParameterId]: pr.resultValue }), {}) 
        : {};
        
    const [formData, setFormData] = useState<Record<string, string>>(initialMap);
    const [remarks, setRemarks] = useState(initialData?.remarks || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchParameters = async () => {
            try {
                const res = await api.get(`/lab-tests/${testId}/parameters`);
                setFields(res.data || []);
            } catch (err: any) {
                setError('Failed to load test parameters');
            } finally {
                setLoading(false);
            }
        };
        fetchParameters();
    }, [testId]);

    const handleInputChange = (parameterId: string, value: string) => {
        setFormData((prev) => ({ ...prev, [parameterId]: value }));
    };

    // Prepare payload format: [{ testParameterId: string, resultValue: string }]
    const preparePayload = () => {
        return Object.entries(formData).map(([testParameterId, resultValue]) => ({
            testParameterId,
            resultValue
        }));
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        setError('');
        try {
            await api.post(`/lab-result/${sampleId}/draft`, { resultData: preparePayload(), remarks });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError('');
        try {
            await api.post(`/lab-result/${sampleId}/submit`, { resultData: preparePayload(), remarks });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit result');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded shadow">Loading template...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-slate-800">Enter Result: {testName}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    {fields.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            No specific parameters configured for this test. Please enter the result in the remarks box below.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fields.map((f) => (
                                <div key={f.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b pb-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        {f.name} {f.isRequired && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="md:col-span-2 flex items-center gap-2">
                                        {f.dataType === 'SELECT' || f.dataType === 'POSITIVE_NEGATIVE' ? (
                                            <select
                                                value={formData[f.id] || ''}
                                                onChange={(e) => handleInputChange(f.id, e.target.value)}
                                                className="border rounded p-2 flex-1 text-sm focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select...</option>
                                                {f.dataType === 'POSITIVE_NEGATIVE' 
                                                    ? ['Positive', 'Negative'].map(opt => <option key={opt} value={opt}>{opt}</option>)
                                                    : f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)
                                                }
                                            </select>
                                        ) : (
                                            <input
                                                type={f.dataType === 'NUMERIC' || f.dataType === 'DECIMAL' ? 'number' : 'text'}
                                                step={f.dataType === 'DECIMAL' ? '0.01' : 'any'}
                                                value={formData[f.id] || ''}
                                                onChange={(e) => handleInputChange(f.id, e.target.value)}
                                                className="border rounded p-2 flex-1 text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}
                                        {f.unit && <span className="text-sm text-slate-500 w-16 whitespace-nowrap">{f.unit}</span>}
                                    </div>
                                    {f.referenceValue && (
                                        <div className="md:col-start-2 md:col-span-2 text-xs text-slate-400 font-mono bg-slate-50 p-1 rounded">
                                            Ref: {f.referenceValue}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 border-t pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Remarks / Report</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                            rows={4}
                            placeholder="Type the report or any additional notes here..."
                        />
                    </div>
                </div>

                <div className="p-4 border-b bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 border text-slate-600 rounded hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Submitting...' : 'Submit Result'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabResultForm;
