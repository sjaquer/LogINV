'use client';
import { useState } from 'react';
import {
    X, Pencil, Trash2, Copy, Tag, MapPin, Layers,
    ClipboardList, StickyNote, Clock,
} from 'lucide-react';
import { UBICACIONES } from '@/context/LocationContext';
import { StockBar } from '@/components/ui/SharedComponents';
import ProductThumb from '@/components/ui/ProductThumb';
import { BarcodeLabelPreview } from '@/components/ui/BarcodeLabel';
import BarcodeLabelModal from '@/components/ui/BarcodeLabel';
import { formatDateTime } from '@/lib/formatters';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const ESTADO_BADGE = {
    OPTIMO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DESGASTADO: 'bg-amber-100 text-amber-700 border-amber-200',
    NECESITA_MANTENIMIENTO: 'bg-red-100 text-red-700 border-red-200',
};

const ESTADO_LABEL = {
    OPTIMO: 'Óptimo',
    DESGASTADO: 'Desgastado',
    NECESITA_MANTENIMIENTO: 'Necesita mantenimiento',
};

function Field({ icon: Icon, label, children }) {
    if (!children) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                <Icon size={16} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-sm text-slate-800 font-medium break-words">{children}</p>
            </div>
        </div>
    );
}

// Visualizador de detalle completo de un producto: toda la información
// nativa del inventario (ubicación, piso, estado, responsable, código de
// barras, observaciones) en una sola vista, sin necesidad de editar.
export default function ProductDetailModal({ producto, canManage, isGeneral, onClose, onEdit, onDelete, onDuplicate }) {
    const [showLabel, setShowLabel] = useState(false);
    useEscapeKey(onClose);

    const ubicInfo = UBICACIONES.find(u => u.id === producto.ubicacion);
    const bajoStock = producto.stock_actual <= (producto.stock_minimo ?? 0);

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-lg w-full max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                        <ProductThumb url={producto.imagen_url} size="sm" />
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-lg leading-snug break-words">{producto.nombre}</h3>
                            <p className="text-xs font-semibold text-brand-600 uppercase mt-0.5">{producto.categoria}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Foto principal destacada */}
                    <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center group/hero shadow-xs">
                        <ProductThumb
                            url={producto.imagen_url}
                            size="card"
                            className="w-full h-full object-cover"
                            alt={producto.nombre}
                        />

                        {/* Badges flotantes en la foto */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                            {producto.estado && (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border shadow-xs ${ESTADO_BADGE[producto.estado] || 'bg-black/60 text-white border-white/20'}`}>
                                    {ESTADO_LABEL[producto.estado] || producto.estado}
                                </span>
                            )}
                            {bajoStock && (
                                <span className="text-xs font-extrabold px-3 py-1 rounded-full backdrop-blur-md bg-amber-500/95 text-white border border-amber-300/40 shadow-xs flex items-center gap-1">
                                    ⚠ Stock bajo
                                </span>
                            )}
                        </div>

                        {/* Botón ver imagen completa en pestaña nueva */}
                        {producto.imagen_url && (
                            <a
                                href={producto.imagen_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover/hero:opacity-100 transition-opacity shadow-md"
                            >
                                Ver original
                            </a>
                        )}
                    </div>

                    {/* Stock Card */}
                    <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Existencias</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                {producto.stock_actual} <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">{producto.unidad}</span>
                            </p>
                        </div>
                        <StockBar actual={producto.stock_actual} minimo={producto.stock_minimo} />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 mt-2">
                            <span>Stock mínimo: {producto.stock_minimo ?? 0} {producto.unidad}</span>
                            {producto.stock_minimo > 0 && (
                                <span className={bajoStock ? 'text-amber-600 font-bold' : 'text-emerald-600 font-medium'}>
                                    {bajoStock ? 'Por debajo del mínimo' : 'Nivel adecuado'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Campos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field icon={MapPin} label="Ubicación">
                            {ubicInfo ? `${ubicInfo.icono} ${ubicInfo.nombre}` : (producto.ubicacion || '—')}
                        </Field>
                        <Field icon={Layers} label="Responsable / Ministerio">{producto.responsabilidad}</Field>
                        <Field icon={Tag} label="Código de barras">{producto.codigo_barras}</Field>
                        <Field icon={Clock} label="Última actualización">
                            {producto.ultima_actualizacion ? formatDateTime(producto.ultima_actualizacion) : null}
                        </Field>
                    </div>

                    <Field icon={ClipboardList} label="Descripción">{producto.descripcion}</Field>
                    <Field icon={StickyNote} label="Observaciones">{producto.observaciones}</Field>

                    {/* Código de barras visual */}
                    {producto.codigo_barras && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Etiqueta con código de barras</p>
                            <BarcodeLabelPreview value={producto.codigo_barras} />
                        </div>
                    )}
                </div>

                {/* Footer: acciones */}
                <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    {producto.codigo_barras && (
                        <button
                            onClick={() => setShowLabel(true)}
                            className="btn btn-ghost px-3 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl flex items-center gap-2"
                        >
                            <Tag size={16} /> Etiqueta
                        </button>
                    )}
                    {canManage && (
                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={() => onDuplicate(producto)} className="p-2.5 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-100 transition-colors" aria-label="Duplicar">
                                <Copy size={18} />
                            </button>
                            <button onClick={() => onDelete(producto)} className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-100 transition-colors" aria-label="Eliminar">
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={() => onEdit(producto)}
                                className="btn btn-primary px-4 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl"
                            >
                                <Pencil size={16} /> Editar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showLabel && (
                <BarcodeLabelModal
                    producto={{ ...producto, ubicacion_nombre: ubicInfo?.nombre }}
                    onClose={() => setShowLabel(false)}
                />
            )}
        </div>
    );
}
