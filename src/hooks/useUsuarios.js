'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    USE_MOCK, mockTimestamp, getFirestore, firebaseError,
} from './useFirestoreQuery';

// Directorio de personal de la iglesia (colección `usuarios`, ver
// scripts/seedExcel.js). Es independiente del login (AuthContext), que
// sigue usando una lista fija de 2 credenciales de acceso al sistema.
let mockUsuarios = [
    { id: 'u1', nombre: 'Juan Carlos Cárdenas', email: 'juan@iglesia.com', rol: 'admin', activo: true, telefono: '', departamento: 'Dirección', fecha_creacion: mockTimestamp() },
    { id: 'u2', nombre: 'Ruth Pando', email: 'ruth@iglesia.com', rol: 'encargado', activo: true, telefono: '', departamento: 'Inventario', fecha_creacion: mockTimestamp() },
    { id: 'u3', nombre: 'Ministerio de Adoración', email: 'adoracion@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Adoración', fecha_creacion: mockTimestamp() },
    { id: 'u4', nombre: 'Imagen y Producción', email: 'imagen@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Producción', fecha_creacion: mockTimestamp() },
    { id: 'u5', nombre: 'Mantenimiento', email: 'mantenimiento@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Mantenimiento', fecha_creacion: mockTimestamp() },
];

const usuariosListeners = new Set();

function notifyUsuarios() {
    usuariosListeners.forEach(fn => fn([...mockUsuarios]));
}

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState(USE_MOCK ? mockUsuarios : []);
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (USE_MOCK) {
            setUsuarios([...mockUsuarios]);
            usuariosListeners.add(setUsuarios);
            return () => usuariosListeners.delete(setUsuarios);
        }
        let unsub;
        (async () => {
            try {
                const { fs, db } = await getFirestore();
                const q = fs.query(fs.collection(db, 'usuarios'), fs.orderBy('nombre', 'asc'));
                unsub = fs.onSnapshot(q,
                    (snap) => {
                        setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setLoading(false);
                        setError(null);
                    },
                    (err) => {
                        console.error('[LogINV] Error listener usuarios:', err.code, err.message);
                        setLoading(false);
                        setError(err.message);
                        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
                            const qSimple = fs.collection(db, 'usuarios');
                            unsub = fs.onSnapshot(qSimple,
                                (snap) => {
                                    setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                                    setLoading(false);
                                    setError(null);
                                },
                                (fallbackErr) => {
                                    console.error('[LogINV] Error fallback usuarios:', fallbackErr);
                                    setLoading(false);
                                }
                            );
                        }
                    }
                );
            } catch (err) {
                console.error('[LogINV] Error setup usuarios:', err);
                setLoading(false);
                setError(err.message);
            }
        })();
        return () => unsub?.();
    }, []);

    const crearUsuario = useCallback(async (data) => {
        if (USE_MOCK) {
            const newUser = { id: 'u_' + Date.now(), activo: true, ...data, fecha_creacion: mockTimestamp() };
            mockUsuarios = [...mockUsuarios, newUser];
            notifyUsuarios();
            return newUser.id;
        }
        try {
            const { fs, db } = await getFirestore();
            const ref = await fs.addDoc(fs.collection(db, 'usuarios'), {
                ...data,
                activo: true,
                fecha_creacion: fs.serverTimestamp(),
            });
            return ref.id;
        } catch (err) {
            firebaseError('crearUsuario', err);
        }
    }, []);

    const actualizarUsuario = useCallback(async (id, data) => {
        if (USE_MOCK) {
            mockUsuarios = mockUsuarios.map(u => u.id === id ? { ...u, ...data } : u);
            notifyUsuarios();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.updateDoc(fs.doc(db, 'usuarios', id), data);
        } catch (err) {
            firebaseError('actualizarUsuario', err);
        }
    }, []);

    const eliminarUsuario = useCallback(async (id) => {
        if (USE_MOCK) {
            mockUsuarios = mockUsuarios.filter(u => u.id !== id);
            notifyUsuarios();
            return;
        }
        try {
            const { fs, db } = await getFirestore();
            await fs.deleteDoc(fs.doc(db, 'usuarios', id));
        } catch (err) {
            firebaseError('eliminarUsuario', err);
        }
    }, []);

    const toggleUsuario = useCallback(async (id, activo) => {
        return actualizarUsuario(id, { activo });
    }, [actualizarUsuario]);

    return { usuarios, loading, error, crearUsuario, actualizarUsuario, eliminarUsuario, toggleUsuario };
}
