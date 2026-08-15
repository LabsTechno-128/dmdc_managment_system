import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

const doctorSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    degree: z.string().optional(),
    availability: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

interface DoctorFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export const DoctorForm: React.FC<DoctorFormProps> = ({ initialData, isEdit = false }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DoctorFormValues>({
        resolver: zodResolver(doctorSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            specialization: '',
            degree: '',
            availability: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                specialization: initialData.specialization || '',
                degree: initialData.degree || '',
                availability: initialData.availability || '',
            });
        }
    }, [initialData, reset]);

    const mutation = useMutation({
        mutationFn: (data: DoctorFormValues) => {
            if (isEdit && initialData) {
                return api.patch(`/doctors/${initialData.id}`, data);
            }
            return api.post('/doctors', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            navigate('/doctors');
        },
    });

    const onSubmit = (data: DoctorFormValues) => {
        mutation.mutate(data);
    };

    const mutationError = mutation.error as any;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="flex items-center space-x-4">
                <button className="cursor-pointer"
                    onClick={() => navigate('/doctors')}
                    className="cursor-pointer p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit ? 'Edit Doctor' : 'New Doctor'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isEdit ? 'Update doctor profile information.' : 'Register a new doctor into the system.'}
                    </p>
                </div>
            </div>

            {mutationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                    {mutationError.message || 'An error occurred. Please try again.'}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                            <input
                                type="text"
                                {...register('firstName')}
                                className={`w-full px-4 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition-all ${errors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-primary/20'
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
                                className={`w-full px-4 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition-all ${errors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                                    }`}
                                placeholder="Doe"
                            />
                            {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                            <input
                                type="text"
                                {...register('specialization')}
                                className={`w-full px-4 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition-all ${errors.specialization ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                                    }`}
                                placeholder="e.g. Cardiologist"
                            />
                            {errors.specialization && <p className="mt-1 text-sm text-red-500">{errors.specialization.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Degree</label>
                            <input
                                type="text"
                                {...register('degree')}
                                className={`w-full px-4 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition-all ${errors.degree ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                                    }`}
                                placeholder="e.g. MD, MBBS"
                            />
                            {errors.degree && <p className="mt-1 text-sm text-red-500">{errors.degree.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
                        <input
                            type="text"
                            {...register('availability')}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20 transition-all"
                            placeholder="e.g. Mon-Fri, 9am-5pm"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button className="cursor-pointer"
                            type="button"
                            onClick={() => navigate('/doctors')}
                            className="cursor-pointer px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors mr-3 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="cursor-pointer px-6 py-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Doctor' : 'Save Doctor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};