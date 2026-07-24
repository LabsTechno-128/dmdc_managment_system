import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
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
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
              }`}
              placeholder="Enter your password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
