import type { FC } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Activity,
    ClipboardList,
    Settings,
    Stethoscope,
    ScrollText,
    CalendarClock,
    FlaskConical,
    Receipt,
    LogOut
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';

export const UserRole = {
    ADMIN: 'admin',
    RECEPTIONIST: 'receptionist',
    DOCTOR: 'doctor',
    LAB_TECHNICIAN: 'lab_technician',
    ACCOUNTANT: 'accountant',
    PHARMACIST: 'pharmacist',
} as const;

export type UserRoleType =
    (typeof UserRole)[keyof typeof UserRole];

// const ALL_ROLES: UserRoleType[] = Object.values(UserRole);
// const RECEPTIONIST_ROLE: UserRoleType[] = [UserRole.RECEPTIONIST];
// const DOCTOR_ROLE: UserRoleType[] = [UserRole.DOCTOR];
// const LAB_TECHNICIAN_ROLE: UserRoleType[] = [UserRole.LAB_TECHNICIAN];
// const ACCOUNTANT_ROLE: UserRoleType[] = [UserRole.ACCOUNTANT];
// const PHARMACIST_ROLE: UserRoleType[] = [UserRole.PHARMACIST];

interface NavItem {
    label: string;
    path: string;
    icon: FC<{ className?: string }>;
    role?: UserRoleType[];
}

const ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,

    },
    {
        label: 'Patients',
        path: '/patients',
        icon: Users,

    },
    {
        label: 'Lab Test',
        path: '/lab-test',
        icon: FlaskConical,

    },
    {
        label: 'Billing',
        path: '/billing',
        icon: Receipt,

    },
    {
        label: 'Test Counter',
        path: '/test-counter',
        icon: Activity,

    },
    {
        label: 'Reports',
        path: '/reports',
        icon: ClipboardList,

    },
    {
        label: 'Doctors',
        path: '/doctors',
        icon: Stethoscope,

    },
    {
        label: 'Appointments',
        path: '/appointments',
        icon: CalendarClock,
    },
    {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
    },
    {
        label: 'Terms & Conditions',
        path: '/terms-and-conditions',
        icon: ScrollText,
    },
];

export const Sidebar: FC = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate()
    if (!user) {
        return null;
    }

    const role = user.role as UserRoleType;

    const NAV_ITEMS =
        role === UserRole.ADMIN
            ? ITEMS
            : ITEMS.filter((item) => {
                if (!item.role) {
                    return true;
                }
                return item.role.includes(role);
            });
    const handleLogout = () => {
        localStorage.removeItem("auth-storage")
        window.location.reload()
        navigate('/login')
    }
    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Logo / Brand */}
            <div className="flex items-center px-6 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white font-black shadow-inner shadow-white/20">
                        DP
                    </div>

                    <div>
                        <h1 className="text-[17px] font-black text-slate-900 tracking-tight">
                            Diagnostic Pro
                        </h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Center
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `group flex items-center space-x-3 rounded-xl px-4 py-3 transition-all duration-200 active:scale-95 ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100 ring-1 ring-blue-500/10'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className={`h-[18px] w-[18px] transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className={`text-sm ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 p-4 w-full">
                <button 
                    onClick={() => handleLogout()}
                    className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 border border-transparent hover:border-red-100"
                >
                    <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};