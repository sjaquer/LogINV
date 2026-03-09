'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    MOCK_PRODUCTOS, MOCK_REQUERIMIENTOS, MOCK_MOVIMIENTOS,
    MOCK_CATEGORIAS, MOCK_CONTEOS,
} from '@/lib/mockDataStore';

// ─── Detect if Firebase is configured ────────────────────────────────────
const USE_MOCK = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_USE_MOCK === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    : true;

if (typeof window !== 'undefined') {
    console.log('[LogINV] Modo:', USE_MOCK ? 'MOCK (datos de prueba)' : 'FIREBASE (producción)');
}

// ─── Helpers for mock timestamps ──────────────────────────────────────────
function mockTimestamp() {
    const d = new Date();
    return { toDate: () => d, seconds: d.getTime() / 1000 };
}

// ─── Shared mock state (client-side) ──────────────────────────────────────
let mockProductos = [...MOCK_PRODUCTOS];
let mockRequerimientos = [...MOCK_REQUERIMIENTOS];
let mockMovimientos = [...MOCK_MOVIMIENTOS];
let mockCategorias = [...MOCK_CATEGORIAS];
let mockConteos = [...MOCK_CONTEOS];

const listeners = {
    productos: new Set(),
    requerimientos: new Set(),
    movimientos: new Set(),
    categorias: new Set(),
    conteos: new Set(),
};

function notify(key) {
    const dataMap = {
        productos: mockProductos,
        requerimientos: mockRequerimientos,
        movimientos: mockMovimientos,
        categorias: mockCategorias,
        conteos: mockConteos,
    };
    listeners[key].forEach(fn => fn([...dataMap[key]]));
}

// ─── Lazy Firestore imports ───────────────────────────────────────────────
let _fs = null;
let _db = null;

async function getFirestore() {
    if (_fs && _db) return { fs: _fs, db: _db };
    _fs = await import('firebase/firestore');
    const fbMod = await import('@/lib/firebase');
    _db = fbMod.db;
    return { fs: _fs, db: _db };
}

// ─── Error helper ─────────────────────────────────────────────────────────
function firebaseError(operation, err) {
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

// ═══════════════════════════════════════════════════════════════════════════
//  useCategorias – CRUD for product categories
// ═══════════════════════════════════════════════════════════════════════════
export function useCategorias() {
    const [categorias, setCategorias] = useState(USE_MOCK ? mockCategorias : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setCategorias([...mockCategorias]);
            listeners.categorias.add(setCategorias);
            return () => listeners.categorias.delete(setCategorias);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'categorias'), fs.orderBy('orden', 'asc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener categorias:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        // Fallback: try without orderBy if index is missing
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            console.warn('[LogINV] Intentando sin orderBy...');
                            const qSimple = fs.collection(db, 'categorias');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback categorias:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup categorias:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    const crearCategoria = useCallback(async (data) => {
        if (USE_MOCK) {
            const newCat = {
                id: 'cat_' + Date.now(),
                ...data,
                orden: mockCategorias.length + 1,
                activa: true,
                fecha_creacion: mockTimestamp(),
            };
            mockCategorias = [...mockCategorias, newCat];
            notify('categorias');
            return newCat.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const ref = await fs.addDoc(fs.collection(db, 'categorias'), {
                ...data,
                orden: categorias.length + 1,
                activa: true,
                fecha_creacion: fs.serverTimestamp(),
            });
            return ref.id;
        } catch (err) {
            firebaseError('crearCategoria', err);
        }
    }, [categorias]);

    const actualizarCategoria = useCallback(async (id, data) => {
        if (USE_MOCK) {
            mockCategorias = mockCategorias.map(c => c.id === id ? { ...c, ...data } : c);
            notify('categorias');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'categorias', id), data);
        } catch (err) {
            firebaseError('actualizarCategoria', err);
        }
    }, []);

    const eliminarCategoria = useCallback(async (id) => {
        if (USE_MOCK) {
            mockCategorias = mockCategorias.filter(c => c.id !== id);
            notify('categorias');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.deleteDoc(fs.doc(db, 'categorias', id));
        } catch (err) {
            firebaseError('eliminarCategoria', err);
        }
    }, []);

    return { categorias, loading, error, crearCategoria, actualizarCategoria, eliminarCategoria };
}

