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
import { DetailsSkeleton } from '../../components/skeleton/DetailsSkeleton';

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
            <div className="w-full animate-in fade-in duration-500 max-w-4xl mx-auto">
                <DetailsSkeleton />
            </div>
        );
    }

    if (isError || !doctor) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/doctors')}
                        className="cursor-pointer p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
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
                        className="cursor-pointer p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
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
                    className="cursor-pointer flex items-center space-x-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    <Edit size={18} />
                    <span>Edit</span>
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10"></div>
                <div className="p-6 sm:p-8 relative z-10 mt-6">
                    {/* Avatar + Name */}
                    <div className="flex items-center space-x-5 mb-6">
                        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl shadow-sm border border-primary/20 transform rotate-3">
                            <Stethoscope className="h-10 w-10 text-primary -rotate-3" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Dr. {doctor.firstName} {doctor.lastName}
                                {doctor.degree && <span className="ml-2 text-lg font-normal text-slate-500">({doctor.degree})</span>}
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
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
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