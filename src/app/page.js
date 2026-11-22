'use client';
import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useProductos, useCategorias, useConteos, useMovimientos } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import Header from '@/components/layout/Header';
import {
    KPICards,
    RecentActivity,
    StockAlerts,
    WeeklyReportButton,
    QuickActions,
    AttentionPanel,
    WelcomeTip,
    generatePDFReport,
} from './components/dashboard';
import { useLoans } from '@/hooks/useLoans';
import { useMaintenance } from '@/hooks/useMaintenance';
import { exportInventoryExcel } from '@/lib/excelExport';
import { History } from 'lucide-react';
import { isLowStock } from '@/lib/stock';

export default function DashboardPage() {
    const { productos, loading: pLoading } = useProductos();
    const { categorias } = useCategorias();
    const { conteos, loading: cLoading } = useConteos();
    const { movimientos, loading: mLoading } = useMovimientos();
    const { prestamosActivos, prestamosVencidos } = useLoans();
    const { mantenimientosProgramados, mantenimientosVencidos } = useMaintenance();
    const { user } = useAuth();
    const { ubicacion, ubicacionInfo, isGeneral } = useLocation();

    // ── KPI: products below stock minimum (current or all locations) ──
    const productosUbicacion = useMemo(
        () => isGeneral ? productos : productos.filter(p => p.ubicacion === ubicacion),
        [productos, ubicacion, isGeneral]
    );

    const alertasStock = useMemo(
        () => productosUbicacion.filter(isLowStock).length,
        [productosUbicacion]
    );

    // ── KPI: counts today (current or all locations) ──
    const conteosHoy = useMemo(() => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return conteos.filter(c => {
            const f = c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha);
            return f >= hoy && (isGeneral || c.ubicacion === ubicacion);
        }).length;
    }, [conteos, ubicacion, isGeneral]);

    // ── KPI: products with differences in latest count ──
    const diferenciasUltimoConteo = useMemo(() => {
        const completados = conteos.filter(c => c.estado === 'COMPLETADO' && (isGeneral || c.ubicacion === ubicacion));
        if (completados.length === 0) return 0;
        const ultimo = completados.sort((a, b) => {
            const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
            const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
            return fB - fA;
        })[0];
        return (ultimo.items || []).filter(i => i.diferencia !== 0).length;
    }, [conteos, ubicacion, isGeneral]);

    // ── Low stock alerts ──
    const stockBajo = useMemo(
        () => productosUbicacion.filter(isLowStock).slice(0, 8),
        [productosUbicacion]
    );

    // ── Recent movements ──
    const movimientosRecientes = useMemo(() => {
        return movimientos
            .filter(m => isGeneral || m.ubicacion === ubicacion)
            .sort((a, b) => {
                const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                return fB - fA;
            })
            .slice(0, 5);
    }, [movimientos, ubicacion, isGeneral]);

    const loading = pLoading || cLoading || mLoading;

    const ultimoConteoCompletado = useMemo(() => {
        const completados = conteos
            .filter(c => c.estado === 'COMPLETADO' && (isGeneral || c.ubicacion === ubicacion))
            .sort((a, b) => {
                const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                return fB - fA;
            });
        return completados[0] || null;
    }, [conteos, ubicacion, isGeneral]);

    const handleWeeklyReport = useCallback(() => {
        if (ultimoConteoCompletado) generatePDFReport(ultimoConteoCompletado);
    }, [ultimoConteoCompletado]);

    const handleExportExcel = useCallback(() => {
        return exportInventoryExcel(productosUbicacion, categorias, ubicacionInfo.nombre);
    }, [productosUbicacion, categorias, ubicacionInfo.nombre]);

    const hoyLabel = useMemo(
        () => new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }),
        []
    );

    return (
        <div className="flex flex-col flex-1">
            <Header title="Panel de control" />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-fade-in max-w-6xl mx-auto w-full pb-4">

                {/* Saludo + acciones de reporte */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-5 sm:p-7 text-white shadow-lg shadow-brand-900/10">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 first-letter:uppercase">{hoyLabel}</p>
                            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
                                Hola, {user?.nombre?.split(' ')[0] || 'Usuario'}
                            </h2>
                            <p className="mt-1 text-sm sm:text-base text-white/75 truncate">
                                {isGeneral ? 'Vista general de todas las ubicaciones' : `${ubicacionInfo.icono} ${ubicacionInfo.nombre}`}
                            </p>
                        </div>
                        <WeeklyReportButton
                            onGenerate={handleWeeklyReport}
                            onExportExcel={handleExportExcel}
                            canGenerate={!!ultimoConteoCompletado}
                        />
                    </div>
                </section>

                <WelcomeTip userId={user?.id} />

                {/* Accesos rápidos */}
                <QuickActions ubicacionInfo={ubicacionInfo} />

                {/* Indicadores */}
                <KPICards
                    totalProductos={productosUbicacion.length}
                    alertasStock={alertasStock}
                    conteosHoy={conteosHoy}
                    diferenciasUltimoConteo={diferenciasUltimoConteo}
                    ubicacionInfo={ubicacionInfo}
                    loading={loading}
                />

                {/* Pendientes + alertas + actividad */}
                <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 items-start">
                    <div className="space-y-5 sm:space-y-6">
                        <AttentionPanel
                            role={user?.rol}
                            prestamosVencidos={prestamosVencidos.length}
                            prestamosActivos={prestamosActivos.length}
                            mantVencidos={mantenimientosVencidos.length}
                            mantPendientes={mantenimientosProgramados.length}
                            conteosAbiertos={conteos.filter(c => c.estado === 'EN_PROGRESO' && (isGeneral || c.ubicacion === ubicacion)).length}
                            bajoMinimo={alertasStock}
                        />
                        <StockAlerts stockBajo={stockBajo} total={alertasStock} />
                    </div>
                    <RecentActivity movimientos={movimientosRecientes} />
                </div>

                <Link
                    href="/inventario?tab=historial"
                    className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                    <History size={18} />
                    Ver historial completo de conteos
                </Link>

            </div>
        </div>
    );
}
