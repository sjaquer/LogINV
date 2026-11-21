'use client';
import { CheckCircle2 } from 'lucide-react';
import { getStockStatus } from '@/lib/stock';

// ─── KPI Card ──────────────────────────────────────────────────────────────
const KPI_THEME = {
    brand:   { chip: 'bg-brand-50 text-brand-600 ring-brand-100', bar: 'bg-brand-500' },
    blue:    { chip: 'bg-blue-50 text-blue-600 ring-blue-100', bar: 'bg-blue-500' },
    red:     { chip: 'bg-rose-50 text-rose-600 ring-rose-100', bar: 'bg-rose-500' },
    yellow:  { chip: 'bg-amber-50 text-amber-600 ring-amber-100', bar: 'bg-amber-500' },
    amber:   { chip: 'bg-amber-50 text-amber-600 ring-amber-100', bar: 'bg-amber-500' },
    green:   { chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', bar: 'bg-emerald-500' },
    emerald: { chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', bar: 'bg-emerald-500' },
    violet:  { chip: 'bg-violet-50 text-violet-600 ring-violet-100', bar: 'bg-violet-500' },
};

export function KPICard({ title, label, value, subtitle, icon: Icon, color = 'brand', loading }) {
    const theme = KPI_THEME[color] || KPI_THEME.brand;
    const heading = title || label;

    return (
        <div className="kpi-card group h-full">
            <span className={`absolute inset-x-0 top-0 h-0.5 ${theme.bar} opacity-70`} aria-hidden="true" />
            <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{heading}</p>
                <span className={`p-1.5 sm:p-2 rounded-lg ring-1 ${theme.chip} flex-shrink-0`}>
                    <Icon size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                </span>
            </div>
            {loading ? (
                <div className="h-8 w-16 mt-1 rounded-md bg-slate-100 animate-pulse" />
            ) : (
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
            )}
            {subtitle && <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight truncate">{subtitle}</p>}
        </div>
    );
}

// ─── Semáforo Row Badge ────────────────────────────────────────────────────
export function SemaforoBadge({ days }) {
    if (days <= 3) return <span className="badge-red">🔴 {days}d</span>;
    if (days <= 7) return <span className="badge-yellow">🟡 {days}d</span>;
    return <span className="badge-green">🟢 {days}d</span>;
}

// ─── Stock Bar ─────────────────────────────────────────────────────────────
// La barra se llena respecto al doble del mínimo: en el mínimo queda a la
// mitad, de modo que "bajo mínimo" se ve claramente distinto de "con margen".
const STOCK_STYLE = {
    agotado:    { bar: 'bg-rose-500',    text: 'text-rose-600',    label: 'Agotado' },
    bajo:       { bar: 'bg-amber-500',   text: 'text-amber-600',   label: 'Bajo mín.' },
    ok:         { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'OK' },
    sin_minimo: { bar: 'bg-slate-300',   text: 'text-slate-400',   label: 'Sin mín.' },
};

export function StockBar({ actual, minimo }) {
    const status = getStockStatus({ stock_actual: actual, stock_minimo: minimo });
    const style = STOCK_STYLE[status];
    const a = Number(actual) || 0;
    const m = Number(minimo) || 0;
    const pct = status === 'sin_minimo' ? 100 : status === 'agotado' ? 0 : Math.min(100, Math.round((a / (m * 2)) * 100));

    return (
        <div className="flex items-center gap-2 sm:gap-3 min-w-[100px] sm:min-w-[120px]" title={`Stock ${a}${m ? ` · mínimo ${m}` : ''}`}>
            <div
                className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label={style.label}
            >
                <div className={`h-full rounded-full ${style.bar} transition-all duration-500`} style={{ width: `${Math.max(pct, status === 'agotado' ? 0 : 4)}%` }} />
            </div>
            <span className={`text-[11px] font-semibold whitespace-nowrap ${style.text}`}>{style.label}</span>
        </div>
    );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────
export function SkeletonRow({ cols = 5 }) {
    return (
        <tr className="border-b border-slate-100">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full max-w-[120px]" />
                </td>
            ))}
        </tr>
    );
}

export function LoadingSkeleton({ rows = 5, cols = 5 }) {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
        </tbody>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = CheckCircle2, title = 'Sin datos', subtitle }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center animate-fade-in px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center mb-4 sm:mb-5 relative">
                <Icon size={24} className="sm:w-7 sm:h-7 text-slate-400 relative z-10" />
            </div>
            <p className="text-base sm:text-lg font-semibold text-slate-700">{title}</p>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">{subtitle}</p>}
        </div>
    );
}
