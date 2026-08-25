import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const IncomeTab: React.FC = () => {
    const [period, setPeriod] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchIncome = async () => {
        const params = new URLSearchParams();
        if (period === 'CUSTOM' && startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        } else if (period === 'DAILY') {
            const today = format(new Date(), 'yyyy-MM-dd');
            params.append('startDate', today);
            params.append('endDate', today);
        } else if (period === 'WEEKLY') {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            params.append('startDate', format(weekStart, 'yyyy-MM-dd'));
            params.append('endDate', format(new Date(), 'yyyy-MM-dd'));
        } else if (period === 'MONTHLY') {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            params.append('startDate', format(monthStart, 'yyyy-MM-dd'));
            params.append('endDate', format(new Date(), 'yyyy-MM-dd'));
        }
        
        const { data } = await api.get('/accounts/income?' + params.toString());
        return data;
    };

    const { data: incomeData, isLoading } = useQuery({
        queryKey: ['income', period, startDate, endDate],
        queryFn: fetchIncome,
    });

    const summary = incomeData?.summary || {};
    const transactions = incomeData?.results || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Today's Income</h3>
                    <p className="text-2xl font-black text-slate-900">{formatMoney(summary.todayTotal || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Weekly Income</h3>
                    <p className="text-2xl font-black text-slate-900">{formatMoney(summary.weekTotal || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Income</h3>
                    <p className="text-2xl font-black text-slate-900">{formatMoney(summary.monthTotal || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Total Income</h3>
                    <p className="text-2xl font-black text-blue-600">{formatMoney(summary.allTimeTotal || 0)}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-end gap-4">
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
                    <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-500">Loading Income...</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Date</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Patient</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Billing ID</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Amount</th>
                                    <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center font-medium text-slate-400">
                                            No income transactions found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx: any) => (
                                        <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm')}</td>
                                            <td className="px-4 py-3 font-medium">
                                                {tx.patient ? `${tx.patient.firstName} ${tx.patient.lastName}` : 'Walk-in Patient'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{tx.billing?.billNumber || 'N/A'}</td>
                                            <td className="px-4 py-3 text-right font-black text-slate-900">{formatMoney(tx.amount)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    {tx.paymentMethod}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomeTab;
