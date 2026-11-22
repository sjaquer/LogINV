'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NAV_GROUPS, navItemsFor, bottomNavFor, isActivePath } from '@/lib/navigation';
import { ROLES } from '@/lib/constants';

const THEME = { light: { Icon: Sun, label: 'Claro' }, dark: { Icon: Moon, label: 'Oscuro' }, auto: { Icon: Monitor, label: 'Automático' } };

// Hoja inferior con todas las secciones (en móvil el menú lateral no se muestra).
function MoreSheet({ onClose }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { mode, setTheme } = useTheme();
    const items = navItemsFor(user?.rol);
    const groups = [...NAV_GROUPS, { id: 'ayuda', label: 'Ayuda' }]
        .map(g => ({ ...g, items: items.filter(i => i.group === g.id) }))
        .filter(g => g.items.length);

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Todas las secciones">
            <button type="button" className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-label="Cerrar menú" />
            <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface pb-safe shadow-2xl animate-slide-up">
                <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-5 pt-3 pb-2">
                    <span className="mx-auto h-1 w-10 rounded-full bg-slate-200 absolute left-1/2 -translate-x-1/2 top-2" aria-hidden="true" />
                    <div className="flex items-center gap-3 pt-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                            {(user?.nombre || '?')[0].toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{user?.nombre}</p>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{ROLES[user?.rol?.toUpperCase()]?.label || user?.rol}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="icon-btn mt-3" aria-label="Cerrar"><X size={20} /></button>
                </div>

                <div className="space-y-5 px-4 pb-4 pt-2">
                    {groups.map(g => (
                        <section key={g.id}>
                            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{g.label}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {g.items.map(({ href, short, icon: Icon }) => {
                                    const active = isActivePath(pathname, href);
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={onClose}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition active:scale-95',
                                                active ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600',
                                            )}
                                        >
                                            <Icon size={22} aria-hidden="true" />
                                            <span className="text-[11px] font-semibold leading-tight">{short}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    ))}

                    <section>
                        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Tema</p>
                        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                            {Object.entries(THEME).map(([key, { Icon, label }]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTheme(key)}
                                    aria-pressed={mode === key}
                                    className={cn(
                                        'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition',
                                        mode === key ? 'bg-surface text-slate-900 shadow-sm' : 'text-slate-500',
                                    )}
                                >
                                    <Icon size={14} /> {label}
                                </button>
                            ))}
                        </div>
                    </section>

                    <button type="button" onClick={logout} className="btn-danger w-full justify-center py-3 text-sm">
                        <LogOut size={16} /> Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BottomNav() {
    const pathname = usePathname();
    const { hideBottomNav } = useSidebar();
    const { user } = useAuth();
    const [moreOpen, setMoreOpen] = useState(false);
    const closeMore = useCallback(() => setMoreOpen(false), []);
    const items = bottomNavFor(user?.rol);
    const inMore = !items.some(i => isActivePath(pathname, i.href));

    if (hideBottomNav) return null;

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]" aria-label="Navegación">
                <div className="flex items-stretch justify-around h-[62px]">
                    {items.map(({ href, short, icon: Icon }) => {
                        const active = isActivePath(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={cn('relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors', active ? 'text-brand-600' : 'text-slate-400')}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {active && <span className="absolute top-0 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-b-full bg-brand-600" />}
                                <span className={cn('flex h-8 w-11 items-center justify-center rounded-xl', active && 'bg-brand-50')}>
                                    <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                                </span>
                                <span className={cn('text-[10px] leading-none', active ? 'font-bold' : 'font-medium')}>{short}</span>
                            </Link>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => setMoreOpen(true)}
                        aria-haspopup="dialog"
                        aria-expanded={moreOpen}
                        className={cn('relative flex flex-1 flex-col items-center justify-center gap-0.5', inMore ? 'text-brand-600' : 'text-slate-400')}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {inMore && <span className="absolute top-0 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-b-full bg-brand-600" />}
                        <span className={cn('flex h-8 w-11 items-center justify-center rounded-xl', inMore && 'bg-brand-50')}>
                            <Menu size={21} />
                        </span>
                        <span className={cn('text-[10px] leading-none', inMore ? 'font-bold' : 'font-medium')}>Más</span>
                    </button>
                </div>
                <div className="pb-safe" />
            </nav>
            {moreOpen && <MoreSheet onClose={closeMore} />}
        </>
    );
}
