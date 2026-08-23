import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

interface AppointmentsTabProps {
    patient: any;
    navigate: NavigateFunction;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ patient, navigate }) => {
    return (
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
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
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
};
