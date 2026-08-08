import React, { useState } from 'react';

import { z } from 'zod';

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAppointment, useCreateAppointment, useUpdateAppointment } from '../../hooks/useAppointments';
// import { AppointmentType, AppointmentStatus } from '../../types/appointment';
import type { Appointment } from '../../types/appointment';
import { AppointmentOdpForm } from '../../components/OdpForm';


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

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ isEdit = false }) => {
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


    const mutation = isEdit ? updateMutation : createMutation;
    const [appointmentId, setAppointmentId] = useState<string>('');


    const onSubmit = async (data: AppointmentFormValues) => {

        const payload = {
            ...data,
            // appointmentType: data.appointmentType as AppointmentType,
            // status: data.status as AppointmentStatus,
        };
        try {
            // if (isEdit && initialData) {
            //     updateMutation.mutate({ id: initialData.id, data: payload });
            // } else {
            const response = await createMutation.mutateAsync(payload);

            console.log(response);

            // console.log(response.id);
            setAppointmentId(response.id);

            // navigate(`/appointments/assign/${response?.id}`);
            // }
        } catch (error) {
            console.log(error)
        }

    };


    const { data: appointment, isLoading } = useAppointment(appointmentId ?? '');
    // const isPending = mutation.isPending;
    const mutationError = mutation.error as any;
    console.log(appointment, "-------------------->>>");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 m mx-auto">
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

            <DMDCRegistration onSubmit={onSubmit} doctors={doctors} appointment={appointment} isLoading={isLoading} />
        </div>
    );
};




