import React from 'react';

export const DetailsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-pulse max-w-4xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div>
                        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
                        <div className="h-4 w-24 bg-slate-200 rounded-lg" />
                    </div>
                </div>
                <div className="w-24 h-10 bg-slate-200 rounded-xl" />
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
                <div className="flex items-center space-x-5 mb-8">
                    <div className="w-20 h-20 bg-slate-200 rounded-2xl" />
                    <div>
                        <div className="h-8 w-64 bg-slate-200 rounded-lg mb-3" />
                        <div className="h-5 w-32 bg-slate-200 rounded-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                            <div className="h-5 w-24 bg-slate-200 rounded-lg mb-2" />
                            <div className="h-12 w-full bg-slate-100 rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i}>
                            <div className="h-5 w-24 bg-slate-200 rounded-lg mb-2" />
                            <div className="h-5 w-40 bg-slate-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
