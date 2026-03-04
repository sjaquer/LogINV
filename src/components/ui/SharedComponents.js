'use client';
import { TrendingDown, ShoppingCart, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// ─── KPI Card ──────────────────────────────────────────────────────────────
export function KPICard({ title, value, subtitle, icon: Icon, color = 'brand', loading }) {
    const theme = {
        brand: { chip: 'bg-brand-500/15 border-brand-500/25 text-brand-100', value: 'text-white' },
        red: { chip: 'bg-rose-500/15 border-rose-500/25 text-rose-100', value: 'text-rose-100' },
        yellow: { chip: 'bg-accent-amber/20 border-accent-amber/30 text-amber-100', value: 'text-accent-amber' },
        green: { chip: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-100', value: 'text-emerald-200' },
        blue: { chip: 'bg-blue-500/15 border-blue-500/25 text-blue-100', value: 'text-blue-100' },
    }[color] || {
        chip: 'bg-brand-500/15 border-brand-500/25 text-brand-100',
        value: 'text-white'
    };

    return (
        <div className="kpi-card animate-fade-in group">
            <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</p>
                <span className={`p-2 rounded-xl border shadow-glow ${theme.chip}`}>
                    <Icon size={18} />
                </span>
            </div>
            {loading ? (
                <div className="spinner mt-3" />
            ) : (
                <p className={`text-3xl font-semibold mt-2 ${theme.value}`}>{value}</p>
            )}
            <p className="text-xs text-slate-500/90 mt-1 tracking-wide">{subtitle}</p>
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
    if (days <= 3) return <span className="badge-red shadow-sm shadow-red-500/20">🔴 {days}d</span>;
    if (days <= 7) return <span className="badge-yellow shadow-sm shadow-yellow-500/20">🟡 {days}d</span>;
    return <span className="badge-green shadow-sm shadow-emerald-500/20">🟢 {days}d</span>;
}

// ─── Stock Bar ─────────────────────────────────────────────────────────────
export function StockBar({ actual, minimo }) {
    const pct = minimo > 0 ? Math.min(100, Math.round((actual / minimo) * 100)) : 100;
    const color = pct < 50 ? 'bg-red-500 shadow-glow' : pct < 100 ? 'bg-yellow-500' : 'bg-emerald-500';
    return (
        <div className="flex items-center gap-3 min-w-[120px]">
            <div className="flex-1 h-2 rounded-full bg-slate-800 border border-glass overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-semibold w-8 text-right ${pct < 50 ? 'text-red-400' : 'text-slate-400'}`}>{pct}%</span>
        </div>
    );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────
export function SkeletonRow({ cols = 5 }) {
    return (
        <tr className="border-b border-glass/50">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <div className="h-4 bg-white/5 rounded-md animate-pulse w-full max-w-[120px]" />
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
