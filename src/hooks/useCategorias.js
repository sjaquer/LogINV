'use client';
import { useCallback, useMemo } from 'react';
import { useCollection } from './useCollection';
import { MOCK_CATEGORIAS } from '@/lib/mockDataStore';
import { registerMock } from '@/lib/mockStore';
import { addDocument, updateDocument, deleteDocument, nowValue } from '@/lib/dataOps';
import { audited } from '@/lib/auditLog';

registerMock('categorias', () => [...MOCK_CATEGORIAS]);

// Se ordena en el cliente: un orderBy('orden') en Firestore ocultaría las
// categorías importadas que no tienen ese campo.
const byOrden = (a, b) => (a.orden ?? 999) - (b.orden ?? 999) || (a.nombre || '').localeCompare(b.nombre || '', 'es');

export function useCategorias() {
    const { data, loading, error } = useCollection('categorias');
    const categorias = useMemo(() => [...data].sort(byOrden), [data]);

    const crearCategoria = useCallback((cat) => addDocument('categorias', {
        ...cat,
        orden: categorias.length + 1,
        activa: true,
        fecha_creacion: nowValue(),
    }, { prefix: 'cat', prepend: false }), [categorias.length]);

    const actualizarCategoria = useCallback((id, cat) => updateDocument('categorias', id, cat), []);
    const eliminarCategoria = useCallback((id) => deleteDocument('categorias', id), []);

    const nombreDe = (id) => categorias.find(c => c.id === id)?.nombre || id;

    return {
        categorias,
        loading,
        error,
        crearCategoria: audited(crearCategoria, ([cat], id) => ({ accion: 'crear', entidad: 'categoria', id, descripcion: cat.nombre })),
        actualizarCategoria: audited(actualizarCategoria, ([id, cat]) => ({ accion: 'editar', entidad: 'categoria', id, descripcion: cat.nombre || nombreDe(id) })),
        eliminarCategoria: audited(eliminarCategoria, ([id]) => ({ accion: 'eliminar', entidad: 'categoria', id, descripcion: nombreDe(id) })),
    };
}
