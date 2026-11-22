'use client';
import { useCallback } from 'react';
import { useCollection } from './useCollection';
import { registerMock, mockTimestamp } from '@/lib/mockStore';
import { setDocument, deleteDocument, nowValue } from '@/lib/dataOps';
import { audited } from '@/lib/auditLog';
import { AppError } from '@/lib/errors';

registerMock('ubicaciones', () => [
    { id: 'TEMPLO', codigo: 'TEMPLO', nombre: 'Templo', descripcion: 'Templo Principal - Auditorio y Altar', capacidad: 500, icono: '⛪', piso: 'Piso 1', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B1', codigo: 'ALMACEN_B1', nombre: 'Almacén B1 (Herramientas)', descripcion: 'Almacén B1 - Primer Piso', capacidad: 100, icono: '🧰', piso: 'Piso 1', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B2', codigo: 'ALMACEN_B2', nombre: 'Almacén B2 (Escaleras y Albañilería)', descripcion: 'Almacén B2 - Primer Piso', capacidad: 100, icono: '🪜', piso: 'Piso 1', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B3', codigo: 'ALMACEN_B3', nombre: 'Almacén B3 Salón 209 (Ministerio de Adoración)', descripcion: 'Almacén B3 - Salón 209', capacidad: 80, icono: '🎵', piso: 'Piso 2', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_B4', codigo: 'ALMACEN_B4', nombre: 'Almacén B4 (Redes Juveniles)', descripcion: 'Almacén B4 - Tercer Piso', capacidad: 100, icono: '📦', piso: 'Piso 3', activa: true, created_at: mockTimestamp() },
    { id: 'ALMACEN_DISCOVERY', codigo: 'ALMACEN_DISCOVERY', nombre: 'Salón 308 (Almacén Discovery)', descripcion: 'Almacén Discovery Land (B5)', capacidad: 100, icono: '🧸', piso: 'Piso 3', activa: true, created_at: mockTimestamp() },
]);

/** Convierte un nombre en un código estable: "Almacén B1" → "ALMACEN_B1". */
export function codigoDesdeNombre(nombre = '') {
    return nombre.toUpperCase().trim()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function useLocations() {
    const { data: ubicaciones, loading, error } = useCollection('ubicaciones');

    const crearUbicacion = useCallback(async (data) => {
        const id = data.codigo || data.id || codigoDesdeNombre(data.nombre) || ('LOC_' + Date.now());
        if (ubicaciones.some(u => u.id === id)) {
            throw new AppError('DATOS-02', { vars: { codigo: id } });
        }
        const ahora = nowValue();
        await setDocument('ubicaciones', id, {
            id,
            codigo: id,
            nombre: (data.nombre || '').trim(),
            descripcion: (data.descripcion || '').trim(),
            capacidad: Number(data.capacidad) || 100,
            icono: data.icono || '📍',
            piso: data.piso || 'Piso 1',
            color: data.color || 'violet',
            activa: data.activa !== false,
            created_at: ahora,
            fecha_creacion: ahora,
        });
        return id;
    }, [ubicaciones]);

    const actualizarUbicacion = useCallback(async (id, data) => {
        const clean = { ...data };
        if ('capacidad' in clean) clean.capacidad = Number(clean.capacidad) || 0;
        if (typeof clean.nombre === 'string') clean.nombre = clean.nombre.trim();
        if (typeof clean.descripcion === 'string') clean.descripcion = clean.descripcion.trim();
        await setDocument('ubicaciones', id, clean, { merge: true });
    }, []);

    const eliminarUbicacion = useCallback((id) => deleteDocument('ubicaciones', id), []);
    const toggleUbicacion = useCallback((id, activa) => actualizarUbicacion(id, { activa }), [actualizarUbicacion]);

    const nombreDe = (id) => ubicaciones.find(u => u.id === id)?.nombre || id;

    return {
        ubicaciones,
        loading,
        error,
        crearUbicacion: audited(crearUbicacion, ([data], id) => ({ accion: 'crear', entidad: 'ubicacion', id, descripcion: data.nombre })),
        actualizarUbicacion: audited(actualizarUbicacion, ([id, data]) => (
            Object.keys(data).length === 1 && 'activa' in data ? null
                : { accion: 'editar', entidad: 'ubicacion', id, descripcion: data.nombre || nombreDe(id) }
        )),
        eliminarUbicacion: audited(eliminarUbicacion, ([id]) => ({ accion: 'eliminar', entidad: 'ubicacion', id, descripcion: nombreDe(id) })),
        toggleUbicacion: audited(toggleUbicacion, ([id, activa]) => ({
            accion: activa ? 'activar' : 'desactivar', entidad: 'ubicacion', id, descripcion: nombreDe(id),
        })),
    };
}
