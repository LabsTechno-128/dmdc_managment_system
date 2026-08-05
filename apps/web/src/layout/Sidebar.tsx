import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    Activity,
    ClipboardList,
    Settings,
    Stethoscope,
    ScrollText,
    CalendarClock
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Billing', path: '/billing', icon: FileText },
    { label: 'Test Counter', path: '/test-counter', icon: Activity },
    { label: 'Reports', path: '/reports', icon: ClipboardList },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope },
    { label: 'Appointments', path: '/appointments', icon: CalendarClock },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Terms & Conditions', path: '/terms-and-conditions', icon: ScrollText },
];

export const Sidebar: FC = () => {
    return (
        <div className="h-full flex flex-col bg-white">
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
                <div className="flex items-center space-x-2 text-primary-dark">
                    <Activity className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg tracking-tight">Diagnostic Pro</span>
                </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary/10 text-primary-dark font-semibold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="p-4 border-t border-slate-200">
                <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-xl text-white shadow-md">
                    <div className="text-xs font-semibold opacity-90 mb-1">PRO PLAN</div>
                    <div className="text-sm font-medium">All systems operational</div>
                </div>
            </div>
        </div>
    );
};
