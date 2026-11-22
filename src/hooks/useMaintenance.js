'use client';
import { useCallback, useMemo } from 'react';
import { useCollection } from './useCollection';
import { registerMock, mockTimestamp, DAY } from '@/lib/mockStore';
import { addDocument, updateDocument, deleteDocument, nowValue } from '@/lib/dataOps';
import { audited } from '@/lib/auditLog';
import { toValidDate } from '@/lib/utils';

const ago = (days) => mockTimestamp(new Date(Date.now() - days * DAY));

registerMock('mantenimiento', () => [
    {
        id: 'maint_1', producto_id: 'p8', producto_nombre: 'Consola de sonido',
        tipo: 'preventivo', descripcion: 'Limpieza de faders y revisión de canales',
        estado: 'programado', fecha_programada: ago(-7), fecha_inicio: null, fecha_fin: null,
        costo: 0, responsable: 'Equipo de Sonido', notas: 'Antes del aniversario', created_at: ago(1),
    },
    {
        id: 'maint_3', producto_id: 'p9', producto_nombre: 'Aire acondicionado Templo',
        tipo: 'preventivo', descripcion: 'Cambio de filtros',
        estado: 'programado', fecha_programada: ago(3), fecha_inicio: null, fecha_fin: null,
        costo: 0, responsable: 'Mantenimiento', notas: '', created_at: ago(20),
    },
    {
        id: 'maint_2', producto_id: 'p10', producto_nombre: 'Parlante principal',
        tipo: 'correctivo', descripcion: 'Reparación de parlante dañado',
        estado: 'completado', fecha_programada: ago(14), fecha_inicio: ago(12), fecha_fin: ago(10),
        costo: 150, responsable: 'Técnico externo', notas: 'Parlante reparado correctamente', created_at: ago(14),
    },
]);

export function useMaintenance() {
    const { data: mantenimientos, loading, error } = useCollection('mantenimiento', { orderByField: 'created_at', direction: 'desc' });

    const crearMantenimiento = useCallback((data) => addDocument('mantenimiento', {
        ...data,
        estado: data.estado || 'programado',
        fecha_inicio: null,
        fecha_fin: null,
        created_at: nowValue(),
    }, { prefix: 'maint' }), []);

    const actualizarMantenimiento = useCallback((id, data) => updateDocument('mantenimiento', id, data), []);

    const iniciarMantenimiento = useCallback((id) => updateDocument('mantenimiento', id, {
        estado: 'en_progreso',
        fecha_inicio: nowValue(),
    }), []);

    const completarMantenimiento = useCallback((id, costo = 0, notas = '') => updateDocument('mantenimiento', id, {
        estado: 'completado',
        fecha_fin: nowValue(),
        costo: Number(costo) || 0,
        ...(notas ? { notas } : {}),
    }), []);

    const eliminarMantenimiento = useCallback((id) => deleteDocument('mantenimiento', id), []);

    const grupos = useMemo(() => {
        const programados = mantenimientos.filter(m => m.estado === 'programado');
        return {
            programados,
            enProgreso: mantenimientos.filter(m => m.estado === 'en_progreso'),
            completados: mantenimientos.filter(m => m.estado === 'completado'),
            vencidos: programados.filter(m => {
                const f = toValidDate(m.fecha_programada);
                return f ? f < new Date() : false;
            }),
        };
    }, [mantenimientos]);

    const desc = (id) => mantenimientos.find(m => m.id === id)?.producto_nombre || id;

    return {
        mantenimientos,
        mantenimientosProgramados: grupos.programados,
        mantenimientosEnProgreso: grupos.enProgreso,
        mantenimientosCompletados: grupos.completados,
        mantenimientosVencidos: grupos.vencidos,
        loading,
        error,
        crearMantenimiento: audited(crearMantenimiento, ([d], id) => ({ accion: 'crear', entidad: 'mantenimiento', id, descripcion: `${d.producto_nombre} · ${d.tipo || ''}` })),
        actualizarMantenimiento: audited(actualizarMantenimiento, ([id]) => ({ accion: 'editar', entidad: 'mantenimiento', id, descripcion: desc(id) })),
        iniciarMantenimiento: audited(iniciarMantenimiento, ([id]) => ({ accion: 'mantenimiento', entidad: 'mantenimiento', id, descripcion: `${desc(id)} · iniciado` })),
        completarMantenimiento: audited(completarMantenimiento, ([id, costo]) => ({ accion: 'mantenimiento', entidad: 'mantenimiento', id, descripcion: `${desc(id)} · completado${costo ? ` (S/ ${costo})` : ''}` })),
        eliminarMantenimiento: audited(eliminarMantenimiento, ([id]) => ({ accion: 'eliminar', entidad: 'mantenimiento', id, descripcion: desc(id) })),
    };
}
