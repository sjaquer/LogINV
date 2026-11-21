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

    /**
     * Actualiza el stock de un producto y registra UN movimiento, de forma
     * atómica (transacción): el stock anterior se lee del servidor, no del
     * estado en caché del cliente, para que dos usuarios operando a la vez
     * no se pisen.
     *
     * @param {string} id
     * @param {number} valor          stock final (modo 'set') o cantidad (modo 'delta')
     * @param {string} usuario
     * @param {object} [opts]
     * @param {'set'|'delta'} [opts.modo='set']
     * @param {string} [opts.tipo]    INGRESO | SALIDA | AJUSTE… (por defecto según el signo)
     * @param {string} [opts.motivo]
     * @returns {Promise<{anterior:number, nuevo:number}|undefined>}
     */
    const updateStock = useCallback(async (id, valor, usuario, opts = {}) => {
        const { modo = 'set', tipo, motivo = 'Ajuste de stock' } = opts;
        const num = Number(valor) || 0;
        const calcular = (anterior) => {
            const nuevo = modo === 'delta' ? Math.max(0, anterior + num) : Math.max(0, num);
            const diff = nuevo - anterior;
            return { nuevo, diff, tipoFinal: tipo || (diff >= 0 ? 'INGRESO' : 'SALIDA') };
        };

        if (USE_MOCK) {
            const prod = mockProductos.find(p => p.id === id);
            if (!prod) return;
            const anterior = Number(prod.stock_actual) || 0;
            const { nuevo, diff, tipoFinal } = calcular(anterior);
            setMockProductos(mockProductos.map(p =>
                p.id === id ? { ...p, stock_actual: nuevo, ultima_actualizacion: mockTimestamp() } : p
            ));
            notify('productos');
            setMockMovimientos([{
                id: 'mv_' + Date.now(),
                producto_id: id,
                nombre_producto: prod.nombre,
                producto_nombre: prod.nombre,
                tipo: tipoFinal,
                cantidad: Math.abs(diff),
                usuario: usuario || 'Sistema',
                ubicacion: prod.ubicacion || '',
                fecha: mockTimestamp(),
                motivo,
                notas: motivo,
                stock_anterior: anterior,
                stock_nuevo: nuevo,
            }, ...mockMovimientos]);
            notify('movimientos');
            return { anterior, nuevo };
        }
        try {
            const { fs, db } = await getFirestore();
            const prodRef = fs.doc(db, 'productos', id);
            const movRef = fs.doc(fs.collection(db, 'movimientos'));
            return await fs.runTransaction(db, async (tx) => {
                const snap = await tx.get(prodRef);
                if (!snap.exists()) throw new Error('El producto ya no existe');
                const prod = snap.data();
                const anterior = Number(prod.stock_actual) || 0;
                const { nuevo, diff, tipoFinal } = calcular(anterior);
                const nowIso = new Date().toISOString();
                tx.update(prodRef, { stock_actual: nuevo, ultima_actualizacion: nowIso });
                tx.set(movRef, {
                    producto_id: id,
                    nombre_producto: prod.nombre || '',
                    producto_nombre: prod.nombre || '',
                    tipo: tipoFinal,
                    cantidad: Math.abs(diff),
                    usuario: usuario || 'Sistema',
                    ubicacion: prod.ubicacion || '',
                    fecha: nowIso,
                    motivo,
                    notas: motivo,
                    stock_anterior: anterior,
                    stock_nuevo: nuevo,
                });
                return { anterior, nuevo };
            });
        } catch (err) {
            firebaseError('updateStock', err);
        }
    }, []);

    return {
        productos, loading, error,
        crearProducto, actualizarProducto, eliminarProducto,
        updateStock,
    };
}
