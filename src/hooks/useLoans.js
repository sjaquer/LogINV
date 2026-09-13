'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, listeners, notify, 
    getFirestore, firebaseError 
} from './useFirestoreQuery';

// Mock data for loans
let mockPrestamos = [
    {
        id: 'loan_1',
        producto_id: 'p3',
        producto_nombre: 'Piano Grande',
        ubicacion_origen: 'TEMPLO',
        prestado_a: 'Ministerio de Adoración',
        contacto: '999888777',
        fecha_prestamo: mockTimestamp(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        fecha_devolucion_esperada: mockTimestamp(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
        fecha_devolucion_real: null,
        estado: 'activo',
        notas: 'Para evento especial de adoración',
        created_by: 'user1',
        created_at: mockTimestamp(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    },
    {
        id: 'loan_2',
        producto_id: 'p4',
        producto_nombre: 'Escaleras de Coro',
        ubicacion_origen: 'TEMPLO',
        prestado_a: 'Equipo de Mantenimiento',
        contacto: '988777666',
        fecha_prestamo: mockTimestamp(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        fecha_devolucion_esperada: mockTimestamp(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        fecha_devolucion_real: mockTimestamp(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        estado: 'devuelto',
        notas: 'Mantenimiento de segundo piso',
        created_by: 'user1',
        created_at: mockTimestamp(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    },
];

const prestamosListeners = new Set();

function notifyPrestamos() {
    prestamosListeners.forEach(fn => fn([...mockPrestamos]));
}

export function useLoans() {
    const [prestamos, setPrestamos] = useState(USE_MOCK ? mockPrestamos : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setPrestamos([...mockPrestamos]);
            prestamosListeners.add(setPrestamos);
            return () => prestamosListeners.delete(setPrestamos);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'prestamos'), fs.orderBy('created_at', 'desc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setPrestamos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener prestamos:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'prestamos');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setPrestamos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback prestamos:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup prestamos:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    const crearPrestamo = useCallback(async (data) => {
        if (USE_MOCK) {
            const newLoan = {
                id: 'loan_' + Date.now(),
                ...data,
                estado: 'activo',
                fecha_devolucion_real: null,
                created_at: mockTimestamp(),
            };
            mockPrestamos = [newLoan, ...mockPrestamos];
            notifyPrestamos();
            return newLoan.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const ref = await fs.addDoc(fs.collection(db, 'prestamos'), {
                ...data,
                estado: 'activo',
                fecha_devolucion_real: null,
                created_at: fs.serverTimestamp(),
            });
            return ref.id;
        } catch (err) {
            firebaseError('crearPrestamo', err);
        }
    }, []);

    const registrarDevolucion = useCallback(async (id, notas = '') => {
        if (USE_MOCK) {
            mockPrestamos = mockPrestamos.map(p => 
                p.id === id ? { 
                    ...p, 
                    estado: 'devuelto', 
                    fecha_devolucion_real: mockTimestamp(),
                    notas: notas || p.notas
                } : p
            );
            notifyPrestamos();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'prestamos', id), {
                estado: 'devuelto',
                fecha_devolucion_real: fs.serverTimestamp(),
                notas: notas || undefined,
            });
        } catch (err) {
            firebaseError('registrarDevolucion', err);
        }
    }, []);

    const actualizarPrestamo = useCallback(async (id, data) => {
        if (USE_MOCK) {
            mockPrestamos = mockPrestamos.map(p => p.id === id ? { ...p, ...data } : p);
            notifyPrestamos();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'prestamos', id), data);
        } catch (err) {
            firebaseError('actualizarPrestamo', err);
        }
    }, []);

    const eliminarPrestamo = useCallback(async (id) => {
        if (USE_MOCK) {
            mockPrestamos = mockPrestamos.filter(p => p.id !== id);
            notifyPrestamos();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.deleteDoc(fs.doc(db, 'prestamos', id));
        } catch (err) {
            firebaseError('eliminarPrestamo', err);
        }
    }, []);

    // Get active loans
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo');
    
    // Get overdue loans
    const prestamosVencidos = prestamosActivos.filter(p => {
        const fechaEsperada = p.fecha_devolucion_esperada?.toDate 
            ? p.fecha_devolucion_esperada.toDate() 
            : new Date(p.fecha_devolucion_esperada);
        return fechaEsperada < new Date();
    });

    return { 
        prestamos, 
        prestamosActivos,
        prestamosVencidos,
        loading, 
        error, 
        crearPrestamo, 
        registrarDevolucion,
        actualizarPrestamo,
        eliminarPrestamo
    };
}
