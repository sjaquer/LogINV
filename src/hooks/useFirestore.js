'use client';
import { useState, useEffect, useCallback } from 'react';
import { MOCK_PRODUCTOS, MOCK_REQUERIMIENTOS, MOCK_MOVIMIENTOS } from '@/lib/mockDataStore';

// ─── Detect if Firebase is configured ────────────────────────────────────
function isFirebaseConfigured() {
    // Returns false until Firebase credentials are set and USE_MOCK is turned off
    return false;
}

const USE_MOCK = true; // Set to false after configuring Firebase in src/lib/firebase.js

// ─── Mock state management (client-side only mutations for demo) ──────────
let mockProductos = [...MOCK_PRODUCTOS];
let mockRequerimientos = [...MOCK_REQUERIMIENTOS];
let mockMovimientos = [...MOCK_MOVIMIENTOS];

const productosListeners = new Set();
const requerimientosListeners = new Set();
const movimientosListeners = new Set();

function notifyProductosListeners() {
    productosListeners.forEach(fn => fn([...mockProductos]));
}
function notifyRequerimientosListeners() {
    requerimientosListeners.forEach(fn => fn([...mockRequerimientos]));
}

// ─── useProductos ─────────────────────────────────────────────────────────

export function useProductos() {
    const [productos, setProductos] = useState(mockProductos);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (USE_MOCK) {
            setProductos([...mockProductos]);
            productosListeners.add(setProductos);
            return () => productosListeners.delete(setProductos);
        }
        // Firebase path
        setLoading(true);
        let unsub;
        import('firebase/firestore').then(({ collection, onSnapshot, query, orderBy }) => {
            import('@/lib/firebase').then(({ db }) => {
                const q = query(collection(db, 'productos'), orderBy('nombre'));
                unsub = onSnapshot(q, (snap) => {
                    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setProductos(docs);
                    setLoading(false);
                });
            });
        });
        return () => unsub?.();
    }, []);

    const updateStock = useCallback(async (id, nuevoStock, usuario) => {
        if (USE_MOCK) {
            mockProductos = mockProductos.map(p =>
                p.id === id ? { ...p, stock_actual: nuevoStock, ultima_actualizacion: { toDate: () => new Date() } } : p
            );
            notifyProductosListeners();
            return;
        }
        const { updateDoc, doc, addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await updateDoc(doc(db, 'productos', id), { stock_actual: nuevoStock, ultima_actualizacion: serverTimestamp() });
        await addDoc(collection(db, 'movimientos'), { producto_id: id, tipo: 'SALIDA', cantidad: nuevoStock, usuario, fecha: serverTimestamp(), motivo_merma: null });
    }, []);

    const registrarMerma = useCallback(async (id, cantidad, usuario, motivo) => {
        if (USE_MOCK) {
            const prod = mockProductos.find(p => p.id === id);
            if (!prod) return;
            const nuevoStock = Math.max(0, prod.stock_actual - cantidad);
            mockProductos = mockProductos.map(p =>
                p.id === id ? { ...p, stock_actual: nuevoStock, ultima_actualizacion: { toDate: () => new Date() } } : p
            );
            const newMov = {
                id: 'mv' + Date.now(),
                producto_id: id,
                nombre_producto: prod.nombre,
                tipo: 'MERMA',
                cantidad,
                usuario,
                fecha: { toDate: () => new Date() },
                motivo_merma: motivo,
            };
            mockMovimientos = [newMov, ...mockMovimientos];
            notifyProductosListeners();
            movimientosListeners.forEach(fn => fn([...mockMovimientos]));
            return;
        }
        const { updateDoc, doc, addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const prodRef = doc(db, 'productos', id);
        const prod = productos.find(p => p.id === id);
        if (!prod) return;
        const nuevoStock = Math.max(0, prod.stock_actual - cantidad);
        await updateDoc(prodRef, { stock_actual: nuevoStock, ultima_actualizacion: serverTimestamp() });
        await addDoc(collection(db, 'movimientos'), { producto_id: id, nombre_producto: prod.nombre, tipo: 'MERMA', cantidad, usuario, fecha: serverTimestamp(), motivo_merma: motivo });
    }, [productos]);

    return { productos, loading, updateStock, registrarMerma };
}

// ─── useRequerimientos ────────────────────────────────────────────────────

export function useRequerimientos() {
    const [requerimientos, setRequerimientos] = useState(mockRequerimientos);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (USE_MOCK) {
            setRequerimientos([...mockRequerimientos]);
            requerimientosListeners.add(setRequerimientos);
            return () => requerimientosListeners.delete(setRequerimientos);
        }
        setLoading(true);
        let unsub;
        import('firebase/firestore').then(({ collection, onSnapshot, query, orderBy }) => {
            import('@/lib/firebase').then(({ db }) => {
                const q = query(collection(db, 'requerimientos'), orderBy('fecha_creacion', 'desc'));
                unsub = onSnapshot(q, (snap) => {
                    setRequerimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                });
            });
        });
        return () => unsub?.();
    }, []);

    const cambiarEstado = useCallback(async (id, nuevoEstado, usuario) => {
        const accionMap = {
            APROBADO_ADMIN: 'Aprobó como Admin',
            VALIDADO_GERENCIA: 'Validó como Gerencia',
            RECHAZADO: 'Rechazó el requerimiento',
            COMPRADO: 'Marcó como Comprado',
        };
        if (USE_MOCK) {
            mockRequerimientos = mockRequerimientos.map(r =>
                r.id === id
                    ? {
                        ...r,
                        estado: nuevoEstado,
                        logs: [...(r.logs || []), { usuario, accion: accionMap[nuevoEstado] || 'Actualizó', fecha: new Date().toISOString() }],
                    }
                    : r
            );
            notifyRequerimientosListeners();
            return;
        }
        const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await updateDoc(doc(db, 'requerimientos', id), {
            estado: nuevoEstado,
            logs: arrayUnion({ usuario, accion: accionMap[nuevoEstado] || 'Actualizó', fecha: new Date().toISOString() }),
        });
    }, []);

    const crearRequerimiento = useCallback(async (items, solicitante) => {
        if (USE_MOCK) {
            const newReq = {
                id: 'req' + Date.now(),
                fecha_creacion: { toDate: () => new Date() },
                solicitante,
                items,
                estado: 'PENDIENTE',
                logs: [{ usuario: solicitante, accion: 'Creó el requerimiento', fecha: new Date().toISOString() }],
            };
            mockRequerimientos = [newReq, ...mockRequerimientos];
            notifyRequerimientosListeners();
            return;
        }
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await addDoc(collection(db, 'requerimientos'), {
            fecha_creacion: serverTimestamp(),
            solicitante,
            items,
            estado: 'PENDIENTE',
            logs: [{ usuario: solicitante, accion: 'Creó el requerimiento', fecha: new Date().toISOString() }],
        });
    }, []);

    return { requerimientos, loading, cambiarEstado, crearRequerimiento };
}

// ─── useMovimientos ───────────────────────────────────────────────────────

export function useMovimientos() {
    const [movimientos, setMovimientos] = useState(mockMovimientos);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (USE_MOCK) {
            setMovimientos([...mockMovimientos]);
            movimientosListeners.add(setMovimientos);
            return () => movimientosListeners.delete(setMovimientos);
        }
        setLoading(true);
        let unsub;
        import('firebase/firestore').then(({ collection, onSnapshot, query, orderBy }) => {
            import('@/lib/firebase').then(({ db }) => {
                const q = query(collection(db, 'movimientos'), orderBy('fecha', 'desc'));
                unsub = onSnapshot(q, (snap) => {
                    setMovimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                });
            });
        });
        return () => unsub?.();
    }, []);

    return { movimientos, loading };
}
