import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppointment } from '../../hooks/useAppointments';
import { AppointmentForm } from './AppointmentForm';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';

export const EditAppointment: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: appointment, isLoading, isError } = useAppointment(id ?? '');

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto mt-8">
                <FormSkeleton />
            </div>
        );
    }

    if (isError || !appointment) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
                <div className="p-8 text-center text-red-500">Appointment not found.</div>
            </div>
        );
    }

    return <AppointmentForm initialData={appointment} isEdit />;
};