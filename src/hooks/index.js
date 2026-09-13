// ═══════════════════════════════════════════════════════════════════════════
//  HOOKS INDEX - LogINV v2.0
//  Exportaciones centralizadas de todos los hooks
// ═══════════════════════════════════════════════════════════════════════════

// Hooks de escape y cierre de modales
export { useEscapeKey, useModalEscape, useClickOutside, useModalClose } from './useEscapeKey';

// Hooks de Firestore
export { useCategorias } from './useCategorias';
export { useProductos } from './useProductos';
export { useRequerimientos } from './useRequerimientos';
export { useMovimientos, useCrearMovimiento } from './useMovimientos';
export { useConteos } from './useConteos';

// Hooks de ubicaciones
export { useLocations } from './useLocations';

// Hooks de préstamos
export { useLoans } from './useLoans';

// Hooks de mantenimiento
export { useMaintenance } from './useMaintenance';

// Hooks de usuarios
// export { useUsers } from './useUsers';

// Hooks de auditoría
// export { useAudit } from './useAudit';

// Hooks de Google Drive
// export { useGoogleDrive } from './useGoogleDrive';
