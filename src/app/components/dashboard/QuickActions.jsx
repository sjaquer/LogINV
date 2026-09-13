'use client';
import Link from 'next/link';
import { ScanBarcode, ClipboardList, Package, MapPin } from 'lucide-react';

export default function QuickActions({ ubicacionInfo }) {
    const actions = [
        {
            href: '/scan',
            icon: ScanBarcode,
            label: 'Escanear',
            color: 'bg-brand-50 text-brand-600 border-brand-200',
        },
        {
            href: '/inventario',
            icon: ClipboardList,
            label: 'Conteo',
            color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
            href: '/inventario?tab=rapido',
            icon: Package,
            label: 'Stock',
            color: 'bg-amber-50 text-amber-600 border-amber-200',
        },
        {
            href: '/locations',
            icon: MapPin,
            label: 'Ubicaciones',
            color: 'bg-violet-50 text-violet-600 border-violet-200',
        },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {actions.map((action) => (
                <Link
                    key={action.href}
                    href={action.href}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md active:scale-95 ${action.color}`}
                >
                    <action.icon size={24} />
                    <span className="text-xs font-semibold">{action.label}</span>
                </Link>
            ))}
        </div>
    );
}
