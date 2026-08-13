import type { FC } from 'react';
// import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

export const Header: FC = () => {
    const user = useAuthStore((state) => state.user);
    console.log(user, "-------------------->>>>");
    if (!user) return null;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md shadow-sm transition-all">
            {/* Mobile Sidebar Toggle would go here if implemented, for now hidden on md */}
            <div className="flex items-center font-black text-blue-600 tracking-tight text-xl md:hidden">
                DMDC
            </div>

            {/* Left side empty for Desktop as Logo is in Sidebar */}
            <div className="hidden md:block"></div>

            <div className="flex items-center space-x-6">
                <div className="hidden items-center rounded-full bg-slate-100/80 px-4 py-1.5 text-xs font-semibold text-slate-500 shadow-inner sm:flex">
                    {today}
                </div>

                <Link to="/profile" className="group flex cursor-pointer items-center space-x-3 rounded-full border border-transparent p-1 transition-all hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm active:scale-95">
                    {
                        user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-inner">
                                {user.firstName?.charAt(0) || 'A'}
                            </div>
                        )

                    }
                    <div className="hidden text-left sm:block pr-2">
                        <div className="w-24 truncate text-sm font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                            {user.firstName + " " + user.lastName}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                            {user.role}
                        </div>
                    </div>
                </Link>
            </div>
        </header>
    );
};
