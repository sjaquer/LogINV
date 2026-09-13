'use client';
import { X, Check } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export default function ConteoDetailModal({ conteo, onClose }) {
    const items = conteo.items || [];
    const conDiff = items.filter(i => i.diferencia !== 0);
    const sinDiff = items.filter(i => i.diferencia === 0);

    useEscapeKey(onClose);

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">Detalle del conteo</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{conteo.usuario} · {formatDateTime(conteo.fecha)}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={22} />
                    </button>
                </div>
                {conteo.notas && (
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 text-sm text-slate-600 italic">
                        &quot;{conteo.notas}&quot;
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    {conDiff.length > 0 && (
                        <div>
                            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Con diferencias ({conDiff.length})</p>
                            </div>
                            {conDiff.map(item => (
                                <div key={item.producto_id} className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-amber-50/30">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-semibold text-slate-800 truncate">{item.producto_nombre}</p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Stock sistema: {item.stock_sistema} → Conteo físico: {item.conteo_fisico}
                                        </p>
                                    </div>
                                    <span className={`text-base font-bold ${item.diferencia < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {sinDiff.length > 0 && (
                        <div>
                            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sin diferencias ({sinDiff.length})</p>
                            </div>
                            {sinDiff.map(item => (
                                <div key={item.producto_id} className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                                    <p className="text-base text-slate-700 truncate flex-1">{item.producto_nombre}</p>
                                    <span className="text-base text-emerald-500 flex items-center gap-1"><Check size={16} /> {item.conteo_fisico}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {items.length === 0 && (
                        <div className="p-8 text-center text-base text-slate-400">Sin datos</div>
                    )}
                </div>
            </div>
        </div>
    );
}
