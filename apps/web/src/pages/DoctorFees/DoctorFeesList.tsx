import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAppointments } from '../../hooks/useAppointments';
import type { AppointmentQueryParams } from '../../types/appointment';
import { RefreshCw, Search, Filter, ChevronLeft, ChevronRight, CheckCircle, CreditCard, Printer } from 'lucide-react';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';

const statusColors: Record<string, string> = {
    Unpaid: 'bg-red-100 text-red-700',
    Partial: 'bg-amber-100 text-amber-700',
    Paid: 'bg-emerald-100 text-emerald-700',
};

export const DoctorFeesList: React.FC = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const queryParams: AppointmentQueryParams = {
        page,
        limit,
        search: search || undefined,
        doctorId: doctorFilter || undefined,
        startDate: dateFilter || undefined,
        endDate: dateFilter || undefined,
        sortBy: 'appointmentDate',
        sortOrder: 'DESC',
    };

    const { data: response, isLoading, isError, refetch, isFetching } = useAppointments(queryParams);

    const { data: doctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data } = await api.get('/doctors');
            return data;
        },
    });

    const appointments = response?.data ?? [];
    // filter by payment status locally if backend doesn't support it directly in appointments query
    const filteredAppointments = paymentStatusFilter 
        ? appointments.filter((a: any) => a.paymentStatus === paymentStatusFilter)
        : appointments;

    const meta = response?.meta;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setSearchInput('');
        setDoctorFilter('');
        setDateFilter('');
        setPaymentStatusFilter('');
        setPage(1);
    };

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [discountType, setDiscountType] = useState('FIXED');
    const [discount, setDiscount] = useState('0');

    const payMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post(`/billing/appointment/${data.appointmentId}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setIsPaymentModalOpen(false);
            alert('Payment successful! Bill generated.');
            // Optionally, handle printing here
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to process payment');
        }
    });

    const handleOpenPayment = (appointment: any) => {
        setSelectedAppointment(appointment);
        setPaymentAmount(appointment.consultationFee.toString());
        setDiscount('0');
        setIsPaymentModalOpen(true);
    };

    const handleProcessPayment = () => {
        if (!selectedAppointment) return;
        
        payMutation.mutate({
            appointmentId: selectedAppointment.id,
            discountType,
            discount: Number(discount),
            paidAmount: Number(paymentAmount),
            paymentMethod: 'Cash'
        });
    };

    const hasActiveFilters = search || doctorFilter || dateFilter || paymentStatusFilter;

    if (!response && isLoading) {
        return <div className="p-8"><TableSkeleton /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Fees</h1>
                    <p className="text-slate-500 mt-1">Manage and collect consultation fees for appointments</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex items-center space-x-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by patient or doctor..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20 text-sm"
                            />
                        </div>
                        <button type="submit" className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium">
                            Search
                        </button>
                    </form>

                    <button onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center space-x-1 px-3 py-2 text-slate-600 hover:text-primary bg-white border border-slate-200 rounded-xl shadow-sm transition-colors text-sm font-medium"
                    >
                        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1 text-slate-500">
                        <Filter size={16} />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>

                    <select
                        value={paymentStatusFilter}
                        onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    >
                        <option value="">All Payment Status</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                    </select>

                    <select
                        value={doctorFilter}
                        onChange={(e) => { setDoctorFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    >
                        <option value="">All Doctors</option>
                        {doctors?.map((doc: any) => (
                            <option key={doc.id} value={doc.id}>Dr. {doc.firstName} {doc.lastName}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="cursor-pointer text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {isError ? (
                    <div className="p-8 text-center text-red-500">Error loading data</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Patient</th>
                                    <th className="p-4">Doctor</th>
                                    <th className="p-4">Visit Type</th>
                                    <th className="p-4">Consultation Fee</th>
                                    <th className="p-4">Payment Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            <span>No records found.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAppointments.map((appt: any) => (
                                        <tr key={appt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-sm text-slate-600">
                                                {new Date(appt.appointmentDate).toLocaleDateString()}
                                                <div className="text-xs text-slate-400">{appt.appointmentTime}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800">
                                                    {appt.patient?.name || `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-700">
                                                    Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-medium text-slate-600">
                                                    {appt.appointmentType}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800">
                                                {Number(appt.consultationFee).toLocaleString()} BDT
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[appt.paymentStatus] || 'bg-slate-100 text-slate-700'}`}>
                                                    {appt.paymentStatus || 'Unpaid'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {(!appt.paymentStatus || appt.paymentStatus === 'Unpaid' || appt.paymentStatus === 'Partial') ? (
                                                    <button onClick={() => handleOpenPayment(appt)}
                                                        className="inline-flex items-center space-x-1 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <CreditCard size={14} />
                                                        <span>Collect Fee</span>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="inline-flex items-center space-x-1 bg-slate-100 text-slate-500 hover:text-primary px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <Printer size={14} />
                                                        <span>Print Invoice</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination */}
                {meta && meta.total > 0 && !paymentStatusFilter && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Showing <span className="font-bold text-slate-700">{((meta.page - 1) * meta.limit) + 1}</span>–{' '}
                            <span className="font-bold text-slate-700">{Math.min(meta.page * meta.limit, meta.total)}</span> of{' '}
                            <span className="font-bold text-slate-700">{meta.total}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50">
                                <ChevronLeft size={15} />
                            </button>
                            <span className="text-sm px-3">Page {page} of {meta.totalPages}</span>
                            <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50">
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Collect Consultation Fee</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="text-sm text-slate-500">Patient</div>
                                <div className="font-medium text-slate-900">
                                    {selectedAppointment.patient?.name || `${selectedAppointment.patient?.firstName || ''} ${selectedAppointment.patient?.lastName || ''}`}
                                </div>
                                <div className="text-sm text-slate-500 mt-2">Doctor</div>
                                <div className="font-medium text-slate-900">
                                    Dr. {selectedAppointment.doctor?.firstName} {selectedAppointment.doctor?.lastName}
                                </div>
                                <div className="text-sm text-slate-500 mt-2">Consultation Fee</div>
                                <div className="font-bold text-slate-900 text-lg">
                                    {Number(selectedAppointment.consultationFee).toLocaleString()} BDT
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                                    <select 
                                        value={discountType}
                                        onChange={e => setDiscountType(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="FIXED">Fixed Amount (BDT)</option>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value</label>
                                    <input 
                                        type="number"
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Paid Amount (BDT)</label>
                                <input 
                                    type="number"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-lg"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessPayment}
                                disabled={payMutation.isPending}
                                className="px-4 py-2 text-white bg-primary hover:bg-primary-dark rounded-xl font-medium transition-colors flex items-center space-x-2"
                            >
                                {payMutation.isPending ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        <CheckCircle size={18} />
                                        <span>Confirm Payment</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
