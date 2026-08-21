import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ShieldAlert, ChevronLeft, ChevronRight,
  Download, Printer, RefreshCw, Briefcase, CreditCard
} from 'lucide-react';
import { payrollService } from '../../services/payroll.service';
import type { Payroll, PayrollQueryParams } from '../../services/payroll.service';
import { PayrollSlipModal } from './components/PayrollSlipModal';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

export const PayrollList: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  const isSuperadminOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  // State
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [month, setMonth] = useState(() => (new Date().getMonth() + 1).toString());
  const [department, setDepartment] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [params, setParams] = useState<PayrollQueryParams>({
    page: 1,
    limit: 10,
    month: month,
    year: year,
    department: '',
  });

  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Sync params when selectors change
  useEffect(() => {
    setParams(prev => ({
      ...prev,
      month: month,
      year: year,
      department: department || undefined,
      page: 1,
    }));
  }, [month, year, department]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['payrolls', params],
    queryFn: () => payrollService.getPayrolls(params),
  });

  // Fetch monthly summary report stats
  const { data: reportData } = useQuery({
    queryKey: ['payroll-monthly-report', year, month],
    queryFn: () => payrollService.getMonthlyReport(parseInt(year, 10), parseInt(month, 10)),
  });

  const summary = reportData?.summary || { totalEmployees: 0, totalSalary: 0, totalDeductions: 0, totalNetPayable: 0 };

  const generateMutation = useMutation({
    mutationFn: payrollService.generatePayroll,
    onSuccess: () => {
      toast.success('Payroll generated/updated successfully');
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-monthly-report'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate payroll');
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      year: parseInt(year, 10),
      month: parseInt(month, 10),
    });
  };

  const handleExportExcel = async () => {
    try {
      const blob = await payrollService.exportExcel(
        parseInt(year, 10),
        parseInt(month, 10),
        department || undefined,
      );
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-report-${year}-${String(month).padStart(2, '0')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      toast.error('Failed to export Excel report');
    }
  };

  const payrolls: Payroll[] = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };
  const total = meta.total || 0;
  const totalPages = meta.totalPages || 1;
  const page = params.page || 1;
  const limit = params.limit || 10;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Client side search filter
  const filteredPayrolls = payrolls.filter(p =>
    `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.toLowerCase().includes(searchInput.toLowerCase()) ||
    (p.employee?.employeeId || '').toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Payroll & Salary summaries</h1>
          <p className="text-slate-500 mt-1">Review staff salary calculations, deductions, and print payment slips</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {isSuperadminOrAdmin && (
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="cursor-pointer flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
            >
              <RefreshCw size={18} className={generateMutation.isPending ? 'animate-spin' : ''} />
              <span>Generate Payroll</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="cursor-pointer flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <Download size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center space-x-3">
          <ShieldAlert size={20} />
          <span>{(error as Error)?.message || 'Failed to load payroll records.'}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Calculated Employees</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{summary.totalEmployees} Staff</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Base Gross Salary</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{summary.totalSalary.toLocaleString()} BDT</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider block">Total Deductions</span>
          <span className="text-2xl font-black text-red-600 mt-1 block">-{summary.totalDeductions.toLocaleString()} BDT</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 bg-blue-50/10">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Total Net Payable</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{summary.totalNetPayable.toLocaleString()} BDT</span>
        </div>
      </div>

      {/* Selectors and filters bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search employee by name or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const m = i + 1;
              const name = new Date(2000, i, 1).toLocaleString('default', { month: 'long' });
              return (
                <option key={m} value={m}>
                  {name}
                </option>
              );
            })}
          </select>

          <input
            type="text"
            placeholder="Department..."
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Employee</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Designation</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Salary Summary</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Attendance Log</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Total Deduction</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Net Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-0 border-b-0">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No payroll summaries found. Choose another month/year or generate payroll.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{p.employee?.firstName} {p.employee?.lastName}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{p.employee?.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Briefcase size={16} className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-700 capitalize">{p.employee?.designation || 'Not Set'}</p>
                          <p className="text-slate-400 text-xs">{p.employee?.department || 'Not Set'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <CreditCard size={16} className="text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-800">{Number(p.monthlySalary).toLocaleString()} BDT</p>
                          <p className="text-slate-400 text-xs">Rate: {Number(p.dailyRate).toFixed(2)} BDT/day</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-0.5 text-slate-600 font-medium">
                        <p>Present: <span className="font-bold text-green-600">{Number(p.presentDays)} d</span></p>
                        <p>Abs/Half: <span className="font-bold text-red-500">{Number(p.absentDays)}d</span> / <span className="font-bold text-orange-500">{Number(p.halfDays)}d</span></p>
                        <p>Deduct: <span className="font-bold text-red-600">{Number(p.deductibleDays)} d</span></p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      -{Number(p.totalDeduction).toLocaleString()} BDT
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <div className="text-right">
                          <p className="font-black text-blue-700">{Number(p.netSalary).toLocaleString()} BDT</p>
                          <span className="inline-block text-[10px] px-2 py-0.2 bg-green-50 text-green-700 border border-green-200 rounded font-bold uppercase">{p.status}</span>
                        </div>
                        <button
                          onClick={() => setSelectedPayroll(p)}
                          className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg transition-all"
                          title="Print Payslip"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{from}</span>–{' '}
            <span className="font-bold text-slate-700">{to}</span> of{' '}
            <span className="font-bold text-slate-700">{total}</span>
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1}
              onClick={() => setParams(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p}
                  onClick={() => setParams(prev => ({ ...prev, page: p }))}
                  className={`cursor-pointer min-w-[36px] rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 ${p === page
                    ? 'bg-blue-600 text-white shadow-blue-600/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {p}
                </button>
              );
            })}
            <button disabled={page >= totalPages}
              onClick={() => setParams(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <PayrollSlipModal
        isOpen={!!selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        payroll={selectedPayroll}
      />
    </div>
  );
};
