'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/SidebarContext';

export default function BottomNav() {
    const pathname = usePathname();
    const { hideBottomNav } = useSidebar();

    if (hideBottomNav) return null;

    const items = [
        { href: '/', label: 'Panel', icon: LayoutDashboard },
        { href: '/productos', label: 'Productos', icon: Package },
        { href: '/inventario', label: 'Inventario', icon: ClipboardList },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-stretch justify-around h-[60px]">
                {items.map(({ href, label, icon: Icon }) => {
                    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative',
                                isActive
                                    ? 'text-brand-600'
                                    : 'text-slate-400 active:text-slate-500'
                            )}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-brand-600 rounded-b-full" />
                            )}
                            <div className={cn(
                                'flex items-center justify-center w-10 h-8 rounded-xl transition-colors',
                                isActive && 'bg-brand-50'
                            )}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                            </div>
                            <span className={cn(
                                'text-[10px] leading-none',
                                isActive ? 'font-bold' : 'font-medium'
                            )}>{label}</span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area spacer for iOS notch devices */}
            <div className="pb-safe" />
        </nav>
    );
}
