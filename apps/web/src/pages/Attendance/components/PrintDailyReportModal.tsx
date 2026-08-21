import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';

interface PrintDailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    date: string;
    summary: {
      total: number;
      present: number;
      absent: number;
      leave: number;
      halfDay: number;
      fridayOff: number;
      unmarked: number;
    };
    details: Array<{
      id: string;
      employeeId: string;
      name: string;
      designation: string;
      department: string;
      monthlySalary: number;
      dailyRate: number;
      status: string;
      checkIn: string | null;
      checkOut: string | null;
      todayDeduction: number;
    }>;
  } | null;
}

export const PrintDailyReportModal: React.FC<PrintDailyReportModalProps> = ({ isOpen, onClose, reportData }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  if (!isOpen || !reportData) return null;

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--';
    return new Date(timeStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Print Daily Attendance Report</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handlePrint()}
              className="cursor-pointer flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Printer size={18} />
              <span>Print Report</span>
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
              <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mt-1">Employee Daily Attendance & Salary Deductions</p>
              <div className="mt-4 text-sm font-semibold text-slate-600">
                Date: <span className="text-slate-900">{formatDate(reportData.date)}</span>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-6 border-2 border-slate-200 rounded-xl overflow-hidden mb-8 text-center bg-slate-50/50">
              <div className="p-4 border-r border-slate-200">
                <div className="text-xs font-bold text-slate-400 uppercase">Total Staff</div>
                <div className="text-xl font-black text-slate-800 mt-1">{reportData.summary.total}</div>
              </div>
              <div className="p-4 border-r border-slate-200 bg-green-50/20">
                <div className="text-xs font-bold text-green-600 uppercase">Present</div>
                <div className="text-xl font-black text-green-700 mt-1">{reportData.summary.present}</div>
              </div>
              <div className="p-4 border-r border-slate-200 bg-red-50/20">
                <div className="text-xs font-bold text-red-600 uppercase">Absent</div>
                <div className="text-xl font-black text-red-700 mt-1">{reportData.summary.absent}</div>
              </div>
              <div className="p-4 border-r border-slate-200 bg-amber-50/20">
                <div className="text-xs font-bold text-amber-600 uppercase">On Leave</div>
                <div className="text-xl font-black text-amber-700 mt-1">{reportData.summary.leave}</div>
              </div>
              <div className="p-4 border-r border-slate-200 bg-orange-50/20">
                <div className="text-xs font-bold text-orange-600 uppercase">Half Day</div>
                <div className="text-xl font-black text-orange-700 mt-1">{reportData.summary.halfDay}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-bold text-slate-500 uppercase">Friday Off</div>
                <div className="text-xl font-black text-slate-700 mt-1">{reportData.summary.fridayOff}</div>
              </div>
            </div>

            <div className="border-t-2 border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-wide">Employee Attendance Details</h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50">
                    <th className="py-3 px-3 font-bold text-slate-600 uppercase">Employee ID</th>
                    <th className="py-3 px-3 font-bold text-slate-600 uppercase">Employee Name</th>
                    <th className="py-3 px-3 font-bold text-slate-600 uppercase">Role / Designation</th>
                    <th className="py-3 px-3 font-bold text-slate-600 uppercase">Check In</th>
                    <th className="py-3 px-3 font-bold text-slate-600 uppercase">Check Out</th>
                    <th className="py-3 px-3 font-bold text-slate-600 uppercase">Status</th>
                    <th className="py-3 px-3 font-bold text-slate-600 uppercase text-right">Deduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.details.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-3 font-bold text-slate-700">{emp.employeeId}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{emp.name}</td>
                      <td className="py-3 px-3 text-slate-600">{emp.designation || '--'}</td>
                      <td className="py-3 px-3 text-slate-500">{formatTime(emp.checkIn)}</td>
                      <td className="py-3 px-3 text-slate-500">{formatTime(emp.checkOut)}</td>
                      <td className="py-3 px-3 font-bold">
                        <span className={
                          emp.status === 'Present' ? 'text-green-600' :
                          emp.status === 'Absent' ? 'text-red-600' :
                          emp.status === 'Leave' ? 'text-amber-600' :
                          emp.status === 'Half Day' ? 'text-orange-600' :
                          'text-slate-500'
                        }>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 text-right">
                        {emp.todayDeduction > 0 ? `${emp.todayDeduction.toFixed(2)} BDT` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div className="flex justify-between items-center mt-32 border-t border-slate-200 pt-10 text-xs text-slate-400">
              <div>
                <div className="w-40 border-t border-slate-300 text-center pt-2">Prepared By (Receptionist)</div>
              </div>
              <div>
                <div className="w-40 border-t border-slate-300 text-center pt-2">Approved By (Superadmin)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
