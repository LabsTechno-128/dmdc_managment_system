import React, { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import AsyncSelect from 'react-select/async';

import { api } from '../../lib/api';
import {
    useAppointment,
    useCreateAppointment,
    useUpdateAppointment,
} from '../../hooks/useAppointments';

import type { Appointment } from '../../types/appointment';
import { AppointmentOdpForm } from '../../components/OdpForm';


// =========================
// Validation Schema
// =========================

const appointmentSchema = z.object({
    bookingType: z.enum(['LIVE', 'FUTURE']),
    isNewPatientMode: z.boolean(),
    existingPatientId: z.string().optional(),
    appointmentDate: z.string().optional(),
    appointmentTime: z.string().optional(),
    doctorId: z.string().min(1, 'Doctor is required'),
    name: z.string().optional(),
    age: z.preprocess((val) => (val === '' || Number.isNaN(val) ? undefined : Number(val)), z.number().min(0).optional()),
    gender: z.string().optional(),
    weight: z.preprocess((val) => (val === '' || Number.isNaN(val) ? undefined : Number(val)), z.number().min(0).optional()),
    bloodPresure: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.bookingType === 'FUTURE') {
        if (!data.appointmentDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Date is required for future appointments',
                path: ['appointmentDate']
            });
        }
        if (!data.appointmentTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Time is required for future appointments',
                path: ['appointmentTime']
            });
        }
    }
    if (data.isNewPatientMode) {
        if (!data.name || data.name.trim().length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Name is required for new patient',
                path: ['name']
            });
        }
        if (!data.phone || data.phone.trim().length < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Phone is required for new patient',
                path: ['phone']
            });
        }
    } else {
        if (!data.existingPatientId || data.existingPatientId.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Please select an existing patient',
                path: ['existingPatientId']
            });
        }
    }
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;


// =========================
// Types
// =========================

interface AppointmentFormProps {
    initialData?: Appointment;
    isEdit?: boolean;
}

interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
}

// interface Patient {
//     id: string;
//     name?: string;
//     firstName?: string;
//     lastName?: string;
//     phone?: string;
// }

// =========================
// Appointment Form
// =========================

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
    isEdit = false,
}) => {
    const navigate = useNavigate();

    const createMutation = useCreateAppointment();
    const updateMutation = useUpdateAppointment();

    const [appointmentId, setAppointmentId] = useState<string>('');

    const { data: doctorsResponse } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data } = await api.get('/doctors');
            return data;
        },
    });



    const mutation = isEdit ? updateMutation : createMutation;

    const onSubmit = async (data: AppointmentFormValues) => {
        try {
            const payload = {
                ...data,
            };

            const response = await createMutation.mutateAsync(payload);

            console.log(response);

            setAppointmentId(response.id);

            if (payload.bookingType === 'FUTURE') {
                toast.success('Future appointment created successfully!');
                // Wait briefly then navigate back
                setTimeout(() => navigate('/appointments'), 1500);
            }
        } catch (error) {
            console.log(error);

            toast.error(
                'Failed to create appointment. Please try again.'
            );
        }
    };

    const {
        data: appointment,
        isLoading,
    } = useAppointment(appointmentId);

    const mutationError = mutation.error as Error | null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 mx-auto">

            {/* Page Header */}
            <div className="flex items-center space-x-4">

                <button
                    type="button"
                    onClick={() => navigate('/appointments')}
                    className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                    <svg
                        className="w-5 h-5 text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEdit
                            ? 'Edit Appointment'
                            : 'New Appointment'}
                    </h1>

                    <p className="text-slate-500 mt-1">
                        {isEdit
                            ? 'Update appointment details.'
                            : 'Schedule a new appointment.'}
                    </p>
                </div>
            </div>


            {/* Mutation Error */}
            {mutationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                    {mutationError.message ||
                        'An error occurred. Please try again.'}
                </div>
            )}


            <DMDCRegistration
                onSubmit={onSubmit}
                doctors={Array.isArray(doctorsResponse) ? doctorsResponse : doctorsResponse?.data ?? []}
                appointment={appointment}
                isLoading={isLoading || createMutation.isPending}
            />
        </div>
    );
};




