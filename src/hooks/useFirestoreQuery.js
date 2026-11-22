'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  Utilidades base de datos - LogINV
//  Modo (Firebase / demo), carga diferida de Firestore y traducción de errores.
// ═══════════════════════════════════════════════════════════════════════════

import { toAppError } from '@/lib/errors';

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

/**
 * Registra el error original y lo relanza como AppError del diccionario
 * (src/lib/errors.js), para que la interfaz muestre un mensaje claro y su código.
 * Los AppError propios (ej. "El artículo ya no existe") pasan sin cambios.
 */
export function firebaseError(operation, err) {
    const appErr = toAppError(err);
    console.error(`[LogINV] ${appErr.appCode} en ${operation}:`, err?.code || '', err?.message || err);
    throw appErr;
}
