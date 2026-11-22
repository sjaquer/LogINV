'use client';
import { Zap, ScanBarcode, ArrowDownCircle, ArrowUpCircle, Package } from 'lucide-react';
import { EmptyState } from '@/components/ui/SharedComponents';
import ProductThumb from '@/components/ui/ProductThumb';
import { getLocationInfo } from '@/context/LocationContext';
import { isLowStock } from '@/lib/stock';
import ProductFilters from './ProductFilters';
import ScanFeedback from './ScanFeedback';

export default function QuickStockTab({ isGeneral, loading, productosFiltrados, filters, feedback, onScan, onMove }) {
    return (
        <div className="space-y-4">
            <div className="glass-panel p-4">
                <h2 className="flex items-center gap-2 font-bold text-slate-800"><Zap size={18} className="text-emerald-500" /> Ingresos y salidas rápidas</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-500">Suma o resta unidades sin hacer un conteo completo. Cada movimiento queda en el historial.</p>
            </div>

            <ScanFeedback feedback={feedback} />

            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => onScan('INGRESO')} className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700 transition active:scale-[0.98]">
                    <ScanBarcode size={18} /> Escanear ingreso
                </button>
                <button type="button" onClick={() => onScan('SALIDA')} className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3.5 text-sm font-bold text-amber-700 transition active:scale-[0.98]">
                    <ScanBarcode size={18} /> Escanear salida
                </button>
            </div>

            <ProductFilters {...filters} />

            {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : productosFiltrados.length === 0 ? (
                <EmptyState icon={Package} title="Sin resultados" />
            ) : (
                <ul className="space-y-2">
                    {productosFiltrados.map(p => {
                        const loc = isGeneral ? getLocationInfo(p.ubicacion) : null;
                        const low = isLowStock(p);
                        return (
                            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-surface p-3 sm:p-4 shadow-sm">
                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <ProductThumb url={p.imagen_url} size="card" className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm sm:text-base font-bold text-slate-900">{p.nombre}</p>
                                    <p className="truncate text-xs text-slate-500">
                                        <span className="font-semibold uppercase text-brand-600">{p.categoria}</span>
                                        {loc && <> · {loc.icono} {loc.nombre}</>}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Stock: <strong className={low ? 'text-amber-700' : 'text-slate-800'}>{p.stock_actual}</strong> {p.unidad}
                                        {low && <span className="ml-1.5 font-semibold text-amber-700">· bajo mínimo</span>}
                                    </p>
                                </div>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                    <button type="button" onClick={() => onMove(p, 'SALIDA')} className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 transition active:scale-95" aria-label={`Registrar salida de ${p.nombre}`} title="Salida">
                                        <ArrowUpCircle size={20} />
                                    </button>
                                    <button type="button" onClick={() => onMove(p, 'INGRESO')} className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 transition active:scale-95" aria-label={`Registrar ingreso de ${p.nombre}`} title="Ingreso">
                                        <ArrowDownCircle size={20} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
