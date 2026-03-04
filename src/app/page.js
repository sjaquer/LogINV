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
        <div className="flex flex-col flex-1">
            <Header title={t('dashboard')} />
            <div className="flex-1 p-4 sm:p-6 space-y-6 animate-fade-in">

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* ── Semáforo Table ── */}
                    <div className="xl:col-span-2 glass-panel overflow-hidden">
                        <div className="px-6 py-5 border-b border-glass flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-wide">{t('semaforoVencimientos')}</h2>
                                <p className="text-xs text-slate-400 mt-1">{t('productosProximosVencer')}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shadow-glow" /> &lt;3d</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-glow" /> &lt;7d</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow" /> OK</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
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
                                            <tr key={p.id} className={`${semaforoRowBg(p.dias)} group`}>
                                                <td className="font-semibold text-slate-200 group-hover:text-white transition-colors">{p.nombre}</td>
                                                <td>
                                                    <span className="badge-gray">{t(p.categoria.toLowerCase())}</span>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-slate-200 font-medium">{p.stock_actual} <span className="text-slate-500 text-xs">{p.unidad || 'u'}</span></span>
                                                        <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                                    </div>
                                                </td>
                                                <td className="text-slate-400 text-xs font-medium">{formatDate(p.fecha_vencimiento)}</td>
                                                <td><SemaforoBadge days={p.dias} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* ── ROP Alerts Panel ── */}
                    <div className="glass-panel overflow-hidden">
                        <div className="px-6 py-5 border-b border-glass bg-yellow-500/5">
                            <h2 className="text-lg font-bold text-yellow-400 tracking-wide flex items-center gap-2">
                                <AlertTriangle size={18} />
                                {t('alertasCompra')}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">{t('stockActualMenorMInimo')}</p>
                        </div>
                        {loading ? (
                            <div className="p-5 space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : ropAlerts.length === 0 ? (
                            <EmptyState title="stockOk" subtitle="noAlertasReorden" />
                        ) : (
                            <div className="divide-y divide-glass/50">
                                {ropAlerts.map((p) => {
                                    const deficit = p.stock_minimo_rop - p.stock_actual;
                                    return (
                                        <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{p.nombre}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{t(p.categoria.toLowerCase())} · {t('stock')}: <span className="text-red-400 font-bold">{p.stock_actual}</span> / {t('min')} {p.stock_minimo_rop}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-yellow-500 font-bold shadow-glow">+{deficit} {p.unidad || 'u'}</p>
                                                <p className="text-xs text-slate-400 font-medium">{t('aReponer')}</p>
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
