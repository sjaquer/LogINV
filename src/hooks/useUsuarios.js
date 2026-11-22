'use client';
import { useCallback } from 'react';
import { useCollection } from './useCollection';
import { registerMock, mockTimestamp } from '@/lib/mockStore';
import { addDocument, updateDocument, deleteDocument, nowValue } from '@/lib/dataOps';

// Perfiles de acceso (colección `usuarios`, id = UID de Firebase Auth).
// En producción las altas/bajas pasan por /api/admin/users; estas funciones
// se usan en modo demo y como respaldo si el servidor no está configurado.
registerMock('usuarios', () => [
    { id: 'demo-admin', nombre: 'Administrador (demo)', email: 'demo@loginv.local', rol: 'admin', activo: true, telefono: '', departamento: 'Dirección', fecha_creacion: mockTimestamp() },
    { id: 'u1', nombre: 'Juan Carlos Cárdenas', email: 'juan@iglesia.com', rol: 'admin', activo: true, telefono: '', departamento: 'Dirección', fecha_creacion: mockTimestamp() },
    { id: 'u2', nombre: 'Ruth Pando', email: 'ruth@iglesia.com', rol: 'encargado', activo: true, telefono: '987654321', departamento: 'Inventario', fecha_creacion: mockTimestamp() },
    { id: 'u3', nombre: 'Ministerio de Adoración', email: 'adoracion@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Adoración', fecha_creacion: mockTimestamp() },
    { id: 'u4', nombre: 'Imagen y Producción', email: 'imagen@iglesia.com', rol: 'voluntario', activo: false, telefono: '', departamento: 'Producción', fecha_creacion: mockTimestamp() },
    { id: 'u5', nombre: 'Mantenimiento', email: 'mantenimiento@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Mantenimiento', fecha_creacion: mockTimestamp() },
]);

export function useUsuarios() {
    const { data: usuarios, loading, error } = useCollection('usuarios', { orderByField: 'nombre' });

    const crearUsuario = useCallback((data) => addDocument('usuarios', {
        ...data,
        email: (data.email || '').trim().toLowerCase(),
        activo: true,
        fecha_creacion: nowValue(),
    }, { prefix: 'u', prepend: false }), []);

    const actualizarUsuario = useCallback((id, data) => updateDocument('usuarios', id, data), []);
    const eliminarUsuario = useCallback((id) => deleteDocument('usuarios', id), []);
    const toggleUsuario = useCallback((id, activo) => updateDocument('usuarios', id, { activo }), []);

    return { usuarios, loading, error, crearUsuario, actualizarUsuario, eliminarUsuario, toggleUsuario };
}
