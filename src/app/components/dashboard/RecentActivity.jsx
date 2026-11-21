'use client';
import { formatRelativeDate, formatDateTime } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, Activity } from 'lucide-react';

const TIPO = {
    INGRESO:    { label: 'Ingreso',    tone: 'bg-emerald-50 text-emerald-600', Icon: ArrowDownCircle, sign: '+' },
    DEVOLUCION: { label: 'Devolución', tone: 'bg-emerald-50 text-emerald-600', Icon: ArrowDownCircle, sign: '+' },
    SALIDA:     { label: 'Salida',     tone: 'bg-amber-50 text-amber-600',     Icon: ArrowUpCircle,   sign: '−' },
    MERMA:      { label: 'Merma',      tone: 'bg-rose-50 text-rose-600',       Icon: ArrowUpCircle,   sign: '−' },
    PRESTAMO:   { label: 'Préstamo',   tone: 'bg-amber-50 text-amber-600',     Icon: ArrowUpCircle,   sign: '−' },
    AJUSTE:     { label: 'Ajuste',     tone: 'bg-blue-50 text-blue-600',       Icon: RotateCcw,       sign: '' },
    CONTEO:     { label: 'Conteo',     tone: 'bg-blue-50 text-blue-600',       Icon: RotateCcw,       sign: '' },
};

export default function RecentActivity({ movimientos = [] }) {
    const recent = movimientos.slice(0, 6);

    return (
        <section className="glass-panel">
            <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Activity size={18} className="text-brand-500" aria-hidden="true" />
                <h3 className="font-bold text-slate-800">Actividad reciente</h3>
            </header>

            {recent.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">Todavía no hay movimientos registrados.</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {recent.map(mov => {
                        const t = TIPO[String(mov.tipo || '').toUpperCase()] || TIPO.AJUSTE;
                        return (
                            <li key={mov.id} className="px-5 py-3 flex items-center gap-3">
                                <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.tone}`}>
                                    <t.Icon size={18} aria-hidden="true" />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{mov.nombre_producto || mov.producto_nombre}</p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {t.label} · <span className="tabular-nums">{t.sign}{mov.cantidad}</span>
                                        {mov.usuario ? ` · ${mov.usuario}` : ''}
                                    </p>
                                </div>
                                <time className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap" title={formatDateTime(mov.fecha)}>
                                    {formatRelativeDate(mov.fecha)}
                                </time>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
