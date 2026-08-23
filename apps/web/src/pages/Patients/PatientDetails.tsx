import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
    User, Calendar, FileText, Receipt, Activity,
    ArrowLeft, Stethoscope, Phone, Edit3
} from 'lucide-react';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';
import { OverviewTab } from './components/OverviewTab';
import { DoctorsTab } from './components/DoctorsTab';
import { AppointmentsTab } from './components/AppointmentsTab';
import { ReportsTab } from './components/ReportsTab';
import { BillingTab } from './components/BillingTab';
import { AssignedTestsTab } from './components/AssignedTestsTab';

const fetchPatientDetails = async (id: string) => {
    const { data } = await api.get(`/patients/${id}`);
    return data;
};

export const PatientDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'appointments' | 'reports' | 'billing' | 'tests'>('overview');

    // Pagination and filters state for tests
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { data: patient, isLoading, isError } = useQuery({
        queryKey: ['patient', id],
        queryFn: () => fetchPatientDetails(id!),
        enabled: !!id,
    });

    const { data: testsData, isLoading: testsLoading } = useQuery({
        queryKey: ['patient-tests', id, page, search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
            });
            const response = await api.get(`/patients/${id}/tests?${params.toString()}`);
            return response as any;
        },
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
                    <button onClick={() => navigate('/patients')}
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
        { id: 'tests', label: 'Assigned Tests', icon: Activity },
    ] as const;

    const renderOverview = () => <OverviewTab patient={patient} />;

    const renderDoctors = () => <DoctorsTab doctors={doctors} />;

    const renderAppointments = () => <AppointmentsTab patient={patient} navigate={navigate} />;

    const renderReports = () => <ReportsTab patient={patient} navigate={navigate} />;

    const renderBilling = () => <BillingTab patient={patient} navigate={navigate} />;

    const renderTests = () => (
        <AssignedTestsTab 
            testsData={testsData}
            testsLoading={testsLoading}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            page={page}
            setPage={setPage}
        />
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 min-h-screen bg-[#f4f6fb] -m-6 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/patients')}
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
                        <button onClick={() => navigate(`/patients/${patient.id}/edit`)}
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
                            <button key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${isActive
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
                    {activeTab === 'tests' && renderTests()}
                </div>
            </div>
        </div>
    );
};
