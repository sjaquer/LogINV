'use client';
import { useState, useCallback, useRef } from 'react';
import { Pencil, Trash2, Copy, MapPin } from 'lucide-react';
import { UBICACIONES } from '@/context/LocationContext';
import { StockBar } from '@/components/ui/SharedComponents';

export default function SwipeableProductCard({ producto, catIcon, canManage, isGeneral, onEdit, onDelete, onDuplicate }) {
    const cardRef = useRef(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const [offsetX, setOffsetX] = useState(0);
    const [swiping, setSwiping] = useState(false);

    const SWIPE_THRESHOLD = 80;

    const handleTouchStart = useCallback((e) => {
        if (!canManage || isGeneral) return;
        startX.current = e.touches[0].clientX;
        currentX.current = 0;
        setSwiping(true);
    }, [canManage, isGeneral]);

    const handleTouchMove = useCallback((e) => {
        if (!swiping) return;
        const diff = e.touches[0].clientX - startX.current;
        currentX.current = diff;
        setOffsetX(Math.max(-120, Math.min(120, diff)));
    }, [swiping]);

    const handleTouchEnd = useCallback(() => {
        if (!swiping) return;
        setSwiping(false);
        if (currentX.current < -SWIPE_THRESHOLD) {
            onDelete(producto);
        } else if (currentX.current > SWIPE_THRESHOLD) {
            onEdit(producto);
        }
        setOffsetX(0);
    }, [swiping, producto, onDelete, onEdit]);

    const ubicInfo = UBICACIONES.find(u => u.id === producto.ubicacion);

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Background actions */}
            {canManage && !isGeneral && (
                <>
                    <div className={`absolute inset-y-0 left-0 w-24 flex items-center justify-center bg-brand-500 rounded-l-xl transition-opacity ${offsetX > 30 ? 'opacity-100' : 'opacity-0'}`}>
                        <Pencil size={22} className="text-white" />
                    </div>
                    <div className={`absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-red-500 rounded-r-xl transition-opacity ${offsetX < -30 ? 'opacity-100' : 'opacity-0'}`}>
                        <Trash2 size={22} className="text-white" />
                    </div>
                </>
            )}

            {/* Card */}
            <div
                ref={cardRef}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all relative z-10"
                style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? 'none' : 'transform 0.3s ease' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-base truncate">{producto.nombre}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-semibold text-brand-600 uppercase">{catIcon} {producto.categoria}</span>
                            {producto.marca && <span className="text-xs text-slate-400">· {producto.marca}</span>}
                            {producto.gramaje && <span className="text-xs text-slate-400">· {producto.gramaje}</span>}
                        </div>
                        {isGeneral && ubicInfo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1.5">
                                <MapPin size={10} /> {ubicInfo.icono} {ubicInfo.nombre}
                            </span>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="font-bold text-slate-800">{producto.stock_actual} <span className="text-slate-400 font-normal text-xs">{producto.unidad}</span></span>
                            <StockBar actual={producto.stock_actual} minimo={producto.stock_minimo_rop} />
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                            {!isGeneral && (
                                <>
                                    <button
                                        onClick={() => onEdit(producto)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                        aria-label="Editar"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDuplicate(producto)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                        aria-label="Duplicar"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(producto)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
