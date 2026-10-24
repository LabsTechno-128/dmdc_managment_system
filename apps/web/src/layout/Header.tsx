import type { FC } from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

interface HeaderProps {
    onToggleMobileMenu?: () => void;
}

export const Header: FC<HeaderProps> = ({ onToggleMobileMenu }) => {
    const user = useAuthStore((state) => state.user);
    if (!user) return null;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="sticky top-0 z-30 flex h-16 sm:h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 sm:px-6 backdrop-blur-md shadow-sm transition-all">
            {/* Mobile Sidebar Toggle */}
            <div className="flex items-center gap-2 md:hidden">
                <button
                    onClick={onToggleMobileMenu}
                    type="button"
                    className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>
                <div className="flex items-center font-black text-blue-600 tracking-tight text-xl">
                    DMDC
                </div>
            </div>

            {/* Left side empty for Desktop as Logo is in Sidebar */}
            <div className="hidden md:block"></div>

            <div className="flex items-center space-x-6">
                <div className="hidden items-center rounded-full bg-slate-100/80 px-4 py-1.5 text-xs font-semibold text-slate-500 shadow-inner sm:flex">
                    {today}
                </div>

                <Link to="/profile" className="group flex cursor-pointer items-center space-x-2 sm:space-x-3 rounded-full border border-transparent p-1 transition-all hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm active:scale-95">
                    {
                        user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs sm:text-sm font-bold text-white shadow-inner">
                                {user.firstName?.charAt(0) || 'A'}
                            </div>
                        )

                    }
                    <div className="hidden text-left sm:block pr-2">
                        <div className="max-w-[120px] lg:max-w-[160px] truncate text-sm font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
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
