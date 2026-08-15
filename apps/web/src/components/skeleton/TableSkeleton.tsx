import React from 'react';

export const TableSkeleton: React.FC = () => {
    return (
        <div className="overflow-x-auto w-full animate-pulse">
            <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-4"><div className="h-3 bg-slate-200 rounded w-24"></div></th>
                        <th className="px-5 py-4"><div className="h-3 bg-slate-200 rounded w-32"></div></th>
                        <th className="px-5 py-4"><div className="h-3 bg-slate-200 rounded w-20"></div></th>
                        <th className="px-5 py-4"><div className="h-3 bg-slate-200 rounded w-28"></div></th>
                        <th className="px-5 py-4 text-right"><div className="h-3 bg-slate-200 rounded w-16 ml-auto"></div></th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-b border-slate-100">
                            <td className="px-5 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-slate-200 rounded w-32"></div>
                                        <div className="h-2 bg-slate-100 rounded w-20"></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <div className="space-y-2">
                                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                                    <div className="h-2 bg-slate-100 rounded w-32"></div>
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <div className="space-y-2">
                                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <div className="h-3 bg-slate-200 rounded w-16"></div>
                            </td>
                            <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
                <div className="h-3 bg-slate-200 rounded w-32"></div>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                </div>
            </div>
        </div>
    );
};
