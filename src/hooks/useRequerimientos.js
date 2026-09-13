'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, mockRequerimientos, 
    listeners, notify, getFirestore, firebaseError, setMockRequerimientos 
} from './useFirestoreQuery';

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
            setMockRequerimientos(mockRequerimientos.map(r =>
                r.id === id
                    ? {
                        ...r,
                        estado: nuevoEstado,
                        logs: [...(r.logs || []), { usuario, accion: accionMap[nuevoEstado] || 'Actualizó', fecha: new Date().toISOString() }],
                    }
                    : r
            ));
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
            setMockRequerimientos([newReq, ...mockRequerimientos]);
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
