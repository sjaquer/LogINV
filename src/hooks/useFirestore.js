'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  useFirestore - LogINV v2.0
//  Archivo índice que exporta todos los hooks de Firestore
//  Los hooks individuales se encuentran en archivos separados
// ═══════════════════════════════════════════════════════════════════════════

// Re-exportar todos los hooks de Firestore
export { useCategorias } from './useCategorias';
export { useProductos } from './useProductos';
export { useMovimientos, useCrearMovimiento } from './useMovimientos';
export { useConteos } from './useConteos';

// Re-exportar helpers y utilidades
export { 
    USE_MOCK, 
    mockTimestamp, 
    getFirestore, 
    firebaseError,
    useFirestoreQuery 
} from './useFirestoreQuery';
