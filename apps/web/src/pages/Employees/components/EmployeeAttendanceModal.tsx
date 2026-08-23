import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceService } from '../../../services/attendance.service';
import type { Employee } from '../../../services/employee.service';
import { TableSkeleton } from '../../../components/skeleton/TableSkeleton';

interface EmployeeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const EmployeeAttendanceModal: React.FC<EmployeeAttendanceModalProps> = ({ isOpen, onClose, employee }) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 5,
    status: '',
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employee-attendance-history', employee?.id, params],
    queryFn: () => attendanceService.getEmployeeAttendance(employee!.id, params),
    enabled: isOpen && !!employee,
  });

  const attendances = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };
  const total = meta.total || 0;
  const totalPages = meta.totalPages || 1;
  const page = params.page || 1;

  if (!isOpen || !employee) return null;

  const handleFilterChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Attendance History</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {employee.firstName} {employee.lastName} ({employee.employeeId})
            </p>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Filters bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <select
              value={params.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Half Day">Half Day</option>
              <option value="Friday Off">Friday Off</option>
              <option value="Weekly Off">Weekly Off</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={params.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700"
              placeholder="Start Date"
            />
          </div>
          <div>
            <input
              type="date"
              value={params.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Date</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Check In</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Check Out</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Work Hours</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  attendances.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {new Date(att.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          att.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
                          att.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' :
                          att.status === 'Leave' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          att.status === 'Half Day' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-bold">
                        {att.workingMinutes ? `${(att.workingMinutes / 60).toFixed(1)} hrs` : '--'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs max-w-xs truncate" title={att.notes}>
                        {att.notes || '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">
              Total {total} logs
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setParams(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                className="cursor-pointer p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-slate-700 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setParams(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                className="cursor-pointer p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
