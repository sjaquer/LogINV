'use client';
import { MapPin, Layers, Check, AlertTriangle } from 'lucide-react';
import { UBICACIONES } from '@/context/LocationContext';
import { StockBar } from '@/components/ui/SharedComponents';
import ProductThumb from '@/components/ui/ProductThumb';

const ESTADO_BADGE = {
    OPTIMO: 'bg-emerald-500/90 text-white border-emerald-400/40',
    DESGASTADO: 'bg-amber-500/90 text-white border-amber-400/40',
    NECESITA_MANTENIMIENTO: 'bg-rose-500/90 text-white border-rose-400/40',
};

const ESTADO_LABEL = {
    OPTIMO: 'Óptimo',
    DESGASTADO: 'Desgastado',
    NECESITA_MANTENIMIENTO: 'Mantenimiento',
};

export default function ProductCard({
    producto,
    isGeneral,
    onView,
    selectMode,
    selected,
    onToggleSelect,
    catIcon,
}) {
    const ubicInfo = UBICACIONES.find(u => u.id === producto.ubicacion);
    const bajoStock = producto.stock_actual <= (producto.stock_minimo ?? 0);

    const handleClick = () => {
        if (selectMode) {
            onToggleSelect(producto);
        } else {
            onView(producto);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            className={`group cursor-pointer text-left bg-white dark:bg-[#0d0d10] border rounded-2xl transition-all duration-300 flex flex-col h-full overflow-hidden relative shadow-xs hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
                selected
                    ? 'border-brand-500 ring-2 ring-brand-300 dark:ring-brand-700 shadow-md'
                    : bajoStock
                        ? 'border-amber-300/80 dark:border-amber-700/60 hover:border-amber-400'
                        : 'border-slate-200/90 dark:border-[#222226] hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
            {/* ── Contenedor visual destacado (Banner de imagen) ── */}
            <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
                <ProductThumb
                    url={producto.imagen_url}
                    size="card"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Sutil viñeta gradiente para legibilidad de los badges flotantes */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/35 pointer-events-none transition-opacity duration-300 group-hover:opacity-90" />

                {/* Badge Categoría (Top-Left) */}
                <span className="absolute top-2.5 left-2.5 z-10 max-w-[62%] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/60 dark:bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-xs truncate flex items-center gap-1">
                    {catIcon && <span className="text-xs">{catIcon}</span>}
                    <span className="truncate">{producto.categoria}</span>
                </span>

                {/* Modo selección: Checkbox flotante (Top-Right) */}
                {selectMode ? (
                    <span
                        className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-20 shadow-md transition-transform active:scale-95 ${
                            selected
                                ? 'bg-brand-600 border-white text-white'
                                : 'bg-black/50 border-white/70 backdrop-blur-md text-transparent'
                        }`}
                    >
                        <Check size={13} strokeWidth={3} className={selected ? 'text-white' : 'hidden'} />
                    </span>
                ) : (
                    /* Badge Estado (Top-Right) */
                    producto.estado && (
                        <span
                            className={`absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md border shadow-xs ${
                                ESTADO_BADGE[producto.estado] || 'bg-black/60 text-white border-white/15'
                            }`}
                        >
                            {ESTADO_LABEL[producto.estado] || producto.estado}
                        </span>
                    )
                )}

                {/* Aviso Stock Bajo en imagen (Bottom-Right) */}
                {bajoStock && (
                    <span className="absolute bottom-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/95 text-white backdrop-blur-md shadow-xs flex items-center gap-1 border border-amber-300/30">
                        <AlertTriangle size={11} className="flex-shrink-0" />
                        <span>Stock bajo</span>
                    </span>
                )}
            </div>

            {/* ── Cuerpo de la tarjeta ── */}
            <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
                {/* Nombre del producto */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-sm leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {producto.nombre}
                    </h4>
                </div>

                {/* Ubicación y Responsabilidad */}
                <div className="space-y-1">
                    {(isGeneral || ubicInfo) && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 min-w-0">
                            <MapPin size={13} className="flex-shrink-0 text-brand-600 dark:text-brand-400" />
                            <span className="truncate font-medium">
                                {ubicInfo ? `${ubicInfo.icono} ${ubicInfo.nombre}` : (producto.ubicacion || 'Sin ubicación')}
                            </span>
                        </div>
                    )}
                    {producto.responsabilidad && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 min-w-0">
                            <Layers size={12} className="flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                            <span className="truncate">{producto.responsabilidad}</span>
                        </div>
                    )}
                </div>

                {/* Footer de Stock */}
                <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1">
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">
                                {producto.stock_actual}
                            </span>
                            <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                                {producto.unidad || 'uds'}
                            </span>
                        </div>
                        {producto.stock_minimo > 0 && (
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                                mín: {producto.stock_minimo}
                            </span>
                        )}
                    </div>
                    <StockBar actual={producto.stock_actual} minimo={producto.stock_minimo} />
                </div>
            </div>
        </div>
    );
}
