'use client';
import { formatDateTime } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react';

export default function RecentActivity({ movimientos }) {
    if (!movimientos || movimientos.length === 0) return null;

    const recentMovements = movimientos.slice(0, 5);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Actividad reciente</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {recentMovements.map(mov => (
                    <div key={mov.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            mov.tipo === 'INGRESO' || mov.tipo === 'DEVOLUCION' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : mov.tipo === 'SALIDA' || mov.tipo === 'MERMA'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-blue-50 text-blue-600'
                        }`}>
                            {mov.tipo === 'INGRESO' || mov.tipo === 'DEVOLUCION' ? (
                                <ArrowDownCircle size={20} />
                            ) : mov.tipo === 'SALIDA' || mov.tipo === 'MERMA' ? (
                                <ArrowUpCircle size={20} />
                            ) : (
                                <RotateCcw size={20} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{mov.nombre_producto || mov.producto_nombre}</p>
                            <p className="text-xs text-slate-500">{mov.tipo} · {mov.cantidad} {mov.unidad || 'unidades'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-400">{mov.usuario}</p>
                            <p className="text-[10px] text-slate-400">{formatDateTime(mov.fecha)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
