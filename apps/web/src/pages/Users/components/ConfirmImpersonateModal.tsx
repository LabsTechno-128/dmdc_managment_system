import React from 'react';
import { UserCircle, X, AlertTriangle } from 'lucide-react';
import type { User } from '../../../services/user.service';

interface ConfirmImpersonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isImpersonating: boolean;
  user: User | null;
}

export const ConfirmImpersonateModal: React.FC<ConfirmImpersonateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isImpersonating,
  user,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
            <UserCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-lg">Impersonate User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3 bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 mb-6">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold mb-1">You are about to sign in as:</p>
              <p className="font-bold">{user.firstName} {user.lastName}</p>
              <p className="opacity-80">{user.email}</p>
              <p className="mt-2 text-xs opacity-90">
                You will be able to see and perform actions as this user. All your actions will be recorded in the audit log under your original admin account.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImpersonating}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isImpersonating}
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 min-w-[140px]"
            >
              {isImpersonating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Start Impersonation'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
