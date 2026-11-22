'use client';
import { MapPin, Check, ChevronRight } from 'lucide-react';
import { StockBar } from '@/components/ui/SharedComponents';
import ProductThumb from '@/components/ui/ProductThumb';
import { getLocationInfo } from '@/context/LocationContext';
import { isLowStock } from '@/lib/stock';
import { cn } from '@/lib/utils';

/** Fila compacta de producto (vista de lista). */
export default function ProductListRow({ producto: p, catIcon, selectMode, selected, onActivate }) {
    const loc = getLocationInfo(p.ubicacion);
    const low = isLowStock(p);
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onActivate(p)}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(p); }
            }}
            aria-pressed={selectMode ? selected : undefined}
            className={cn('flex cursor-pointer items-center gap-3 p-3 sm:gap-4 sm:p-4 transition-colors hover:bg-slate-50', selected && 'bg-brand-50')}
        >
            {selectMode && (
                <span className={cn('flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>
                    {selected && <Check size={11} strokeWidth={3} />}
                </span>
            )}
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-16 sm:w-16">
                <ProductThumb url={p.imagen_url} size="card" icon={catIcon ? <span className="text-xl">{catIcon}</span> : undefined} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{p.categoria}</span>
                    {low && <span className="text-[10px] font-bold text-amber-700">Bajo mínimo</span>}
                </div>
                <h3 className="truncate text-sm font-bold leading-snug text-slate-900 sm:text-base">{p.nombre}</h3>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <MapPin size={12} className="flex-shrink-0 text-brand-500" />
                    <span className="truncate">{loc?.icono} {loc?.nombre || p.ubicacion}</span>
                </p>
            </div>
            <div className="min-w-[72px] flex-shrink-0 text-right sm:min-w-[110px]">
                <p className="text-base font-bold text-slate-900 tabular-nums sm:text-lg">
                    {p.stock_actual} <span className="text-xs font-normal text-slate-400">{p.unidad || 'uds'}</span>
                </p>
                <div className="ml-auto mt-1 hidden w-28 sm:block"><StockBar actual={p.stock_actual} minimo={p.stock_minimo} /></div>
            </div>
            <ChevronRight size={18} className="hidden flex-shrink-0 text-slate-300 sm:block" />
        </div>
    );
}
