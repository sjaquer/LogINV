'use client';
import { useMemo, useState, useCallback } from 'react';
import { useCollection } from './useCollection';
import { toValidDate } from '@/lib/utils';
import '@/lib/auditLog'; // registra los datos de ejemplo del modo demo

const PAGE = 200;

/** Registro de auditoría en tiempo real, del más reciente al más antiguo. */
export function useAuditoria() {
    const [limitCount, setLimitCount] = useState(PAGE);
    const { data, loading, error } = useCollection('auditoria', { orderByField: 'timestamp', direction: 'desc', limitCount });

    const registros = useMemo(() => data
        .map(r => ({ ...r, _fecha: toValidDate(r.timestamp) || toValidDate(r.fecha) }))
        .sort((a, b) => (b._fecha?.getTime() || 0) - (a._fecha?.getTime() || 0)), [data]);

    const cargarMas = useCallback(() => setLimitCount(n => n + PAGE), []);

    return { registros, loading, error, cargarMas, hayMas: data.length >= limitCount };
}
