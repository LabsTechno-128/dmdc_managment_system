import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useCreateAppointment, useUpdateAppointment } from '../../hooks/useAppointments';
// import { AppointmentType, AppointmentStatus } from '../../types/appointment';
import type { Appointment } from '../../types/appointment';


const appointmentSchema = z.object({
    doctorId: z.string().min(1, 'Doctor is required'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    age: z.number().min(0, 'Age must be at least 0').optional(),
    gender: z.string().min(2, 'Name must be at least 2 characters long'),
    weight: z.number().min(0, 'Weight must be at least 0').optional(),
    bloodPresure: z.string().optional(),
    notes: z.string().optional(),
    // consultationFee: z.number().min(0, 'Consultation fee must be positive').optional(),
    phone: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
    initialData?: Appointment;
    isEdit?: boolean;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ initialData, isEdit = false }) => {
    const navigate = useNavigate();
    const createMutation = useCreateAppointment();
    const updateMutation = useUpdateAppointment();

    const { data: doctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data } = await api.get('/doctors');
            return data;
        },
    });

    // const { data: patients } = useQuery({
    //     queryKey: ['patients'],
    //     queryFn: async () => {
    //         const { data } = await api.get('/patients');
    //         return data;
    //     },
    // });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            doctorId: '',
            name: '',
            age: undefined,
            gender: undefined,
            weight: undefined,
            bloodPresure: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                doctorId: initialData.doctorId,
                // name: initialData.name ?? '',
                // age: initialData.age,
                // gender: initialData.gender,
                // weight: initialData.weight,
                // bloodPresure: initialData.bloodPresure ?? '',
                // phone: initialData.phone ?? '',
            });
        }
    }, [initialData, reset]);

    const mutation = isEdit ? updateMutation : createMutation;

    const onSubmit = async (data: AppointmentFormValues) => {
        const payload = {
            ...data,
            // appointmentType: data.appointmentType as AppointmentType,
            // status: data.status as AppointmentStatus,
        };
        if (isEdit && initialData) {
            updateMutation.mutate({ id: initialData.id, data: payload });
        } else {
            const response = await createMutation.mutateAsync(payload);

            console.log(response);
            console.log(response.id);

            navigate(`/appointments/assign/${response?.data?.id}`);
        }
    };

    // const isPending = mutation.isPending;
    const mutationError = mutation.error as any;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/appointments')}
                    className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit ? 'Edit Appointment' : 'New Appointment'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isEdit ? 'Update appointment details.' : 'Schedule a new appointment.'}
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
                    {/* Doctor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Doctor
                        </label>

                        <select
                            {...register('doctorId')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        >
                            <option value="">-- Select Doctor --</option>

                            {doctors?.map((doc: any) => (
                                <option key={doc.id} value={doc.id}>
                                    Dr. {doc.firstName} {doc.lastName} - {doc.specialization}
                                </option>
                            ))}
                        </select>

                        {errors.doctorId && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.doctorId.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Name */}
                        <div>
                            <label>Name</label>
                            <input
                                {...register('name')}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                        {/* Age */}
                        <div>
                            <label>Age</label>
                            <input
                                type="number"
                                {...register('age', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                        {/* Gender */}
                        <div>
                            <label>Gender</label>
                            <select
                                {...register('gender')}
                                className="w-full px-4 py-2 border rounded-xl"
                            >
                                <option value="">Select Gender</option>
                                <option value={"MALE"}>Male</option>
                                <option value={"FEMALE"}>Female</option>
                                <option value={"OTHER"}>Other</option>
                            </select>
                        </div>

                        {/* Weight */}
                        <div>
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                {...register('weight', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                        {/* Blood Pressure */}
                        <div>
                            <label>Blood Pressure</label>
                            <input
                                {...register('bloodPresure')}
                                placeholder="120/80"
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label>Phone</label>
                            <input
                                {...register('phone')}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                    </div>
                    <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-70" > Create </button>
                </form>
            </div>
        </div>
    );
};