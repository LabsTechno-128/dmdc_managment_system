import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, ShieldCheck, KeyRound, UserPen, LogOut } from 'lucide-react';

export const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  // Get initials for avatar
  const getInitials = () => {
    const f = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const l = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return f + l || 'U';
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Manage your personal information and security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Basic Info */}
        <div className="col-span-1 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="h-32 w-full bg-gradient-to-r from-blue-600 to-indigo-600 relative">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            </div>
            
            <div className="relative px-6 pb-6 pt-16 text-center">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-blue-100 shadow-xl">
                <span className="text-4xl font-bold text-blue-700">{getInitials()}</span>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                {user.firstName} {user.lastName}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <ShieldCheck size={16} />
                <span className="capitalize">{user.role || 'User'}</span>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all">
                <LogOut size={16} className="text-slate-400" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info & Settings */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Personal Details</h3>
              <Link
                to="/profile/edit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <UserPen size={16} />
                Edit
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <User size={16} className="text-slate-400" />
                  First Name
                </div>
                <div className="text-lg font-bold text-slate-900">{user.firstName || 'Not Set'}</div>
              </div>

              <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <User size={16} className="text-slate-400" />
                  Last Name
                </div>
                <div className="text-lg font-bold text-slate-900">{user.lastName || 'Not Set'}</div>
              </div>

              <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Mail size={16} className="text-slate-400" />
                  Email Address
                </div>
                <div className="text-lg font-bold text-slate-900 break-words">{user.email}</div>
              </div>

              <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Phone size={16} className="text-slate-400" />
                  Phone Number
                </div>
                <div className="text-lg font-bold text-slate-900">{user.phone || 'Not Set'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
             <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Security</h3>
                <p className="mt-1 text-sm text-slate-500 font-medium">Keep your account secure with a strong password.</p>
             </div>
             
             <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 text-slate-600">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900">Password</div>
                    <div className="text-sm font-medium text-slate-500">••••••••</div>
                  </div>
                </div>
                
                <Link
                  to="/profile/change-password"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50"
                >
                  Change
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
