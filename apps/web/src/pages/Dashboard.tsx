import type { FC } from 'react';
import { UserPlus, FileText, Send, Calendar, Users, CheckCircle, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, Riya</h1>
                <p className="text-slate-500 mt-1">Here is what's happening at the diagnostic center today.</p>
            </div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">⚡</span>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                        onClick={() => navigate('/patients/new')}
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

                    <button 
                        onClick={() => navigate('/billing/new')}
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

                    <button 
                        onClick={() => navigate('/reports')}
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

            {/* Today's Overview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mr-2">📊</span>
                        Today's Overview
                    </h2>
                    <button className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                        View Detailed Analytics
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Calendar size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-bold text-slate-800">42</div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Total Booked</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-bold text-slate-800">08</div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Waiting Room</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-bold text-slate-800">25</div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Completed</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-0 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary-dark flex items-center justify-center">
                                <CreditCard size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-bold text-slate-800">32,500 <span className="text-lg font-semibold text-slate-500">BDT</span></div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Collection</div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};
