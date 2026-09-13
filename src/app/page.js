'use client';
import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useProductos, useConteos, useMovimientos } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES } from '@/context/LocationContext';
import Header from '@/components/layout/Header';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { 
    KPICards, 
    RecentActivity, 
    StockAlerts, 
    ExpirationAlerts, 
    WeeklyReportButton, 
    QuickActions,
    generatePDFReport,
    exportInventoryCSV 
} from './components/dashboard';
import { daysUntil } from '@/lib/utils';
import { History } from 'lucide-react';

export default function DashboardPage() {
    const { productos, loading: pLoading } = useProductos();
    const { conteos, loading: cLoading } = useConteos();
    const { movimientos, loading: mLoading } = useMovimientos();
    const { user } = useAuth();
    const { ubicacion, ubicacionInfo, isGeneral } = useLocation();

    // ── KPI: products below stock minimum (current or all locations) ──
    const productosUbicacion = useMemo(
        () => isGeneral ? productos : productos.filter(p => p.ubicacion === ubicacion),
        [productos, ubicacion, isGeneral]
    );

    const alertasStock = useMemo(
        () => productosUbicacion.filter((p) => p.stock_actual <= p.stock_minimo_rop).length,
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

    // ── Semáforo: products expiring soon (current location) ──
    const productosSemaforo = useMemo(() => {
        return [...productosUbicacion]
            .map((p) => ({ ...p, dias: daysUntil(p.fecha_vencimiento) }))
            .filter((p) => p.dias < 30)
            .sort((a, b) => a.dias - b.dias)
            .slice(0, 12);
    }, [productosUbicacion]);

    // ── Low stock alerts ──
    const stockBajo = useMemo(
        () => productosUbicacion.filter((p) => p.stock_actual <= p.stock_minimo_rop).slice(0, 8),
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

    const handleWeeklyReport = useCallback(() => {
        const completados = conteos
            .filter(c => c.estado === 'COMPLETADO' && (isGeneral || c.ubicacion === ubicacion))
            .sort((a, b) => {
                const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                return fB - fA;
            });
        
        if (completados.length > 0) {
            generatePDFReport(completados[0]);
        }
    }, [conteos, ubicacion, isGeneral]);

    const handleExportCSV = useCallback(() => {
        exportInventoryCSV(productosUbicacion, ubicacionInfo.nombre);
    }, [productosUbicacion, ubicacionInfo.nombre]);

    const handleRefresh = useCallback(() => {
        return new Promise(resolve => setTimeout(resolve, 600));
    }, []);

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Dashboard" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-4">

                {/* Welcome banner */}
                <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-brand-500/20">
                    <h2 className="text-xl sm:text-2xl font-bold">Hola, {user?.nombre?.split(' ')[0] || 'Usuario'} 👋</h2>
                    <p className="text-white/80 mt-1 text-sm sm:text-base">
                        {isGeneral ? 'Vista general del inventario' : `Ubicación: ${ubicacionInfo.icono} ${ubicacionInfo.nombre}`}
                    </p>
                </div>

                {/* Quick Actions */}
                <QuickActions ubicacionInfo={ubicacionInfo} />

                {/* KPI Cards */}
                <KPICards
                    totalProductos={productosUbicacion.length}
                    alertasStock={alertasStock}
                    conteosHoy={conteosHoy}
                    diferenciasUltimoConteo={diferenciasUltimoConteo}
                    ubicacionInfo={ubicacionInfo}
                />

                {/* Report buttons */}
                <WeeklyReportButton
                    onGenerate={handleWeeklyReport}
                    onExportCSV={handleExportCSV}
                />

                {/* Content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Stock Alerts */}
                    <StockAlerts stockBajo={stockBajo} />

                    {/* Expiration Alerts */}
                    <ExpirationAlerts productos={productosSemaforo} />
                </div>

                {/* Recent Activity */}
                <RecentActivity movimientos={movimientosRecientes} />

                {/* History link */}
                <Link 
                    href="/inventory?tab=historial"
                    className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-brand-600"
                >
                    <History size={20} />
                    <span className="font-semibold">Ver historial completo de conteos</span>
                </Link>

            </div>
            </PullToRefresh>
        </div>
    );
}
