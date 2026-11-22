'use client';
import { useCallback } from 'react';
import { useCollection } from './useCollection';
import { MOCK_MOVIMIENTOS } from '@/lib/mockDataStore';
import { registerMock } from '@/lib/mockStore';
import { addDocument, nowValue } from '@/lib/dataOps';

registerMock('movimientos', () => [...MOCK_MOVIMIENTOS]);

export function useMovimientos() {
    const { data: movimientos, loading, error } = useCollection('movimientos', { orderByField: 'fecha', direction: 'desc' });
    return { movimientos, loading, error };
}

/** Registra un movimiento suelto (los cambios de stock usan updateStock, que ya lo crea). */
export function useCrearMovimiento() {
    return useCallback((data) => addDocument('movimientos', { ...data, fecha: nowValue() }, { prefix: 'mv' }), []);
}
