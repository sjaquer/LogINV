'use client';
import Link from 'next/link';
import { Package, ClipboardCheck, TrendingDown, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/ui/SharedComponents';

export default function KPICards({ 
    totalProductos, 
    alertasStock, 
    conteosHoy, 
    diferenciasUltimoConteo,
    ubicacionInfo 
}) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
                icon={Package}
                label="Total productos"
                value={totalProductos}
                color="brand"
                subtitle={`${ubicacionInfo.icono} ${ubicacionInfo.nombre}`}
            />
            <Link href="/inventario?tab=rapido">
                <KPICard
                    icon={AlertTriangle}
                    label="Stock bajo"
                    value={alertasStock}
                    color={alertasStock > 0 ? 'red' : 'emerald'}
                    subtitle="Requieren reposición"
                />
            </Link>
            <Link href="/inventario">
                <KPICard
                    icon={ClipboardCheck}
                    label="Conteos hoy"
                    value={conteosHoy}
                    color="violet"
                    subtitle="Inventario físico"
                />
            </Link>
            <Link href="/inventario?tab=historial">
                <KPICard
                    icon={TrendingDown}
                    label="Diferencias"
                    value={diferenciasUltimoConteo}
                    color={diferenciasUltimoConteo > 0 ? 'amber' : 'emerald'}
                    subtitle="Último conteo"
                />
            </Link>
        </div>
    );
}
