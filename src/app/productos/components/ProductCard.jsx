'use client';
import { useState } from 'react';
import { Pencil, Trash2, Copy, MapPin, Tag, Layers } from 'lucide-react';
import { UBICACIONES } from '@/context/LocationContext';
import { StockBar } from '@/components/ui/SharedComponents';
import BarcodeLabelModal from '@/components/ui/BarcodeLabel';

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
// (ubicación completa, piso, responsable, estado) y acciones rápidas.
export default function ProductCard({ producto, catIcon, canManage, isGeneral, onEdit, onDelete, onDuplicate }) {
    const [showLabel, setShowLabel] = useState(false);
    const ubicInfo = UBICACIONES.find(u => u.id === producto.ubicacion);
    const bajoStock = producto.stock_actual <= (producto.stock_minimo ?? 0);

    return (
        <div className={`group relative bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col h-full ${bajoStock ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
            <div className="p-4 flex flex-col gap-2.5 flex-1">
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
                    <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{producto.nombre}</p>
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
            </div>

            {/* Acciones */}
            {canManage && !isGeneral && (
                <div className="flex items-center border-t border-slate-100">
                    <button onClick={() => onEdit(producto)} className="flex-1 py-2.5 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors rounded-bl-2xl" aria-label="Editar">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => setShowLabel(true)} className="flex-1 py-2.5 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border-l border-slate-100" aria-label="Etiqueta">
                        <Tag size={16} />
                    </button>
                    <button onClick={() => onDuplicate(producto)} className="flex-1 py-2.5 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors border-l border-slate-100" aria-label="Duplicar">
                        <Copy size={16} />
                    </button>
                    <button onClick={() => onDelete(producto)} className="flex-1 py-2.5 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-slate-100 rounded-br-2xl" aria-label="Eliminar">
                        <Trash2 size={16} />
                    </button>
                </div>
            )}

            {showLabel && (
                <BarcodeLabelModal
                    producto={{ ...producto, ubicacion_nombre: ubicInfo?.nombre }}
                    onClose={() => setShowLabel(false)}
                />
            )}
        </div>
    );
}
