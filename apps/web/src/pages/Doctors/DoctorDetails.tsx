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
    DollarSign,
    Users,
    Printer,
    FileText,
} from 'lucide-react';
import { DetailsSkeleton } from '../../components/skeleton/DetailsSkeleton';
import { useReactToPrint } from 'react-to-print';

export const DoctorDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [statsDate, setStatsDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
    const printRef = React.useRef<HTMLDivElement>(null);

    const { data: doctor, isLoading, isError } = useQuery({
        queryKey: ['doctor', id],
        queryFn: async () => {
            const { data } = await api.get(`/doctors/${id}`);
            return data;
        },
        enabled: !!id,
    });

    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['doctor-daily-stats', id, statsDate],
        queryFn: async () => {
            const { data } = await api.get(`/doctors/${id}/daily-stats?date=${statsDate}`);
            return data;
        },
        enabled: !!id,
    });

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Doctor_Daily_Report_${doctor?.firstName}_${statsDate}`,
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

            {/* Daily Stats Section */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mt-8 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="text-primary" size={24} />
                            Daily Income & Report
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Track daily patients, income, and generate reports.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={statsDate}
                            onChange={(e) => setStatsDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        <button
                            onClick={() => handlePrint()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-primary hover:text-white rounded-xl transition-colors font-medium text-sm"
                        >
                            <Printer size={16} />
                            Print Report
                        </button>
                    </div>
                </div>

                {isStatsLoading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-200 rounded"></div>
                                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div ref={printRef} className="print:p-8">
                        <div className="hidden print:block mb-8 text-center border-b pb-6">
                            <h1 className="text-3xl font-bold text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</h1>
                            <p className="text-lg text-slate-600 mt-2">Daily Consultation Report - {statsDate}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-emerald-800">Total Income</p>
                                    <h3 className="text-2xl font-bold text-emerald-900">{Number(stats?.totalIncome || 0).toLocaleString()} BDT</h3>
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Patients Seen</p>
                                    <h3 className="text-2xl font-bold text-blue-900">{stats?.totalPatients || 0}</h3>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Total Discount</p>
                                    <h3 className="text-2xl font-bold text-amber-900">{Number(stats?.totalDiscount || 0).toLocaleString()} BDT</h3>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                                        <th className="p-4">Patient Name</th>
                                        <th className="p-4">Visit Type</th>
                                        <th className="p-4">Time</th>
                                        <th className="p-4">Fee</th>
                                        <th className="p-4">Discount</th>
                                        <th className="p-4">Paid</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.patientsSeen?.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-6 text-center text-slate-500">No patients seen on this date.</td>
                                        </tr>
                                    ) : (
                                        stats?.patientsSeen?.map((appt: any) => (
                                            <tr key={appt.id} className="border-b border-slate-100 last:border-0">
                                                <td className="p-4 font-medium text-slate-800">
                                                    {appt.patient?.name || `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`}
                                                </td>
                                                <td className="p-4 text-sm text-slate-600">{appt.appointmentType}</td>
                                                <td className="p-4 text-sm text-slate-600">{appt.appointmentTime}</td>
                                                <td className="p-4 font-medium">{Number(appt.consultationFee).toLocaleString()} BDT</td>
                                                <td className="p-4 text-red-500">{appt.billing?.discountAmount ? Number(appt.billing.discountAmount).toLocaleString() : 0} BDT</td>
                                                <td className="p-4 font-semibold text-emerald-600">{appt.billing?.paidAmount ? Number(appt.billing.paidAmount).toLocaleString() : 0} BDT</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        appt.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                        appt.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {appt.paymentStatus || 'Unpaid'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};