// ═══════════════════════════════════════════════════════════════════════════
//  useProductos – Full CRUD for productos + stock/merma ops
// ═══════════════════════════════════════════════════════════════════════════
export function useProductos() {
    const [productos, setProductos] = useState(USE_MOCK ? mockProductos : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setProductos([...mockProductos]);
            listeners.productos.add(setProductos);
            return () => listeners.productos.delete(setProductos);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'productos'), fs.orderBy('nombre'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener productos:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'productos');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback productos:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup productos:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    // ── Create ──
    const crearProducto = useCallback(async (data) => {
        if (USE_MOCK) {
            const newProd = {
                id: 'p_' + Date.now(),
                ...data,
                stock_actual: data.stock_actual || 0,
                fecha_vencimiento: data.fecha_vencimiento
                    ? { toDate: () => new Date(data.fecha_vencimiento), seconds: new Date(data.fecha_vencimiento).getTime() / 1000 }
                    : null,
                ultima_actualizacion: mockTimestamp(),
                fecha_creacion: mockTimestamp(),
                activo: true,
            };
            mockProductos = [...mockProductos, newProd];
            notify('productos');
            if (data.stock_actual > 0) {
                const mov = {
                    id: 'mv_' + Date.now(),
                    producto_id: newProd.id,
                    nombre_producto: data.nombre,
                    tipo: 'INGRESO',
                    cantidad: data.stock_actual,
                    usuario: data._usuario || 'Sistema',
                    ubicacion: data.ubicacion || '',
                    fecha: mockTimestamp(),
                    motivo_merma: null,
                    notas: 'Stock inicial al crear producto',
                };
                mockMovimientos = [mov, ...mockMovimientos];
                notify('movimientos');
            }
            return newProd.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const docData = {
                ...data,
                stock_actual: data.stock_actual || 0,
                fecha_vencimiento: data.fecha_vencimiento ? fs.Timestamp.fromDate(new Date(data.fecha_vencimiento)) : null,
                ultima_actualizacion: fs.serverTimestamp(),
                fecha_creacion: fs.serverTimestamp(),
                activo: true,
            };
            const usuario = docData._usuario || 'Sistema';
            delete docData._usuario;
            const ref = await fs.addDoc(fs.collection(db, 'productos'), docData);
            if (data.stock_actual > 0) {
                await fs.addDoc(fs.collection(db, 'movimientos'), {
                    producto_id: ref.id,
                    nombre_producto: data.nombre,
                    tipo: 'INGRESO',
                    cantidad: data.stock_actual,
                    usuario,
                    ubicacion: docData.ubicacion || '',
                    fecha: fs.serverTimestamp(),
                    motivo_merma: null,
                    notas: 'Stock inicial al crear producto',
                });
            }
            return ref.id;
        } catch (err) {
            firebaseError('crearProducto', err);
        }
    }, []);

    // ── Update ──
    const actualizarProducto = useCallback(async (id, data) => {
        if (USE_MOCK) {
            mockProductos = mockProductos.map(p => {
                if (p.id !== id) return p;
                const updated = { ...p, ...data, ultima_actualizacion: mockTimestamp() };
                if (data.fecha_vencimiento && typeof data.fecha_vencimiento === 'string') {
                    updated.fecha_vencimiento = {
                        toDate: () => new Date(data.fecha_vencimiento),
                        seconds: new Date(data.fecha_vencimiento).getTime() / 1000,
                    };
                }
                return updated;
            });
            notify('productos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            const updateData = { ...data, ultima_actualizacion: fs.serverTimestamp() };
            if (data.fecha_vencimiento && typeof data.fecha_vencimiento === 'string') {
                updateData.fecha_vencimiento = fs.Timestamp.fromDate(new Date(data.fecha_vencimiento));
            }
            await fs.updateDoc(fs.doc(db, 'productos', id), updateData);
        } catch (err) {
            firebaseError('actualizarProducto', err);
        }
    }, []);

    // ── Delete ──
    const eliminarProducto = useCallback(async (id) => {
        if (USE_MOCK) {
            mockProductos = mockProductos.filter(p => p.id !== id);
            notify('productos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.deleteDoc(fs.doc(db, 'productos', id));
        } catch (err) {
            firebaseError('eliminarProducto', err);
        }
    }, []);

    // ── Update Stock (inbound) ──
    const updateStock = useCallback(async (id, nuevoStock, usuario) => {
        if (USE_MOCK) {
            const prod = mockProductos.find(p => p.id === id);
            if (!prod) return;
            const diff = nuevoStock - prod.stock_actual;
            mockProductos = mockProductos.map(p =>
                p.id === id ? { ...p, stock_actual: nuevoStock, ultima_actualizacion: mockTimestamp() } : p
            );
            notify('productos');
            const mov = {
                id: 'mv_' + Date.now(),
                producto_id: id,
                nombre_producto: prod.nombre,
                tipo: diff >= 0 ? 'INGRESO' : 'SALIDA',
                cantidad: Math.abs(diff),
                usuario,
                ubicacion: prod.ubicacion || '',
                fecha: mockTimestamp(),
                motivo_merma: null,
            };
            mockMovimientos = [mov, ...mockMovimientos];
            notify('movimientos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            const prodSnap = productos.find(p => p.id === id);
            const diff = nuevoStock - (prodSnap?.stock_actual || 0);
            await fs.updateDoc(fs.doc(db, 'productos', id), {
                stock_actual: nuevoStock,
                ultima_actualizacion: fs.serverTimestamp(),
            });
            await fs.addDoc(fs.collection(db, 'movimientos'), {
                producto_id: id,
                nombre_producto: prodSnap?.nombre || '',
                tipo: diff >= 0 ? 'INGRESO' : 'SALIDA',
                cantidad: Math.abs(diff),
                usuario,
                ubicacion: prodSnap?.ubicacion || '',
                fecha: fs.serverTimestamp(),
                motivo_merma: null,
            });
        } catch (err) {
            firebaseError('updateStock', err);
        }
    }, [productos]);

    // ── Register loss (merma) ──
    const registrarMerma = useCallback(async (id, cantidad, usuario, motivo) => {
        if (USE_MOCK) {
            const prod = mockProductos.find(p => p.id === id);
            if (!prod) return;
            const nuevoStock = Math.max(0, prod.stock_actual - cantidad);
            mockProductos = mockProductos.map(p =>
                p.id === id ? { ...p, stock_actual: nuevoStock, ultima_actualizacion: mockTimestamp() } : p
            );
            const mov = {
                id: 'mv_' + Date.now(),
                producto_id: id,
                nombre_producto: prod.nombre,
                tipo: 'MERMA',
                cantidad,
                usuario,
                ubicacion: prod.ubicacion || '',
                fecha: mockTimestamp(),
                motivo_merma: motivo,
            };
            mockMovimientos = [mov, ...mockMovimientos];
            notify('productos');
            notify('movimientos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            const prodSnap = productos.find(p => p.id === id);
            if (!prodSnap) return;
            const nuevoStock = Math.max(0, prodSnap.stock_actual - cantidad);
            await fs.updateDoc(fs.doc(db, 'productos', id), {
                stock_actual: nuevoStock,
                ultima_actualizacion: fs.serverTimestamp(),
            });
            await fs.addDoc(fs.collection(db, 'movimientos'), {
                producto_id: id,
                nombre_producto: prodSnap.nombre,
                tipo: 'MERMA',
                cantidad,
                usuario,
                ubicacion: prodSnap.ubicacion || '',
                fecha: fs.serverTimestamp(),
                motivo_merma: motivo,
            });
        } catch (err) {
            firebaseError('registrarMerma', err);
        }
    }, [productos]);

    return {
        productos, loading, error,
        crearProducto, actualizarProducto, eliminarProducto,
        updateStock, registrarMerma,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
//  useRequerimientos
// ═══════════════════════════════════════════════════════════════════════════
export function useRequerimientos() {
    const [requerimientos, setRequerimientos] = useState(USE_MOCK ? mockRequerimientos : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setRequerimientos([...mockRequerimientos]);
            listeners.requerimientos.add(setRequerimientos);
            return () => listeners.requerimientos.delete(setRequerimientos);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'requerimientos'), fs.orderBy('fecha_creacion', 'desc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setRequerimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener requerimientos:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'requerimientos');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setRequerimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback requerimientos:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup requerimientos:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
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
            notify('requerimientos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'requerimientos', id), {
                estado: nuevoEstado,
                logs: fs.arrayUnion({ usuario, accion: accionMap[nuevoEstado] || 'Actualizó', fecha: new Date().toISOString() }),
            });
        } catch (err) {
            firebaseError('cambiarEstado', err);
        }
    }, []);

    const crearRequerimiento = useCallback(async (items, solicitante) => {
        if (USE_MOCK) {
            const newReq = {
                id: 'req_' + Date.now(),
                fecha_creacion: mockTimestamp(),
                solicitante,
                items,
                estado: 'PENDIENTE',
                logs: [{ usuario: solicitante, accion: 'Creó el requerimiento', fecha: new Date().toISOString() }],
            };
            mockRequerimientos = [newReq, ...mockRequerimientos];
            notify('requerimientos');
            return newReq.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const ref = await fs.addDoc(fs.collection(db, 'requerimientos'), {
                fecha_creacion: fs.serverTimestamp(),
                solicitante,
                items,
                estado: 'PENDIENTE',
                logs: [{ usuario: solicitante, accion: 'Creó el requerimiento', fecha: new Date().toISOString() }],
            });
            return ref.id;
        } catch (err) {
            firebaseError('crearRequerimiento', err);
        }
    }, []);

    return { requerimientos, loading, error, cambiarEstado, crearRequerimiento };
}

// ═══════════════════════════════════════════════════════════════════════════
//  useMovimientos
// ═══════════════════════════════════════════════════════════════════════════
export function useMovimientos() {
    const [movimientos, setMovimientos] = useState(USE_MOCK ? mockMovimientos : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setMovimientos([...mockMovimientos]);
            listeners.movimientos.add(setMovimientos);
            return () => listeners.movimientos.delete(setMovimientos);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'movimientos'), fs.orderBy('fecha', 'desc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setMovimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener movimientos:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'movimientos');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setMovimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback movimientos:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup movimientos:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    return { movimientos, loading, error };
}

// ═══════════════════════════════════════════════════════════════════════════
//  useConteos – Daily inventory counts
// ═══════════════════════════════════════════════════════════════════════════
export function useConteos() {
    const [conteos, setConteos] = useState(USE_MOCK ? mockConteos : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setConteos([...mockConteos]);
            listeners.conteos.add(setConteos);
            return () => listeners.conteos.delete(setConteos);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'conteos'), fs.orderBy('fecha', 'desc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setConteos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener conteos:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'conteos');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setConteos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback conteos:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup conteos:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    const crearConteo = useCallback(async (data) => {
        if (USE_MOCK) {
            const newConteo = {
                id: 'cnt_' + Date.now(),
                ...data,
                fecha: mockTimestamp(),
                estado: 'EN_PROGRESO',
                items: data.items || [],
                fecha_cierre: null,
            };
            mockConteos = [newConteo, ...mockConteos];
            notify('conteos');
            return newConteo.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const ref = await fs.addDoc(fs.collection(db, 'conteos'), {
                ...data,
                fecha: fs.serverTimestamp(),
                estado: 'EN_PROGRESO',
                items: data.items || [],
                fecha_cierre: null,
            });
            return ref.id;
        } catch (err) {
            firebaseError('crearConteo', err);
        }
    }, []);

    const actualizarConteo = useCallback(async (id, data) => {
        if (USE_MOCK) {
            mockConteos = mockConteos.map(c => c.id === id ? { ...c, ...data } : c);
            notify('conteos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'conteos', id), data);
        } catch (err) {
            firebaseError('actualizarConteo', err);
        }
    }, []);

    const finalizarConteo = useCallback(async (id) => {
        if (USE_MOCK) {
            mockConteos = mockConteos.map(c =>
                c.id === id ? { ...c, estado: 'COMPLETADO', fecha_cierre: mockTimestamp() } : c
            );
            notify('conteos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'conteos', id), {
                estado: 'COMPLETADO',
                fecha_cierre: fs.serverTimestamp(),
            });
        } catch (err) {
            firebaseError('finalizarConteo', err);
        }
    }, []);

    return { conteos, loading, error, crearConteo, actualizarConteo, finalizarConteo };
}
