'use client';
import { MapPin, Layers } from 'lucide-react';
import { UBICACIONES } from '@/context/LocationContext';
import { StockBar } from '@/components/ui/SharedComponents';

const ESTADO_BADGE = {
    OPTIMO: 'bg-emerald-100 text-emerald-700',
    DESGASTADO: 'bg-amber-100 text-amber-700',
    NECESITA_MANTENIMIENTO: 'bg-red-100 text-red-700',
};

const ESTADO_LABEL = {
    OPTIMO: 'Óptimo',
    DESGASTADO: 'Desgastado',
    NECESITA_MANTENIMIENTO: 'Mantenimiento',
};

// Tile de bento grid: tarjeta compacta con la info nativa del inventario
// (ubicación completa, piso, responsable, estado). Un solo tap abre el
// visualizador de detalle completo (ProductDetailModal) con todas las
// acciones — mantiene la grilla densa y la observación rápida.
export default function ProductCard({ producto, catIcon, isGeneral, onView }) {
    const ubicInfo = UBICACIONES.find(u => u.id === producto.ubicacion);
    const bajoStock = producto.stock_actual <= (producto.stock_minimo ?? 0);

    return (
        <button
            onClick={() => onView(producto)}
            className={`group text-left bg-white border rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col h-full p-4 gap-2.5 ${bajoStock ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}
        >
            {/* Top: icon + estado */}
            <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                    {catIcon}
                </div>
                {producto.estado && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${ESTADO_BADGE[producto.estado] || 'bg-slate-100 text-slate-500'}`}>
                        {ESTADO_LABEL[producto.estado] || producto.estado}
                    </span>
                )}
            </div>

            {/* Nombre + categoría */}
            <div>
                <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">{producto.nombre}</p>
                <p className="text-[11px] font-semibold text-brand-600 uppercase mt-1 truncate">{producto.categoria}</p>
            </div>

            {/* Ubicación completa */}
            {(isGeneral || ubicInfo) && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin size={12} className="flex-shrink-0 text-slate-400" />
                    <span className="truncate">{ubicInfo?.icono} {ubicInfo?.nombre || producto.ubicacion}</span>
                    {producto.piso && <span className="text-slate-300">· {producto.piso}</span>}
                </div>
            )}

            {/* Responsable */}
            {producto.responsabilidad && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Layers size={12} className="flex-shrink-0 text-slate-400" />
                    <span className="truncate">{producto.responsabilidad}</span>
                </div>
            )}

            {/* Stock */}
            <div className="mt-auto pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{producto.stock_actual} <span className="text-slate-400 font-normal text-[11px]">{producto.unidad}</span></span>
                    {bajoStock && <span className="text-[10px] font-bold text-amber-600">Stock bajo</span>}
                </div>
                <StockBar actual={producto.stock_actual} minimo={producto.stock_minimo} />
            </div>
        </button>
    );
}
