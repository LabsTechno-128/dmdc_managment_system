import React from 'react';
import { PackageOpen } from 'lucide-react';

export const Placeholder: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <PackageOpen size={40} />
            </div>
            <div className="max-w-md space-y-1">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-sm text-slate-500">
                    This module is currently under construction. Please check back later.
                </p>
            </div>
        </div>
    );
};
