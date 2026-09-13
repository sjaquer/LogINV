'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, listeners, notify, 
    getFirestore, firebaseError 
} from './useFirestoreQuery';

// Mock data for locations
let mockUbicaciones = [
    { id: 'loc_1', nombre: 'Iglesia Principal', descripcion: 'Templo principal de la congregación', capacidad: 200, activa: true, created_at: mockTimestamp() },
    { id: 'loc_2', nombre: 'Almacén General', descripcion: 'Almacenamiento central de equipos y suministros', capacidad: 500, activa: true, created_at: mockTimestamp() },
    { id: 'loc_3', nombre: 'Sala de Eventos', descripcion: 'Espacio para eventos y reuniones', capacidad: 150, activa: true, created_at: mockTimestamp() },
    { id: 'loc_4', nombre: 'Oficina Parroquial', descripcion: 'Oficina administrativa de la iglesia', capacidad: 20, activa: true, created_at: mockTimestamp() },
];

const ubicacionesListeners = new Set();

function notifyUbicaciones() {
    ubicacionesListeners.forEach(fn => fn([...mockUbicaciones]));
}

export function useLocations() {
    const [ubicaciones, setUbicaciones] = useState(USE_MOCK ? mockUbicaciones : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setUbicaciones([...mockUbicaciones]);
            ubicacionesListeners.add(setUbicaciones);
            return () => ubicacionesListeners.delete(setUbicaciones);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'ubicaciones'), fs.orderBy('nombre', 'asc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setUbicaciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener ubicaciones:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'ubicaciones');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setUbicaciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback ubicaciones:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup ubicaciones:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    const crearUbicacion = useCallback(async (data) => {
        if (USE_MOCK) {
            const newLoc = {
                id: 'loc_' + Date.now(),
                ...data,
                activa: true,
                created_at: mockTimestamp(),
            };
            mockUbicaciones = [...mockUbicaciones, newLoc];
            notifyUbicaciones();
            return newLoc.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const ref = await fs.addDoc(fs.collection(db, 'ubicaciones'), {
                ...data,
                activa: true,
                created_at: fs.serverTimestamp(),
            });
            return ref.id;
        } catch (err) {
            firebaseError('crearUbicacion', err);
        }
    }, []);

    const actualizarUbicacion = useCallback(async (id, data) => {
        if (USE_MOCK) {
            mockUbicaciones = mockUbicaciones.map(u => u.id === id ? { ...u, ...data } : u);
            notifyUbicaciones();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'ubicaciones', id), data);
        } catch (err) {
            firebaseError('actualizarUbicacion', err);
        }
    }, []);

    const eliminarUbicacion = useCallback(async (id) => {
        if (USE_MOCK) {
            mockUbicaciones = mockUbicaciones.filter(u => u.id !== id);
            notifyUbicaciones();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.deleteDoc(fs.doc(db, 'ubicaciones', id));
        } catch (err) {
            firebaseError('eliminarUbicacion', err);
        }
    }, []);

    const toggleUbicacion = useCallback(async (id, activa) => {
        return actualizarUbicacion(id, { activa });
    }, [actualizarUbicacion]);

    return { 
        ubicaciones, 
        loading, 
        error, 
        crearUbicacion, 
        actualizarUbicacion, 
        eliminarUbicacion,
        toggleUbicacion
    };
}
