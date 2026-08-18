import type { FC } from 'react';
import { UserPlus, FileText, Send, Calendar, Users, CheckCircle, CreditCard, ChevronRight, TrendingUp, Stethoscope, Clock, Activity, FileDigit, BadgeDollarSign, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardSkeleton } from '../components/skeleton/DashboardSkeleton';

const fetchStats = async () => {
    const { data } = await api.get('/dashboard/stats');
    return data;
};

export const Dashboard: FC = () => {
    const navigate = useNavigate();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchStats,
        refetchInterval: 60000, // Refetch every minute
    });

    const displayStats = stats || {
        totalBooked: 0,
        waitingRoom: 0,
        completed: 0,
        collection: 0,
        thisMonthIncome: 0,
        lastMonthIncome: 0,
        completePatientBillingCount: 0,
        unpaidBillingCount: 0,
        partialBillingCount: 0,
        totalDoctor: 0,
        totalPatient: 0,
        totalAppointment: 0,
        lastMonthAppointment: 0,
        thisMonthAppointment: 0,
        userListCount: 0
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
                <p className="text-slate-500 mt-1">Here is what's happening at the diagnostic center today.</p>
            </div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">⚡</span>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => navigate('/patients/new')}
                        className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-primary hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800 text-lg">New Patient</div>
                                <div className="text-sm text-slate-500 mt-0.5">Register a new patient</div>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" />
                    </button>

                    <button onClick={() => navigate('/billing/new')}
                        className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-secondary hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800 text-lg">New Billing</div>
                                <div className="text-sm text-slate-500 mt-0.5">Create a new invoice</div>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-secondary transition-colors" />
                    </button>

                    <button onClick={() => navigate('/reports')}
                        className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Send size={24} />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800 text-lg">Deliver Report</div>
                                <div className="text-sm text-slate-500 mt-0.5">Search and deliver</div>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                </div>
            </section>

            {/* Income & Billing Analytics */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-2">💰</span>
                        Income & Billing Analytics
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-0 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary-dark flex items-center justify-center">
                                <CreditCard size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-2xl font-bold text-slate-800">
                                {Number(displayStats.collection).toLocaleString()} <span className="text-sm font-semibold text-slate-500">BDT</span>
                            </div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Today's Collection</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-2xl font-bold text-slate-800">
                                {Number(displayStats.thisMonthIncome).toLocaleString()} <span className="text-sm font-semibold text-slate-500">BDT</span>
                            </div>
                            <div className="text-sm font-medium text-slate-500 mt-1">This Month Income</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full -z-0 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                <BadgeDollarSign size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-2xl font-bold text-slate-800">
                                {Number(displayStats.lastMonthIncome).toLocaleString()} <span className="text-sm font-semibold text-slate-500">BDT</span>
                            </div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Last Month Income</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500 flex items-center"><CheckCircle size={14} className="mr-1 text-emerald-500"/> Paid Bills</span>
                                <span className="font-bold text-slate-700">{displayStats.completePatientBillingCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500 flex items-center"><FileDigit size={14} className="mr-1 text-amber-500"/> Partial Bills</span>
                                <span className="font-bold text-slate-700">{displayStats.partialBillingCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500 flex items-center"><Activity size={14} className="mr-1 text-red-500"/> Unpaid Bills</span>
                                <span className="font-bold text-slate-700">{displayStats.unpaidBillingCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Operations & Staff */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">🏥</span>
                        Operations & Staff
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{displayStats.totalPatient}</div>
                            <div className="text-sm font-medium text-slate-500">Total Patients</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{displayStats.totalDoctor}</div>
                            <div className="text-sm font-medium text-slate-500">Total Doctors</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                            <UserCog size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{displayStats.userListCount}</div>
                            <div className="text-sm font-medium text-slate-500">Total System Users</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Appointment & Order Analytics */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-2">📅</span>
                        Appointments & Orders
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                            <Calendar size={18} className="text-blue-500" />
                            <span className="font-medium text-slate-600">Total Appointments</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{displayStats.totalAppointment}</div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                            <Clock size={18} className="text-emerald-500" />
                            <span className="font-medium text-slate-600">This Month Appts</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{displayStats.thisMonthAppointment}</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                            <Clock size={18} className="text-slate-400" />
                            <span className="font-medium text-slate-600">Last Month Appts</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{displayStats.lastMonthAppointment}</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Today Booked</span>
                                <span className="font-bold text-slate-700">{displayStats.totalBooked}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Waiting Room</span>
                                <span className="font-bold text-slate-700">{displayStats.waitingRoom}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Today Completed</span>
                                <span className="font-bold text-slate-700">{displayStats.completed}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
