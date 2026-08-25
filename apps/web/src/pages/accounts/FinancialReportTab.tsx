import React, { useState } from 'react';
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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

    const { data: comparisonData } = useQuery({
        queryKey: ['financial-comparison', period],
        queryFn: async () => {
            if (period === 'CUSTOM') return null; // no comparison for custom range natively right now
            const { data } = await api.get('/accounts/financial-report/comparison?period=' + period);
            return data;
        },
        enabled: period !== 'CUSTOM'
    });

    const { data: chartData, isLoading: loadingChart } = useQuery({
        queryKey: ['financial-chart', period, startDate, endDate],
        queryFn: async () => {
            let s = startDate, e = endDate;
            let groupBy = 'DAY';
            
            if (period !== 'CUSTOM') {
                if (reportData?.period) {
                    s = reportData.period.startDate;
                    e = reportData.period.endDate;
                } else {
                    return [];
                }
            }

            if (period === 'MONTHLY') groupBy = 'DAY';
            
            const params = new URLSearchParams({ startDate: s, endDate: e, groupBy });
            const { data } = await api.get('/accounts/financial-report/chart?' + params.toString());
            return data;
        },
        enabled: !!(period === 'CUSTOM' ? (startDate && endDate) : reportData?.period)
    });

    const income = reportData?.income?.total || 0;
    const expense = reportData?.expense?.total || 0;
    const profit = reportData?.profit || 0;

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
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                data: chartData?.map((d: any) => d.income) || [],
                borderRadius: 4,
            },
            {
                type: 'bar' as const,
                label: 'Expense',
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Report Period</label>
                    <select 
                        value={period} 
                        onChange={(e) => setPeriod(e.target.value as any)}
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
            </div>

            {loadingReport ? (
                <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-500">Loading Report...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp size={48} className="text-blue-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Income</h3>
                            <p className="text-3xl font-black text-slate-900">{formatMoney(income)}</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">{reportData?.income?.transactionCount || 0} transactions</p>
                            {renderChangeIndicator(comparisonData?.changes?.income)}
                        </div>
                        
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingDown size={48} className="text-red-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Expense</h3>
                            <p className="text-3xl font-black text-slate-900">{formatMoney(expense)}</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">{reportData?.expense?.transactionCount || 0} transactions</p>
                            {renderChangeIndicator(comparisonData?.changes?.expense)}
                        </div>

                        <div className={`rounded-2xl border ${profit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} p-6 shadow-sm relative overflow-hidden`}>
                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Profit</h3>
                            <p className={`text-3xl font-black ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatMoney(profit)}
                            </p>
                            {renderChangeIndicator(comparisonData?.changes?.profit)}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Income vs Expense Trend</h3>
                        <div className="h-[400px]">
                            {loadingChart ? (
                                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Loading Chart...</div>
                            ) : chartData && chartData.length > 0 ? (
                                <Chart type='bar' data={cData as any} options={chartOptions} />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">No data available for this period.</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FinancialReportTab;
