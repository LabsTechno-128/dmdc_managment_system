import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  BarController,
  LineController,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Printer,
  Search,
  Table as TableIcon,
  List,
} from 'lucide-react';
import PrintFinancialReportModal from './PrintFinancialReportModal';
import type { FinancialTransactionItem, PeriodicBreakdownItem } from './PrintFinancialReportModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const FinancialReportTab: React.FC = () => {
    const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('MONTHLY');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setDate(1); return format(d, 'yyyy-MM-dd');
    });
    const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [groupBy, setGroupBy] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
    
    // On-screen table views & filters
    const [activeTab, setActiveTab] = useState<'BREAKDOWN' | 'TRANSACTIONS'>('BREAKDOWN');
    const [transactionType, setTransactionType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [txPage, setTxPage] = useState(1);
    const txLimit = 15;

    // Print Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Reset pagination when filters change
    React.useEffect(() => {
        setTxPage(1);
    }, [period, startDate, endDate, transactionType, searchQuery]);

    // Financial Report Summary Query
    const { data: reportData, isLoading: loadingReport } = useQuery({
        queryKey: ['financial-report', period, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('period', period);
            if (period === 'CUSTOM') {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }
            const { data } = await api.get('/accounts/financial-report?' + params.toString());
            return data;
        },
    });

    // Comparison Query
    const { data: comparisonData } = useQuery({
        queryKey: ['financial-comparison', period],
        queryFn: async () => {
            if (period === 'CUSTOM') return null;
            const { data } = await api.get('/accounts/financial-report/comparison?period=' + period);
            return data;
        },
        enabled: period !== 'CUSTOM'
    });

    // Chart & Periodic Breakdown Query
    const { data: chartData, isLoading: loadingChart } = useQuery<PeriodicBreakdownItem[]>({
        queryKey: ['financial-chart', period, startDate, endDate, groupBy],
        queryFn: async () => {
            let s = startDate, e = endDate;
            
            if (period !== 'CUSTOM') {
                if (reportData?.period) {
                    s = reportData.period.startDate;
                    e = reportData.period.endDate;
                } else {
                    return [];
                }
            }

            const params = new URLSearchParams({ startDate: s, endDate: e, groupBy });
            const { data } = await api.get('/accounts/financial-report/chart?' + params.toString());
            return data;
        },
        enabled: !!(period === 'CUSTOM' ? (startDate && endDate) : reportData?.period)
    });

    // Detailed Transactions Query
    const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
        queryKey: ['financial-transactions', period, startDate, endDate, transactionType, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('period', period);
            if (period === 'CUSTOM') {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }
            if (transactionType !== 'ALL') {
                params.append('type', transactionType);
            }
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }
            const { data } = await api.get('/accounts/financial-report/transactions?' + params.toString());
            return data;
        },
        enabled: !!(period === 'CUSTOM' ? (startDate && endDate) : reportData?.period)
    });

    const income = reportData?.income?.total || 0;
    const expense = reportData?.expense?.total || 0;
    const profit = reportData?.profit ?? (income - expense);
    const incomeCount = reportData?.income?.transactionCount || 0;
    const expenseCount = reportData?.expense?.transactionCount || 0;
    const totalTransactions = incomeCount + expenseCount;

    const profitMargin = income > 0
        ? ((profit / income) * 100).toFixed(1)
        : '0.0';

    const renderChangeIndicator = (change?: number) => {
        if (!comparisonData || period === 'CUSTOM' || change === undefined) return null;
        if (change > 0) {
            return (
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-green-600">
                    <TrendingUp size={14} /> {change}% vs prev
                </div>
            );
        } else if (change < 0) {
            return (
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-red-600">
                    <TrendingDown size={14} /> {Math.abs(change)}% vs prev
                </div>
            );
        }
        return (
            <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400">
                <Minus size={14} /> 0% vs prev
            </div>
        );
    };

    const cData = {
        labels: chartData?.map((d: any) => d.period) || [],
        datasets: [
            {
                type: 'bar' as const,
                label: 'Income',
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                data: chartData?.map((d: any) => d.income) || [],
                borderRadius: 4,
            },
            {
                type: 'bar' as const,
                label: 'Expense',
                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                data: chartData?.map((d: any) => d.expense) || [],
                borderRadius: 4,
            },
            {
                type: 'line' as const,
                label: 'Net Profit',
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                data: chartData?.map((d: any) => d.profit) || [],
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { font: { family: 'inherit', weight: 'bold' as const } }
            }
        },
        scales: {
            y: { grid: { display: true, color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    const transactionsList: FinancialTransactionItem[] = useMemo(() => {
        return transactionsData?.results || [];
    }, [transactionsData?.results]);
    const totalTransactionsCount = transactionsData?.total || 0;
    
    // Pagination slicing for on-screen list
    const paginatedTransactions = useMemo(() => {
        const start = (txPage - 1) * txLimit;
        return transactionsList.slice(start, start + txLimit);
    }, [transactionsList, txPage, txLimit]);

    return (
        <div className="space-y-6">
            {/* Filter Bar with Controls & Print Report Action */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap gap-4 items-end justify-between">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Report Period</label>
                        <select 
                            value={period} 
                            onChange={(e) => {
                                const newP = e.target.value as any;
                                setPeriod(newP);
                                if (newP === 'DAILY') setGroupBy('DAY');
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                        >
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

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Group By</label>
                        <select 
                            value={groupBy} 
                            onChange={(e) => setGroupBy(e.target.value as any)}
                            disabled={period === 'DAILY'}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                            <option value="DAY">Daily</option>
                            <option value="WEEK">Weekly</option>
                            <option value="MONTH">Monthly</option>
                        </select>
                    </div>
                </div>

                {/* Print Report Action Button */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsPrintModalOpen(true)}
                        disabled={loadingReport || !reportData}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Printer size={18} />
                        Print Report
                    </button>
                </div>
            </div>

            {loadingReport ? (
                <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-500">
                    Loading Report...
                </div>
            ) : (
                <>
                    {/* Executive KPI Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp size={48} className="text-blue-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Income</h3>
                            <p className="text-3xl font-black text-slate-900">{formatMoney(income)}</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">{incomeCount} transactions</p>
                            {renderChangeIndicator(comparisonData?.changes?.income)}
                        </div>
                        
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingDown size={48} className="text-red-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Expense</h3>
                            <p className="text-3xl font-black text-slate-900">{formatMoney(expense)}</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">{expenseCount} transactions</p>
                            {renderChangeIndicator(comparisonData?.changes?.expense)}
                        </div>

                        <div className={`rounded-2xl border ${profit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} p-6 shadow-sm relative overflow-hidden`}>
                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Profit</h3>
                            <p className={`text-3xl font-black ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatMoney(profit)}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-1">Margin: {profitMargin}% ({totalTransactions} total)</p>
                            {renderChangeIndicator(comparisonData?.changes?.profit)}
                        </div>
                    </div>

                    {/* Income vs Expense Trend Chart */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Income vs Expense Trend</h3>
                                <p className="text-xs text-slate-500 font-medium">Grouped by {groupBy.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="h-[360px]">
                            {loadingChart ? (
                                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Loading Chart...</div>
                            ) : chartData && chartData.length > 0 ? (
                                <Chart type='bar' data={cData as any} options={chartOptions} />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">No data available for this period.</div>
                            )}
                        </div>
                    </div>

                    {/* On-Screen Tables Section: Breakdown & Detailed Transactions */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('BREAKDOWN')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        activeTab === 'BREAKDOWN'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <TableIcon size={16} />
                                    Periodic Breakdown ({groupBy})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('TRANSACTIONS')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        activeTab === 'TRANSACTIONS'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <List size={16} />
                                    Detailed Transactions ({totalTransactionsCount})
                                </button>
                            </div>

                            {activeTab === 'TRANSACTIONS' && (
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Type filter */}
                                    <select
                                        value={transactionType}
                                        onChange={(e) => setTransactionType(e.target.value as any)}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                                    >
                                        <option value="ALL">All Types</option>
                                        <option value="INCOME">Income Only</option>
                                        <option value="EXPENSE">Expense Only</option>
                                    </select>

                                    {/* Search input */}
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search ledger..."
                                            className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 w-44"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content for TAB 1: PERIODIC BREAKDOWN */}
                        {activeTab === 'BREAKDOWN' && (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="border-b border-slate-200 px-4 py-3 font-bold">Period / Date</th>
                                            <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Income</th>
                                            <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Expense</th>
                                            <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Net Profit / (Loss)</th>
                                            <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!chartData || chartData.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center font-medium text-slate-400">
                                                    No activity found for this period.
                                                </td>
                                            </tr>
                                        ) : (
                                            chartData.map((row, idx) => {
                                                const isSurplus = row.profit >= 0;
                                                return (
                                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-medium text-slate-900">
                                                            {row.period}
                                                            {row.startDate && row.endDate && row.startDate !== row.endDate && (
                                                                <span className="text-xs text-slate-400 block font-normal">
                                                                    {row.startDate} to {row.endDate}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                            {formatMoney(row.income || 0)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                            {formatMoney(row.expense || 0)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-black ${
                                                            isSurplus ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {formatMoney(row.profit || 0)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
                                                                isSurplus
                                                                    ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                                                                    : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                                                            }`}>
                                                                {isSurplus ? 'Surplus' : 'Deficit'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {chartData && chartData.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                                                <td className="px-4 py-3 uppercase text-xs">Grand Total</td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatMoney(chartData.reduce((s, r) => s + (r.income || 0), 0))}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatMoney(chartData.reduce((s, r) => s + (r.expense || 0), 0))}
                                                </td>
                                                <td className={`px-4 py-3 text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatMoney(profit)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-xs">
                                                    {profit >= 0 ? 'Surplus' : 'Deficit'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        )}

                        {/* Content for TAB 2: DETAILED TRANSACTIONS */}
                        {activeTab === 'TRANSACTIONS' && (
                            <div>
                                {loadingTransactions ? (
                                    <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-500">
                                        Loading Transactions...
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full text-left text-sm text-slate-600">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                                <tr>
                                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Date</th>
                                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Type</th>
                                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Category</th>
                                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Description</th>
                                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Reference / ID</th>
                                                    <th className="border-b border-slate-200 px-4 py-3 font-bold">Method</th>
                                                    <th className="border-b border-slate-200 px-4 py-3 font-bold text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedTransactions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-8 text-center font-medium text-slate-400">
                                                            No transactions found for the selected period.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedTransactions.map((tx, idx) => {
                                                        const isIncome = tx.type === 'INCOME';
                                                        let dateStr = 'N/A';
                                                        try {
                                                            dateStr = format(new Date(tx.date), 'dd MMM yyyy, HH:mm');
                                                        } catch {
                                                            dateStr = String(tx.date);
                                                        }

                                                        return (
                                                            <tr key={tx.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                                                                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                                                    {dateStr}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
                                                                        isIncome
                                                                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                                                            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                                                                    }`}>
                                                                        {tx.type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-slate-700">
                                                                    {tx.category}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600">
                                                                    {tx.description}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                                    {tx.referenceId || 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 text-xs">
                                                                    {tx.paymentMethod || 'Cash'}
                                                                </td>
                                                                <td className={`px-4 py-3 text-right font-black ${
                                                                    isIncome ? 'text-green-700' : 'text-red-700'
                                                                }`}>
                                                                    {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
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
                                {!loadingTransactions && totalTransactionsCount > txLimit && (
                                    <div className="mt-4 flex items-center justify-between pt-2">
                                        <div className="text-xs text-slate-500 font-medium">
                                            Showing <span className="font-bold text-slate-900">{((txPage - 1) * txLimit) + 1}</span> to <span className="font-bold text-slate-900">{Math.min(txPage * txLimit, totalTransactionsCount)}</span> of <span className="font-bold text-slate-900">{totalTransactionsCount}</span> transactions
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTxPage(p => Math.max(1, p - 1))}
                                                disabled={txPage === 1}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-xs font-bold text-slate-800 px-1">
                                                Page {txPage} of {Math.ceil(totalTransactionsCount / txLimit)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setTxPage(p => p + 1)}
                                                disabled={txPage * txLimit >= totalTransactionsCount}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Print Modal Dialog */}
            <PrintFinancialReportModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                reportData={reportData}
                breakdownData={chartData || []}
                transactions={transactionsList}
                period={period}
                groupBy={groupBy}
                startDate={startDate}
                endDate={endDate}
                formatMoney={formatMoney}
            />
        </div>
    );
};

export default FinancialReportTab;

