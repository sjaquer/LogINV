'use client';
import { useCallback } from 'react';
import { useCollection } from './useCollection';
import { MOCK_CONTEOS } from '@/lib/mockDataStore';
import { registerMock, getMock } from '@/lib/mockStore';
import { addDocument, updateDocument, nowValue } from '@/lib/dataOps';
import { audited } from '@/lib/auditLog';
import { getLocationInfo } from '@/context/LocationContext';

registerMock('conteos', () => [...MOCK_CONTEOS]);

export function useConteos() {
    const { data: conteos, loading, error } = useCollection('conteos', { orderByField: 'fecha', direction: 'desc' });

    const crearConteo = useCallback((data) => addDocument('conteos', {
        ...data,
        fecha: nowValue(),
        estado: 'EN_PROGRESO',
        items: data.items || [],
        fecha_cierre: null,
    }, { prefix: 'cnt' }), []);

    const actualizarConteo = useCallback((id, data) => updateDocument('conteos', id, data), []);

    const finalizarConteo = useCallback((id) => updateDocument('conteos', id, {
        estado: 'COMPLETADO',
        fecha_cierre: nowValue(),
    }), []);

    const findConteo = (id) => conteos.find(c => c.id === id) || getMock('conteos').find(c => c.id === id);

    return {
        conteos,
        loading,
        error,
        crearConteo: audited(crearConteo, ([data], id) => ({
            accion: 'crear', entidad: 'conteo', id,
            descripcion: `Conteo iniciado en ${getLocationInfo(data.ubicacion).nombre}`,
        })),
        actualizarConteo,
        finalizarConteo: audited(finalizarConteo, ([id]) => {
            const c = findConteo(id);
            const difs = (c?.items || []).filter(i => i.diferencia !== 0).length;
            return {
                accion: 'contar', entidad: 'conteo', id,
                descripcion: `Conteo finalizado en ${getLocationInfo(c?.ubicacion).nombre} · ${difs} diferencia${difs === 1 ? '' : 's'}`,
            };
        }),
    };
}
