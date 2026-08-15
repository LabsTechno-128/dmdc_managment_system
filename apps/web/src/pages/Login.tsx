import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, Stethoscope, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'receptionist@diagnosticpro.com', password: 'password123' }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', data);
      const { accessToken, user } = response.data;
      setAuth(accessToken, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left side: Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Activity size={28} />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              DMDC<span className="text-blue-600">.</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 mt-2 font-medium">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="group">
              <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className={`h-5 w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                  placeholder="name@diagnosticpro.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-xs font-bold text-red-500">{errors.email.message}</p>}
            </div>

            <div className="group">
              <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className={`h-5 w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={`block w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-900 transition-all outline-none focus:bg-white ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                  placeholder="••••••••"
                />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-xs font-bold text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <span className="text-sm font-semibold text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer group relative mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Image/Gradient */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-blue-600 object-cover bg-gradient-to-br from-blue-700 via-indigo-900 to-slate-900" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="absolute inset-0 flex flex-col justify-center px-20">
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white/10 p-10 backdrop-blur-md border border-white/20 shadow-2xl">
             <div className="mb-6 inline-flex rounded-xl bg-blue-500/20 p-4 text-blue-300">
                <Stethoscope size={40} />
             </div>
             <h2 className="mb-4 text-4xl font-extrabold text-white leading-tight">
               Next-generation healthcare management.
             </h2>
             <p className="text-lg font-medium text-blue-100/80">
               Streamline your laboratory workflow, manage patient records seamlessly, and generate beautiful, accurate reports in seconds.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
