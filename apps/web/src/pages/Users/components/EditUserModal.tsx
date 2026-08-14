import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/user.service';
import type { User } from '../../../services/user.service';
import { toast } from 'react-toastify';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditUserFormValues) => userService.updateUser(user!.id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    }
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Edit User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="edit-user-form" onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (Optional)</label>
              <input
                type="text"
                {...register('phone')}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={mutation.isPending}
            className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
