import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500">First Name</label>
            <p className="mt-1 text-lg text-slate-900">{user.firstName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">Last Name</label>
            <p className="mt-1 text-lg text-slate-900">{user.lastName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">Email</label>
            <p className="mt-1 text-lg text-slate-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">Phone</label>
            <p className="mt-1 text-lg text-slate-900">{user.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">User Role</label>
            <p className="mt-1 text-lg text-slate-900">{user.role || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <Link to="/profile/edit" className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition">
            Edit Profile
          </Link>
          <Link to="/profile/change-password" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition">
            Change Password
          </Link>
        </div>
      </div>
    </div>
  );
};
