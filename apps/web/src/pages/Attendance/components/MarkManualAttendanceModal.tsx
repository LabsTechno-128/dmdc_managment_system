import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../../../services/attendance.service';
import { toast } from 'react-toastify';

const markAttendanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.string().min(1, 'Status is required'),
  checkIn: z.string().optional().or(z.literal('')),
  checkOut: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type MarkAttendanceFormValues = z.infer<typeof markAttendanceSchema>;

interface MarkManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: { id: string; name: string; employeeId: string } | null;
  selectedDate: string;
}

export const MarkManualAttendanceModal: React.FC<MarkManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  employee,
  selectedDate,
}) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<MarkAttendanceFormValues>({
    resolver: zodResolver(markAttendanceSchema),
  });

  const selectedStatus = watch('status');

  useEffect(() => {
    if (employee) {
      reset({
        employeeId: employee.id,
        date: selectedDate,
        status: 'Present',
        checkIn: '',
        checkOut: '',
        notes: '',
      });
    }
  }, [employee, selectedDate, reset]);

  const mutation = useMutation({
    mutationFn: attendanceService.markAttendance,
    onSuccess: () => {
      toast.success('Attendance updated successfully');
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['daily-report'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update attendance');
    }
  });

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Manually Correct Attendance</h2>
            <p className="text-slate-500 text-sm mt-0.5">{employee.name} ({employee.employeeId})</p>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="mark-attendance-form" onSubmit={handleSubmit((data) => {
            // Format check-in/out timestamps based on date
            let checkInVal: string | undefined = undefined;
            let checkOutVal: string | undefined = undefined;

            if (data.status === 'Present' || data.status === 'Half Day') {
              if (data.checkIn) {
                checkInVal = new Date(`${data.date}T${data.checkIn}:00`).toISOString();
              }
              if (data.checkOut) {
                checkOutVal = new Date(`${data.date}T${data.checkOut}:00`).toISOString();
              }
            }

            mutation.mutate({
              employeeId: data.employeeId,
              date: data.date,
              status: data.status,
              checkIn: checkInVal,
              checkOut: checkOutVal,
              notes: data.notes,
            });
          })} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
                <option value="Half Day">Half Day</option>
                <option value="Friday Off">Friday Off</option>
              </select>
            </div>

            {(selectedStatus === 'Present' || selectedStatus === 'Half Day') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check In Time</label>
                  <input
                    type="time"
                    {...register('checkIn')}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    {...register('checkOut')}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Remarks</label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="E.g., Forgot to check out, on site duty..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm resize-none"
              />
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
            form="mark-attendance-form"
            disabled={mutation.isPending}
            className="cursor-pointer flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
            <span>Save Attendance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
