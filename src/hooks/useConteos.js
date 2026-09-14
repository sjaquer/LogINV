'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, mockConteos, 
    listeners, notify, getFirestore, firebaseError, setMockConteos 
} from './useFirestoreQuery';

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
            setMockConteos([newConteo, ...mockConteos]);
            notify('conteos');
            return newConteo.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const ref = await fs.addDoc(fs.collection(db, 'conteos'), {
                ...data,
                fecha: new Date().toISOString(),
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
            setMockConteos(mockConteos.map(c => c.id === id ? { ...c, ...data } : c));
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
            setMockConteos(mockConteos.map(c =>
                c.id === id ? { ...c, estado: 'COMPLETADO', fecha_cierre: mockTimestamp() } : c
            ));
            notify('conteos');
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'conteos', id), {
                estado: 'COMPLETADO',
                fecha_cierre: new Date().toISOString(),
            });
        } catch (err) {
            firebaseError('finalizarConteo', err);
        }
    }, []);

    return { conteos, loading, error, crearConteo, actualizarConteo, finalizarConteo };
}
