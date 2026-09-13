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
        if (USE_MOCK) {
            const newProd = {
                id: 'p_' + Date.now(),
                ...data,
                stock_actual: data.stock_actual || 0,
                ultima_actualizacion: mockTimestamp(),
                fecha_creacion: mockTimestamp(),
                activo: true,
            };
            setMockProductos([...mockProductos, newProd]);
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
                setMockMovimientos([mov, ...mockMovimientos]);
                notify('movimientos');
            }
            return newProd.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const docData = {
                ...data,
                stock_actual: data.stock_actual || 0,
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

    const actualizarProducto = useCallback(async (id, data) => {
        if (USE_MOCK) {
            const updated = mockProductos.map(p =>
                p.id === id ? { ...p, ...data, ultima_actualizacion: mockTimestamp() } : p
            );
            setMockProductos(updated);
            notify('productos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'productos', id), { ...data, ultima_actualizacion: fs.serverTimestamp() });
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
        if (USE_MOCK) {
            const prod = mockProductos.find(p => p.id === id);
            if (!prod) return;
            const diff = nuevoStock - prod.stock_actual;
            setMockProductos(mockProductos.map(p =>
                p.id === id ? { ...p, stock_actual: nuevoStock, ultima_actualizacion: mockTimestamp() } : p
            ));
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
            setMockMovimientos([mov, ...mockMovimientos]);
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

    return {
        productos, loading, error,
        crearProducto, actualizarProducto, eliminarProducto,
        updateStock,
    };
}
