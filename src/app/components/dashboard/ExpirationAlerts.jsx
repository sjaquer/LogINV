'use client';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { daysUntil, semaforoColor, formatDate } from '@/lib/utils';

export default function ExpirationAlerts({ productos }) {
    if (!productos || productos.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-amber-500" />
                    <h3 className="font-bold text-slate-800">Por vencer</h3>
                </div>
                <Link href="/inventory" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                    Ver todos <ArrowRight size={12} />
                </Link>
            </div>
            <div className="divide-y divide-slate-100">
                {productos.map(p => {
                    const days = daysUntil(p.fecha_vencimiento);
                    const color = semaforoColor(days);
                    return (
                        <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                color === 'red' ? 'bg-red-50 text-red-600' :
                                color === 'yellow' ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                            }`}>
                                <Calendar size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{p.nombre}</p>
                                <p className="text-xs text-slate-500">Vence: {formatDate(p.fecha_vencimiento)}</p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                color === 'red' ? 'bg-red-100 text-red-700' :
                                color === 'yellow' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                                {days <= 0 ? 'Vencido' : `${days} días`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