function DMDCRegistration({
    onSubmit,
    doctors,
    appointment,
    isLoading,

}: {
    onSubmit: any;
    doctors: any;
    appointment: Appointment;
    isLoading: boolean;

}) {
    const [patient, setPatient] = useState({
        name: "",
        phone: "",
        age: "",
        gender: "",
        weight: "",
        bloodPresure: "",
        date: "",
    });
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const update = (field) => (e) =>
        setPatient((p) => ({ ...p, [field]: e.target.value }));

    // const doctorObj = DOCTORS.find((d) => d.id === selectedDoctor);

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 text-sm">
            {/* Header */}
            {/* <header className="bg-emerald-800 text-white flex items-center justify-between px-4 py-2 shadow">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-800 font-bold text-xs">
                        +
                    </div>
                    <span className="font-semibold tracking-wide text-base">DMDC</span>
                </div>
                <div className="font-medium">Registration</div>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-white"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.6-9.8 4.9v2.7h19.6v-2.7c0-3.3-6.5-4.9-9.8-4.9z" />
                        </svg>
                    </div>
                    <span className="text-xs">Taberul Islam Chayon</span>
                </div>
            </header> */}

            <main className="p-4">
                {/* New Patient's Details bar */}
                <div className="bg-gray-200 rounded px-3 py-1.5 mb-2 w-56 text-xs font-medium">
                    New Patient's Details
                </div>

                {/* Patient form row */}
                <div className="grid grid-cols-12 gap-2 mb-6">
                    <input
                        className="col-span-3 bg-gray-200 rounded px-3 py-2 placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Name:"
                        value={patient.name}
                        onChange={update("name")}
                    />
                    <input
                        className="col-span-2 bg-gray-200 rounded px-3 py-2 placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Phone:"
                        value={patient.phone}
                        onChange={update("phone")}
                    />
                    <div className="col-span-1 flex items-center bg-gray-200 rounded px-2 py-2">
                        <input
                            className="bg-transparent placeholder-gray-600 text-xs w-full focus:outline-none"
                            placeholder="Age:"
                            value={patient.age}
                            onChange={update("age")}
                        />
                        <span className="text-gray-500 text-xs">▾</span>
                    </div>
                    <input
                        className="col-span-1 bg-gray-200 rounded px-3 py-2 placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Sex:"
                        value={patient.gender}
                        onChange={update("gender")}
                    />
                    <div className="col-span-2 flex items-center gap-1 bg-gray-200 rounded px-3 py-2">
                        <input
                            className="bg-transparent placeholder-gray-600 text-xs w-full focus:outline-none"
                            placeholder="Weight:"
                            value={patient.weight}
                            onChange={update("weight")}
                        />
                        <span className="text-gray-500 text-xs shrink-0">kg</span>
                    </div>
                    <div className="col-span-1 flex items-center gap-1 bg-gray-200 rounded px-3 py-2">
                        <input
                            className="bg-transparent placeholder-gray-600 text-xs w-full focus:outline-none"
                            placeholder="R/P:"
                            value={patient.bloodPresure}
                            onChange={update("bloodPresure")}
                        />
                        <span className="text-gray-500 text-xs">/</span>
                    </div>
                    <input
                        className="col-span-2 bg-gray-200 rounded px-3 py-2 placeholder-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Date:"
                        value={patient.date}
                        onChange={update("date")}
                    />
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Doctor selection */}
                    <div className={`col-span-${appointment ? 5 : 12}`}>
                        <div className="bg-gray-200 rounded px-3 py-1.5 mb-3 w-48 text-sm font-semibold">
                            Select Doctor
                        </div>
                        <div className={`grid ${appointment ? "grid-cols-2" : "grid-cols-3"} gap-3`}>
                            {doctors.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoctor(doc.id)}
                                    className={`text-left rounded shadow-sm px-4 py-3 transition
                    ${selectedDoctor === doc.id
                                            ? "bg-emerald-100 ring-2 ring-emerald-700"
                                            : "bg-gray-200 hover:bg-gray-300"
                                        }`}
                                >
                                    <div className="font-semibold text-sm">{doc.firstName + " " + doc.lastName}</div>
                                    <div className="text-[11px] text-gray-600 whitespace-pre-line leading-tight mt-0.5">
                                        {doc.specialization}
                                    </div>
                                </button>
                            ))}
                        </div>


                        {!appointment && <button onClick={() => { onSubmit({ ...patient, doctorId: selectedDoctor }) }} className="w-full mt-4 bg-emerald-600 text-white rounded px-4 py-2 hover:bg-emerald-700 transition">Generate OPD</button>}
                    </div>
                    <div className='col-span-7'>
                        {appointment && <AppointmentOdpForm appointment={appointment} isLoading={isLoading} />}
                    </div>


                    {/* Preview / print form */}
                    {/* <div className="col-span-5 flex flex-col">
                        <div className="border border-gray-300 rounded bg-white shadow-sm flex flex-col h-[420px]">
                            
                            <div className="bg-emerald-800 text-white px-4 py-2 flex items-center gap-2 rounded-t">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0">
                                    +
                                </div>
                                <div>
                                    <div className="font-semibold text-sm leading-tight">
                                        Dr. Muazzem Medical Diagnostic Center
                                    </div>
                                    <div className="text-[9px] leading-tight opacity-90">
                                        132/D, 2nd Floor, Anandar Tower, Shirin Miajgel — Sylhet
                                    </div>
                                    <div className="text-[9px] leading-tight opacity-90">
                                        Phone: 0821-2247566, 0821-2247566 | E-mail: dmdcenter@gmail.com
                                    </div>
                                </div>
                            </div>

                        
                            <div className="grid grid-cols-2 text-[10px] px-3 py-2 border-b border-gray-200">
                                <div>
                                    <div className="font-semibold mb-1">Patient Details</div>
                                    <div className="space-y-0.5">
                                        <div>Name : {patient.name}</div>
                                        <div>Age :{" "}{patient.age}</div>
                                        <div>Sex :{" "}{patient.sex}</div>
                                        <div>Weight :{" "}{patient.weight}</div>
                                        <div>R/P :{" "}{patient.bloodPresure}</div>
                                        <div>Phone :{" "}{patient.phone}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold mb-1">Doctor Details</div>
                                    <div className="space-y-0.5">
                                        <div>Name : {doctorObj ? doctorObj.name : ""}</div>
                                        <div className="whitespace-pre-line pl-1">
                                            {doctorObj ? doctorObj.credentials : ""}
                                        </div>
                                    </div>
                                    <div className="mt-2">Call for Serial: 01821-2247566</div>
                                </div>
                            </div>

                          
                            <div className="flex-1 relative">
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                            </div>
                        </div>

                        <div className="flex justify-end mt-3">
                            <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-medium px-4 py-2 rounded shadow-sm">
                                Generate Form
                            </button>
                        </div>
                    </div> */}
                </div>

            </main>
        </div>
    );
}




{/* <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                   
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

                     
                        <div>
                            <label>Name</label>
                            <input
                                {...register('name')}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                    
                        <div>
                            <label>Age</label>
                            <input
                                type="number"
                                {...register('age', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                     
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

                       
                        <div>
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                {...register('weight', { valueAsNumber: true })}
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                
                        <div>
                            <label>Blood Pressure</label>
                            <input
                                {...register('bloodPresure')}
                                placeholder="120/80"
                                className="w-full px-4 py-2 border rounded-xl"
                            />
                        </div>

                  
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
            </div> */}