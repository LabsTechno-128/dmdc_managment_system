import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../../services/employee.service';
import type { Employee } from '../../../services/employee.service';
import { userService } from '../../../services/user.service';
import { toast } from 'react-toastify';

const editEmployeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')),
  phone: z.string().optional(),
  designation: z.string().min(1, 'Designation/Role is required'),
  department: z.string().min(1, 'Department is required'),
  monthlySalary: z.coerce.number().min(0, 'Salary must be positive'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  userId: z.string().optional().or(z.literal('')),
});

type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema) as any
  });

  // Fetch users to link
  const { data: usersData } = useQuery({
    queryKey: ['users-list-simple'],
    queryFn: () => userService.getUsers({ limit: 100 }),
    enabled: isOpen,
  });
  const users = usersData?.data || [];

  useEffect(() => {
    if (employee) {
      reset({
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email || '',
        phone: employee.phone || '',
        designation: employee.designation || '',
        department: employee.department || '',
        monthlySalary: Number(employee.monthlySalary),
        joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
        userId: employee.user?.id || '',
      });
    }
  }, [employee, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => employeeService.updateEmployee(employee!.id, data),
    onSuccess: () => {
      toast.success('Employee updated successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update employee');
    }
  });

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Edit Employee</h2>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="edit-employee-form" onSubmit={handleSubmit((data) => {
            const formatted = {
              ...data,
              email: data.email === '' ? null : data.email,
              userId: data.userId === '' ? null : data.userId,
            };
            mutation.mutate(formatted);
          })} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  {...register('employeeId')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="EMP-001"
                />
                {errors.employeeId && <p className="mt-1 text-sm text-red-500">{errors.employeeId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  {...register('joiningDate')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {errors.joiningDate && <p className="mt-1 text-sm text-red-500">{errors.joiningDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  {...register('firstName')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  {...register('lastName')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  {...register('designation')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {errors.designation && <p className="mt-1 text-sm text-red-500">{errors.designation.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  {...register('department')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Salary (BDT)</label>
                <input
                  type="number"
                  {...register('monthlySalary')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {errors.monthlySalary && <p className="mt-1 text-sm text-red-500">{errors.monthlySalary.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link User Login (Optional)</label>
                <select
                  {...register('userId')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">-- No User Account --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-5 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-employee-form"
            disabled={mutation.isPending}
            className="cursor-pointer flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
            <span>Update Employee</span>
          </button>
        </div>
      </div>
    </div>
  );
};
