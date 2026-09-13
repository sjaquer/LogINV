'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, mockCategorias, listeners, notify, 
    getFirestore, firebaseError, setMockCategorias 
} from './useFirestoreQuery';

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
            setMockCategorias([...mockCategorias, newCat]);
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
            const updated = mockCategorias.map(c => c.id === id ? { ...c, ...data } : c);
            setMockCategorias(updated);
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
            setMockCategorias(mockCategorias.filter(c => c.id !== id));
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
