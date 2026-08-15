import React from 'react';

export const FormSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse space-y-6">
            {/* Form Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                    <div>
                        <div className="h-5 bg-slate-200 rounded w-40 mb-1"></div>
                        <div className="h-3 bg-slate-100 rounded w-64"></div>
                    </div>
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
            </div>

            {/* Form Fields Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                            <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                        </div>
                    ))}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                        <div className="h-32 bg-slate-100 rounded-xl w-full"></div>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
                    <div className="h-10 bg-slate-300 rounded-xl w-32"></div>
                </div>
            </div>
        </div>
    );
};
