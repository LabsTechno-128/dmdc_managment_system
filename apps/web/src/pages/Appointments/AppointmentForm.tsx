
import React, { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';

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
    doctorId: z
        .string()
        .min(1, 'Doctor is required'),

    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters long'),

    age: z
        .number({
            message: 'Age is required',
        })
        .min(0, 'Age must be at least 0'),

    gender: z
        .string()
        .min(1, 'Gender is required'),

    weight: z
        .number({
            message: 'Weight is required',
        })
        .min(0, 'Weight must be at least 0'),

    bloodPresure: z
        .string()
        .trim()
        .min(1, 'Blood pressure is required'),

    notes: z
        .string()
        .optional(),

    phone: z
        .string()
        .trim()
        .min(1, 'Phone is required'),
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

    const { data: doctors } = useQuery<Doctor[]>({
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
                doctors={doctors ?? []}
                appointment={appointment}
                isLoading={isLoading}
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
    const [selectedDoctor, setSelectedDoctor] =
        useState<string>('');

    const {
        register,
        handleSubmit,
        setValue,
        formState: {
            errors,
        },
    } = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),

        defaultValues: {
            doctorId: '',
            name: '',
            phone: '',
            age: undefined,
            gender: '',
            weight: undefined,
            bloodPresure: '',
            notes: '',
        },
    });


    const submitForm = (data: AppointmentFormValues) => {
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

                {/* New Patient's Details */}
                <div className="bg-gray-200 rounded px-3 py-1.5 mb-2 w-56 text-xs font-medium">
                    New Patient's Details
                </div>


                {/* Patient Form */}
                <form onSubmit={handleSubmit(submitForm)}>

                    <div className="grid grid-cols-12 gap-2 mb-6">

                        {/* Name */}
                        <div className="col-span-3">

                            <input
                                {...register('name')}
                                className={`w-full bg-gray-200 rounded px-3 py-2 placeholder-gray-600 text-xs focus:outline-none focus:ring-2 ${errors.name
                                    ? 'ring-2 ring-red-500'
                                    : 'focus:ring-emerald-600'
                                    }`}
                                placeholder="Name:"
                            />

                            {errors.name && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>


                        {/* Phone */}
                        <div className="col-span-2">

                            <input
                                type="tel"
                                {...register('phone')}
                                className={`w-full bg-gray-200 rounded px-3 py-2 placeholder-gray-600 text-xs focus:outline-none focus:ring-2 ${errors.phone
                                    ? 'ring-2 ring-red-500'
                                    : 'focus:ring-emerald-600'
                                    }`}
                                placeholder="Phone:"
                            />

                            {errors.phone && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {errors.phone.message}
                                </p>
                            )}
                        </div>


                        {/* Age */}
                        <div className="col-span-1">

                            <div
                                className={`flex items-center bg-gray-200 rounded px-2 py-2 ${errors.age
                                    ? 'ring-2 ring-red-500'
                                    : ''
                                    }`}
                            >
                                <input
                                    type="number"
                                    min="0"
                                    {...register('age', {
                                        valueAsNumber: true,
                                    })}
                                    className="bg-transparent placeholder-gray-600 text-xs w-full focus:outline-none"
                                    placeholder="Age:"
                                />

                                <span className="text-gray-500 text-xs">
                                    ▾
                                </span>
                            </div>

                            {errors.age && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {errors.age.message}
                                </p>
                            )}
                        </div>


                        {/* Gender */}
                        <div className="col-span-2">

                            <select
                                {...register('gender')}
                                className={`w-full bg-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 ${errors.gender
                                    ? 'ring-2 ring-red-500'
                                    : 'focus:ring-emerald-600'
                                    }`}
                            >
                                <option value="">
                                    Select Gender
                                </option>

                                <option value="MALE">
                                    Male
                                </option>

                                <option value="FEMALE">
                                    Female
                                </option>

                                <option value="OTHER">
                                    Other
                                </option>
                            </select>

                            {errors.gender && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {errors.gender.message}
                                </p>
                            )}
                        </div>


                        {/* Weight */}
                        <div className="col-span-2">

                            <div
                                className={`flex items-center gap-1 bg-gray-200 rounded px-3 py-2 ${errors.weight
                                    ? 'ring-2 ring-red-500'
                                    : ''
                                    }`}
                            >
                                <input
                                    type="number"
                                    min="0"
                                    {...register('weight', {
                                        valueAsNumber: true,
                                    })}
                                    className="bg-transparent placeholder-gray-600 text-xs w-full focus:outline-none"
                                    placeholder="Weight:"
                                />

                                <span className="text-gray-500 text-xs shrink-0">
                                    kg
                                </span>
                            </div>

                            {errors.weight && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {errors.weight.message}
                                </p>
                            )}
                        </div>


                        {/* Blood Pressure */}
                        <div className="col-span-2">

                            <div
                                className={`flex items-center gap-1 bg-gray-200 rounded px-3 py-2 ${errors.bloodPresure
                                    ? 'ring-2 ring-red-500'
                                    : ''
                                    }`}
                            >
                                <input
                                    {...register('bloodPresure')}
                                    className="bg-transparent placeholder-gray-600 text-xs w-full focus:outline-none"
                                    placeholder="R/P:"
                                />

                                <span className="text-gray-500 text-xs">
                                    /
                                </span>
                            </div>

                            {errors.bloodPresure && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {errors.bloodPresure.message}
                                </p>
                            )}
                        </div>

                    </div>


                    {/* Doctor + OPD */}
                    <div className="grid grid-cols-12 gap-4">

                        {/* Doctor Selection */}
                        <div
                            className={
                                appointment
                                    ? 'col-span-5'
                                    : 'col-span-12'
                            }
                        >

                            <div className="bg-gray-200 rounded px-3 py-1.5 mb-3 w-48 text-sm font-semibold">
                                Select Doctor
                            </div>


                            {errors.doctorId && (
                                <p className="text-red-500 text-xs mb-2">
                                    {errors.doctorId.message}
                                </p>
                            )}


                            <div
                                className={
                                    `grid ${appointment
                                        ? 'grid-cols-2'
                                        : 'grid-cols-3'
                                    } gap-3`
                                }
                            >

                                {doctors.map((doc) => (

                                    <button
                                        type="button"
                                        key={doc.id}
                                        onClick={() =>
                                            handleDoctorSelect(doc.id)
                                        }
                                        className={`text-left rounded shadow-sm px-4 py-3 transition ${selectedDoctor === doc.id
                                            ? 'bg-emerald-100 ring-2 ring-emerald-700'
                                            : 'bg-gray-200 hover:bg-gray-300'
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
                                    className="w-full mt-4 bg-emerald-600 text-white rounded px-4 py-2 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading
                                        ? 'Creating...'
                                        : 'Generate OPD'}
                                </button>

                            )}

                        </div>


                        {/* OPD Form */}
                        <div className="col-span-7">

                            {appointment && (
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

