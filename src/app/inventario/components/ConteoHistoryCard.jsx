'use client';
import { formatDateTime } from '@/lib/utils';

export default function ConteoHistoryCard({ conteo, onSelect }) {
    const totalItems = conteo.items?.length || 0;
    const conDiff = conteo.items?.filter(i => i.diferencia !== 0).length || 0;
    const isCompleted = conteo.estado === 'COMPLETADO';

    return (
        <button
            type="button"
            onClick={() => onSelect(conteo)}
            className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {isCompleted ? 'Completado' : 'En progreso'}
                    </span>
                    <p className="text-sm text-slate-500 mt-2 font-medium">{conteo.usuario}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(conteo.fecha)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ítems contados</p>
                    {conDiff > 0 && (
                        <p className="text-xs text-amber-600 font-bold mt-1">{conDiff} con diferencias</p>
                    )}
                </div>
            </div>
            {conteo.notas && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic">&quot;{conteo.notas}&quot;</p>
            )}
        </button>
    );
}
