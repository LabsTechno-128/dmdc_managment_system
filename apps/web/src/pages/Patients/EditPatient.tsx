import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';

const patientSchema = z.object({
  name: z.string().min(1, 'Patient name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'] as const),
  age: z.coerce.number().min(0, 'Age must be positive').optional(),
  bloodGroup: z.string().optional(),
  weight: z.coerce.number().min(0).optional(),
  bloodPresure: z.string().optional(),
  address: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export const EditPatient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
  });

  useEffect(() => {
    if (response?.data) {
      reset({
        name: response.data.name || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        gender: response.data.gender || undefined,
        age: response.data.age || undefined,
        bloodGroup: response.data.bloodGroup || '',
        weight: response.data.weight || undefined,
        bloodPresure: response.data.bloodPresure || '',
        address: response.data.address || '',
      });
    }
  }, [response, reset]);

  const mutation = useMutation({
    mutationFn: (updatedPatient: PatientFormValues) => {
      // Assuming patch for updates based on common REST standards
      return api.patch(`/patients/${id}`, updatedPatient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate('/patients');
    },
  });

  const onSubmit = (data: PatientFormValues) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="max-w-2xl mx-auto mt-8"><FormSkeleton /></div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500 font-semibold">Failed to load patient details.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl animate-in fade-in duration-500">
      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={() => navigate('/patients')}
          className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
        >
          <ArrowLeft size={18} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Edit Patient Profile</h1>
          <p className="mt-1 text-xs text-slate-500">Update information for the selected patient.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Full Name *</label>
              <input
                type="text"
                {...register('name')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Phone Number *</label>
              <input
                type="text"
                {...register('phone')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.phone ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="+8801XXXXXXXXX"
              />
              {errors.phone && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="johndoe@example.com"
              />
              {errors.email && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Gender *</label>
              <select
                {...register('gender')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.gender ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Age</label>
              <input
                type="number"
                {...register('age')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.age ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="e.g. 35"
              />
              {errors.age && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.age.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Blood Group</label>
              <select
                {...register('bloodGroup')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.bloodGroup ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
              >
                <option value="">Select Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodGroup && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.bloodGroup.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Weight (kg)</label>
              <input
                type="number"
                {...register('weight')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.weight ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="e.g. 65"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Blood Pressure</label>
              <input
                type="text"
                {...register('bloodPresure')}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.bloodPresure ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="e.g. 120/80"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Address</label>
              <textarea
                {...register('address')}
                rows={2}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 ${
                  errors.address ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="Full residential address"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="cursor-pointer flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending ? 'Updating...' : 'Update Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
