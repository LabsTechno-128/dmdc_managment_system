import type { FC, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';


interface LayoutProps {
    children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
};
