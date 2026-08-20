import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Search, Printer, Eye, Calendar, Loader2 } from 'lucide-react';
import { DoctorIncomePosModal } from './DoctorIncomePosModal';
import { useReactToPrint } from 'react-to-print';
import { DoctorIncomePrint } from './DoctorIncomePrint';

const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

interface DoctorIncome {
    doctorId: string;
    doctorName: string;
    totalIncome: number;
    consultationIncome: number;
    followUpIncome: number;
    patientCount: number;
    appointmentCount: number;
    appointments: {
        appointmentId: string;
        patientName: string;
        appointmentType: string;
        feeEarned: number;
        consultationFee: number;
        followUpFee: number;
    }[];
}

export const DoctorFeesList: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [viewDoctorId, setViewDoctorId] = useState<string | null>(null);
    const [selectedPosDoctor, setSelectedPosDoctor] = useState<string | null>(null);

    const handlePrintPos = (doctorId?: string) => {
        setSelectedPosDoctor(doctorId || 'ALL');
    };

    const { data: incomeResponse, isLoading, isFetching } = useQuery<{ summary: any, doctors: DoctorIncome[] }>({
        queryKey: ['doctor-daily-income', selectedDate],
        queryFn: async () => {
            const response = await api.get(`/appointments/daily-income?date=${selectedDate}`);
            return response.data;
        },
    });


    // Filter doctors by search query (doctor name)
    const mappedDoctorsData = (incomeResponse?.doctors || []).map(doc => ({
        ...doc,
        doctorName: doc.doctorName.startsWith('Dr.') ? doc.doctorName : `Dr. ${doc.doctorName}`
    })).filter((doc: any) =>
        doc.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const summary = incomeResponse?.summary || {
        totalIncome: 0,
        consultationIncome: 0,
        followUpIncome: 0,
        patientCount: 0,
        appointmentCount: 0
    };

    const handleViewDetails = (doctorId: string) => {
        setViewDoctorId(doctorId);
    };
    const [printingDoctor, setPrintingDoctor] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrintAction = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => setPrintingDoctor(null),
    });

    useEffect(() => {
        if (printingDoctor) {
            const timer = setTimeout(() => {
                handlePrintAction();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [printingDoctor, handlePrintAction]);

    const selectedDoctorData = mappedDoctorsData?.find((doc: any) => doc.doctorId === viewDoctorId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="hidden">
                <DoctorIncomePrint
                    ref={printRef}
                    date={selectedDate}
                    doctor={printingDoctor}
                />
            </div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Daily Income</h1>
                    <p className="text-slate-500 mt-1">View and print daily income reports for doctors</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Date Picker */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
                        />
                    </div>

                    {/* Search Doctor */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search doctor name..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
                        />
                    </div>

                    {/* <div className="ml-auto">
                        <button
                            onClick={() => handlePrintPos()} // No id = print all
                            disabled={mappedDoctorsData.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors text-sm font-bold disabled:opacity-50"
                        >
                            <Printer size={16} />
                            <span>Print All POS</span>
                        </button>
                    </div> */}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Patients</p>
                    <p className="text-3xl font-black text-blue-600">{summary.patientCount}</p>
                    <p className="text-xs text-slate-400 mt-1">From {summary.appointmentCount} Appointments</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Consultation Income</p>
                    <p className="text-3xl font-black text-indigo-600">৳{summary.consultationIncome.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Follow-up Income</p>
                    <p className="text-3xl font-black text-purple-600">৳{summary.followUpIncome.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">Total Daily Income</p>
                    <p className="text-3xl font-black text-emerald-700">৳{summary.totalIncome.toLocaleString()}</p>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">Doctor Name</th>
                                <th className="px-6 py-4">Patients Seen</th>
                                <th className="px-6 py-4">Appointments</th>
                                <th className="px-6 py-4">Consultation Inc.</th>
                                <th className="px-6 py-4">Follow-up Inc.</th>
                                <th className="px-6 py-4">Total Income</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading || isFetching ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                                        <p className="text-slate-500 mt-2">Loading daily income...</p>
                                    </td>
                                </tr>
                            ) : mappedDoctorsData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <p className="text-slate-500 font-medium text-lg">No doctors found</p>
                                        <p className="text-slate-400 mt-1">Try a different search query.</p>
                                    </td>
                                </tr>
                            ) : (
                                mappedDoctorsData.map((docData: any) => (
                                    <tr key={docData.doctorId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800">{docData.doctorName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-medium px-3 py-1 rounded-full text-sm">
                                                {docData.patientCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {docData.appointmentCount}
                                        </td>
                                        <td className="px-6 py-4 text-indigo-600 font-semibold">
                                            ৳{docData.consultationIncome.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-purple-600 font-semibold">
                                            ৳{docData.followUpIncome.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-emerald-600 font-bold">
                                                ৳{docData.totalIncome.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(docData.doctorId)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                {docData.appointments.length > 0 && (
                                                    <button
                                                        onClick={() => setPrintingDoctor(docData)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Printer size={14} /> Print
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {viewDoctorId && selectedDoctorData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selectedDoctorData.doctorName}</h2>
                                <p className="text-sm text-slate-500 font-medium">Income Details for {formatDate(selectedDate)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePrintPos(selectedDoctorData.doctorId)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-100 rounded-xl hover:bg-emerald-200 transition-colors"
                                >
                                    <Printer size={16} /> Print POS
                                </button>
                                <button
                                    onClick={() => setViewDoctorId(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Patients</p>
                                    <p className="text-2xl font-black text-blue-900">{selectedDoctorData.appointments.length}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Income</p>
                                    <p className="text-2xl font-black text-emerald-900">৳{selectedDoctorData.totalIncome.toLocaleString()}</p>
                                </div>
                            </div>

                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">#</th>
                                        <th className="px-4 py-3">Patient Name</th>
                                        <th className="px-4 py-3">Consultation Type</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg">Fee (BDT)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedDoctorData.appointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500 font-medium">
                                                No patients seen on this date.
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedDoctorData.appointments.map((appt: any, idx: number) => (
                                            <tr key={appt.appointmentId} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-700">{appt.patientName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${appt.appointmentType === 'New' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {appt.appointmentType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                                    ৳{appt.feeEarned.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Doctor Income POS Print Modal */}
            {selectedPosDoctor && (
                <DoctorIncomePosModal
                    isOpen={!!selectedPosDoctor}
                    onClose={() => setSelectedPosDoctor(null)}
                    incomes={incomeResponse?.doctors || []}
                    date={selectedDate}
                    doctorId={selectedPosDoctor}
                />
            )}
        </div>
    );
};
