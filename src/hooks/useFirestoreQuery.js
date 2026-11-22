'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  Utilidades base de datos - LogINV
//  Modo (Firebase / demo), carga diferida de Firestore y traducción de errores.
// ═══════════════════════════════════════════════════════════════════════════

export { mockTimestamp } from '@/lib/mockStore';

// Modo demo: sin proyecto de Firebase configurado o forzado por variable.
export const USE_MOCK =
    process.env.NEXT_PUBLIC_USE_MOCK === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let _fs = null;
let _db = null;

export async function getFirestore() {
    if (_fs && _db) return { fs: _fs, db: _db };
    _fs = await import('firebase/firestore');
    const fbMod = await import('@/lib/firebase');
    _db = fbMod.db;
    return { fs: _fs, db: _db };
}

export function firebaseError(operation, err) {
    const code = err?.code || '';
    const msg = err?.message || String(err);
    console.error(`[LogINV] Error en ${operation}:`, code, msg);

    if (code === 'permission-denied' || msg.includes('Missing or insufficient permissions')) {
        throw new Error('No tienes permisos para realizar esta acción. Si crees que es un error, contacta a un administrador.');
    }
    if (code === 'failed-precondition' || msg.includes('index')) {
        throw new Error('Firestore requiere un índice para esta consulta. Revisa la consola del navegador para obtener el enlace de creación del índice.');
    }
    if (code === 'unavailable' || code === 'resource-exhausted') {
        throw new Error('Sin conexión con el servidor. Verifica tu conexión a internet.');
    }
    throw new Error(msg || `Error en operación: ${operation}`);
}
