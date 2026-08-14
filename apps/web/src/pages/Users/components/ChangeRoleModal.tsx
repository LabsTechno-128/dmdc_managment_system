import React, { useEffect, useState } from 'react';
import { X, Loader2, ShieldAlert } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/user.service';
import type { User } from '../../../services/user.service';
import { toast } from 'react-toastify';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'pharmacist', label: 'Pharmacist' },
];

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({ isOpen, onClose, user }) => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => userService.updateUserRole(user!.id, selectedRole),
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user role');
    }
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Change Role</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100" disabled={mutation.isPending}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-5 mx-auto">
              <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          
          <h3 className="text-center text-lg font-medium text-slate-900 mb-2">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-center text-sm text-slate-500 mb-6">
            Select a new role for this user. This will immediately affect their access permissions.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">New Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={mutation.isPending}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex space-x-3">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || selectedRole === user.role}
            className="flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Role</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
