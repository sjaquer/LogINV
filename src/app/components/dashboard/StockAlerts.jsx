'use client';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { StockBar } from '@/components/ui/SharedComponents';

export default function StockAlerts({ stockBajo }) {
    if (!stockBajo || stockBajo.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <h3 className="font-bold text-slate-800">Stock bajo</h3>
                </div>
                <Link href="/inventario?tab=rapido" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                    Ver todos <ArrowRight size={12} />
                </Link>
            </div>
            <div className="divide-y divide-slate-100">
                {stockBajo.map(p => (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.nombre}</p>
                            <p className="text-xs text-slate-500">{p.categoria}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-amber-600">{p.stock_actual}</p>
                                <p className="text-[10px] text-slate-400">mín: {p.stock_minimo}</p>
                            </div>
                            <StockBar actual={p.stock_actual} minimo={p.stock_minimo} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
