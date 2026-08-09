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
    CalendarClock,
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

const ALL_ROLES: UserRoleType[] = Object.values(UserRole);
const RECEPTIONIST_ROLE: UserRoleType[] = [UserRole.RECEPTIONIST];
const DOCTOR_ROLE: UserRoleType[] = [UserRole.DOCTOR];
const LAB_TECHNICIAN_ROLE: UserRoleType[] = [UserRole.LAB_TECHNICIAN];
const ACCOUNTANT_ROLE: UserRoleType[] = [UserRole.ACCOUNTANT];
const PHARMACIST_ROLE: UserRoleType[] = [UserRole.PHARMACIST];

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
        role: RECEPTIONIST_ROLE,
    },
    {
        label: 'Patients',
        path: '/patients',
        icon: Users,
        role: ALL_ROLES,
    },
    {
        label: 'Billing',
        path: '/billing',
        icon: FileText,
        role: ALL_ROLES,
    },
    {
        label: 'Test Counter',
        path: '/test-counter',
        icon: Activity,
        role: ALL_ROLES,
    },
    {
        label: 'Reports',
        path: '/reports',
        icon: ClipboardList,
        role: ALL_ROLES,
    },
    {
        label: 'Doctors',
        path: '/doctors',
        icon: Stethoscope,
        role: DOCTOR_ROLE,
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

    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
            {/* Logo / Brand */}
            <div className="flex items-center px-6 py-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold">
                        DP
                    </div>

                    <div>
                        <h1 className="text-lg font-bold text-slate-900">
                            Diagnostic Pro
                        </h1>
                        <p className="text-xs text-slate-500">
                            Diagnostic Center
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
                                `flex items-center space-x-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${isActive
                                    ? 'bg-primary/10 text-primary-dark font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                }`
                            }
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>

            {/* Bottom Plan Card */}
            <div className="border-t border-slate-200 p-4">
                <div className="rounded-xl bg-gradient-to-r from-primary to-secondary p-4 text-white shadow-md">
                    <div className="mb-1 text-xs font-semibold opacity-90">
                        PRO PLAN
                    </div>

                    <div className="text-sm font-medium">
                        All systems operational
                    </div>
                </div>
            </div>
        </div>
    );
};