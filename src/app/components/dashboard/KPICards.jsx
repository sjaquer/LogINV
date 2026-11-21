'use client';
import Link from 'next/link';
import { Package, ClipboardCheck, TrendingDown, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/ui/SharedComponents';

export default function KPICards({ 
    totalProductos, 
    alertasStock, 
    conteosHoy, 
    diferenciasUltimoConteo,
    ubicacionInfo,
    loading,
}) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 [&>a]:block [&>a]:h-full">
            <KPICard
                icon={Package}
                label="Total productos"
                loading={loading}
                value={totalProductos}
                color="brand"
                subtitle={`${ubicacionInfo.icono} ${ubicacionInfo.nombre}`}
            />
            <Link href="/inventario?tab=rapido">
                <KPICard
                    icon={AlertTriangle}
                    label="Bajo mínimo"
                    loading={loading}
                value={alertasStock}
                    color={alertasStock > 0 ? 'red' : 'emerald'}
                    subtitle={alertasStock > 0 ? 'Requieren reposición' : 'Todo en orden'}
                />
            </Link>
            <Link href="/inventario">
                <KPICard
                    icon={ClipboardCheck}
                    label="Conteos hoy"
                    loading={loading}
                value={conteosHoy}
                    color="violet"
                    subtitle="Conteos físicos"
                />
            </Link>
            <Link href="/inventario?tab=historial">
                <KPICard
                    icon={TrendingDown}
                    label="Diferencias"
                    loading={loading}
                value={diferenciasUltimoConteo}
                    color={diferenciasUltimoConteo > 0 ? 'amber' : 'emerald'}
                    subtitle="Último conteo"
                />
            </Link>
        </div>
    );
}
