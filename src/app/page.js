'use client';
import { useMemo, useCallback } from 'react';
import { useProductos, useConteos, useMovimientos } from '@/hooks/useFirestore';
import { useLanguage } from '@/context/LanguageContext';
import Header from '@/components/layout/Header';
import { KPICard, SemaforoBadge, StockBar, EmptyState } from '@/components/ui/SharedComponents';
import { daysUntil, formatDate, formatDateTime, semaforoRowBg } from '@/lib/utils';
import {
    AlertTriangle, Package, ClipboardCheck, TrendingDown,
    FileText, Check, X as XIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
//  PDF Report Generator (browser print)
// ═══════════════════════════════════════════════════════════════════════════
function generatePDFReport(conteo, t) {
    const items = conteo.items || [];
    const conDiff = items.filter(i => i.diferencia !== 0);
    const fecha = conteo.fecha?.toDate
        ? conteo.fecha.toDate().toLocaleString('es-PE')
        : new Date(conteo.fecha).toLocaleString('es-PE');

    const rows = items.map(i => `
        <tr style="${i.diferencia !== 0 ? 'background:#FEF3C7;' : ''}">
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${i.producto_nombre}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;">${i.stock_sistema}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:bold;">${i.conteo_fisico}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:bold;color:${i.diferencia < 0 ? '#DC2626' : i.diferencia > 0 ? '#059669' : '#64748B'}">
                ${i.diferencia > 0 ? '+' : ''}${i.diferencia}
            </td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${t('reporteConteo')} - ${fecha}</title>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin:0; padding:40px; color:#1e293b; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; border-bottom:3px solid #3b82f6; padding-bottom:20px; }
    .logo { font-size:24px; font-weight:800; color:#1e293b; }
    .logo span { color:#3b82f6; }
    .meta { text-align:right; font-size:12px; color:#64748b; }
    .meta strong { color:#1e293b; display:block; font-size:14px; }
    .summary { display:flex; gap:16px; margin-bottom:24px; }
    .summary-card { flex:1; padding:16px; border-radius:12px; text-align:center; }
    .summary-card .val { font-size:28px; font-weight:800; }
    .summary-card .lbl { font-size:10px; text-transform:uppercase; letter-spacing:1px; margin-top:4px; }
    table { width:100%; border-collapse:collapse; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0; }
    thead { background:#f1f5f9; }
    th { padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; font-weight:700; }
    .notes { margin-top:24px; padding:16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; font-size:13px; color:#475569; }
    .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; }
    @media print { body { padding:20px; } }
</style>
</head><body>
<div class="header">
    <div>
        <div class="logo">Log<span>INV</span></div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">${t('reporteConteo')}</div>
    </div>
    <div class="meta">
        <strong>${fecha}</strong>
        ${t('usuario')}: ${conteo.usuario}
    </div>
</div>
<div class="summary">
    <div class="summary-card" style="background:#EFF6FF;color:#1D4ED8;">
        <div class="val">${items.length}</div>
        <div class="lbl">${t('itemsContados')}</div>
    </div>
    <div class="summary-card" style="background:#F0FDF4;color:#15803D;">
        <div class="val">${items.length - conDiff.length}</div>
        <div class="lbl">${t('sinDiferencias')}</div>
    </div>
    <div class="summary-card" style="background:#FFFBEB;color:#B45309;">
        <div class="val">${conDiff.length}</div>
        <div class="lbl">${t('conDiferencias')}</div>
    </div>
</div>
<table>
    <thead><tr>
        <th>${t('producto')}</th>
        <th style="text-align:center;">${t('stockSistema')}</th>
        <th style="text-align:center;">${t('conteoFisico')}</th>
        <th style="text-align:center;">${t('diferencia')}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
</table>
${conteo.notas ? `<div class="notes"><strong>${t('motivo')}:</strong> ${conteo.notas}</div>` : ''}
<div class="footer">
    <span>LogINV - Control de Inventario</span>
    <span>${t('reporteConteo')} generado el ${new Date().toLocaleString('es-PE')}</span>
</div>
</body></html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
    const { productos, loading: pLoading } = useProductos();
    const { conteos, loading: cLoading } = useConteos();
    const { movimientos, loading: mLoading } = useMovimientos();
    const { t } = useLanguage();

    // ── KPI: products below stock minimum ──
    const alertasStock = useMemo(
        () => productos.filter((p) => p.stock_actual <= p.stock_minimo_rop).length,
        [productos]
    );

    // ── KPI: counts today ──
    const conteosHoy = useMemo(() => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return conteos.filter(c => {
            const f = c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha);
            return f >= hoy;
        }).length;
    }, [conteos]);

    // ── KPI: products with differences in latest count ──
    const diferenciasUltimoConteo = useMemo(() => {
        const completados = conteos.filter(c => c.estado === 'COMPLETADO');
        if (completados.length === 0) return 0;
        const ultimo = completados.sort((a, b) => {
            const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
            const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
            return fB - fA;
        })[0];
        return (ultimo.items || []).filter(i => i.diferencia !== 0).length;
    }, [conteos]);

    // ── Semáforo: products expiring soon ──
    const productosSemaforo = useMemo(() => {
        return [...productos]
            .map((p) => ({ ...p, dias: daysUntil(p.fecha_vencimiento) }))
            .filter((p) => p.dias < 30)
            .sort((a, b) => a.dias - b.dias)
            .slice(0, 12);
    }, [productos]);

    // ── Low stock alerts ──
    const stockBajo = useMemo(
        () => productos.filter((p) => p.stock_actual <= p.stock_minimo_rop).slice(0, 8),
        [productos]
    );

    // ── Recent completed counts ──
    const conteosRecientes = useMemo(() => {
        return conteos
            .filter(c => c.estado === 'COMPLETADO')
            .sort((a, b) => {
                const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                return fB - fA;
            })
            .slice(0, 5);
    }, [conteos]);

    const handleGenerarPDF = useCallback((conteo) => {
        generatePDFReport(conteo, t);
    }, [t]);

    const loading = pLoading || cLoading || mLoading;

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title={t('dashboard')} />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 animate-fade-in max-w-7xl mx-auto w-full">

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <KPICard
                        title={t('alertasROP')}
                        value={loading ? '—' : alertasStock}
                        subtitle={t('productosBajoStock')}
                        icon={AlertTriangle}
                        color="yellow"
                        loading={loading}
                    />
                    <KPICard
                        title={t('conteosDiarios')}
                        value={loading ? '—' : conteosHoy}
                        subtitle={t('conteosRealizados')}
                        icon={ClipboardCheck}
                        color="blue"
                        loading={loading}
                    />
                    <KPICard
                        title={t('diferenciasDetectadas')}
                        value={loading ? '—' : diferenciasUltimoConteo}
                        subtitle={t('diferenciasDesc')}
                        icon={TrendingDown}
                        color="red"
                        loading={loading}
                    />
                    <KPICard
                        title={t('totalProductos')}
                        value={loading ? '—' : productos.length}
                        subtitle={t('enCatalogo')}
                        icon={Package}
                        color="brand"
                        loading={loading}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

                    {/* ── Recent counts + PDF export ── */}
                    <div className="xl:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <ClipboardCheck size={18} className="text-brand-600" />
                                {t('historialConteos')}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">{t('reporteConteo')}</p>
                        </div>

                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : conteosRecientes.length === 0 ? (
                            <EmptyState title="noConteos" />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {conteosRecientes.map((c) => {
                                    const totalItems = c.items?.length || 0;
                                    const conDiff = c.items?.filter(i => i.diferencia !== 0).length || 0;
                                    return (
                                        <div key={c.id} className="px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                                                        {c.usuario}
                                                    </p>
                                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                                                        {t('conteoCompletado')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(c.fecha)}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs">
                                                    <span className="text-slate-500">{totalItems} {t('itemsContados').toLowerCase()}</span>
                                                    {conDiff > 0 ? (
                                                        <span className="text-amber-600 font-semibold">{conDiff} {t('conDiferencias').toLowerCase()}</span>
                                                    ) : (
                                                        <span className="text-emerald-500 flex items-center gap-0.5"><Check size={12} /> {t('sinDiferencias')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleGenerarPDF(c)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-600 hover:bg-brand-50 border border-transparent hover:border-brand-200 transition-all flex-shrink-0"
                                                title={t('reporteConteo')}
                                            >
                                                <FileText size={16} /> PDF
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Stock bajo mínimo ── */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-amber-50">
                            <h2 className="text-base sm:text-lg font-bold text-amber-600 tracking-tight flex items-center gap-2">
                                <AlertTriangle size={18} />
                                {t('alertasCompra')}
                            </h2>
                            <p className="text-xs text-amber-600/70 mt-1 font-medium">{t('stockActualMenorMInimo')}</p>
                        </div>
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : stockBajo.length === 0 ? (
                            <EmptyState title="stockOk" subtitle="noAlertasReorden" />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {stockBajo.map((p) => {
                                    const deficit = p.stock_minimo_rop - p.stock_actual;
                                    return (
                                        <div key={p.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-amber-50/50 transition-colors group">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-700 transition-colors truncate">{p.nombre}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">{p.categoria} · {t('stock')}: <span className="text-rose-600 font-bold">{p.stock_actual}</span> / {t('min')} {p.stock_minimo_rop}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm text-amber-600 font-bold">+{deficit} <span className="text-xs text-slate-400 font-normal">{p.unidad || 'u'}</span></p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{t('aReponer')}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Semáforo de vencimientos ── */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{t('semaforoVencimientos')}</h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">{t('productosProximosVencer')}</p>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;3d</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> &lt;7d</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> OK</span>
                        </div>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="data-table w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th>{t('producto')}</th>
                                    <th>{t('categoria')}</th>
                                    <th>{t('stock')}</th>
                                    <th>{t('vencimiento')}</th>
                                    <th>{t('alerta')}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-full max-w-[120px]" /></td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            ) : productosSemaforo.length === 0 ? (
                                <tbody>
                                    <tr><td colSpan={5}><EmptyState title="sinProductosVencer" subtitle="todosProductosVigentes" /></td></tr>
                                </tbody>
                            ) : (
                                <tbody>
                                    {productosSemaforo.map((p) => (
                                        <tr key={p.id} className={`${semaforoRowBg(p.dias)} group border-b border-slate-50 hover:bg-slate-50/50`}>
                                            <td className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{p.nombre}</td>
                                            <td><span className="badge-gray bg-white border-slate-200">{p.categoria}</span></td>
                                            <td>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-slate-700 font-bold text-sm">{p.stock_actual} <span className="text-slate-400 text-xs font-normal">{p.unidad || 'u'}</span></span>
                                                    <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                                </div>
                                            </td>
                                            <td className="text-slate-500 text-xs font-medium">{formatDate(p.fecha_vencimiento)}</td>
                                            <td><SemaforoBadge days={p.dias} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-4 h-20 animate-pulse bg-slate-50" />
                            ))
                        ) : productosSemaforo.length === 0 ? (
                            <EmptyState title="sinProductosVencer" subtitle="todosProductosVigentes" />
                        ) : (
                            productosSemaforo.map((p) => (
                                <div key={p.id} className={`p-4 ${semaforoRowBg(p.dias)}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate">{p.nombre}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-500 font-medium uppercase">{p.categoria}</span>
                                                <span className="text-xs text-slate-400">·</span>
                                                <span className="text-xs text-slate-500 font-medium">{formatDate(p.fecha_vencimiento)}</span>
                                            </div>
                                        </div>
                                        <SemaforoBadge days={p.dias} />
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-sm font-bold text-slate-800">{p.stock_actual} <span className="text-xs text-slate-400 font-normal">{p.unidad || 'u'}</span></span>
                                        <div className="flex-1">
                                            <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
