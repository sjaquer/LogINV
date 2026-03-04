'use client';
import { TrendingDown, ShoppingCart, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// ─── KPI Card ──────────────────────────────────────────────────────────────
export function KPICard({ title, value, subtitle, icon: Icon, color = 'brand', loading }) {
    const colorMap = {
        brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
    return (
        <div className="kpi-card animate-fade-in group">
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{title}</p>
                <span className={`p-2 rounded-xl border ${colorMap[color]} shadow-glow`}>
                    <Icon size={18} />
                </span>
            </div>
            {loading ? (
                <div className="spinner mt-3" />
            ) : (
                <p className={`text-3xl font-bold mt-2 ${colorMap[color].split(' ')[0]}`}>{value}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
    );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
export function StatusBadge({ estado }) {
    const { t, language } = useLanguage();

    // Fallbacks since states are stored in DB
    const ESTADO_MAP = {
        PENDIENTE: { cls: 'badge-yellow', label: t('estado') + ': ' + (language === 'es' ? 'Pendiente' : language === 'en' ? 'Pending' : language === 'zh' ? '待定' : '保留') },
        APROBADO_ADMIN: { cls: 'badge-blue', label: t('aprobarComoAdmin') },
        VALIDADO_GERENCIA: { cls: 'badge-green', label: t('validarComoGerencia') },
        RECHAZADO: { cls: 'badge-red', label: t('rechazar') },
        COMPRADO: { cls: 'badge-purple', label: t('marcarComprado') },
    };

    const e = ESTADO_MAP[estado] || { cls: 'badge-gray', label: estado };
    return <span className={e.cls}>●&nbsp;{e.label.replace('Aprobar', 'Aprobado').replace('Validar', 'Validado').replace('Marcar como ', '')}</span>;
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
            <div className="w-16 h-16 rounded-3xl bg-dark-panel border border-glass shadow-lg flex items-center justify-center mb-5 relative group">
                <div className="absolute inset-0 bg-brand-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon size={28} className="text-slate-400 group-hover:text-brand-400 transition-colors relative z-10" />
            </div>
            <p className="text-lg font-medium text-slate-200">{translatedTitle}</p>
            {translatedSubtitle && <p className="text-sm text-slate-500 mt-1 max-w-sm">{translatedSubtitle}</p>}
        </div>
    );
}
