import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const ExpenseTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [period, setPeriod] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expenseTypeFilter, setExpenseTypeFilter] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formType, setFormType] = useState('EMPLOYEE_SALARY');
    const [formAmount, setFormAmount] = useState('');
    const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [formDesc, setFormDesc] = useState('');
    const [formRef, setFormRef] = useState('');
    const [formError, setFormError] = useState('');

    const fetchExpenses = async () => {
        const params = new URLSearchParams();
        params.append('period', period);
        if (expenseTypeFilter) params.append('expenseType', expenseTypeFilter);

        if (period === 'CUSTOM' && startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        }
        
        const { data } = await api.get('/accounts/expenses?' + params.toString());
        return data;
    };

    const { data: expenseData, isLoading } = useQuery({
        queryKey: ['expenses', period, startDate, endDate, expenseTypeFilter],
        queryFn: fetchExpenses,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/accounts/expenses', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            setShowModal(false);
            setFormAmount('');
            setFormDesc('');
            setFormRef('');
            setFormError('');
        },
        onError: (err: any) => {
            setFormError(err.response?.data?.message || 'Failed to create expense');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/accounts/expenses/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
            setFormError('Valid amount is required');
            return;
        }
        if (formType === 'OTHER' && !formDesc) {
            setFormError('Description is required when expense type is OTHER');
            return;
        }
        createMutation.mutate({
            expenseType: formType,
            amount: Number(formAmount),
            expenseDate: formDate,
            description: formDesc || undefined,
            referenceNumber: formRef || undefined
        });
    };

    const summary = expenseData?.summary || {};
    const transactions = expenseData?.results || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-w-[300px]">
                    <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Total Filtered Expense</h3>
                    <p className="text-2xl font-black text-red-600">{formatMoney(summary.filteredTotal || 0)}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                >
                    <Plus size={18} />
                    Add Expense
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Expense Type</label>
                        <select 
                            value={expenseTypeFilter} 
                            onChange={(e) => setExpenseTypeFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="EMPLOYEE_SALARY">Employee Salary</option>
                            <option value="EMPLOYEE_FOOD">Employee Food</option>
                            <option value="EMPLOYEE_BREAKFAST">Employee Breakfast</option>
                            <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
                            <option value="OFFICE_SUPPLIES">Office Supplies</option>
                            <option value="ELECTRICITY">Electricity</option>
                            <option value="INTERNET">Internet</option>
                            <option value="RENT">Rent</option>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="TRANSPORTATION">Transportation</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Filter Period</label>
                        <select 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value as any)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Time</option>
                            <option value="DAILY">Today</option>
                            <option value="WEEKLY">This Week</option>
                            <option value="MONTHLY">This Month</option>
                            <option value="CUSTOM">Custom Range</option>
                        </select>
                    </div>

                    {period === 'CUSTOM' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                        </>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-500">Loading Expenses...</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Date</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Type</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Description</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Amount</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center font-medium text-slate-400">
                                            No expenses found for this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx: any) => (
                                        <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{format(new Date(tx.expenseDate), 'dd MMM yyyy')}</td>
                                            <td className="px-4 py-3 font-medium">
                                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                                                    {tx.expenseType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs max-w-[200px] truncate">{tx.description || '-'}</td>
                                            <td className="px-4 py-3 text-right font-black text-red-600">{formatMoney(tx.amount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this expense?')) {
                                                            deleteMutation.mutate(tx.id);
                                                        }
                                                    }}
                                                    className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
                        <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                        <h2 className="mb-6 text-xl font-black text-slate-900">Add Expense</h2>

                        {formError && (
                            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600 border border-red-100">
                                {Array.isArray(formError) ? formError[0] : formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">Expense Type *</label>
                                <select
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="EMPLOYEE_SALARY">Employee Salary</option>
                                    <option value="EMPLOYEE_FOOD">Employee Food</option>
                                    <option value="EMPLOYEE_BREAKFAST">Employee Breakfast</option>
                                    <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
                                    <option value="OFFICE_SUPPLIES">Office Supplies</option>
                                    <option value="ELECTRICITY">Electricity</option>
                                    <option value="INTERNET">Internet</option>
                                    <option value="RENT">Rent</option>
                                    <option value="EQUIPMENT">Equipment</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="TRANSPORTATION">Transportation</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={formAmount}
                                    onChange={(e) => setFormAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">Expense Date *</label>
                                <input
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">
                                    Description {formType === 'OTHER' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    placeholder={formType === 'OTHER' ? 'Please explain this expense' : 'Optional description'}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none h-20 resize-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-bold text-slate-700">Reference Number</label>
                                <input
                                    type="text"
                                    value={formRef}
                                    onChange={(e) => setFormRef(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {createMutation.isPending ? 'Saving...' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseTab;
