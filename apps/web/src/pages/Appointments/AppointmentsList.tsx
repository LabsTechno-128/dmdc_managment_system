import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAppointments, useDeleteAppointment } from '../../hooks/useAppointments';
import { AppointmentStatus, AppointmentType } from '../../types/appointment';
import type { AppointmentQueryParams } from '../../types/appointment';
import { Plus, Trash2, Edit, Eye, RefreshCw, Search, Calendar, Filter } from 'lucide-react';

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

export const AppointmentsList: React.FC = () => {
    const navigate = useNavigate();
    const deleteMutation = useDeleteAppointment();

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [patientFilter, setPatientFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortBy, setSortBy] = useState('appointmentDate');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    const queryParams: AppointmentQueryParams = {
        page,
        limit,
        search: search || undefined,
        status: (statusFilter || undefined) as any,
        appointmentType: (typeFilter || undefined) as any,
        doctorId: doctorFilter || undefined,
        patientId: patientFilter || undefined,
        startDate: dateFilter || undefined,
        sortBy,
        sortOrder,
    };

    const { data: response, isLoading, isError, refetch, isFetching } = useAppointments(queryParams);

    const { data: doctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data } = await api.get('/doctors');
            return data;
        },
    });
    console.log(response, "----------");
    const { data: patients } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const { data } = await api.get('/patients');
            return data;
        },
    });

    const appointments = response ?? [];
    const meta = response?.meta;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setSearchInput('');
        setStatusFilter('');
        setTypeFilter('');
        setDoctorFilter('');
        setPatientFilter('');
        setDateFilter('');
        setSortBy('appointmentDate');
        setSortOrder('ASC');
        setPage(1);
    };

    const hasActiveFilters = search || statusFilter || typeFilter || doctorFilter || patientFilter || dateFilter;
    if (!response) {
        return <div>loading</div>
    }
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
                    <p className="text-slate-500 mt-1">Manage patient appointments and schedules</p>
                </div>
                <button
                    onClick={() => navigate('/appointments/create')}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} />
                    <span>New Appointment</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex items-center space-x-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by patient or doctor name..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20 text-sm"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium">
                            Search
                        </button>
                    </form>

                    {/* Refresh */}
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center space-x-1 px-3 py-2 text-slate-600 hover:text-primary bg-white border border-slate-200 rounded-xl shadow-sm transition-colors text-sm font-medium"
                    >
                        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1 text-slate-500">
                        <Filter size={16} />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    >
                        <option value="">All Status</option>
                        <option value={AppointmentStatus.Pending}>Pending</option>
                        <option value={AppointmentStatus.Confirmed}>Confirmed</option>
                        <option value={AppointmentStatus.Completed}>Completed</option>
                        <option value={AppointmentStatus.Cancelled}>Cancelled</option>
                        <option value={AppointmentStatus.NoShow}>No Show</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    >
                        <option value="">All Types</option>
                        <option value={AppointmentType.New}>New</option>
                        <option value={AppointmentType.FollowUp}>Follow Up</option>
                        <option value={AppointmentType.Emergency}>Emergency</option>
                    </select>

                    {/* Doctor Filter */}
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

                    {/* Patient Filter */}
                    <select
                        value={patientFilter}
                        onChange={(e) => { setPatientFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    >
                        <option value="">All Patients</option>
                        {patients?.map((pat: any) => (
                            <option key={pat.id} value={pat.id}>{pat.name || `${pat.firstName || ''} ${pat.lastName || ''}`}</option>
                        ))}
                    </select>

                    {/* Date Filter */}
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading appointments...</div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">Error loading appointments</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                                    <th className="p-4">Appointment ID</th>
                                    <th className="p-4">Patient Name</th>
                                    <th className="p-4">Doctor Name</th>
                                    <th className="p-4 cursor-pointer select-none hover:bg-slate-100" onClick={() => handleSort('appointmentDate')}>
                                        <div className="flex items-center space-x-1">
                                            <Calendar size={14} />
                                            <span>Date</span>
                                            {sortBy === 'appointmentDate' && <span className="text-xs">{sortOrder === 'ASC' ? '↑' : '↓'}</span>}
                                        </div>
                                    </th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4 cursor-pointer select-none hover:bg-slate-100" onClick={() => handleSort('status')}>
                                        <div className="flex items-center space-x-1">
                                            <span>Status</span>
                                            {sortBy === 'status' && <span className="text-xs">{sortOrder === 'ASC' ? '↑' : '↓'}</span>}
                                        </div>
                                    </th>
                                    <th className="p-4 cursor-pointer select-none hover:bg-slate-100" onClick={() => handleSort('consultationFee')}>
                                        <div className="flex items-center space-x-1">
                                            <span>Fee</span>
                                            {sortBy === 'consultationFee' && <span className="text-xs">{sortOrder === 'ASC' ? '↑' : '↓'}</span>}
                                        </div>
                                    </th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-500">
                                            <div className="flex flex-col items-center space-y-2">
                                                <Calendar className="h-8 w-8 text-slate-300" />
                                                <span>No appointments found.</span>
                                                {hasActiveFilters && <span className="text-xs">Try adjusting your filters.</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appointment: any) => (
                                        <tr key={appointment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <span className="font-mono text-sm font-semibold text-slate-700">
                                                    #{appointment.id.substring(0, 8)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800">
                                                    {appointment.patient
                                                        ? (appointment.patient.name || `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`)
                                                        : 'Unknown Patient'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-700">
                                                    {appointment.doctor
                                                        ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                                                        : 'Unknown Doctor'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">
                                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">
                                                {appointment.appointmentTime}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[appointment.appointmentType] || 'bg-slate-100 text-slate-700'}`}>
                                                    {appointment.appointmentType}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status] || 'bg-slate-100 text-slate-700'}`}>
                                                    {appointment.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800 text-sm">
                                                {Number(appointment.consultationFee).toLocaleString()} BDT
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/appointments/${appointment.id}`)}
                                                        className="p-2 text-slate-400 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
                                                        className="p-2 text-slate-400 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(appointment.id)}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.total > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium text-slate-700">{((meta.page - 1) * meta.limit) + 1}</span> to{' '}
                            <span className="font-medium text-slate-700">{Math.min(meta.page * meta.limit, meta.total)}</span> of{' '}
                            <span className="font-medium text-slate-700">{meta.total}</span> appointments
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-500">
                                Page {meta.page} of {meta.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page >= meta.totalPages}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};