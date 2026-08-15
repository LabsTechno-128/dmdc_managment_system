import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const ChangePassword: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      setError(null);
      setSuccess(false);
      await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to change password.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <button 
          onClick={() => navigate('/profile')} 
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Change Password</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Ensure your account is using a long, random password to stay secure.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
        
        {/* Header Graphic */}
        <div className="h-24 w-full bg-gradient-to-r from-slate-800 to-slate-900 relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        </div>
        
        <div className="relative px-6 pb-8 pt-12 sm:px-10">
          <div className="absolute -top-10 left-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 shadow-xl">
             <KeyRound className="h-8 w-8 text-slate-700" />
          </div>

          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-500" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
              Password updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="group">
              <label className="mb-2 block text-sm font-bold text-slate-700">Current Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <KeyRound className={`h-5 w-5 transition-colors ${errors.currentPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  {...register('currentPassword')}
                  className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                    errors.currentPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.currentPassword && <p className="mt-2 text-xs font-bold text-red-500">{errors.currentPassword.message}</p>}
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <KeyRound className={`h-5 w-5 transition-colors ${errors.newPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    {...register('newPassword')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.newPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-2 text-xs font-bold text-red-500">{errors.newPassword.message}</p>}
              </div>

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <KeyRound className={`h-5 w-5 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register('confirmPassword')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-xs font-bold text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
