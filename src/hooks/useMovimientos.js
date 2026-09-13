'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, mockMovimientos, 
    listeners, notify, getFirestore, firebaseError, setMockMovimientos 
} from './useFirestoreQuery';

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

export function useCrearMovimiento() {
    const crearMovimiento = useCallback(async (data) => {
        if (USE_MOCK) {
            const id = 'mov_' + Date.now();
            const newMov = { id, ...data, fecha: mockTimestamp() };
            setMockMovimientos([newMov, ...mockMovimientos]);
            notify('movimientos');
            return id;
        }
        try {
            const { fs, db } = await getFirestore();
            const docRef = await fs.addDoc(fs.collection(db, 'movimientos'), {
                ...data,
                fecha: fs.serverTimestamp(),
            });
            return docRef.id;
        } catch (err) {
            firebaseError('crearMovimiento', err);
        }
    }, []);

    return crearMovimiento;
}
