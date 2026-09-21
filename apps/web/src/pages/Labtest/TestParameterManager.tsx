import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit3, ArrowUp, ArrowDown } from 'lucide-react';
import {
    useTestParameters,
    useCreateTestParameter,
    useUpdateTestParameter,
    useDeleteTestParameter,
    useReorderTestParameters,
    type TestParameter
} from '../../hooks/useLabTest';

interface TestParameterManagerProps {
    testId: number;
    testName: string;
    onClose: () => void;
}

const DATA_TYPES = ['NUMERIC', 'DECIMAL', 'TEXT', 'POSITIVE_NEGATIVE', 'SELECT'];

export function TestParameterManager({ testId, testName, onClose }: TestParameterManagerProps) {
    const { data: parameters = [], isLoading } = useTestParameters(testId);
    const createMutation = useCreateTestParameter();
    const updateMutation = useUpdateTestParameter();
    const deleteMutation = useDeleteTestParameter();
    const reorderMutation = useReorderTestParameters();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<TestParameter>>({
        name: '',
        dataType: 'NUMERIC',
        unit: '',
        referenceValue: '',
        options: [],
        isRequired: true,
        group: '',
        isSubItem: false,
        isActive: true
    });

    const [optionsText, setOptionsText] = useState('');

    useEffect(() => {
        if (formData.dataType === 'SELECT' && formData.options) {
            setOptionsText(formData.options.join(', '));
        }
    }, [formData.dataType, formData.options]);

    function handleOptionsChange(e: React.ChangeEvent<HTMLInputElement>) {
        setOptionsText(e.target.value);
        setFormData(prev => ({
            ...prev,
            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
        }));
    }

    function resetForm() {
        setFormData({
            name: '',
            dataType: 'NUMERIC',
            unit: '',
            referenceValue: '',
            options: [],
            isRequired: true,
            group: '',
            isSubItem: false,
            isActive: true
        });
        setOptionsText('');
        setIsAdding(false);
        setEditingId(null);
    }

    function startEdit(param: TestParameter) {
        setFormData({
            name: param.name,
            dataType: param.dataType,
            unit: param.unit || '',
            referenceValue: param.referenceValue || '',
            options: param.options || [],
            isRequired: param.isRequired,
            group: param.group || '',
            isSubItem: param.isSubItem,
            isActive: param.isActive
        });
        setEditingId(param.id);
        setIsAdding(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.name) return;

        try {
            if (editingId) {
                await updateMutation.mutateAsync({
                    testId,
                    paramId: editingId,
                    data: formData
                });
            } else {
                await createMutation.mutateAsync({
                    testId,
                    data: formData
                });
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save parameter', error);
            alert('Failed to save parameter. Please check the inputs.');
        }
    }

    async function handleDelete(paramId: string) {
        if (!confirm('Are you sure you want to delete this parameter?')) return;
        try {
            await deleteMutation.mutateAsync({ testId, paramId });
        } catch (error) {
            console.error('Failed to delete', error);
        }
    }

    async function handleMove(index: number, direction: 'up' | 'down') {
        const newParams = [...parameters];
        if (direction === 'up' && index > 0) {
            [newParams[index - 1], newParams[index]] = [newParams[index], newParams[index - 1]];
        } else if (direction === 'down' && index < newParams.length - 1) {
            [newParams[index + 1], newParams[index]] = [newParams[index], newParams[index + 1]];
        } else {
            return;
        }

        await reorderMutation.mutateAsync({
            testId,
            parameterIds: newParams.map(p => p.id)
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Parameters for {testName}</h2>
                        <p className="text-xs text-slate-500">Define the fields and reference values for this lab test</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* List Section */}
                    <div className="flex w-2/3 flex-col border-r border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between p-4">
                            <h3 className="text-sm font-bold text-slate-700">Existing Parameters</h3>
                            {!isAdding && (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                                >
                                    <Plus size={14} /> Add Parameter
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 pt-0">
                            {isLoading ? (
                                <div className="text-center text-sm text-slate-500">Loading parameters...</div>
                            ) : parameters.length === 0 ? (
                                <div className="text-center text-sm text-slate-500 py-8">No parameters defined yet.</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {parameters.map((param: TestParameter, index: number) => (
                                        <div
                                            key={param.id}
                                            className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm ${editingId === param.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                                                    <ArrowUp size={14} />
                                                </button>
                                                <button onClick={() => handleMove(index, 'down')} disabled={index === parameters.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                                                    <ArrowDown size={14} />
                                                </button>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{param.name}</span>
                                                    {param.isRequired && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">REQUIRED</span>}
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{param.dataType}</span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                                                    {param.unit && <span>Unit: {param.unit}</span>}
                                                    {param.referenceValue && <span>Ref: {param.referenceValue}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => startEdit(param)}
                                                    className="rounded-lg p-2 text-violet-600 hover:bg-violet-50"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(param.id)}
                                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Section */}
                    {isAdding && (
                        <div className="w-1/3 overflow-y-auto bg-white p-6">
                            <h3 className="mb-4 text-sm font-bold text-slate-800">
                                {editingId ? 'Edit Parameter' : 'New Parameter'}
                            </h3>
                            <form onSubmit={handleSave} className="flex flex-col gap-4">
                                <label className="block">
                                    <span className="mb-1 text-xs font-bold uppercase text-slate-500">Name *</span>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="e.g. Hemoglobin"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1 text-xs font-bold uppercase text-slate-500">Data Type *</span>
                                    <select
                                        value={formData.dataType}
                                        onChange={e => setFormData({ ...formData, dataType: e.target.value as any })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {DATA_TYPES.map(dt => (
                                            <option key={dt} value={dt}>{dt}</option>
                                        ))}
                                    </select>
                                </label>

                                {(formData.dataType === 'NUMERIC' || formData.dataType === 'DECIMAL' || formData.dataType === 'TEXT') && (
                                    <>
                                        <label className="block">
                                            <span className="mb-1 text-xs font-bold uppercase text-slate-500">Unit</span>
                                            <input
                                                value={formData.unit || ''}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                placeholder="e.g. g/dL, mg/dL"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-1 text-xs font-bold uppercase text-slate-500">Reference Value</span>
                                            <input
                                                value={formData.referenceValue || ''}
                                                onChange={e => setFormData({ ...formData, referenceValue: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                placeholder="e.g. 13.0 - 17.0"
                                            />
                                        </label>
                                    </>
                                )}

                                {formData.dataType === 'SELECT' && (
                                    <label className="block">
                                        <span className="mb-1 text-xs font-bold uppercase text-slate-500">Options (comma separated)</span>
                                        <input
                                            value={optionsText}
                                            onChange={handleOptionsChange}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="e.g. Positive, Negative, Trace"
                                        />
                                    </label>
                                )}

                                <label className="block">
                                    <span className="mb-1 text-xs font-bold uppercase text-slate-500">Group Name</span>
                                    <input
                                        value={formData.group || ''}
                                        onChange={e => setFormData({ ...formData, group: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="e.g. Differential Count"
                                    />
                                    <span className="mt-1 block text-[10px] text-slate-400">Optional. Use to group parameters together.</span>
                                </label>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={formData.isRequired}
                                            onChange={e => setFormData({ ...formData, isRequired: e.target.checked })}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                        />
                                        Is Required?
                                    </label>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700"
                                    >
                                        {editingId ? 'Update' : 'Add'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
