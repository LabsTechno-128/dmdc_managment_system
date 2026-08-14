import React from 'react';
import { X, Loader2, Power } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/user.service';
import type { User } from '../../../services/user.service';
import { toast } from 'react-toastify';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ isOpen, onClose, user }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => userService.updateUserStatus(user!.id, !user!.isActive),
    onSuccess: () => {
      toast.success(`User ${user!.isActive ? 'deactivated' : 'activated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user status');
    }
  });

  if (!isOpen || !user) return null;

  const isActivating = !user.isActive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">
            {isActivating ? 'Activate User' : 'Deactivate User'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100" disabled={mutation.isPending}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className={`flex items-center justify-center w-14 h-14 rounded-full mb-5 mx-auto ${isActivating ? 'bg-green-100' : 'bg-red-100'}`}>
            <Power className={`h-7 w-7 ${isActivating ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          
          <h3 className="text-center text-lg font-medium text-slate-900 mb-2">
            Are you sure?
          </h3>
          <p className="text-center text-sm text-slate-500 mb-4 leading-relaxed">
            You are about to {isActivating ? 'activate' : 'deactivate'} <strong className="text-slate-800 font-semibold">{user.firstName} {user.lastName}</strong>.
            {isActivating 
              ? ' They will regain access to the platform.' 
              : ' They will immediately lose access to the platform and active sessions will be invalidated.'}
          </p>
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
            disabled={mutation.isPending}
            className={`flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-white shadow-sm ${
              isActivating ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {mutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Power size={18} />
            )}
            <span>{isActivating ? 'Activate' : 'Deactivate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
