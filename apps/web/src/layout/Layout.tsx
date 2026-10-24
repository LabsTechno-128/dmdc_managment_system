// import type { FC, ReactNode } from 'react';
// import { Sidebar } from './Sidebar';
// import { Header } from './Header';

// interface LayoutProps {
//     children: ReactNode;
// }

// const Layout: FC<LayoutProps> = ({ children }) => {
//     return (
//         <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
//             {/* Sidebar */}
//             <div className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
//                 <Sidebar />
//             </div>

//             {/* Main Content Area */}
//             <div className="flex flex-col flex-1 overflow-hidden">
//                 <Header />
//                 <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
//                     {children}
//                 </main>
//             </div>
//         </div>
//     );
// };

// export default Layout;


import { type FC, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ImpersonateBanner } from '../components/ImpersonateBanner';

const Layout: FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Drawer Content */}
                    <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
                        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <ImpersonateBanner />
                <Header onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-50 min-w-0">
                    {/* Outlet dynamically renders child routes (Dashboard, Patients, etc.) */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;