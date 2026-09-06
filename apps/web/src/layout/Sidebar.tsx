import { type FC, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Activity,
    ClipboardList,
    Settings,
    Stethoscope,
    CalendarClock,
    FlaskConical,
    Receipt,
    LogOut,
    Wallet,
    Package,
    CreditCard,
    Contact,
    Fingerprint,
    Coins,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';

export const UserRole = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    RECEPTIONIST: 'receptionist',
    DOCTOR: 'doctor',
    LAB_TECHNICIAN: 'lab_technician',
    ACCOUNTANT: 'accountant',
    PHARMACIST: 'pharmacist',
    USG_REPORT: 'usg_report',
    XRAY_REPORT: 'xray_report',
    SAMPLE_COLLECTION: 'sample_collection',
} as const;

export type UserRoleType =
    (typeof UserRole)[keyof typeof UserRole];

interface NavItem {
    label: string;
    path?: string;
    icon: FC<{ className?: string }>;
    role?: UserRoleType[];
    children?: NavItem[];
}

const ITEMS: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    {
        label: 'Patients & Billing',
        icon: Users,
        role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST],
        children: [
            { label: 'Appointments', path: '/appointments', icon: CalendarClock, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST] },
            { label: "Patient's List", path: '/patients', icon: Users, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST] },
            { label: "Patient's Billing", path: '/billing', icon: Receipt, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST] },
            { label: "Patient's Reports", path: '/reports', icon: ClipboardList, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST] },
        ]
    },
    {
        label: 'Medical & Laboratory',
        icon: Stethoscope,
        role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION],
        children: [
            { label: "Doctor's List", path: '/doctors', icon: Stethoscope, role: [UserRole.SUPER_ADMIN] },
            { label: "Doctor's Fee", path: '/doctors-fee', icon: CreditCard, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST] },
            { label: 'Tests List', path: '/lab-test', icon: FlaskConical, role: [UserRole.SUPER_ADMIN] },
            { label: "Patient's Serial for Test", path: '/test-counter', icon: Activity, role: [UserRole.LAB_TECHNICIAN] },
            { label: 'Sample Collection', path: '/sample-collection', icon: FlaskConical, role: [UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION] },
            { label: 'Re-agents & Sample Pots', path: '/reagents', icon: FlaskConical, role: [UserRole.LAB_TECHNICIAN] },
        ]
    },
    {
        label: 'Inventory Management',
        icon: Package,
        role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION],
        children: [
            { label: 'Inventory Dashboard', path: '/inventory', icon: Package, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION] },
            { label: 'Inventory Items', path: '/inventory/items', icon: Package, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
            { label: 'Stock Entry (In)', path: '/inventory/stock-in', icon: Package, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
            { label: 'Stock Usage (Out)', path: '/inventory/stock-out', icon: Package, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION] },
            { label: 'Inventory Reports', path: '/inventory/reports', icon: ClipboardList, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION] },
        ]
    },
    {
        label: 'HR & Payroll',
        icon: Contact,
        role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST],
        children: [
            { label: 'Employees', path: '/employees', icon: Contact, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
            { label: 'Attendance', path: '/attendance', icon: Fingerprint, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST] },
            { label: 'Payroll', path: '/payroll', icon: Coins, role: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        ]
    },
    {
        label: 'System & Settings',
        icon: Settings,
        role: [UserRole.SUPER_ADMIN],
        children: [
            { label: 'Accounts', path: '/accounts', icon: Wallet, role: [UserRole.SUPER_ADMIN] },
            { label: "User's List", path: '/users', icon: Users, role: [UserRole.SUPER_ADMIN] },
            { label: 'Setting', path: '/settings', icon: Settings, role: [UserRole.SUPER_ADMIN] },
        ]
    }
];

export const Sidebar: FC = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    if (!user) {
        return null;
    }

    const role = user.role as UserRoleType;

    // Filter items based on user role recursively
    const filterItems = (items: NavItem[]): NavItem[] => {
        return items
            .filter((item) => !item.role || item.role.includes(role))
            .map((item) => ({
                ...item,
                children: item.children ? filterItems(item.children) : undefined,
            }))
            .filter((item) => !item.children || item.children.length > 0);
    };

    const NAV_ITEMS = filterItems(ITEMS);

    const toggleMenu = (label: string) => {
        setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const handleLogout = () => {
        localStorage.removeItem("auth-storage");
        window.location.reload();
        navigate('/login');
    };

    const isChildActive = (children?: NavItem[]) => {
        if (!children) return false;
        return children.some((child) => child.path && location.pathname === child.path);
    };

    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Logo / Brand */}
            <div className="flex items-center px-6 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-black shadow-inner shadow-white/20">
                        <img src="/dmdc_logo.jpeg" alt="Logo" />
                    </div>

                    <div>
                        <h1 className="text-[17px] font-black text-slate-900 tracking-tight">
                            DMDC
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const hasChildren = item.children && item.children.length > 0;
                    const childActive = isChildActive(item.children);
                    const isOpen = openMenus[item.label] || childActive;

                    if (hasChildren) {
                        return (
                            <div key={item.label} className="space-y-1">
                                <button
                                    onClick={() => toggleMenu(item.label)}
                                    className={`w-full group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${childActive
                                        ? 'bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-200/50'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Icon className={`h-[18px] w-[18px] transition-colors ${childActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                        <span className={`text-sm ${childActive ? 'font-bold text-slate-800' : 'font-semibold'}`}>{item.label}</span>
                                    </div>
                                    {isOpen ? (
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                </button>

                                {isOpen && (
                                    <div className="pl-11 pr-2 space-y-1 py-1">
                                        {item.children!.map((child) => {
                                            const ChildIcon = child.icon;
                                            return (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path!}
                                                    className={({ isActive }) =>
                                                        `group flex items-center space-x-3 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-95 ${isActive
                                                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/10'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                        }`
                                                    }
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            <ChildIcon className={`h-4 w-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                                            <span className={`text-[13px] ${isActive ? 'font-bold' : 'font-medium'}`}>{child.label}</span>
                                                        </>
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path!}
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
                <button onClick={() => handleLogout()}
                    className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 border border-transparent hover:border-red-100"
                >
                    <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};