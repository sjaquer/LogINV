'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, listeners, notify, 
    getFirestore, firebaseError 
} from './useFirestoreQuery';
import { toValidDate } from '@/lib/utils';

// Mock data for maintenance
let mockMantenimientos = [
    {
        id: 'maint_1',
        producto_id: 'p_2',
        producto_nombre: 'Tequila José Cuervo 750ml',
        tipo: 'preventivo',
        descripcion: 'Revisión de almacenamiento y temperatura',
        estado: 'programado',
        fecha_programada: mockTimestamp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        fecha_inicio: null,
        fecha_fin: null,
        costo: 0,
        responsable: 'Juan Técnico',
        notas: 'Verificar temperatura del almacén',
        created_at: mockTimestamp(),
    },
    {
        id: 'maint_2',
        producto_id: 'p_8',
        producto_nombre: 'Equipo de Sonido',
        tipo: 'correctivo',
        descripcion: 'Reparación de parlante dañado',
        estado: 'completado',
        fecha_programada: mockTimestamp(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
        fecha_inicio: mockTimestamp(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)),
        fecha_fin: mockTimestamp(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        costo: 150,
        responsable: 'María Técnico',
        notas: 'Parlante reparado correctamente',
        created_at: mockTimestamp(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
    },
];

const mantenimientoListeners = new Set();

function notifyMantenimientos() {
    mantenimientoListeners.forEach(fn => fn([...mockMantenimientos]));
}

export function useMaintenance() {
    const [mantenimientos, setMantenimientos] = useState(USE_MOCK ? mockMantenimientos : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setMantenimientos([...mockMantenimientos]);
            mantenimientoListeners.add(setMantenimientos);
            return () => mantenimientoListeners.delete(setMantenimientos);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'mantenimiento'), fs.orderBy('created_at', 'desc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setMantenimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener mantenimiento:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'mantenimiento');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setMantenimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback mantenimiento:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup mantenimiento:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    const crearMantenimiento = useCallback(async (data) => {
        if (USE_MOCK) {
            const newMaint = {
                id: 'maint_' + Date.now(),
                ...data,
                estado: 'programado',
                fecha_inicio: null,
                fecha_fin: null,
                created_at: mockTimestamp(),
            };
            mockMantenimientos = [newMaint, ...mockMantenimientos];
            notifyMantenimientos();
            return newMaint.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const nowIso = new Date().toISOString();
            const ref = await fs.addDoc(fs.collection(db, 'mantenimiento'), {
                ...data,
                estado: data.estado || 'programado',
                fecha_inicio: null,
                fecha_fin: null,
                created_at: nowIso,
            });
            return ref.id;
        } catch (err) {
            firebaseError('crearMantenimiento', err);
        }
    }, []);

    const actualizarMantenimiento = useCallback(async (id, data) => {
        if (USE_MOCK) {
            mockMantenimientos = mockMantenimientos.map(m => m.id === id ? { ...m, ...data } : m);
            notifyMantenimientos();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'mantenimiento', id), data);
        } catch (err) {
            firebaseError('actualizarMantenimiento', err);
        }
    }, []);

    const iniciarMantenimiento = useCallback(async (id) => {
        const dateVal = USE_MOCK ? mockTimestamp() : new Date().toISOString();
        return actualizarMantenimiento(id, {
            estado: 'en_progreso',
            fecha_inicio: dateVal,
        });
    }, [actualizarMantenimiento]);

    const completarMantenimiento = useCallback(async (id, costo = 0, notas = '') => {
        const dateVal = USE_MOCK ? mockTimestamp() : new Date().toISOString();
        return actualizarMantenimiento(id, {
            estado: 'completado',
            fecha_fin: dateVal,
            costo,
            notas: notas || undefined,
        });
    }, [actualizarMantenimiento]);

    const eliminarMantenimiento = useCallback(async (id) => {
        if (USE_MOCK) {
            mockMantenimientos = mockMantenimientos.filter(m => m.id !== id);
            notifyMantenimientos();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.deleteDoc(fs.doc(db, 'mantenimiento', id));
        } catch (err) {
            firebaseError('eliminarMantenimiento', err);
        }
    }, []);

    // Get scheduled maintenance
    const mantenimientosProgramados = mantenimientos.filter(m => m.estado === 'programado');
    
    // Get in-progress maintenance
    const mantenimientosEnProgreso = mantenimientos.filter(m => m.estado === 'en_progreso');
    
    // Get completed maintenance
    const mantenimientosCompletados = mantenimientos.filter(m => m.estado === 'completado');

    // Get overdue maintenance
    const mantenimientosVencidos = mantenimientosProgramados.filter(m => {
        const fechaProgramada = toValidDate(m.fecha_programada);
        return fechaProgramada ? fechaProgramada < new Date() : false;
    });

    return { 
        mantenimientos, 
        mantenimientosProgramados,
        mantenimientosEnProgreso,
        mantenimientosCompletados,
        mantenimientosVencidos,
        loading, 
        error, 
        crearMantenimiento, 
        actualizarMantenimiento,
        iniciarMantenimiento,
        completarMantenimiento,
        eliminarMantenimiento
    };
}
