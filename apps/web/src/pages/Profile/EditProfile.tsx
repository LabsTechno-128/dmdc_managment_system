import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, ShieldAlert, CheckCircle2, UserPen } from 'lucide-react';

const editProfileSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export const EditProfile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
  });

  useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('phone', user.phone || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data: EditProfileFormValues) => {
    try {
      setError(null);
      setSuccess(false);
      const response = await api.patch('/auth/me', data);
      setUser({ ...user, ...response.data } as any);
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Update failed.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <button 
          onClick={() => navigate('/profile')} 
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Update your personal information and contact details.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
        
        {/* Header Graphic */}
        <div className="h-24 w-full bg-gradient-to-r from-blue-600 to-indigo-600 relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        </div>
        
        <div className="relative px-6 pb-8 pt-12 sm:px-10">
          <div className="absolute -top-10 left-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-blue-50 shadow-xl">
             <UserPen className="h-8 w-8 text-blue-600" />
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
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">First Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className={`h-5 w-5 transition-colors ${errors.firstName ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                    type="text"
                    {...register('firstName')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.firstName 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                  />
                </div>
                {errors.firstName && <p className="mt-2 text-xs font-bold text-red-500">{errors.firstName.message}</p>}
              </div>

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">Last Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className={`h-5 w-5 transition-colors ${errors.lastName ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                    type="text"
                    {...register('lastName')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.lastName 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                  />
                </div>
                {errors.lastName && <p className="mt-2 text-xs font-bold text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="group">
              <label className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Phone className={`h-5 w-5 transition-colors ${errors.phone ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                  type="tel"
                  {...register('phone')}
                  className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                    errors.phone 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>
              {errors.phone && <p className="mt-2 text-xs font-bold text-red-500">{errors.phone.message}</p>}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