function DMDCRegistration({
    onSubmit,
    doctors,
    appointment,
    isLoading,
}: {
    onSubmit: (data: AppointmentFormValues) => void;
    doctors: Doctor[];
    appointment?: Appointment;
    isLoading: boolean;
}) {
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [selectedPatientOpt, setSelectedPatientOpt] = useState<{ label: string, value: string } | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema) as any,
        defaultValues: {
            bookingType: 'LIVE',
            isNewPatientMode: true,
            doctorId: '',
            existingPatientId: '',
            appointmentDate: '',
            appointmentTime: '',
            name: '',
            phone: '',
            age: undefined,
            gender: '',
            weight: undefined,
            bloodPresure: '',
            notes: '',
        },
    });

    const bookingType = useWatch({ control, name: 'bookingType' });
    const isNewPatientMode = useWatch({ control, name: 'isNewPatientMode' });

    const submitForm = (data: AppointmentFormValues) => {
        if (isNewPatientMode) {
            data.existingPatientId = undefined; // clear it if they switched back
        } else {
            // Clear new patient fields to avoid confusion
            data.name = undefined;
            data.phone = undefined;
            data.age = undefined;
            data.gender = undefined;
            data.weight = undefined;
            data.bloodPresure = undefined;
        }
        onSubmit(data);
    };

    const handleDoctorSelect = (doctorId: string) => {
        setSelectedDoctor(doctorId);
        setValue('doctorId', doctorId, {
            shouldValidate: true,
            shouldDirty: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 text-sm">
            <main className="p-4">
                <form onSubmit={handleSubmit(submitForm)}>
                    {/* Booking Type Selection */}
                    {!appointment && (
                        <div className="mb-6 flex gap-4">
                            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 transition-all ${bookingType === 'LIVE' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                                <input type="radio" value="LIVE" {...register('bookingType')} className="hidden" />
                                <div className="font-semibold text-emerald-700">Live / Walk-in</div>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 transition-all ${bookingType === 'FUTURE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                                <input type="radio" value="FUTURE" {...register('bookingType')} className="hidden" />
                                <div className="font-semibold text-blue-700">Future Appointment</div>
                            </label>
                        </div>
                    )}

                    {/* Patient Details */}
                    {!appointment && (
                        <div className="mb-6 bg-white p-4 rounded shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <h3 className="font-semibold text-gray-700">Patient Information</h3>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setValue('isNewPatientMode', false); setValue('existingPatientId', ''); setSelectedPatientOpt(null); }} className={`px-3 py-1 rounded text-xs font-medium ${!isNewPatientMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Existing Patient</button>
                                    <button type="button" onClick={() => { setValue('isNewPatientMode', true); setValue('existingPatientId', ''); setSelectedPatientOpt(null); }} className={`px-3 py-1 rounded text-xs font-medium ${isNewPatientMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>New Patient</button>
                                </div>
                            </div>

                            {!isNewPatientMode ? (
                                <div className="mb-4 max-w-md">
                                    <Controller
                                        name="existingPatientId"
                                        control={control}
                                        render={({ field }) => (
                                            <AsyncSelect
                                                ref={field.ref}
                                                name={field.name}
                                                onBlur={field.onBlur}
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={async (inputValue) => {
                                                    try {
                                                        const { data } = await api.get('/patients', {
                                                            params: { search: inputValue, limit: 20 },
                                                        });
                                                        const patientsData = Array.isArray(data) ? data : data?.data || [];
                                                        return patientsData.map((p: any) => ({
                                                            label: `${p.name || `${p.firstName || ''} ${p.lastName || ''}`} - ${p.phone}`,
                                                            value: p.id,
                                                        }));
                                                    } catch (error) {
                                                        return [];
                                                    }
                                                }}
                                                onChange={(option: any) => {
                                                    field.onChange(option ? option.value : '');
                                                    setSelectedPatientOpt(option);
                                                }}
                                                value={selectedPatientOpt}
                                                placeholder="Search by name or phone..."
                                                isClearable
                                                className="text-sm"
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        backgroundColor: '#f9fafb',
                                                        borderColor: errors.existingPatientId ? '#ef4444' : '#d1d5db',
                                                        minHeight: '38px',
                                                        boxShadow: 'none',
                                                        '&:hover': {
                                                            borderColor: errors.existingPatientId ? '#ef4444' : '#6366f1'
                                                        }
                                                    })
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.existingPatientId && <p className="text-red-500 text-[11px] mt-1">{errors.existingPatientId.message}</p>}
                                </div>
                            ) : (
                                <div className="grid grid-cols-12 gap-2">
                                    {/* Name */}
                                    <div className="col-span-3">
                                        <input
                                            {...register('name')}
                                            className={`w-full bg-gray-50 border rounded px-3 py-2 placeholder-gray-500 text-xs focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                                            placeholder="Name:"
                                        />
                                        {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name.message}</p>}
                                    </div>

                                    {/* Phone */}
                                    <div className="col-span-2">
                                        <input
                                            type="tel"
                                            {...register('phone')}
                                            className={`w-full bg-gray-50 border rounded px-3 py-2 placeholder-gray-500 text-xs focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                                            placeholder="Phone:"
                                        />
                                        {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone.message}</p>}
                                    </div>

                                    {/* Age */}
                                    <div className="col-span-1">
                                        <div className={`flex items-center bg-gray-50 border rounded px-2 py-2 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}>
                                            <input
                                                type="number"
                                                min="0"
                                                {...register('age', { valueAsNumber: true })}
                                                className="bg-transparent placeholder-gray-500 text-xs w-full focus:outline-none"
                                                placeholder="Age:"
                                            />
                                        </div>
                                        {errors.age && <p className="text-red-500 text-[11px] mt-1">{errors.age.message}</p>}
                                    </div>

                                    {/* Gender */}
                                    <div className="col-span-2">
                                        <select
                                            {...register('gender')}
                                            className={`w-full bg-gray-50 border rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 ${errors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                        {errors.gender && <p className="text-red-500 text-[11px] mt-1">{errors.gender.message}</p>}
                                    </div>

                                    {/* Weight */}
                                    <div className="col-span-2">
                                        <div className={`flex items-center gap-1 bg-gray-50 border rounded px-3 py-2 ${errors.weight ? 'border-red-500' : 'border-gray-300'}`}>
                                            <input
                                                type="number"
                                                min="0"
                                                {...register('weight', { valueAsNumber: true })}
                                                className="bg-transparent placeholder-gray-500 text-xs w-full focus:outline-none"
                                                placeholder="Weight:"
                                            />
                                            <span className="text-gray-500 text-xs shrink-0">kg</span>
                                        </div>
                                        {errors.weight && <p className="text-red-500 text-[11px] mt-1">{errors.weight.message}</p>}
                                    </div>

                                    {/* Blood Pressure */}
                                    <div className="col-span-2">
                                        <div className={`flex items-center gap-1 bg-gray-50 border rounded px-3 py-2 ${errors.bloodPresure ? 'border-red-500' : 'border-gray-300'}`}>
                                            <input
                                                {...register('bloodPresure')}
                                                className="bg-transparent placeholder-gray-500 text-xs w-full focus:outline-none"
                                                placeholder="BP:"
                                            />
                                        </div>
                                        {errors.bloodPresure && <p className="text-red-500 text-[11px] mt-1">{errors.bloodPresure.message}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date/Time for FUTURE */}
                    {bookingType === 'FUTURE' && !appointment && (
                        <div className="mb-6 bg-white p-4 rounded shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-4">Date & Time</h3>
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        {...register('appointmentDate')}
                                        className={`w-full bg-gray-50 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.appointmentDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                                    />
                                    {errors.appointmentDate && <p className="text-red-500 text-[11px] mt-1">{errors.appointmentDate.message}</p>}
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                                    <input
                                        type="time"
                                        {...register('appointmentTime')}
                                        className={`w-full bg-gray-50 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.appointmentTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                                    />
                                    {errors.appointmentTime && <p className="text-red-500 text-[11px] mt-1">{errors.appointmentTime.message}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Doctor + OPD */}
                    <div className="grid grid-cols-12 gap-4">

                        {/* Doctor Selection */}
                        <div className={appointment ? 'col-span-5' : 'col-span-12'}>
                            <div className="bg-gray-200 rounded px-3 py-1.5 mb-3 w-48 text-sm font-semibold">
                                Select Doctor
                            </div>

                            {errors.doctorId && (
                                <p className="text-red-500 text-xs mb-2">
                                    {errors.doctorId.message}
                                </p>
                            )}

                            <div className={`grid ${appointment ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                                {doctors.map((doc) => (
                                    <button
                                        type="button"
                                        key={doc.id}
                                        onClick={() => handleDoctorSelect(doc.id)}
                                        className={`text-left rounded shadow-sm px-4 py-3 transition ${selectedDoctor === doc.id
                                            ? 'bg-emerald-100 ring-2 ring-emerald-700'
                                            : 'bg-white hover:bg-gray-50 border border-gray-200'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm">
                                            {doc.firstName} {doc.lastName}
                                        </div>
                                        <div className="text-[11px] text-gray-600 whitespace-pre-line leading-tight mt-0.5">
                                            {doc.specialization}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {!appointment && (
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-6 bg-emerald-600 text-white rounded px-4 py-3 font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading
                                        ? 'Processing...'
                                        : bookingType === 'LIVE' ? 'Generate OPD' : 'Book Appointment'}
                                </button>
                            )}
                        </div>

                        {/* OPD Form */}
                        <div className="col-span-7">
                            {appointment && bookingType === 'LIVE' && (
                                <AppointmentOdpForm
                                    appointment={appointment}
                                    isLoading={isLoading}
                                />
                            )}
                        </div>

                    </div>
                </form>
            </main>
        </div>
    );
}
