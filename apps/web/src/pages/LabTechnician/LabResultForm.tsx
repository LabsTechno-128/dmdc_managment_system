import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Field {
    name: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
    unit?: string;
    referenceRange?: string;
    required: boolean;
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
    const [formData, setFormData] = useState<any>(initialData?.resultData || {});
    const [remarks, setRemarks] = useState(initialData?.remarks || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const res = await api.get(`/lab-result/template/${testId}`);
                setFields(res.data.fields || []);
            } catch (err: any) {
                setError('Failed to load test template');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [testId]);

    const handleInputChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        setError('');
        try {
            await api.post(`/lab-result/${sampleId}/draft`, { resultData: formData, remarks });
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
            await api.post(`/lab-result/${sampleId}/submit`, { resultData: formData, remarks });
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
                            No template configured for this test.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fields.map((f, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                    <label className="text-sm font-medium text-slate-700">
                                        {f.name} {f.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="md:col-span-2 flex items-center gap-2">
                                        {f.type === 'select' ? (
                                            <select
                                                value={formData[f.name] || ''}
                                                onChange={(e) => handleInputChange(f.name, e.target.value)}
                                                className="border rounded p-2 flex-1 text-sm focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select...</option>
                                                {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type={f.type === 'number' ? 'number' : 'text'}
                                                value={formData[f.name] || ''}
                                                onChange={(e) => handleInputChange(f.name, e.target.value)}
                                                className="border rounded p-2 flex-1 text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}
                                        {f.unit && <span className="text-sm text-slate-500 w-16">{f.unit}</span>}
                                    </div>
                                    {f.referenceRange && (
                                        <div className="md:col-start-2 md:col-span-2 text-xs text-slate-400">
                                            Reference Range: {f.referenceRange}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 border-t pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                            rows={3}
                            placeholder="Any additional notes..."
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
                    {fields.length > 0 && (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabResultForm;
