import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Printer, Play, Square, ShieldAlert,
  Search, Edit3
} from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { MarkManualAttendanceModal } from './components/MarkManualAttendanceModal';
import { PrintDailyReportModal } from './components/PrintDailyReportModal';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

export const AttendanceList: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  const isSuperadminOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const [selectedDate, setSelectedDate] = useState(() => {
    const offset = new Date().getTimezoneOffset();
    const localDate = new Date(new Date().getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [searchInput, setSearchInput] = useState('');
  const [filteredDetails, setFilteredDetails] = useState<any[]>([]);

  // Modals state
  const [markEmployee, setMarkEmployee] = useState<any | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Fetch daily report data which contains summary stats and details list
  const { data: reportData, isLoading, isError, error } = useQuery({
    queryKey: ['daily-report', selectedDate],
    queryFn: () => attendanceService.getDailyReport(selectedDate),
  });

  const summary = reportData?.summary || { total: 0, present: 0, absent: 0, leave: 0, halfDay: 0, fridayOff: 0, unmarked: 0 };
  const details = reportData?.details || [];

  // Filter local details list by search input
  useEffect(() => {
    if (details) {
      const filtered = details.filter((item: any) =>
        item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        item.employeeId.toLowerCase().includes(searchInput.toLowerCase()) ||
        (item.department && item.department.toLowerCase().includes(searchInput.toLowerCase()))
      );
      setFilteredDetails(filtered);
    }
  }, [details, searchInput]);

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: attendanceService.checkIn,
    onSuccess: () => {
      toast.success('Check-in logged successfully');
      queryClient.invalidateQueries({ queryKey: ['daily-report'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to check in');
    }
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: attendanceService.checkOut,
    onSuccess: () => {
      toast.success('Check-out logged successfully');
      queryClient.invalidateQueries({ queryKey: ['daily-report'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to check out');
    }
  });

  const handleCheckIn = (employeeId: string) => {
    checkInMutation.mutate({ employeeId });
  };

  const handleCheckOut = (employeeId: string) => {
    checkOutMutation.mutate({ employeeId });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Attendance Manager</h1>
          <p className="text-slate-500 mt-1">Track check-ins, check-outs, and manage daily attendance logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-700 font-semibold shadow-sm text-sm"
          />
          <button
            onClick={() => setIsPrintOpen(true)}
            className="cursor-pointer flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <Printer size={20} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center space-x-3">
          <ShieldAlert size={20} />
          <span>{(error as Error)?.message || 'Failed to load attendance report.'}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
          <span className="text-2xl font-black text-slate-800 mt-1.5">{summary.total}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Present</span>
          <span className="text-2xl font-black text-green-600 mt-1.5">{summary.present}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Absent</span>
          <span className="text-2xl font-black text-red-600 mt-1.5">{summary.absent}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Leave</span>
          <span className="text-2xl font-black text-amber-600 mt-1.5">{summary.leave}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Half Day</span>
          <span className="text-2xl font-black text-orange-600 mt-1.5">{summary.halfDay}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Friday Off</span>
          <span className="text-2xl font-black text-slate-600 mt-1.5">{summary.fridayOff}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between bg-blue-50/10">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Not Marked</span>
          <span className="text-2xl font-black text-blue-600 mt-1.5">{summary.unmarked}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by employee name or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
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
                <th className="px-6 py-4 font-semibold text-slate-600">Role & Department</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Check In</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Check Out</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-0 border-b-0">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : filteredDetails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No employees matching the search filters.
                  </td>
                </tr>
              ) : (
                filteredDetails.map((item) => {
                  const hasCheckedIn = !!item.checkIn;
                  const hasCheckedOut = !!item.checkOut;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{item.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700 capitalize">{item.designation || 'Not Set'}</p>
                        <p className="text-slate-400 text-xs">{item.department || 'Not Set'}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {item.checkIn ? new Date(item.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {item.checkOut ? new Date(item.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          item.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
                          item.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' :
                          item.status === 'Leave' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          item.status === 'Half Day' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          item.status === 'Friday Off' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          'bg-blue-50/50 text-blue-600 border-blue-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Present' ? 'bg-green-500' :
                            item.status === 'Absent' ? 'bg-red-500' :
                            item.status === 'Leave' ? 'bg-amber-500' :
                            item.status === 'Half Day' ? 'bg-orange-500' :
                            item.status === 'Friday Off' ? 'bg-slate-400' :
                            'bg-blue-400'
                          }`}></span>
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Check-In / Check-Out Actions */}
                          {item.status !== 'Friday Off' && item.status !== 'Leave' && item.status !== 'Absent' && (
                            <>
                              {!hasCheckedIn && (
                                <button
                                  onClick={() => handleCheckIn(item.id)}
                                  disabled={checkInMutation.isPending}
                                  className="cursor-pointer flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  <Play size={12} />
                                  <span>Check In</span>
                                </button>
                              )}
                              {hasCheckedIn && !hasCheckedOut && (
                                <button
                                  onClick={() => handleCheckOut(item.id)}
                                  disabled={checkOutMutation.isPending}
                                  className="cursor-pointer flex items-center space-x-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  <Square size={12} />
                                  <span>Check Out</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Manual Correction (Superadmin/Admin only) */}
                          {isSuperadminOrAdmin && (
                            <button
                              onClick={() => setMarkEmployee(item)}
                              className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                              title="Force Mark Attendance"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MarkManualAttendanceModal
        isOpen={!!markEmployee}
        onClose={() => setMarkEmployee(null)}
        employee={markEmployee}
        selectedDate={selectedDate}
      />
      <PrintDailyReportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        reportData={reportData}
      />
    </div>
  );
};
