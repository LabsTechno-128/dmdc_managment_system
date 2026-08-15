import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
    User, Calendar, FileText, Receipt, Activity, Clock,
    ArrowLeft, Stethoscope, Phone, Edit3, Droplet, Users
} from 'lucide-react';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';

const fetchPatientDetails = async (id: string) => {
    const { data } = await api.get(`/patients/${id}`);
    return data;
};

export const PatientDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'appointments' | 'reports' | 'billing'>('overview');

    const { data: patient, isLoading, isError } = useQuery({
        queryKey: ['patient', id],
        queryFn: () => fetchPatientDetails(id!),
        enabled: !!id,
    });

    const doctors = useMemo(() => {
        if (!patient?.appointments) return [];
        const doctorMap = new Map();
        
        patient.appointments.forEach((apt: any) => {
            if (apt.doctor) {
                if (!doctorMap.has(apt.doctor.id)) {
                    doctorMap.set(apt.doctor.id, {
                        ...apt.doctor,
                        appointmentCount: 1,
                        lastVisit: apt.appointmentDate,
                        firstVisit: apt.appointmentDate,
                    });
                } else {
                    const doc = doctorMap.get(apt.doctor.id);
                    doc.appointmentCount += 1;
                    if (new Date(apt.appointmentDate) > new Date(doc.lastVisit)) {
                        doc.lastVisit = apt.appointmentDate;
                    }
                    if (new Date(apt.appointmentDate) < new Date(doc.firstVisit)) {
                        doc.firstVisit = apt.appointmentDate;
                    }
                }
            }
        });
        
        return Array.from(doctorMap.values()).sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    }, [patient]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <FormSkeleton />
            </div>
        );
    }

    if (isError || !patient) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/patients')}
                        className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Not Found</h1>
                        <p className="text-slate-500 mt-1">The patient you are looking for does not exist.</p>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'doctors', label: 'Doctors', icon: Stethoscope },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'reports', label: 'Test Reports', icon: FileText },
        { id: 'billing', label: 'Billing', icon: Receipt },
    ] as const;

    const renderOverview = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="text-blue-600" size={20} /> Personal Info
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{patient.name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
                                <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">{patient.gender?.toLowerCase() || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</label>
                                <p className="text-sm font-semibold text-slate-900 mt-1">{patient.age ? `${patient.age} yrs` : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood Group</label>
                                <p className="text-sm font-bold text-red-500 mt-1 flex items-center gap-1">
                                    <Droplet size={14} /> {patient.bloodGroup || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</label>
                                <p className="text-sm font-semibold text-slate-900 mt-1">{patient.weight ? `${patient.weight} kg` : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Phone className="text-blue-600" size={20} /> Contact Info
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{patient.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{patient.email || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</label>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{patient.address || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="text-blue-600" size={20} /> Medical History / Notes
                    </h3>
                    <div className="space-y-4">
                        {patient.appointments?.filter((apt: any) => apt.notes || apt.visitReason).length > 0 ? (
                            <div className="space-y-4">
                                {patient.appointments.filter((apt: any) => apt.notes || apt.visitReason).map((apt: any) => (
                                    <div key={apt.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-blue-600">{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dr. {apt.doctor?.lastName}</span>
                                        </div>
                                        {apt.visitReason && (
                                            <div className="mb-2">
                                                <span className="text-xs font-bold text-slate-700">Reason: </span>
                                                <span className="text-sm text-slate-600">{apt.visitReason}</span>
                                            </div>
                                        )}
                                        {apt.notes && (
                                            <div>
                                                <span className="text-xs font-bold text-slate-700">Notes: </span>
                                                <span className="text-sm text-slate-600">{apt.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Activity size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No medical history notes found.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                            <Calendar size={24} />
                        </div>
                        <h4 className="text-2xl font-black text-slate-800">{patient.appointments?.length || 0}</h4>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Appointments</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <FileText size={24} />
                        </div>
                        <h4 className="text-2xl font-black text-slate-800">{patient.reports?.length || 0}</h4>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Lab Reports</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDoctors = () => (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {doctors.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Doctor</th>
                                <th className="px-6 py-4 font-bold">Specialization</th>
                                <th className="px-6 py-4 font-bold text-center">Appointments</th>
                                <th className="px-6 py-4 font-bold">First Visit</th>
                                <th className="px-6 py-4 font-bold">Last Visit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {doctors.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">Dr. {doc.firstName} {doc.lastName}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">{doc.phone || 'No phone'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">{doc.specialization || '-'}</td>
                                    <td className="px-6 py-4 text-center font-bold text-blue-600">{doc.appointmentCount}</td>
                                    <td className="px-6 py-4 text-slate-600">{new Date(doc.firstVisit).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-600">{new Date(doc.lastVisit).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <Users size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Doctors Found</h3>
                    <p className="text-sm text-slate-500 mt-1">This patient hasn't been assigned to any doctors yet.</p>
                </div>
            )}
        </div>
    );

    const renderAppointments = () => (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {patient.appointments?.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Date & Time</th>
                                <th className="px-6 py-4 font-bold">Doctor</th>
                                <th className="px-6 py-4 font-bold">Type</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {patient.appointments.map((apt: any) => (
                                <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/appointments/${apt.id}`)}>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                            <Clock size={12} /> {apt.appointmentTime || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-700">
                                            {apt.doctor ? `Dr. ${apt.doctor.lastName}` : 'Unassigned'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                                            {apt.appointmentType || 'Regular'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                            apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                            apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <Calendar size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Appointments</h3>
                    <p className="text-sm text-slate-500 mt-1">This patient has no appointment history.</p>
                </div>
            )}
        </div>
    );

    const renderReports = () => (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {patient.reports?.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Report ID</th>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {patient.reports.map((report: any) => (
                                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/reports?patientId=${patient.id}`)}>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{report.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{new Date(report.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                            report.isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {report.isDelivered ? 'Delivered' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors">
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <FileText size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Test Reports</h3>
                    <p className="text-sm text-slate-500 mt-1">This patient has no lab or test reports available.</p>
                </div>
            )}
        </div>
    );

    const renderBilling = () => (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {patient.billings?.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Invoice Date</th>
                                <th className="px-6 py-4 font-bold">Amount</th>
                                <th className="px-6 py-4 font-bold">Discount</th>
                                <th className="px-6 py-4 font-bold">Total</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {patient.billings.map((bill: any) => (
                                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/billing/${bill.id}`)}>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{new Date(bill.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-600">{Number(bill.subtotal || 0).toLocaleString()} BDT</td>
                                    <td className="px-6 py-4 text-red-500 font-medium">-{Number(bill.discount || 0).toLocaleString()} BDT</td>
                                    <td className="px-6 py-4 font-black text-slate-900">{Number(bill.totalAmount || 0).toLocaleString()} BDT</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                            bill.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {bill.paymentStatus || 'Unpaid'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <Receipt size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Billing Records</h3>
                    <p className="text-sm text-slate-500 mt-1">This patient has no invoices or billing history.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 min-h-screen bg-[#f4f6fb] -m-6 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/patients')}
                            className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors group cursor-pointer"
                        >
                            <ArrowLeft size={20} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-inner">
                                {patient.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                                    {patient.name || 'Unnamed Patient'}
                                </h1>
                                <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                                    <span className="uppercase tracking-wider text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                        {patient.patientId || `ID: ${patient.id.substring(0, 8)}`}
                                    </span>
                                    <span className="flex items-center gap-1"><Phone size={14} /> {patient.phone || 'No phone'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-colors text-sm shadow-sm cursor-pointer"
                        >
                            <Edit3 size={16} /> Edit Profile
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                {tab.label}
                                {tab.id === 'appointments' && patient.appointments?.length > 0 && (
                                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                                        {patient.appointments.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="transition-all duration-300">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'doctors' && renderDoctors()}
                    {activeTab === 'appointments' && renderAppointments()}
                    {activeTab === 'reports' && renderReports()}
                    {activeTab === 'billing' && renderBilling()}
                </div>
            </div>
        </div>
    );
};
