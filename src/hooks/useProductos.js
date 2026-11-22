'use client';
import { useCallback, useMemo } from 'react';
import { USE_MOCK, getFirestore, firebaseError } from './useFirestoreQuery';
import { useCollection } from './useCollection';
import { MOCK_PRODUCTOS } from '@/lib/mockDataStore';
import { registerMock, getMock, setMock, mockId } from '@/lib/mockStore';
import { addDocument, updateDocument, deleteDocument, clean, nowValue } from '@/lib/dataOps';
import { audited } from '@/lib/auditLog';

registerMock('productos', () => [...MOCK_PRODUCTOS]);

const toNum = (v) => Number(v) || 0;

export function useProductos() {
    const { data: productos, loading, error } = useCollection('productos', { orderByField: 'nombre' });

    const crearProducto = useCallback(async (data) => {
        const { _usuario: usuario = 'Sistema', ...rest } = data;
        const stockActual = toNum(rest.stock_actual);
        const ahora = nowValue();
        const id = await addDocument('productos', {
            ...rest,
            stock_actual: stockActual,
            stock_minimo: toNum(rest.stock_minimo),
            ultima_actualizacion: ahora,
            fecha_creacion: ahora,
            activo: true,
        }, { prefix: 'p', prepend: false });

        if (stockActual > 0) {
            await addDocument('movimientos', {
                producto_id: id,
                nombre_producto: rest.nombre,
                producto_nombre: rest.nombre,
                tipo: 'INGRESO',
                cantidad: stockActual,
                usuario,
                ubicacion: rest.ubicacion || '',
                fecha: ahora,
                motivo: 'Stock inicial al crear producto',
                notas: 'Stock inicial al crear producto',
                stock_anterior: 0,
                stock_nuevo: stockActual,
            }, { prefix: 'mv' });
        }
        return id;
    }, []);

    const actualizarProducto = useCallback(async (id, data) => {
        const { _usuario, ...rest } = data;
        const updateData = { ...rest, ultima_actualizacion: nowValue() };
        if (updateData.stock_actual !== undefined) updateData.stock_actual = toNum(updateData.stock_actual);
        if (updateData.stock_minimo !== undefined) updateData.stock_minimo = toNum(updateData.stock_minimo);
        await updateDocument('productos', id, updateData);
    }, []);

    const eliminarProducto = useCallback((id) => deleteDocument('productos', id), []);

    /**
     * Actualiza el stock y registra UN movimiento de forma atómica
     * (transacción): el stock anterior se lee del servidor, no de la caché.
     *
     * @param {string} id
     * @param {number} valor          stock final (modo 'set') o cantidad (modo 'delta')
     * @param {string} usuario
     * @param {{ modo?: 'set'|'delta', tipo?: string, motivo?: string }} [opts]
     */
    const updateStock = useCallback(async (id, valor, usuario, opts = {}) => {
        const { modo = 'set', tipo, motivo = 'Ajuste de stock' } = opts;
        const num = toNum(valor);
        const calcular = (anterior) => {
            const nuevo = modo === 'delta' ? Math.max(0, anterior + num) : Math.max(0, num);
            const diff = nuevo - anterior;
            return { nuevo, diff, tipoFinal: tipo || (diff >= 0 ? 'INGRESO' : 'SALIDA') };
        };
        const movimiento = (prod, anterior, nuevo, diff, tipoFinal, fecha) => clean({
            producto_id: id,
            nombre_producto: prod.nombre || '',
            producto_nombre: prod.nombre || '',
            tipo: tipoFinal,
            cantidad: Math.abs(diff),
            usuario: usuario || 'Sistema',
            ubicacion: prod.ubicacion || '',
            fecha,
            motivo,
            notas: motivo,
            stock_anterior: anterior,
            stock_nuevo: nuevo,
        });

        if (USE_MOCK) {
            const prod = getMock('productos').find(p => p.id === id);
            if (!prod) throw new Error('El producto ya no existe');
            const anterior = toNum(prod.stock_actual);
            const { nuevo, diff, tipoFinal } = calcular(anterior);
            const fecha = nowValue();
            setMock('productos', list => list.map(p => (p.id === id ? { ...p, stock_actual: nuevo, ultima_actualizacion: fecha } : p)));
            setMock('movimientos', list => [{ id: mockId('mv'), ...movimiento(prod, anterior, nuevo, diff, tipoFinal, fecha) }, ...list]);
            return { anterior, nuevo, nombre: prod.nombre, tipo: tipoFinal, diff };
        }
        try {
            const { fs, db } = await getFirestore();
            const prodRef = fs.doc(db, 'productos', id);
            const movRef = fs.doc(fs.collection(db, 'movimientos'));
            return await fs.runTransaction(db, async (tx) => {
                const snap = await tx.get(prodRef);
                if (!snap.exists()) throw new Error('El producto ya no existe');
                const prod = snap.data();
                const anterior = toNum(prod.stock_actual);
                const { nuevo, diff, tipoFinal } = calcular(anterior);
                const fecha = new Date().toISOString();
                tx.update(prodRef, { stock_actual: nuevo, ultima_actualizacion: fecha });
                tx.set(movRef, movimiento(prod, anterior, nuevo, diff, tipoFinal, fecha));
                return { anterior, nuevo, nombre: prod.nombre, tipo: tipoFinal, diff };
            });
        } catch (err) {
            firebaseError('updateStock', err);
        }
    }, []);

    // Envolturas con auditoría (el nombre se resuelve con la lista actual).
    const nombreDe = useCallback((id) => productos.find(p => p.id === id)?.nombre || id, [productos]);

    return useMemo(() => ({
        productos,
        loading,
        error,
        crearProducto: audited(crearProducto, ([data], id) => ({
            accion: 'crear', entidad: 'producto', id, descripcion: data.nombre,
            detalles: { ubicacion: data.ubicacion || '', stock: toNum(data.stock_actual) },
        })),
        actualizarProducto: audited(actualizarProducto, ([id, data]) => ({
            accion: 'editar', entidad: 'producto', id,
            descripcion: `${data.nombre || nombreDe(id)} · ${Object.keys(data).filter(k => !k.startsWith('_')).slice(0, 6).join(', ')}`,
        })),
        eliminarProducto: audited(eliminarProducto, ([id]) => ({
            accion: 'eliminar', entidad: 'producto', id, descripcion: nombreDe(id),
        })),
        updateStock: audited(updateStock, ([id, , , opts = {}], r) => r && r.diff !== 0 ? ({
            accion: 'stock', entidad: 'producto', id,
            descripcion: `${r.nombre} · ${r.tipo.toLowerCase()} de ${Math.abs(r.diff)} (${r.anterior} → ${r.nuevo})${opts.motivo ? ` · ${opts.motivo}` : ''}`,
        }) : null),
    }), [productos, loading, error, crearProducto, actualizarProducto, eliminarProducto, updateStock, nombreDe]);
}
