import React, { useState } from 'react';
import { PiggyBank, Receipt, PieChart } from 'lucide-react';
import IncomeTab from './IncomeTab';
import ExpenseTab from './ExpenseTab';
import FinancialReportTab from './FinancialReportTab';

export const AccountsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE' | 'REPORT'>('INCOME');

    return (
        <div className="min-h-screen bg-[#f4f6fb] text-slate-800 -m-6 p-6">
            <div className="mx-auto max-w-[1200px]">
                <div className="mb-6 flex flex-col gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Accounts</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage your clinic's income, expenses and financial reports.</p>
                </div>

                <div className="mb-8 flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('INCOME')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                            activeTab === 'INCOME'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <PiggyBank size={18} />
                        Income
                    </button>
                    <button
                        onClick={() => setActiveTab('EXPENSE')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                            activeTab === 'EXPENSE'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <Receipt size={18} />
                        Expense
                    </button>
                    <button
                        onClick={() => setActiveTab('REPORT')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                            activeTab === 'REPORT'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <PieChart size={18} />
                        Financial Report
                    </button>
                </div>

                <div className="mt-4">
                    {activeTab === 'INCOME' && <IncomeTab />}
                    {activeTab === 'EXPENSE' && <ExpenseTab />}
                    {activeTab === 'REPORT' && <FinancialReportTab />}
                </div>
            </div>
        </div>
    );
};

export default AccountsPage;
