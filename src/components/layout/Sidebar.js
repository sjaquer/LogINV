'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { NAV_GROUPS, navItemsFor, isActivePath } from '@/lib/navigation';
import { ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, setCollapsed } = useSidebar();
    const { user } = useAuth();
    const items = navItemsFor(user?.rol);
    const groups = [...NAV_GROUPS, { id: 'ayuda', label: null }]
        .map(g => ({ ...g, items: items.filter(i => i.group === g.id) }))
        .filter(g => g.items.length);

    return (
        <aside
            className={cn(
                'fixed top-0 left-0 z-[58] h-[100dvh] flex-col bg-surface border-r border-slate-200 transition-[width] duration-300 hidden lg:flex',
                collapsed ? 'w-[72px]' : 'w-64',
            )}
            aria-label="Navegación principal"
        >
            {/* Marca */}
            <div className={cn('flex items-center gap-3 h-[72px] px-5 border-b border-slate-100', collapsed && 'justify-center px-2')}>
                <img src="/icons/logo-mark.png" alt="" width={40} height={40} className="flex-shrink-0 w-10 h-10 rounded-full shadow-md shadow-brand-500/25" />
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="font-bold text-slate-900 tracking-tight leading-tight text-lg">Log<span className="text-brand-600">INV</span></p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">Iglesia Alianza CNC</p>
                    </div>
                )}
            </div>

            {/* Secciones */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {groups.map(group => (
                    <div key={group.id}>
                        {group.label && !collapsed && (
                            <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.12em] text-slate-400 font-bold">{group.label}</p>
                        )}
                        {group.label && collapsed && <div className="mx-3 mb-2 border-t border-slate-100" />}
                        <ul className="space-y-0.5">
                            {group.items.map(({ href, label, icon: Icon }) => {
                                const active = isActivePath(pathname, href);
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            title={collapsed ? label : undefined}
                                            aria-current={active ? 'page' : undefined}
                                            className={cn(
                                                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                                                collapsed && 'justify-center px-2',
                                            )}
                                        >
                                            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-600" aria-hidden="true" />}
                                            <Icon size={19} strokeWidth={active ? 2.4 : 2} className={active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} aria-hidden="true" />
                                            {!collapsed && <span className="truncate">{label}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Cuenta + colapsar */}
            <div className="border-t border-slate-100 p-3 space-y-2">
                {!collapsed && user && (
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                            {(user.nombre || '?')[0].toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800">{user.nombre}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{ROLES[user.rol?.toUpperCase()]?.label || user.rol}</p>
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                    {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Colapsar</>}
                </button>
            </div>
        </aside>
    );
}
