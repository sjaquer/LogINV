'use client';
import { useSidebar } from '@/context/SidebarContext';

export default function MainContent({ children }) {
    const { collapsed } = useSidebar();
    return (
        <main
            className={`flex-1 flex flex-col transition-all duration-300 min-w-0 bg-slate-50/50 w-full overflow-x-hidden ${
                collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
            }`}
        >
            {children}
        </main>
    );
}
