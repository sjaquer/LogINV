'use client';
// Primitivas de maquetación compartidas por las páginas.
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Contenedor estándar del contenido de una página. */
export function PageBody({ children, className, width = 'max-w-6xl' }) {
    return (
        <div className={cn('flex-1 w-full mx-auto p-3 sm:p-6 lg:p-8 pb-6 space-y-4 sm:space-y-6 animate-fade-in', width, className)}>
            {children}
        </div>
    );
}

/** Tarjeta de sección con encabezado opcional. */
export function Section({ title, icon: Icon, actions, children, className, bodyClassName }) {
    return (
        <section className={cn('glass-panel', className)}>
            {(title || actions) && (
                <header className="panel-header">
                    <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800 min-w-0">
                        {Icon && <Icon size={18} className="text-brand-500 flex-shrink-0" aria-hidden="true" />}
                        <span className="truncate">{title}</span>
                    </h2>
                    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
                </header>
            )}
            <div className={bodyClassName}>{children}</div>
        </section>
    );
}

/** Pestañas segmentadas (con contador opcional). Desplazables en móvil. */
export function SegmentedTabs({ tabs, value, onChange, className }) {
    return (
        <div role="tablist" className={cn('flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-slate-100 p-1', className)}>
            {tabs.map(({ id, label, count, icon: Icon, tone }) => {
                const active = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(id)}
                        className={cn(
                            'flex flex-1 min-w-fit items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition',
                            active ? 'bg-surface text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                        )}
                    >
                        {Icon && <Icon size={15} aria-hidden="true" />}
                        {label}
                        {count != null && (
                            <span className={cn(
                                'min-w-[1.25rem] rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                                tone === 'danger' && count > 0 ? 'bg-rose-100 text-rose-700' : active ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600',
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/** Campo de búsqueda con botón para limpiar. */
export function SearchInput({ value, onChange, placeholder = 'Buscar…', className, autoFocus }) {
    return (
        <div className={cn('relative', className)}>
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
                type="search"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="inp pl-10 pr-9"
                aria-label={placeholder}
            />
            {value && (
                <button type="button" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600" aria-label="Limpiar búsqueda">
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
