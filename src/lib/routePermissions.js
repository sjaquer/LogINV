// ═══════════════════════════════════════════════════════════════════════════
//  ROUTE PERMISSIONS  – LogINV
//  Mapeo centralizado de rutas protegidas → roles con acceso permitido.
//  Usado por RouteGuard y por el Sidebar para filtrar el menú de navegación.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Roles disponibles en el sistema.
 * admin     → acceso completo
 * encargado → no puede entrar a /admin/users
 * voluntario → solo Dashboard, Productos, Escanear, Préstamos
 */

// Rutas privadas y los roles que pueden acceder.
// Si una ruta NO aparece aquí se asume que cualquier usuario autenticado puede entrar.
export const ROUTE_PERMISSIONS = {
    '/admin/users':   ['admin'],
    '/reports':       ['admin', 'encargado'],
    '/maintenance':   ['admin', 'encargado'],
    '/locations':     ['admin', 'encargado'],
    '/inventario':    ['admin', 'encargado'],
    '/loans':         ['admin', 'encargado', 'voluntario'],
    '/scan':          ['admin', 'encargado', 'voluntario'],
    '/productos':     ['admin', 'encargado', 'voluntario'],
    '/':              ['admin', 'encargado', 'voluntario'],
};

/**
 * Comprueba si un rol tiene acceso a una ruta.
 * Usa coincidencia por prefijo para rutas anidadas (ej. /admin/users/edit).
 *
 * @param {string} pathname  - Ruta actual (ej. '/admin/users')
 * @param {string} role      - Rol del usuario (ej. 'admin')
 * @returns {boolean}
 */
export function canAccess(pathname, role) {
    // Sin rol → sin acceso
    if (!role) return false;

    const normalizedRole = String(role).toLowerCase().trim();
    const cleanPath = (pathname || '').replace(/\/$/, '') || '/';

    // Buscar la entrada más específica (más larga) que coincida como prefijo
    const matchingKey = Object.keys(ROUTE_PERMISSIONS)
        .filter(route => route === '/' ? cleanPath === '/' : cleanPath.startsWith(route))
        .sort((a, b) => b.length - a.length)[0];

    // Ruta no listada → acceso libre para cualquier autenticado
    if (!matchingKey) return true;

    return ROUTE_PERMISSIONS[matchingKey].some(r => r.toLowerCase() === normalizedRole);
}

/**
 * Devuelve las rutas de nav a las que el rol tiene acceso.
 * Útil para filtrar el Sidebar.
 *
 * @param {string} role
 * @returns {string[]}  array de prefijos de ruta permitidos
 */
export function allowedRoutes(role) {
    return Object.keys(ROUTE_PERMISSIONS).filter(r => canAccess(r, role));
}
