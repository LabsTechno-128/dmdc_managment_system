import React from 'react';
import { User, Droplet, Phone, Activity, Calendar, FileText } from 'lucide-react';

interface OverviewTabProps {
    patient: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ patient }) => {
    return (
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
};
