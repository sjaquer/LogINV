'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useSidebar } from '@/context/SidebarContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ArrowLeftRight,
    Wheat,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { collapsed, setCollapsed } = useSidebar();
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
                className="fixed top-3.5 left-3 z-[60] lg:hidden bg-white border border-slate-200 p-2.5 rounded-xl shadow-md text-slate-600 hover:text-brand-600 hover:bg-slate-50 active:scale-95 transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-[55] bg-slate-900/30 backdrop-blur-sm lg:hidden transition-all"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-[58] h-full flex flex-col bg-white border-r border-slate-200 shadow-xl lg:shadow-none transition-all duration-300',
                    collapsed ? 'w-[72px]' : 'w-64',
                    'lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
                style={{ height: '100dvh' }}
            >
                {/* Logo */}
                <div className={cn('flex items-center gap-3 px-6 py-6 border-b border-slate-100', collapsed && 'justify-center px-2')}>
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/20">
                        <Wheat size={20} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="font-bold text-slate-800 tracking-tight leading-tight text-lg">LOG-INV</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Gestión de Stock</p>
                        </div>
                    )}
                </div>

                {/* Nav links */}
                <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                    {!collapsed && (
                        <div className="px-2 py-2 mb-2">
                            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{t('menu')}</p>
                        </div>
                    )}
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                                    isActive 
                                        ? 'text-brand-700 bg-brand-50' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                                    collapsed && 'justify-center px-2'
                                )}
                                title={collapsed ? label : undefined}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className={cn(
                                    'transition-colors duration-200',
                                    isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                                )}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </span>
                                {!collapsed && <span className="flex-1 text-left">{label}</span>}
                                {isActive && !collapsed && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-600 rounded-l-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle (desktop only) */}
                <div className="hidden lg:flex p-4 border-t border-slate-100">
                    <button
                        className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {collapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2"><ChevronLeft size={20} /><span className="text-xs font-medium">Colapsar</span></div>}
                    </button>
                </div>
            </aside>
        </>
    );
}
