// ═══════════════════════════════════════════════════════════════════════════
//  Navegación - LogINV
//  Fuente única de las secciones de la app: la usan el menú lateral, la
//  barra inferior móvil, la hoja "Más" y la guía de ayuda.
// ═══════════════════════════════════════════════════════════════════════════

import {
    LayoutDashboard, Package, ClipboardList, ScanBarcode, MapPin, Handshake,
    Wrench, FileText, Users, ShieldCheck, LifeBuoy,
} from 'lucide-react';
import { canAccess } from '@/lib/routePermissions';

export const NAV_GROUPS = [
    { id: 'operacion', label: 'Operación' },
    { id: 'gestion', label: 'Gestión' },
    { id: 'admin', label: 'Administración' },
];

export const NAV_ITEMS = [
    { href: '/', label: 'Panel de control', short: 'Panel', icon: LayoutDashboard, group: 'operacion', hint: 'Resumen y alertas' },
    { href: '/productos', label: 'Productos', short: 'Productos', icon: Package, group: 'operacion', hint: 'Catálogo de artículos' },
    { href: '/scan', label: 'Escanear', short: 'Escanear', icon: ScanBarcode, group: 'operacion', hint: 'Buscar por código' },
    { href: '/inventario', label: 'Inventario', short: 'Inventario', icon: ClipboardList, group: 'operacion', hint: 'Conteos y stock' },
    { href: '/loans', label: 'Préstamos', short: 'Préstamos', icon: Handshake, group: 'operacion', hint: 'Salidas temporales' },
    { href: '/locations', label: 'Ubicaciones', short: 'Ubicaciones', icon: MapPin, group: 'gestion', hint: 'Salones y almacenes' },
    { href: '/maintenance', label: 'Mantenimiento', short: 'Mantenim.', icon: Wrench, group: 'gestion', hint: 'Revisiones y reparaciones' },
    { href: '/reports', label: 'Reportes', short: 'Reportes', icon: FileText, group: 'gestion', hint: 'Excel e impresión' },
    { href: '/admin/users', label: 'Usuarios', short: 'Usuarios', icon: Users, group: 'admin', hint: 'Cuentas y roles' },
    { href: '/auditoria', label: 'Auditoría', short: 'Auditoría', icon: ShieldCheck, group: 'admin', hint: 'Quién hizo qué y cuándo' },
    { href: '/ayuda', label: 'Ayuda y guía', short: 'Ayuda', icon: LifeBuoy, group: 'ayuda', hint: 'Cómo usar LogINV' },
];

export function navItemsFor(role) {
    return NAV_ITEMS.filter(item => canAccess(item.href, role));
}

export function isActivePath(pathname, href) {
    return href === '/' ? pathname === '/' : pathname?.startsWith(href);
}

/** Accesos de la barra inferior móvil (4 + botón "Más"). */
export function bottomNavFor(role) {
    const allowed = navItemsFor(role);
    const pick = (href) => allowed.find(i => i.href === href);
    const fourth = pick('/inventario') || pick('/loans');
    return [pick('/'), pick('/productos'), pick('/scan'), fourth].filter(Boolean);
}
