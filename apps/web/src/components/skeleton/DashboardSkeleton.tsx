import React from 'react';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header */}
            <div>
                <div className="h-7 bg-slate-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-72"></div>
            </div>

            {/* Quick Actions */}
            <section>
                <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                                    <div className="h-3 bg-slate-100 rounded w-32"></div>
                                </div>
                            </div>
                            <div className="w-4 h-4 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Today's Overview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 bg-slate-200 rounded w-40"></div>
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 h-32 flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
                            <div className="space-y-2">
                                <div className="h-8 bg-slate-200 rounded w-16"></div>
                                <div className="h-3 bg-slate-100 rounded w-24"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* Charts/Tables Area (if any) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white border border-slate-200 rounded-2xl h-80 p-5">
                     <div className="h-5 bg-slate-200 rounded w-48 mb-6"></div>
                     <div className="h-56 bg-slate-100 rounded-xl w-full"></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl h-80 p-5">
                     <div className="h-5 bg-slate-200 rounded w-48 mb-6"></div>
                     <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                           <div key={idx} className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                   <div className="h-3 bg-slate-100 rounded w-24"></div>
                               </div>
                               <div className="h-3 bg-slate-200 rounded w-12"></div>
                           </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};
