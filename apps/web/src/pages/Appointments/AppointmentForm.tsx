import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useCreateAppointment, useUpdateAppointment } from '../../hooks/useAppointments';
import { AppointmentType, AppointmentStatus } from '../../types/appointment';
import type { Appointment } from '../../types/appointment';

const appointmentSchema = z.object({
    doctorId: z.string().min(1, 'Doctor is required'),
    patientId: z.string().min(1, 'Patient is required'),
    appointmentDate: z.string().min(1, 'Appointment date is required'),
    appointmentTime: z.string().min(1, 'Appointment time is required'),
    appointmentType: z.string().min(1, 'Appointment type is required'),
    status: z.string().min(1, 'Status is required'),
    visitReason: z.string().optional(),
    notes: z.string().optional(),
    consultationFee: z.number().min(0, 'Consultation fee must be positive').optional(),
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

    const { data: patients } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const { data } = await api.get('/patients');
            return data;
        },
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            doctorId: '',
            patientId: '',
            appointmentDate: '',
            appointmentTime: '',
            appointmentType: AppointmentType.New,
            status: AppointmentStatus.Pending,
            visitReason: '',
            notes: '',
            consultationFee: 0,
        },
    });

    useEffect(() => {
        if (initialData) {
            const dateStr = initialData.appointmentDate
                ? new Date(initialData.appointmentDate).toISOString().split('T')[0]
                : '';
            reset({
                doctorId: initialData.doctorId,
                patientId: initialData.patientId,
                appointmentDate: dateStr,
                appointmentTime: initialData.appointmentTime,
                appointmentType: initialData.appointmentType,
                status: initialData.status,
                visitReason: initialData.visitReason ?? '',
                notes: initialData.notes ?? '',
                consultationFee: Number(initialData.consultationFee) || 0,
            });
        }
    }, [initialData, reset]);

    const mutation = isEdit ? updateMutation : createMutation;

    const onSubmit = (data: AppointmentFormValues) => {
        const payload = {
            ...data,
            appointmentType: data.appointmentType as AppointmentType,
            status: data.status as AppointmentStatus,
        };
        if (isEdit && initialData) {
            updateMutation.mutate({ id: initialData.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const isPending = mutation.isPending;
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
                    {/* Doctor & Patient Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                            <select
                                {...register('doctorId')}
                                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${errors.doctorId ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                                    }`}
                            >
                                <option value="">-- Select Doctor --</option>
                                {doctors?.map((doc: any) => (
                                    <option key={doc.id} value={doc.id}>
                                        Dr. {doc.firstName} {doc.lastName} - {doc.specialization}
                                        <img src='https://google.com' alt='loading' />
                                    </option>
                                ))}
                            </select>
                            {errors.doctorId && <p className="mt-1 text-sm text-red-500">{errors.doctorId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
                            <select
                                {...register('patientId')}
                                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${errors.patientId ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                                    }`}
                            >
                                <option value="">-- Select Patient --</option>
                                {patients?.map((pat: any) => (
                                    <option key={pat.id} value={pat.id}>
                                        {pat.name || `${pat.firstName || ''} ${pat.lastName || ''}`} - {pat.phone}
                                    </option>
                                ))}
                            </select>
                            {errors.patientId && <p className="mt-1 text-sm text-red-500">{errors.patientId.message}</p>}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Date</label>
                            <input
                                type="date"
                                {...register('appointmentDate')}
                                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${errors.appointmentDate ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                                    }`}
                            />
                            {errors.appointmentDate && <p className="mt-1 text-sm text-red-500">{errors.appointmentDate.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Time</label>
                            <input
                                type="time"
                                {...register('appointmentTime')}
                                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${errors.appointmentTime ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                                    }`}
                            />
                            {errors.appointmentTime && <p className="mt-1 text-sm text-red-500">{errors.appointmentTime.message}</p>}
                        </div>
                    </div>

                    {/* Type & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Type</label>
                            <select
                                {...register('appointmentType')}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                            >
                                <option value={AppointmentType.New}>New</option>
                                <option value={AppointmentType.FollowUp}>Follow Up</option>
                                <option value={AppointmentType.Emergency}>Emergency</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                {...register('status')}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                            >
                                <option value={AppointmentStatus.Pending}>Pending</option>
                                <option value={AppointmentStatus.Confirmed}>Confirmed</option>
                                <option value={AppointmentStatus.Completed}>Completed</option>
                                <option value={AppointmentStatus.Cancelled}>Cancelled</option>
                                <option value={AppointmentStatus.NoShow}>No Show</option>
                            </select>
                        </div>
                    </div>

                    {/* Visit Reason */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Visit Reason</label>
                        <input
                            type="text"
                            {...register('visitReason')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                            placeholder="Reason for visit"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                            placeholder="Additional notes"
                        />
                    </div>

                    {/* Consultation Fee */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (BDT)</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('consultationFee', { valueAsNumber: true })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                            placeholder="0.00"
                        />
                        {errors.consultationFee && <p className="mt-1 text-sm text-red-500">{errors.consultationFee.message}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/appointments')}
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-70"
                        >
                            {isPending ? 'Saving...' : isEdit ? 'Update Appointment' : 'Create Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};