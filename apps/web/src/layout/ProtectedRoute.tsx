import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm border border-red-100">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-400">
                <ShieldAlert size={40} />
            </div>
            <div className="max-w-md space-y-1">
                <h2 className="text-xl font-bold text-slate-800">403 - Forbidden</h2>
                <p className="text-sm text-slate-500">
                    You do not have the required permissions to access this page.
                </p>
            </div>
        </div>
    );
  }

  return <Outlet />;
};
