'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    MOCK_PRODUCTOS, MOCK_MOVIMIENTOS,
    MOCK_CATEGORIAS, MOCK_CONTEOS,
} from '@/lib/mockDataStore';

// ─── Detect if Firebase is configured ────────────────────────────────────
export const USE_MOCK = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_USE_MOCK === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    : true;

if (typeof window !== 'undefined') {
    console.log('[LogINV] Modo:', USE_MOCK ? 'MOCK (datos de prueba)' : 'FIREBASE (producción)');
}

// ─── Helpers for mock timestamps ──────────────────────────────────────────
export function mockTimestamp() {
    const d = new Date();
    return { toDate: () => d, seconds: d.getTime() / 1000 };
}

// ─── Shared mock state (client-side) ──────────────────────────────────────
export let mockProductos = [...MOCK_PRODUCTOS];
export let mockMovimientos = [...MOCK_MOVIMIENTOS];
export let mockCategorias = [...MOCK_CATEGORIAS];
export let mockConteos = [...MOCK_CONTEOS];

export const listeners = {
    productos: new Set(),
    movimientos: new Set(),
    categorias: new Set(),
    conteos: new Set(),
};

export function notify(key) {
    const dataMap = {
        productos: mockProductos,
        movimientos: mockMovimientos,
        categorias: mockCategorias,
        conteos: mockConteos,
    };
    listeners[key]?.forEach(fn => fn([...dataMap[key]]));
}

// ─── Setter functions for mock data ──────────────────────────────────────
export function setMockProductos(data) { mockProductos = data; }
export function setMockMovimientos(data) { mockMovimientos = data; }
export function setMockCategorias(data) { mockCategorias = data; }
export function setMockConteos(data) { mockConteos = data; }

// ─── Lazy Firestore imports ───────────────────────────────────────────────
let _fs = null;
let _db = null;

export async function getFirestore() {
    if (_fs && _db) return { fs: _fs, db: _db };
    _fs = await import('firebase/firestore');
    const fbMod = await import('@/lib/firebase');
    _db = fbMod.db;
    return { fs: _fs, db: _db };
}

// ─── Error helper ─────────────────────────────────────────────────────────
export function firebaseError(operation, err) {
    const code = err?.code || '';
    const msg = err?.message || String(err);
    console.error(`[LogINV] Error en ${operation}:`, code, msg);

    if (code === 'permission-denied' || code === 'PERMISSION_DENIED' || msg.includes('Missing or insufficient permissions')) {
        throw new Error(
            'Permisos denegados en Firestore. Revisa las Security Rules en Firebase Console → Firestore → Rules. ' +
            'Asegúrate de que permiten lectura/escritura.'
        );
    }
    if (code === 'failed-precondition' || msg.includes('index')) {
        throw new Error(
            'Firestore requiere un índice para esta consulta. Revisa la consola del navegador para obtener el enlace de creación del índice.'
        );
    }
    if (code === 'unavailable' || code === 'resource-exhausted') {
        throw new Error('Firebase no disponible. Verifica tu conexión a internet.');
    }
    throw new Error(msg || `Error en operación: ${operation}`);
}

// ─── Shared query hook with fallback ─────────────────────────────────────
export function useFirestoreQuery(collectionName, options = {}) {
    const { 
        orderByField = null, 
        orderByDirection = 'asc',
        mockDataKey = null,
        mockData = null
    } = options;
    
    const [data, setData] = useState(USE_MOCK ? (mockData || []) : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            const initialData = mockData || [];
            setData([...initialData]);
            if (mockDataKey && listeners[mockDataKey]) {
                listeners[mockDataKey].add(setData);
                return () => listeners[mockDataKey].delete(setData);
            }
            return;
        }

        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                let q;
                
                if (orderByField) {
                    q = fs.query(
                        fs.collection(db, collectionName), 
                        fs.orderBy(orderByField, orderByDirection)
                    );
                } else {
                    q = fs.collection(db, collectionName);
                }

                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error(`[LogINV] Error listener ${collectionName}:`, err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        
                        // Fallback: try without orderBy if index is missing
                        if (orderByField && (err.code === 'failed-precondition' || err.message?.includes('index'))) {
                            console.warn(`[LogINV] Intentando ${collectionName} sin orderBy...`);
                            const qSimple = fs.collection(db, collectionName);
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error(`[LogINV] Error fallback ${collectionName}:`, fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error(`[LogINV] Error setup ${collectionName}:`, err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, [collectionName, orderByField, orderByDirection, mockDataKey, mockData]);

    return { data, loading, error, setData };
}
