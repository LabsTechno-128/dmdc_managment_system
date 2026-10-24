import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Printer,
    X,
    FileText,
    TrendingUp,
    TrendingDown,
    Calendar,
    User as UserIcon,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

export interface FinancialTransactionItem {
    id: string;
    date: string | Date;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    paymentMethod: string;
    referenceId: string;
    amount: number;
    patientName?: string;
    patientId?: string;
    receivedBy?: string | null;
    createdBy?: string | null;
}

export interface PeriodicBreakdownItem {
    period: string;
    dateKey?: string;
    startDate?: string;
    endDate?: string;
    income: number;
    expense: number;
    profit: number;
}

interface PrintFinancialReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: {
        period?: {
            startDate: string;
            endDate: string;
        };
        income?: {
            total: number;
            transactionCount: number;
        };
        expense?: {
            total: number;
            transactionCount: number;
        };
        profit?: number;
    } | null;
    breakdownData?: PeriodicBreakdownItem[];
    transactions?: FinancialTransactionItem[];
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    groupBy: 'DAY' | 'WEEK' | 'MONTH';
    startDate: string;
    endDate: string;
    formatMoney: (amount: number) => string;
}

export const PrintFinancialReportModal: React.FC<PrintFinancialReportModalProps> = ({
    isOpen,
    onClose,
    reportData,
    breakdownData = [],
    transactions = [],
    period,
    groupBy,
    startDate,
    endDate,
    formatMoney
}) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const currentUser = useAuthStore((state) => state.user);

    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [includeBreakdown, setIncludeBreakdown] = useState<boolean>(true);
    const [includeTransactions, setIncludeTransactions] = useState<boolean>(true);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `DMDC_Financial_Report_${period}_${startDate}_${endDate}`,
    });

    if (!isOpen || !reportData) return null;

    const totalIncome = reportData.income?.total || 0;
    const totalExpense = reportData.expense?.total || 0;
    const netProfit = reportData.profit ?? (totalIncome - totalExpense);
    const incomeCount = reportData.income?.transactionCount || 0;
    const expenseCount = reportData.expense?.transactionCount || 0;
    const totalTransactions = incomeCount + expenseCount;

    const profitMargin = totalIncome > 0
        ? ((netProfit / totalIncome) * 100).toFixed(1)
        : '0.0';

    const getPeriodLabel = () => {
        switch (period) {
            case 'DAILY':
                return 'Daily Statement (Today)';
            case 'WEEKLY':
                return 'Weekly Statement (This Week)';
            case 'MONTHLY':
                return 'Monthly Statement (This Month)';
            case 'CUSTOM':
                return 'Custom Period Statement';
            default:
                return 'Financial Statement';
        }
    };

    const formattedStartDate = reportData.period?.startDate || startDate;
    const formattedEndDate = reportData.period?.endDate || endDate;

    const grandBreakdownIncome = breakdownData.reduce((sum, item) => sum + (item.income || 0), 0);
    const grandBreakdownExpense = breakdownData.reduce((sum, item) => sum + (item.expense || 0), 0);
    const grandBreakdownProfit = grandBreakdownIncome - grandBreakdownExpense;

    const currentUserName = currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : (currentUser?.name || 'Authorized Officer');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col h-[92vh] z-10">
                {/* Modal Top Control Bar (Never Printed) */}
                <div className="flex flex-wrap items-center justify-between p-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-800">Financial Report Print Preview</h2>
                            <p className="text-xs text-slate-500 font-medium">Standard A4 Print & PDF Export</p>
                        </div>
                    </div>

                    {/* Report Customization Options */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-600">
                        {/* Orientation selector */}
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                            <button
                                type="button"
                                onClick={() => setOrientation('portrait')}
                                className={`px-2.5 py-1.5 rounded-md transition-colors ${orientation === 'portrait'
                                        ? 'bg-blue-600 text-white font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                Portrait
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrientation('landscape')}
                                className={`px-2.5 py-1.5 rounded-md transition-colors ${orientation === 'landscape'
                                        ? 'bg-blue-600 text-white font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                Landscape
                            </button>
                        </div>

                        {/* Section toggles */}
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={includeBreakdown}
                                onChange={(e) => setIncludeBreakdown(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>Periodic Breakdown</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={includeTransactions}
                                onChange={(e) => setIncludeTransactions(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>Transaction Ledger</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => handlePrint()}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                            <Printer size={16} />
                            <span>Print / Save PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Preview Viewport */}
                <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 md:p-8 bg-slate-100/80">
                    <div
                        ref={componentRef}
                        className={`bg-white shadow-md mx-auto text-slate-800 ${orientation === 'portrait' ? 'max-w-[210mm]' : 'max-w-[297mm]'
                            } min-w-[600px] sm:min-w-0 p-6 sm:p-8 md:p-10 font-sans print:shadow-none print:m-0 print:p-0 print:max-w-none print:w-full print:min-w-0`}
                        style={{
                            minHeight: orientation === 'portrait' ? '297mm' : '210mm',
                        }}
                        id="financial-report-print"
                    >
                        {/* Print Stylesheet */}
                        <style type="text/css" media="print">
                            {`
                                @page {
                                    size: A4 ${orientation};
                                    margin: 12mm 15mm 15mm 15mm;
                                }
                                body {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                    background: #ffffff !important;
                                    color: #1e293b !important;
                                }
                                @media print {
                                    .no-print {
                                        display: none !important;
                                    }
                                    table {
                                        page-break-inside: auto;
                                        width: 100% !important;
                                    }
                                    tr {
                                        page-break-inside: avoid;
                                        break-inside: avoid;
                                    }
                                    thead {
                                        display: table-header-group;
                                    }
                                    tfoot {
                                        display: table-footer-group;
                                    }
                                    .print-avoid-break {
                                        page-break-inside: avoid;
                                        break-inside: avoid;
                                    }
                                }
                            `}
                        </style>

                        {/* ===================== HOSPITAL OFFICIAL HEADER ===================== */}
                        <div className="border-b-2 border-slate-800 pb-5 mb-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white flex items-center justify-center p-1">
                                        <img
                                            src="/dmdc_logo.jpeg"
                                            alt="DMDC Logo"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                // Fallback if image path not accessible
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                        <span className="text-xs font-black text-blue-700 hidden">DMDC</span>
                                    </div>
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                            Dr. Muazzem Medical Diagnostic Center
                                        </h1>
                                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                                            82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka.
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 mt-1">
                                            <span>Phone: 01234567890, 01234567899</span>
                                            <span>E-mail: dmdc.contact@gmail.com</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded">
                                        Official Report
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                                        Issue Date: {format(new Date(), 'dd MMM yyyy, HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ===================== REPORT TITLE & METADATA ===================== */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 block">
                                        Accounting & Finance
                                    </span>
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                                        {getPeriodLabel()}
                                    </h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-6 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <div>
                                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Reporting Window</span>
                                            <span className="font-bold text-slate-800">
                                                {formattedStartDate} &rarr; {formattedEndDate}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <UserIcon size={14} className="text-slate-400" />
                                        <div>
                                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Generated By</span>
                                            <span className="font-bold text-slate-800">{currentUserName}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Grouping Mode</span>
                                        <span className="font-bold text-slate-800 uppercase">{groupBy}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================== SECTION A: FINANCIAL SUMMARY ===================== */}
                        <div className="mb-6 print-avoid-break">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                                1. Executive Financial Summary
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Total Income</span>
                                        <TrendingUp size={14} className="text-green-600" />
                                    </div>
                                    <div className="text-xl font-black text-slate-900">
                                        {formatMoney(totalIncome)}
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                        {incomeCount} transaction{incomeCount === 1 ? '' : 's'}
                                    </p>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Total Expense</span>
                                        <TrendingDown size={14} className="text-red-600" />
                                    </div>
                                    <div className="text-xl font-black text-slate-900">
                                        {formatMoney(totalExpense)}
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                        {expenseCount} transaction{expenseCount === 1 ? '' : 's'}
                                    </p>
                                </div>

                                <div className={`border rounded-xl p-4 ${netProfit >= 0 ? 'border-green-300 bg-green-50/40' : 'border-red-300 bg-red-50/40'
                                    }`}>
                                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                                        <span className={netProfit >= 0 ? 'text-green-800' : 'text-red-800'}>
                                            Net Profit / (Loss)
                                        </span>
                                        {netProfit >= 0 ? (
                                            <CheckCircle2 size={14} className="text-green-600" />
                                        ) : (
                                            <AlertCircle size={14} className="text-red-600" />
                                        )}
                                    </div>
                                    <div className={`text-xl font-black ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {formatMoney(netProfit)}
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                        Margin: {profitMargin}%
                                    </p>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <div className="text-xs font-bold text-slate-500 mb-1">
                                        Financial Status
                                    </div>
                                    <div className="text-base font-black text-slate-800 mt-0.5">
                                        {netProfit >= 0 ? 'Surplus / Profitable' : 'Deficit / Net Loss'}
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                        {totalTransactions} Total Records
                                    </p>
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-400 mt-2 italic">
                                * Summary figures are reconciled directly from completed billing vouchers and recorded expense vouchers. Opening and closing balance adjustments are not maintained in the current ledger configuration.
                            </p>
                        </div>

                        {/* ===================== SECTION B: PERIODIC BREAKDOWN ===================== */}
                        {includeBreakdown && (
                            <div className="mb-6 print-avoid-break">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                        2. Periodic Financial Breakdown ({groupBy} Summary)
                                    </h3>
                                    <span className="text-[11px] text-slate-500 font-semibold">
                                        {breakdownData.length} Intervals
                                    </span>
                                </div>

                                {breakdownData.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                                        No breakdown intervals available for this period.
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                                    <th className="py-2.5 px-3">Period / Date</th>
                                                    <th className="py-2.5 px-3 text-right">Income</th>
                                                    <th className="py-2.5 px-3 text-right">Expense</th>
                                                    <th className="py-2.5 px-3 text-right">Net Profit / (Loss)</th>
                                                    <th className="py-2.5 px-3 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {breakdownData.map((row, idx) => {
                                                    const isProfitable = (row.profit || 0) >= 0;
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="py-2 px-3 font-semibold text-slate-800">
                                                                {row.period}
                                                                {row.startDate && row.endDate && row.startDate !== row.endDate && (
                                                                    <span className="text-[10px] text-slate-400 block font-normal">
                                                                        {row.startDate} to {row.endDate}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-semibold text-slate-700">
                                                                {formatMoney(row.income || 0)}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-semibold text-slate-700">
                                                                {formatMoney(row.expense || 0)}
                                                            </td>
                                                            <td className={`py-2 px-3 text-right font-black ${isProfitable ? 'text-green-600' : 'text-red-600'
                                                                }`}>
                                                                {formatMoney(row.profit || 0)}
                                                            </td>
                                                            <td className="py-2 px-3 text-right">
                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${isProfitable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {isProfitable ? 'Surplus' : 'Deficit'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-100/80 font-black border-t-2 border-slate-300 text-slate-900">
                                                    <td className="py-2.5 px-3 uppercase text-[11px]">Grand Total</td>
                                                    <td className="py-2.5 px-3 text-right">{formatMoney(grandBreakdownIncome)}</td>
                                                    <td className="py-2.5 px-3 text-right">{formatMoney(grandBreakdownExpense)}</td>
                                                    <td className={`py-2.5 px-3 text-right ${grandBreakdownProfit >= 0 ? 'text-green-700' : 'text-red-700'
                                                        }`}>
                                                        {formatMoney(grandBreakdownProfit)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right text-[10px]">
                                                        {grandBreakdownProfit >= 0 ? 'Surplus' : 'Deficit'}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===================== SECTION C: DETAILED TRANSACTIONS ===================== */}
                        {includeTransactions && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                        3. Itemized Transaction Ledger
                                    </h3>
                                    <span className="text-[11px] text-slate-500 font-semibold">
                                        {transactions.length} Transactions
                                    </span>
                                </div>

                                {transactions.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                                        No individual transactions found for the selected reporting period.
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                                    <th className="py-2.5 px-2 text-center w-8">#</th>
                                                    <th className="py-2.5 px-3">Date</th>
                                                    <th className="py-2.5 px-2">Type</th>
                                                    <th className="py-2.5 px-3">Category</th>
                                                    <th className="py-2.5 px-3">Description / Reference</th>
                                                    <th className="py-2.5 px-2">Method</th>
                                                    <th className="py-2.5 px-3 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {transactions.map((tx, idx) => {
                                                    const isIncome = tx.type === 'INCOME';
                                                    let formattedDate = 'N/A';
                                                    try {
                                                        formattedDate = format(new Date(tx.date), 'dd MMM yyyy, HH:mm');
                                                    } catch {
                                                        formattedDate = String(tx.date);
                                                    }

                                                    return (
                                                        <tr key={tx.id || idx} className="hover:bg-slate-50/50">
                                                            <td className="py-2 px-2 text-center text-slate-400 text-[10px]">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-3 font-semibold text-slate-800">
                                                                {tx.category}
                                                            </td>
                                                            <td className="py-2 px-3 text-slate-600">
                                                                <div className="font-medium">{tx.description}</div>
                                                                {tx.referenceId && (
                                                                    <div className="text-[10px] font-mono text-slate-400">
                                                                        Ref: {tx.referenceId}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-2 text-slate-500 text-[11px]">
                                                                {tx.paymentMethod || 'Cash'}
                                                            </td>
                                                            <td className={`py-2 px-3 text-right font-bold whitespace-nowrap ${isIncome ? 'text-green-700' : 'text-red-700'
                                                                }`}>
                                                                {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===================== SECTION D: SIGNATURE BLOCK ===================== */}
                        <div className="mt-14 pt-8 border-t border-slate-200 print-avoid-break">
                            <div className="grid grid-cols-3 gap-6 text-center text-xs">
                                <div>
                                    <div className="border-t border-slate-300 pt-2 font-bold text-slate-800">
                                        Prepared By
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Accounts Officer / Cashier</div>
                                </div>
                                <div>
                                    <div className="border-t border-slate-300 pt-2 font-bold text-slate-800">
                                        Audited & Verified
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Finance Department</div>
                                </div>
                                <div>
                                    <div className="border-t border-slate-300 pt-2 font-bold text-slate-800">
                                        Authorized Signature
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Managing Director / Super Admin</div>
                                </div>
                            </div>

                            {/* System disclaimer footer */}
                            <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                                <p>
                                    This document is an authentic computerized report generated by DMDC Hospital Management System.
                                </p>
                                <p className="mt-0.5">
                                    Confidential &bull; Dr. Muazzem Medical Diagnostic Center &bull; All Rights Reserved
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintFinancialReportModal;
