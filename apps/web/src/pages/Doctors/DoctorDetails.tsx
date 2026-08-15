import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
    ArrowLeft,
    Edit,
    Stethoscope,
    User,
    Calendar,
    Clock,
} from 'lucide-react';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';

export const DoctorDetails: React.FC = () => {
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
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
                <FormSkeleton />
            </div>
        );
    }

    if (isError || !doctor) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/doctors')}
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/doctors')}
                        className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Details</h1>
                        <p className="text-slate-500 mt-1">
                            <span className="font-mono">#{doctor.id?.substring(0, 8)}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/doctors/${doctor.id}/edit`)}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <Edit size={18} />
                    <span>Edit</span>
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                    {/* Avatar + Name */}
                    <div className="flex items-center space-x-5 mb-6">
                        <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                            <Stethoscope className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Dr. {doctor.firstName} {doctor.lastName}
                            </h2>
                            <p className="text-slate-500 mt-1">{doctor.specialization}</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                                <User size={16} />
                                <span>First Name</span>
                            </label>
                            <div className="text-base font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {doctor.firstName}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                                <User size={16} />
                                <span>Last Name</span>
                            </label>
                            <div className="text-base font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {doctor.lastName}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                                <Stethoscope size={16} />
                                <span>Specialization</span>
                            </label>
                            <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {doctor.specialization}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                                <Clock size={16} />
                                <span>Availability</span>
                            </label>
                            <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {doctor.availability || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-1">
                                <Calendar size={16} />
                                <span>Created Date</span>
                            </label>
                            <div className="text-sm text-slate-700">
                                {new Date(doctor.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-1">
                                <Calendar size={16} />
                                <span>Last Updated</span>
                            </label>
                            <div className="text-sm text-slate-700">
                                {new Date(doctor.updatedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};