'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ArrowLeftRight,
    Hotel,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const NAV_ITEMS = [
        { href: '/', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/inventario', label: t('inventario'), icon: Package },
        { href: '/compras', label: t('compras'), icon: ShoppingCart },
        { href: '/mermas', label: t('mermas'), icon: ArrowLeftRight },
    ];

    return (
        <>
            {/* Mobile toggle button */}
            <button
                className="fixed top-4 left-4 z-50 lg:hidden glass-card p-2 rounded-xl"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full flex flex-col bg-dark border-r border-glass shadow-xl transition-all duration-300',
                    collapsed ? 'w-[72px]' : 'w-64',
                    // Mobile: slide in/out
                    'lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/5', collapsed && 'justify-center px-2')}>
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-gradient shadow-glow rounded-2xl flex items-center justify-center">
                        <Hotel size={18} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="font-bold text-white tracking-wide leading-tight">LogINV</p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em]">Hospitality Ops</p>
                        </div>
                    )}
                </div>

                {/* Nav links */}
                <nav className="flex-1 flex flex-col gap-1.5 p-3 overflow-y-auto">
                    {!collapsed && (
                        <div className="px-2 pb-1">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">{t('menu')}</p>
                        </div>
                    )}
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className={cn('nav-link', isActive && 'active', collapsed && 'justify-center px-2')}
                                title={collapsed ? label : undefined}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className={cn('flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center', isActive && 'bg-white/10 border-transparent shadow-glow')}>
                                    <Icon size={18} />
                                </span>
                                {!collapsed && <span className="flex-1 text-left">{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle (desktop only) */}
                <button
                    className="hidden lg:flex items-center justify-center p-4 border-t border-glass hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </aside>
        </>
    );
}

export function useSidebarWidth() {
    return 'lg:pl-64';
}
