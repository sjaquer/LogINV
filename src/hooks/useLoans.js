'use client';
import { useCallback, useMemo } from 'react';
import { useCollection } from './useCollection';
import { registerMock, mockTimestamp, DAY } from '@/lib/mockStore';
import { addDocument, updateDocument, deleteDocument, nowValue } from '@/lib/dataOps';
import { audited } from '@/lib/auditLog';
import { toValidDate } from '@/lib/utils';

const ago = (days) => mockTimestamp(new Date(Date.now() - days * DAY));

registerMock('prestamos', () => [
    {
        id: 'loan_1', producto_id: 'p3', producto_nombre: 'Piano Grande', ubicacion_origen: 'TEMPLO',
        prestado_a: 'Ministerio de Adoración', contacto: '999888777',
        fecha_prestamo: ago(2), fecha_devolucion_esperada: ago(-5), fecha_devolucion_real: null,
        estado: 'activo', notas: 'Para evento especial de adoración', created_by: 'Ruth Pando', created_at: ago(2),
    },
    {
        id: 'loan_3', producto_id: 'p7', producto_nombre: 'Proyector Epson', ubicacion_origen: 'IMAGEN_PRODUCCION',
        prestado_a: 'Redes Juveniles', contacto: '977111222',
        fecha_prestamo: ago(9), fecha_devolucion_esperada: ago(2), fecha_devolucion_real: null,
        estado: 'activo', notas: 'Retiro de jóvenes', created_by: 'Ruth Pando', created_at: ago(9),
    },
    {
        id: 'loan_2', producto_id: 'p4', producto_nombre: 'Escaleras de Coro', ubicacion_origen: 'TEMPLO',
        prestado_a: 'Equipo de Mantenimiento', contacto: '988777666',
        fecha_prestamo: ago(10), fecha_devolucion_esperada: ago(3), fecha_devolucion_real: ago(2),
        estado: 'devuelto', notas: 'Mantenimiento de segundo piso', created_by: 'Ruth Pando', created_at: ago(10),
    },
]);

export function useLoans() {
    const { data: prestamos, loading, error } = useCollection('prestamos', { orderByField: 'created_at', direction: 'desc' });

    const crearPrestamo = useCallback((data) => {
        const ahora = nowValue();
        return addDocument('prestamos', {
            ...data,
            estado: 'activo',
            fecha_prestamo: data.fecha_prestamo || ahora,
            fecha_devolucion_real: null,
            created_at: ahora,
        }, { prefix: 'loan' });
    }, []);

    const registrarDevolucion = useCallback((id, notas = '') => updateDocument('prestamos', id, {
        estado: 'devuelto',
        fecha_devolucion_real: nowValue(),
        // Solo se sobrescriben las notas si se escribió algo (antes se enviaba
        // `undefined` y Firestore rechazaba la devolución).
        ...(notas ? { notas } : {}),
    }), []);

    const actualizarPrestamo = useCallback((id, data) => updateDocument('prestamos', id, data), []);
    const eliminarPrestamo = useCallback((id) => deleteDocument('prestamos', id), []);

    const prestamosActivos = useMemo(() => prestamos.filter(p => p.estado === 'activo'), [prestamos]);
    const prestamosVencidos = useMemo(() => prestamosActivos.filter(p => {
        const fecha = toValidDate(p.fecha_devolucion_esperada);
        return fecha ? fecha < new Date() : false;
    }), [prestamosActivos]);

    const desc = (id) => {
        const p = prestamos.find(x => x.id === id);
        return p ? `${p.producto_nombre} → ${p.prestado_a}` : id;
    };

    return {
        prestamos,
        prestamosActivos,
        prestamosVencidos,
        loading,
        error,
        crearPrestamo: audited(crearPrestamo, ([d], id) => ({ accion: 'prestar', entidad: 'prestamo', id, descripcion: `${d.producto_nombre} → ${d.prestado_a}` })),
        registrarDevolucion: audited(registrarDevolucion, ([id]) => ({ accion: 'devolver', entidad: 'prestamo', id, descripcion: desc(id) })),
        actualizarPrestamo: audited(actualizarPrestamo, ([id]) => ({ accion: 'editar', entidad: 'prestamo', id, descripcion: desc(id) })),
        eliminarPrestamo: audited(eliminarPrestamo, ([id]) => ({ accion: 'eliminar', entidad: 'prestamo', id, descripcion: desc(id) })),
    };
}
