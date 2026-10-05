'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
    USE_MOCK, mockTimestamp, listeners, notify, 
    getFirestore, firebaseError 
} from './useFirestoreQuery';

// Mock data for locations fallback
let mockUbicaciones = [
    { id: 'TEMPLO', codigo: 'TEMPLO', nombre: 'Templo', descripcion: 'Templo Principal - Auditorio y Altar', capacidad: 500, icono: '⛪', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B1', codigo: 'ALMACEN_B1', nombre: 'Almacén B1 (Herramientas)', descripcion: 'Almacén B1 - Primer Piso', capacidad: 100, icono: '🧰', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B2', codigo: 'ALMACEN_B2', nombre: 'Almacén B2 (Escaleras y Albañilería)', descripcion: 'Almacén B2 - Primer Piso', capacidad: 100, icono: '🪜', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B3', codigo: 'ALMACEN_B3', nombre: 'Almacén B3 Salón 209 (Ministerio de Adoración)', descripcion: 'Almacén B3 - Salón 209', capacidad: 80, icono: '🎵', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B4', codigo: 'ALMACEN_B4', nombre: 'Almacén B4 (Redes Juveniles)', descripcion: 'Almacén B4 - Tercer Piso', capacidad: 100, icono: '📦', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_DISCOVERY', codigo: 'ALMACEN_DISCOVERY', nombre: 'Salón 308 (Almacén Discovery)', descripcion: 'Almacén Discovery Land (B5)', capacidad: 100, icono: '🧸', activa: true, created_at: mockTimestamp() },
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
                const colRef = fs.collection(db, 'ubicaciones');
                unsub = fs.onSnapshot(colRef,
                    (snap) => {
                        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        list.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
                        setUbicaciones(list);
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener ubicaciones:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
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
            const nowIso = new Date().toISOString();
            
            // Clean uppercase code ID
            const rawCode = data.codigo || data.id || data.nombre.toUpperCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            const finalId = rawCode || ('LOC_' + Date.now());

            const newDoc = {
                id: finalId,
                codigo: finalId,
                nombre: (data.nombre || '').trim(),
                descripcion: (data.descripcion || '').trim(),
                capacidad: Number(data.capacidad) || 100,
                icono: data.icono || '📍',
                piso: data.piso || 'Piso 1',
                color: data.color || 'violet',
                activa: data.activa !== false,
                created_at: nowIso,
                fecha_creacion: nowIso,
            };

            await fs.setDoc(fs.doc(db, 'ubicaciones', finalId), newDoc);
            return finalId;
        } catch (err) {
            firebaseError('crearUbicacion', err);
            throw err;
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
            await fs.setDoc(fs.doc(db, 'ubicaciones', id), data, { merge: true });
        } catch (err) {
            firebaseError('actualizarUbicacion', err);
            throw err;
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
            throw err;
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
