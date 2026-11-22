'use client';
import Link from 'next/link';
import { ScanBarcode, ClipboardList, Package, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/lib/routePermissions';

const ACTIONS = [
    { href: '/scan', icon: ScanBarcode, label: 'Escanear', hint: 'Buscar por código', tone: 'text-brand-600 bg-brand-50 ring-brand-100' },
    { href: '/inventario', icon: ClipboardList, label: 'Conteo', hint: 'Inventario físico', tone: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
    { href: '/inventario?tab=rapido', icon: Package, label: 'Stock', hint: 'Ingresos y salidas', tone: 'text-amber-600 bg-amber-50 ring-amber-100' },
    { href: '/locations', icon: MapPin, label: 'Ubicaciones', hint: 'Salones y almacenes', tone: 'text-violet-600 bg-violet-50 ring-violet-100' },
];

export default function QuickActions() {
    const { user } = useAuth();
    // Solo mostrar accesos a secciones que el rol puede abrir.
    const actions = ACTIONS.filter(a => canAccess(a.href.split('?')[0], user?.rol));
    if (actions.length === 0) return null;

    return (
        <nav aria-label="Accesos rápidos" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {actions.map(({ href, icon: Icon, label, hint, tone }) => (
                <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-surface p-3 sm:p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
                >
                    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${tone}`}>
                        <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">{label}</span>
                        <span className="block truncate text-[11px] text-slate-400">{hint}</span>
                    </span>
                </Link>
            ))}
        </nav>
    );
}
