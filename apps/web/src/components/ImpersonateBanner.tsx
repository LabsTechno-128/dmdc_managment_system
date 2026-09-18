import React from 'react';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/user.service';
import { LogOut, UserCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const ImpersonateBanner: React.FC = () => {
  const { isImpersonating, user, stopImpersonation } = useAuthStore();
  const navigate = useNavigate();

  if (!isImpersonating || !user) return null;

  const handleStopImpersonation = async () => {
    try {
      const response = await userService.stopImpersonation();
      stopImpersonation(response.accessToken, response.user);
      toast.success('Impersonation stopped. Restored to original session.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop impersonation');
    }
  };

  return (
    <div className="bg-amber-100 border-b border-amber-200 sticky top-0 z-50 text-amber-900 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <UserCircle className="w-5 h-5 text-amber-600" />
        <p className="text-sm font-medium">
          You are currently impersonating <strong className="font-bold">{user.firstName} {user.lastName}</strong> ({user.email}). All actions taken will be recorded as this user.
        </p>
      </div>
      <button 
        onClick={handleStopImpersonation}
        className="flex items-center space-x-2 bg-amber-200 hover:bg-amber-300 transition-colors px-3 py-1.5 rounded-lg text-sm font-semibold"
      >
        <LogOut className="w-4 h-4" />
        <span>Stop Impersonation</span>
      </button>
    </div>
  );
};
