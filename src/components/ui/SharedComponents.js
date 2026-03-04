'use client';
import { TrendingDown, ShoppingCart, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// ─── KPI Card ──────────────────────────────────────────────────────────────
export function KPICard({ title, value, subtitle, icon: Icon, color = 'brand', loading }) {
    const theme = {
        brand: { chip: 'bg-brand-50 border-brand-100 text-brand-600', value: 'text-brand-600' },
        red: { chip: 'bg-rose-50 border-rose-100 text-rose-600', value: 'text-rose-600' },
        yellow: { chip: 'bg-amber-50 border-amber-100 text-amber-600', value: 'text-amber-600' },
        green: { chip: 'bg-emerald-50 border-emerald-100 text-emerald-600', value: 'text-emerald-600' },
        blue: { chip: 'bg-blue-50 border-blue-100 text-blue-600', value: 'text-blue-600' },
    }[color] || {
        chip: 'bg-brand-50 border-brand-100 text-brand-600',
        value: 'text-brand-600'
    };

    return (
        <div className="kpi-card group bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 rounded-xl">
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                <span className={`p-2 rounded-lg border ${theme.chip} transition-colors`}>
                    <Icon size={18} />
                </span>
            </div>
            {loading ? (
                <div className="spinner mt-3" />
            ) : (
                <p className={`text-3xl font-bold tracking-tight text-slate-900`}>{value}</p>
            )}
            <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        </div>
    );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
export function StatusBadge({ estado }) {
    const { language } = useLanguage();

    const LABELS = {
        es: {
            PENDIENTE: 'Pendiente',
            APROBADO_ADMIN: 'Aprobado · Admin',
            VALIDADO_GERENCIA: 'Validado · Gerencia',
            RECHAZADO: 'Rechazado',
            COMPRADO: 'Comprado',
        },
        en: {
            PENDIENTE: 'Pending',
            APROBADO_ADMIN: 'Approved · Admin',
            VALIDADO_GERENCIA: 'Validated · Mgmt',
            RECHAZADO: 'Rejected',
            COMPRADO: 'Purchased',
        },
    };

    const CLS = {
        PENDIENTE: 'badge-yellow',
        APROBADO_ADMIN: 'badge-blue',
        VALIDADO_GERENCIA: 'badge-green',
        RECHAZADO: 'badge-red',
        COMPRADO: 'badge-purple',
    };

    const label = LABELS[language]?.[estado] || LABELS.en[estado] || estado;
    const cls = CLS[estado] || 'badge-gray';
    return <span className={cls}>● {label}</span>;
}

// ─── Semáforo Row Badge ────────────────────────────────────────────────────
export function SemaforoBadge({ days }) {
    if (days <= 3) return <span className="badge-red">🔴 {days}d</span>;
    if (days <= 7) return <span className="badge-yellow">🟡 {days}d</span>;
    return <span className="badge-green">🟢 {days}d</span>;
}

// ─── Stock Bar ─────────────────────────────────────────────────────────────
export function StockBar({ actual, minimo }) {
    const pct = minimo > 0 ? Math.min(100, Math.round((actual / minimo) * 100)) : 100;
    const color = pct < 50 ? 'bg-rose-500' : pct < 100 ? 'bg-amber-400' : 'bg-emerald-500';
    return (
        <div className="flex items-center gap-3 min-w-[120px]">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-semibold w-8 text-right ${pct < 50 ? 'text-rose-600' : 'text-slate-500'}`}>{pct}%</span>
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
    const { t } = useLanguage();

    // Try to translate if key exists, otherwise use raw text
    const translatedTitle = t(title) !== title ? t(title) : title;
    const translatedSubtitle = subtitle ? (t(subtitle) !== subtitle ? t(subtitle) : subtitle) : null;

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-dark-panel border border-white/5 shadow-soft flex items-center justify-center mb-5 relative">
                <div className="absolute inset-0 rounded-3xl bg-brand-gradient opacity-20 blur-xl" />
                <Icon size={28} className="text-slate-300 relative z-10" />
            </div>
            <p className="text-lg font-semibold text-white">{translatedTitle}</p>
            {translatedSubtitle && <p className="text-sm text-slate-500 mt-1 max-w-sm">{translatedSubtitle}</p>}
        </div>
    );
}
