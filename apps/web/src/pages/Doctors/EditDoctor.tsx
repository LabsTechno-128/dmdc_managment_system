import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { DoctorForm } from './DoctorForm';
import { ArrowLeft } from 'lucide-react';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';

export const EditDoctor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: doctor, isLoading, isError } = useQuery({
        queryKey: ['doctor', id],
        queryFn: async () => {
            const { data } = await api.get(`/doctors/${id}`);
            return data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/doctors')}
                        className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Doctor</h1>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <FormSkeleton />
                </div>
            </div>
        );
    }

    if (isError || !doctor) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/doctors')}
                        className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Not Found</h1>
                        <p className="text-slate-500 mt-1">The doctor you are looking for does not exist.</p>
                    </div>
                </div>
            </div>
        );
    }

    return <DoctorForm initialData={doctor} isEdit />;
};