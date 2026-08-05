import type { FC } from 'react';
import { Bell } from 'lucide-react';

export const Header: FC = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-green-800 border-b border-slate-200 shadow-sm z-10">
            {/* Mobile Sidebar Toggle would go here if implemented, for now hidden on md */}
            <div className="flex md:hidden items-center font-bold text-primary-dark">
                Diagnostic Center Pro
            </div>

            {/* Left side empty for Desktop as Logo is in Sidebar */}
            <div className="hidden md:block"></div>

            <div className="flex items-center space-x-6">
                <div className="text-sm text-slate-500 font-medium hidden sm:block">
                    {today}
                </div>

                <button className="relative p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-slate-50">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary-dark font-semibold">
                        R
                    </div>
                    <div className="hidden sm:block text-left">
                        <div className="text-sm font-bold text-slate-800 leading-none">Riya</div>
                        <div className="text-xs text-slate-500 mt-1">Receptionist</div>
                    </div>
                </div>
            </div>
        </header>
    );
};
