import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Briefcase, Calendar,
  CreditCard, Edit2, ShieldAlert,
  ChevronLeft, ChevronRight, UserCheck, UserX, TableProperties
} from 'lucide-react';
import { employeeService } from '../../services/employee.service';
import type { Employee, EmployeeQueryParams } from '../../services/employee.service';
import { CreateEmployeeModal } from './components/CreateEmployeeModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { EmployeeAttendanceModal } from './components/EmployeeAttendanceModal';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

export const EmployeesList: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  const isSuperadminOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const [params, setParams] = useState<EmployeeQueryParams>({
    page: 1,
    limit: 10,
    search: '',
    isActive: '',
    department: '',
  });

  const [searchInput, setSearchInput] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [attendanceEmployee, setAttendanceEmployee] = useState<Employee | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeeService.getEmployees(params),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      employeeService.updateEmployeeStatus(id, isActive),
    onSuccess: () => {
      toast.success('Employee status updated');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update employee status');
    }
  });

  const handleFilterChange = (key: keyof EmployeeQueryParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const employees: Employee[] = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };
  const total = meta.total || 0;
  const totalPages = meta.totalPages || 1;
  const page = params.page || 1;
  const limit = params.limit || 10;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Employee Directory</h1>
          <p className="text-slate-500 mt-1">Manage staff details, monthly salaries, and work roles</p>
        </div>
        {isSuperadminOrAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="cursor-pointer flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200"
          >
            <Plus size={20} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center space-x-3">
          <ShieldAlert size={20} />
          <span>{(error as Error)?.message || 'Failed to load employees.'}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Filter Department..."
            value={params.department || ''}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm min-w-[160px] font-medium"
          />

          <select
            value={params.isActive || ''}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-w-[140px] text-sm text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Employee</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Department & Designation</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Salary & Daily Rate</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Joined Date</th>
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
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-base text-slate-600 font-medium">No employees found</p>
                      <p className="text-sm">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const dailyRate = Number(emp.monthlySalary) / 24;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold uppercase shrink-0">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{emp.employeeId} • {emp.phone || 'No Phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Briefcase size={16} className="text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-700 capitalize">{emp.designation || 'Not Set'}</p>
                            <p className="text-slate-400 text-xs">{emp.department || 'Not Set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <CreditCard size={16} className="text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-800">{Number(emp.monthlySalary).toLocaleString()} BDT</p>
                            <p className="text-slate-400 text-xs">Daily: {dailyRate.toFixed(2)} BDT</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-slate-500 font-medium">
                          <Calendar size={16} className="text-slate-400" />
                          <span>
                            {new Date(emp.joiningDate).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${emp.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                          <span>{emp.isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setAttendanceEmployee(emp)}
                            className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Attendance Logs"
                          >
                            <TableProperties size={18} />
                          </button>
                          
                          {isSuperadminOrAdmin && (
                            <>
                              <button
                                onClick={() => setEditEmployee(emp)}
                                className="cursor-pointer p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Employee"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => toggleStatusMutation.mutate({ id: emp.id, isActive: !emp.isActive })}
                                className={`cursor-pointer p-1.5 rounded-lg transition-colors ${emp.isActive
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                title={emp.isActive ? "Deactivate Employee" : "Activate Employee"}
                              >
                                {emp.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                              </button>
                            </>
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
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEmployeeModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EditEmployeeModal isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} employee={editEmployee} />
      <EmployeeAttendanceModal isOpen={!!attendanceEmployee} onClose={() => setAttendanceEmployee(null)} employee={attendanceEmployee} />
    </div>
  );
};
