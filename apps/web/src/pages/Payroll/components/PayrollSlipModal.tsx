import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';
import type { Payroll } from '../../../services/payroll.service';

interface PayrollSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: Payroll | null;
}

export const PayrollSlipModal: React.FC<PayrollSlipModalProps> = ({ isOpen, onClose, payroll }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  if (!isOpen || !payroll) return null;

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Print Employee Salary Slip</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handlePrint()}
              className="cursor-pointer flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Printer size={18} />
              <span>Print Slip</span>
            </button>
            <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div
            ref={componentRef}
            className="bg-white p-12 shadow-sm max-w-210mm mx-auto text-slate-800 print:shadow-none print:p-0 print:m-0"
            style={{ minHeight: '297mm', fontFamily: 'Inter, sans-serif' }}
          >
            {/* Header */}
            <div className="text-center border-b-2 border-slate-200 pb-6 mb-8">
              <h1 className="text-2xl font-black text-slate-900 tracking-wide uppercase">Diagnostic Pro Center</h1>
              <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mt-1">Monthly Salary Pay Slip</p>
              <div className="mt-4 text-sm font-semibold text-slate-600">
                For the Month of: <span className="text-slate-900">{getMonthName(payroll.month)} {payroll.year}</span>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div className="grid grid-cols-2 gap-6 border-2 border-slate-200 rounded-xl p-6 mb-8 bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Employee Details</span>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-bold text-slate-800">{payroll.employee?.firstName} {payroll.employee?.lastName}</p>
                  <p className="text-xs text-slate-500">Employee ID: <span className="font-semibold text-slate-700">{payroll.employee?.employeeId}</span></p>
                  <p className="text-xs text-slate-500">Designation: <span className="font-semibold text-slate-700">{payroll.employee?.designation || '--'}</span></p>
                  <p className="text-xs text-slate-500">Department: <span className="font-semibold text-slate-700">{payroll.employee?.department || '--'}</span></p>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Salary Snapshot</span>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">Base Monthly Salary: <span className="font-bold text-slate-700">{Number(payroll.monthlySalary).toLocaleString()} BDT</span></p>
                  <p className="text-xs text-slate-500">Daily Salary Rate (Salary / 24): <span className="font-semibold text-slate-700">{Number(payroll.dailyRate).toFixed(2)} BDT</span></p>
                  <p className="text-xs text-slate-500">Joining Date: <span className="font-semibold text-slate-700">{payroll.employee?.joiningDate ? new Date(payroll.employee.joiningDate).toLocaleDateString() : '--'}</span></p>
                  <p className="text-xs text-slate-500">Generated Date: <span className="font-semibold text-slate-700">{new Date(payroll.generatedAt).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Attendance Metrics</h3>
              <div className="grid grid-cols-5 border border-slate-200 rounded-xl overflow-hidden text-center text-xs divide-x divide-slate-200">
                <div className="p-3">
                  <div className="font-semibold text-green-600">Present</div>
                  <div className="font-black text-slate-800 text-sm mt-1">{payroll.presentDays} Days</div>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-red-600">Absent</div>
                  <div className="font-black text-slate-800 text-sm mt-1">{payroll.absentDays} Days</div>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-orange-600">Half Day</div>
                  <div className="font-black text-slate-800 text-sm mt-1">{payroll.halfDays} Days</div>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-amber-600">On Leave</div>
                  <div className="font-black text-slate-800 text-sm mt-1">{payroll.leaveDays} Days</div>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-slate-500">Friday Off</div>
                  <div className="font-black text-slate-800 text-sm mt-1">{payroll.fridayOffDays} Days</div>
                </div>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="border-t-2 border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Salary Calculations Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600">Basic Monthly Salary</span>
                  <span className="font-semibold text-slate-800">{Number(payroll.monthlySalary).toLocaleString()} BDT</span>
                </div>
                
                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600">Deductions for Absentees</span>
                    <span className="text-xs text-slate-400 block">{payroll.absentDays} Days × {Number(payroll.dailyRate).toFixed(2)} BDT</span>
                  </div>
                  <span className="font-semibold text-red-600">-{Number(payroll.absentDays * payroll.dailyRate).toFixed(2)} BDT</span>
                </div>

                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600">Deductions for Half-Days</span>
                    <span className="text-xs text-slate-400 block">{payroll.halfDays} Days × 50% rate × {Number(payroll.dailyRate).toFixed(2)} BDT</span>
                  </div>
                  <span className="font-semibold text-red-600">-{Number(payroll.halfDays * 0.5 * payroll.dailyRate).toFixed(2)} BDT</span>
                </div>

                <div className="flex justify-between text-sm py-2 border-b border-slate-150">
                  <span className="text-slate-600 font-bold">Total Deductible Days</span>
                  <span className="font-bold text-slate-800">{payroll.deductibleDays} Days</span>
                </div>

                <div className="flex justify-between text-sm py-2 border-b border-slate-200">
                  <span className="text-slate-600 font-bold">Total Deduction Amount</span>
                  <span className="font-bold text-red-600">-{Number(payroll.totalDeduction).toLocaleString()} BDT</span>
                </div>

                {/* Final Net Pay */}
                <div className="flex justify-between text-lg py-4 bg-slate-50 px-4 rounded-xl border border-slate-200">
                  <span className="font-black text-slate-900 uppercase">Net Payable Salary</span>
                  <span className="font-black text-blue-700">{Number(payroll.netSalary).toLocaleString()} BDT</span>
                </div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="flex justify-between items-center mt-32 border-t border-slate-200 pt-10 text-xs text-slate-400">
              <div>
                <div className="w-40 border-t border-slate-300 text-center pt-2">Authorized Signature</div>
              </div>
              <div>
                <div className="w-40 border-t border-slate-300 text-center pt-2">Employee Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
