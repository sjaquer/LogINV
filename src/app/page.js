'use client';
import { useMemo } from 'react';
import { useProductos } from '@/hooks/useFirestore';
import { useRequerimientos } from '@/hooks/useFirestore';
import { useMovimientos } from '@/hooks/useFirestore';
import { useLanguage } from '@/context/LanguageContext';
import Header from '@/components/layout/Header';
import { KPICard, SemaforoBadge, StockBar, LoadingSkeleton, EmptyState } from '@/components/ui/SharedComponents';
import { daysUntil, formatDate, semaforoRowBg } from '@/lib/utils';
import { TrendingDown, ShoppingCart, Clock, AlertTriangle, Package } from 'lucide-react';

export default function DashboardPage() {
    const { productos, loading: pLoading } = useProductos();
    const { requerimientos, loading: rLoading } = useRequerimientos();
    const { movimientos, loading: mLoading } = useMovimientos();
    const { t } = useLanguage();

    // ── KPI calculations ──
    const alertasROP = useMemo(
        () => productos.filter((p) => p.stock_actual <= p.stock_minimo_rop).length,
        [productos]
    );

    const mermasEsteMes = useMemo(() => {
        const inicio = new Date();
        inicio.setDate(1);
        inicio.setHours(0, 0, 0, 0);
        return movimientos.filter((m) => {
            if (m.tipo !== 'MERMA') return false;
            const fecha = m.fecha?.toDate ? m.fecha.toDate() : new Date(m.fecha);
            return fecha >= inicio;
        }).length;
    }, [movimientos]);

    const solicitudesPendientes = useMemo(
        () => requerimientos.filter((r) => r.estado === 'PENDIENTE').length,
        [requerimientos]
    );

    // ── Semáforo sorted by urgency ──
    const productosSemaforo = useMemo(() => {
        return [...productos]
            .map((p) => ({ ...p, dias: daysUntil(p.fecha_vencimiento) }))
            .filter((p) => p.dias < 30)
            .sort((a, b) => a.dias - b.dias)
            .slice(0, 12);
    }, [productos]);

    // ── ROP alerts ──
    const ropAlerts = useMemo(
        () => productos.filter((p) => p.stock_actual <= p.stock_minimo_rop).slice(0, 8),
        [productos]
    );

    const loading = pLoading || rLoading || mLoading;

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title={t('dashboard')} />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 animate-fade-in max-w-7xl mx-auto w-full">

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <KPICard
                        title={t('alertasROP')}
                        value={loading ? '—' : alertasROP}
                        subtitle={t('productosBajoStock')}
                        icon={AlertTriangle}
                        color="yellow"
                        loading={loading}
                    />
                    <KPICard
                        title={t('mermasMes')}
                        value={loading ? '—' : mermasEsteMes}
                        subtitle={t('registrosMerma')}
                        icon={TrendingDown}
                        color="red"
                        loading={loading}
                    />
                    <KPICard
                        title={t('solicitudesPendientes')}
                        value={loading ? '—' : solicitudesPendientes}
                        subtitle={t('esperandoValidacion')}
                        icon={Clock}
                        color="blue"
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

                    {/* ── Semáforo ── */}
                    <div className="xl:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
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
                                    <LoadingSkeleton rows={6} cols={5} />
                                ) : productosSemaforo.length === 0 ? (
                                    <tbody>
                                        <tr>
                                            <td colSpan={5}>
                                                <EmptyState title="sinProductosVencer" subtitle="todosProductosVigentes" />
                                            </td>
                                        </tr>
                                    </tbody>
                                ) : (
                                    <tbody>
                                        {productosSemaforo.map((p) => (
                                            <tr key={p.id} className={`${semaforoRowBg(p.dias)} group border-b border-slate-50 hover:bg-slate-50/50`}>
                                                <td className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{p.nombre}</td>
                                                <td>
                                                    <span className="badge-gray bg-white border-slate-200">{t(p.categoria.toLowerCase())}</span>
                                                </td>
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

                    {/* ── ROP Alerts Panel ── */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-amber-50">
                            <h2 className="text-base sm:text-lg font-bold text-amber-600 tracking-tight flex items-center gap-2">
                                <AlertTriangle size={18} />
                                {t('alertasCompra')}
                            </h2>
                            <p className="text-xs text-amber-600/70 mt-1 font-medium">{t('stockActualMenorMInimo')}</p>
                        </div>
                        {loading ? (
                            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : ropAlerts.length === 0 ? (
                            <EmptyState title="stockOk" subtitle="noAlertasReorden" />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {ropAlerts.map((p) => {
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
            </div>
        </div>
    );
}
