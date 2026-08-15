import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppointment } from '../../hooks/useAppointments';
import {
    ArrowLeft,
    Edit,
    Calendar,
    Clock,
    User,
    Stethoscope,
    DollarSign,
    FileText,
    StickyNote,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';

const statusColors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-red-100 text-red-700',
    NoShow: 'bg-slate-100 text-slate-700',
};

const typeColors: Record<string, string> = {
    New: 'bg-indigo-100 text-indigo-700',
    FollowUp: 'bg-purple-100 text-purple-700',
    Emergency: 'bg-red-100 text-red-700',
};

export const AppointmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: appointment, isLoading, isError } = useAppointment(id ?? '');

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mt-8">
                <FormSkeleton />
            </div>
        );
    }

    if (isError || !appointment) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
                <div className="flex items-center space-x-4">
                    <button className="cursor-pointer"
                        onClick={() => navigate('/appointments')}
                        className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Not Found</h1>
                        <p className="text-slate-500 mt-1">The appointment you are looking for does not exist.</p>
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
                    <button className="cursor-pointer"
                        onClick={() => navigate('/appointments')}
                        className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Appointment Details
                        </h1>
                        <p className="text-slate-500 mt-1">
                            <span className="font-mono">#{appointment.id.substring(0, 8)}</span>
                        </p>
                    </div>
                </div>
                <button className="cursor-pointer"
                    onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <Edit size={18} />
                    <span>Edit</span>
                </button>
            </div>

            {/* Status & Type Badges */}
            <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[appointment.status] || 'bg-slate-100 text-slate-700'}`}>
                    {appointment.status === 'Completed' && <CheckCircle size={14} className="mr-1" />}
                    {appointment.status === 'Cancelled' && <XCircle size={14} className="mr-1" />}
                    {appointment.status}
                </span>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${typeColors[appointment.appointmentType] || 'bg-slate-100 text-slate-700'}`}>
                    {appointment.appointmentType}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doctor Information */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex items-center space-x-2">
                            <Stethoscope className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-slate-800">Doctor Information</h2>
                        </div>
                        {appointment.doctor ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                                    <div className="text-base font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Specialization</label>
                                    <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                        {appointment.doctor.specialization}
                                    </div>
                                </div>
                                {appointment.doctor.availability && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Availability</label>
                                        <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                            {appointment.doctor.availability}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-slate-500 text-sm">Doctor information not available.</div>
                        )}
                    </div>
                </div>

                {/* Patient Information */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-slate-800">Patient Information</h2>
                        </div>
                        {appointment.patient ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                                    <div className="text-base font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                        {appointment.patient.name || `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Phone</label>
                                    <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                        {appointment.patient.phone}
                                    </div>
                                </div>
                                {appointment.patient.email && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                                        <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                            {appointment.patient.email}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-slate-500 text-sm">Patient information not available.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Appointment Information */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-slate-800">Appointment Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-1">
                                <Calendar size={16} />
                                <span>Date</span>
                            </label>
                            <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-1">
                                <Clock size={16} />
                                <span>Time</span>
                            </label>
                            <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {appointment.appointmentTime}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-1">
                                <FileText size={16} />
                                <span>Visit Reason</span>
                            </label>
                            <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {appointment.visitReason || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-1">
                                <DollarSign size={16} />
                                <span>Consultation Fee</span>
                            </label>
                            <div className="text-base font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {Number(appointment.consultationFee).toLocaleString()} BDT
                            </div>
                        </div>
                    </div>

                    {appointment.notes && (
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-1">
                                <StickyNote size={16} />
                                <span>Notes</span>
                            </label>
                            <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                {appointment.notes}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Created Date</label>
                            <div className="text-sm text-slate-700">
                                {new Date(appointment.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Last Updated</label>
                            <div className="text-sm text-slate-700">
                                {new Date(appointment.updatedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};