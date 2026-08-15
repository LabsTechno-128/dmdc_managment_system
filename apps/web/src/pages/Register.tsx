import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, ShieldCheck, Activity, Users, Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', data);
      const { accessToken, user } = response.data;
      setAuth(accessToken, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      
      {/* Left side: Image/Gradient */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-violet-600 object-cover bg-gradient-to-br from-indigo-900 via-violet-800 to-fuchsia-900" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="absolute inset-0 flex flex-col justify-center px-20">
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white/10 p-10 backdrop-blur-md border border-white/20 shadow-2xl">
             <div className="mb-6 inline-flex rounded-xl bg-violet-500/30 p-4 text-violet-200">
                <Users size={40} />
             </div>
             <h2 className="mb-4 text-4xl font-extrabold text-white leading-tight">
               Join the future of healthcare.
             </h2>
             <p className="text-lg font-medium text-violet-100/80">
               Create an account to gain access to the hospital management dashboard, patient directories, and laboratory tools.
             </p>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-sm lg:w-[28rem]">
          <div className="mb-8 flex items-center justify-end gap-3 lg:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/30">
              <Activity size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              DMDC<span className="text-violet-600">.</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-slate-500 mt-2 font-medium">Get started with your free account.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">First Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className={`h-4 w-4 transition-colors ${errors.firstName ? 'text-red-400' : 'text-slate-400 group-focus-within:text-violet-500'}`} />
                  </div>
                  <input
                    type="text"
                    {...register('firstName')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.firstName 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'
                    }`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.firstName.message}</p>}
              </div>

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">Last Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className={`h-4 w-4 transition-colors ${errors.lastName ? 'text-red-400' : 'text-slate-400 group-focus-within:text-violet-500'}`} />
                  </div>
                  <input
                    type="text"
                    {...register('lastName')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.lastName 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'
                    }`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="group">
              <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className={`h-5 w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400 group-focus-within:text-violet-500'}`} />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'
                  }`}
                  placeholder="name@diagnosticpro.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-xs font-bold text-red-500">{errors.email.message}</p>}
            </div>

            <div className="group">
              <label className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Phone className={`h-5 w-5 transition-colors ${errors.phone ? 'text-red-400' : 'text-slate-400 group-focus-within:text-violet-500'}`} />
                </div>
                <input
                  type="tel"
                  {...register('phone')}
                  className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                    errors.phone 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'
                  }`}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {errors.phone && <p className="mt-2 text-xs font-bold text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className={`h-4 w-4 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-violet-500'}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3 pl-11 pr-11 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.password.message}</p>}
              </div>

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-slate-700">Confirm</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className={`h-4 w-4 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-violet-500'}`} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register('confirmPassword')}
                    className={`block w-full rounded-2xl border bg-slate-50/50 py-3 pl-11 pr-11 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-700 hover:shadow-violet-600/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
              {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-violet-600 hover:text-violet-700 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
