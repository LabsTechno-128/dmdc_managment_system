import React from 'react';

export const NavbarSkeleton: React.FC = () => {
    return (
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md shadow-sm">
            {/* Mobile Logo Skeleton */}
            <div className="md:hidden w-16 h-6 bg-slate-200 rounded animate-pulse"></div>

            <div className="hidden md:block"></div>

            <div className="flex items-center space-x-6 animate-pulse">
                {/* Date Badge Skeleton */}
                <div className="hidden h-7 w-32 rounded-full bg-slate-200 sm:block"></div>

                {/* User Profile Skeleton */}
                <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-slate-200"></div>
                    <div className="hidden text-left sm:block space-y-2 pr-2">
                        <div className="h-3 w-24 rounded bg-slate-200"></div>
                        <div className="h-2 w-16 rounded bg-slate-100"></div>
                    </div>
                </div>
            </div>
        </header>
    );
};
