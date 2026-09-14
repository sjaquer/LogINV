'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, mockProductos, mockMovimientos, 
    listeners, notify, getFirestore, firebaseError, 
    setMockProductos, setMockMovimientos 
} from './useFirestoreQuery';

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

    const crearProducto = useCallback(async (data) => {
        const stockActual = Number(data.stock_actual) || 0;
        const stockMinimo = Number(data.stock_minimo) || 0;
        const usuario = data._usuario || 'Sistema';

        if (USE_MOCK) {
            const newProd = {
                id: 'p_' + Date.now(),
                ...data,
                stock_actual: stockActual,
                stock_minimo: stockMinimo,
                ultima_actualizacion: mockTimestamp(),
                fecha_creacion: mockTimestamp(),
                activo: true,
            };
            delete newProd._usuario;
            setMockProductos([...mockProductos, newProd]);
            notify('productos');
            if (stockActual > 0) {
                const mov = {
                    id: 'mv_' + Date.now(),
                    producto_id: newProd.id,
                    nombre_producto: data.nombre,
                    producto_nombre: data.nombre,
                    tipo: 'INGRESO',
                    cantidad: stockActual,
                    usuario,
                    ubicacion: data.ubicacion || '',
                    fecha: mockTimestamp(),
                    motivo: 'Stock inicial al crear producto',
                    notas: 'Stock inicial al crear producto',
                    stock_anterior: 0,
                    stock_nuevo: stockActual,
                };
                setMockMovimientos([mov, ...mockMovimientos]);
                notify('movimientos');
            }
            return newProd.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const nowIso = new Date().toISOString();
            const docData = {
                ...data,
                stock_actual: stockActual,
                stock_minimo: stockMinimo,
                ultima_actualizacion: nowIso,
                fecha_creacion: nowIso,
                activo: true,
            };
            delete docData._usuario;
            const ref = await fs.addDoc(fs.collection(db, 'productos'), docData);
            if (stockActual > 0) {
                await fs.addDoc(fs.collection(db, 'movimientos'), {
                    producto_id: ref.id,
                    nombre_producto: data.nombre,
                    producto_nombre: data.nombre,
                    tipo: 'INGRESO',
                    cantidad: stockActual,
                    usuario,
                    ubicacion: docData.ubicacion || '',
                    fecha: nowIso,
                    motivo: 'Stock inicial al crear producto',
                    notas: 'Stock inicial al crear producto',
                    stock_anterior: 0,
                    stock_nuevo: stockActual,
                });
            }
            return ref.id;
        } catch (err) {
            firebaseError('crearProducto', err);
        }
    }, []);

    const actualizarProducto = useCallback(async (id, data) => {
        const updateData = { ...data, ultima_actualizacion: new Date().toISOString() };
        if (updateData.stock_actual !== undefined) updateData.stock_actual = Number(updateData.stock_actual) || 0;
        if (updateData.stock_minimo !== undefined) updateData.stock_minimo = Number(updateData.stock_minimo) || 0;
        delete updateData._usuario;

        if (USE_MOCK) {
            const updated = mockProductos.map(p =>
                p.id === id ? { ...p, ...updateData, ultima_actualizacion: mockTimestamp() } : p
            );
            setMockProductos(updated);
            notify('productos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'productos', id), updateData);
        } catch (err) {
            firebaseError('actualizarProducto', err);
        }
    }, []);

    const eliminarProducto = useCallback(async (id) => {
        if (USE_MOCK) {
            setMockProductos(mockProductos.filter(p => p.id !== id));
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

    const updateStock = useCallback(async (id, nuevoStock, usuario) => {
        const stockNum = Number(nuevoStock) || 0;
        if (USE_MOCK) {
            const prod = mockProductos.find(p => p.id === id);
            if (!prod) return;
            const diff = stockNum - prod.stock_actual;
            setMockProductos(mockProductos.map(p =>
                p.id === id ? { ...p, stock_actual: stockNum, ultima_actualizacion: mockTimestamp() } : p
            ));
            notify('productos');
            const mov = {
                id: 'mv_' + Date.now(),
                producto_id: id,
                nombre_producto: prod.nombre,
                producto_nombre: prod.nombre,
                tipo: diff >= 0 ? 'INGRESO' : 'SALIDA',
                cantidad: Math.abs(diff),
                usuario: usuario || 'Sistema',
                ubicacion: prod.ubicacion || '',
                fecha: mockTimestamp(),
                motivo: 'Ajuste de stock',
                notas: 'Ajuste manual de stock',
                stock_anterior: prod.stock_actual,
                stock_nuevo: stockNum,
            };
            setMockMovimientos([mov, ...mockMovimientos]);
            notify('movimientos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            const prodSnap = productos.find(p => p.id === id);
            const anterior = prodSnap?.stock_actual || 0;
            const diff = stockNum - anterior;
            const nowIso = new Date().toISOString();
            await fs.updateDoc(fs.doc(db, 'productos', id), {
                stock_actual: stockNum,
                ultima_actualizacion: nowIso,
            });
            await fs.addDoc(fs.collection(db, 'movimientos'), {
                producto_id: id,
                nombre_producto: prodSnap?.nombre || '',
                producto_nombre: prodSnap?.nombre || '',
                tipo: diff >= 0 ? 'INGRESO' : 'SALIDA',
                cantidad: Math.abs(diff),
                usuario: usuario || 'Sistema',
                ubicacion: prodSnap?.ubicacion || '',
                fecha: nowIso,
                motivo: 'Ajuste de stock',
                notas: 'Ajuste manual de stock',
                stock_anterior: anterior,
                stock_nuevo: stockNum,
            });
        } catch (err) {
            firebaseError('updateStock', err);
        }
    }, [productos]);

    return {
        productos, loading, error,
        crearProducto, actualizarProducto, eliminarProducto,
        updateStock,
    };
}
