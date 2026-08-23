import React from 'react';
import { Users } from 'lucide-react';

interface DoctorsTabProps {
    doctors: any[];
}

export const DoctorsTab: React.FC<DoctorsTabProps> = ({ doctors }) => {
    return (
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
};
