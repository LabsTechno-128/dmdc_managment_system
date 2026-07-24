import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

  const mutation = useMutation({
    mutationFn: (newPatient: PatientFormValues) => {
      return api.post('/patients', newPatient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate('/patients');
    },
  });

  const onSubmit = (data: PatientFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Patient</h1>
          <p className="text-slate-500 mt-1">Register a new patient into the system.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                {...register('firstName')}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                  errors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder="John"
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                {...register('lastName')}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                  errors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-70"
            >
              {mutation.isPending ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
