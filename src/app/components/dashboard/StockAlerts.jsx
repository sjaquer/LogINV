'use client';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StockBar } from '@/components/ui/SharedComponents';

export default function StockAlerts({ stockBajo = [], total = 0 }) {
    return (
        <section className="glass-panel">
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" aria-hidden="true" />
                    <h3 className="font-bold text-slate-800">Bajo mínimo</h3>
                    {total > 0 && <span className="badge-yellow">{total}</span>}
                </div>
                {total > 0 && (
                    <Link href="/inventario?tab=rapido" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                        Reponer <ArrowRight size={12} />
                    </Link>
                )}
            </header>

            {stockBajo.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
                    <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
                    Ningún artículo está por debajo de su stock mínimo.
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {stockBajo.map(p => (
                        <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{p.nombre}</p>
                                <p className="text-xs text-slate-500 truncate">{p.categoria}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className={`text-sm font-bold tabular-nums ${Number(p.stock_actual) <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                    {p.stock_actual}<span className="text-slate-400 font-medium"> / {p.stock_minimo}</span>
                                </p>
                            </div>
                            <div className="hidden sm:block w-36 flex-shrink-0">
                                <StockBar actual={p.stock_actual} minimo={p.stock_minimo} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
