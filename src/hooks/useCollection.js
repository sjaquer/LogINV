'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  useCollection - suscripción en tiempo real a una colección
//  Firestore (onSnapshot) en producción o el mockStore en modo demo.
//  Si falta un índice para el orderBy, reintenta sin ordenar.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useSyncExternalStore } from 'react';
import { USE_MOCK, getFirestore } from './useFirestoreQuery';
import { getMock, subscribeMock } from '@/lib/mockStore';
import { AppError, describeError, reportError } from '@/lib/errors';

const NOMBRES = {
    productos: 'los artículos', categorias: 'las categorías', ubicaciones: 'las ubicaciones', movimientos: 'los movimientos',
    prestamos: 'los préstamos', mantenimientos: 'los mantenimientos', conteos: 'los conteos', usuarios: 'los usuarios', auditoria: 'la auditoría',
};

/** Error de carga con el código original (permisos, red…) o DATOS-08 si no se reconoce. */
function loadError(name, err) {
    const info = describeError(err);
    return info.code === 'APP-01' ? new AppError('DATOS-08', { vars: { que: NOMBRES[name] }, cause: err }) : err;
}

const EMPTY = Object.freeze([]);
const noopSubscribe = () => () => {};

export function useCollection(name, { orderByField = null, direction = 'asc', limitCount = null } = {}) {
    const mockData = useSyncExternalStore(
        USE_MOCK ? (cb) => subscribeMock(name, cb) : noopSubscribe,
        () => (USE_MOCK ? getMock(name) : EMPTY),
        () => (USE_MOCK ? getMock(name) : EMPTY),
    );

    const [state, setState] = useState({ data: EMPTY, loading: !USE_MOCK, error: null });

    useEffect(() => {
        if (USE_MOCK) return undefined;
        let unsub = null;
        let cancelled = false;

        getFirestore().then(({ fs, db }) => {
            if (cancelled) return;
            const base = fs.collection(db, name);
            const listen = (query, allowFallback) => fs.onSnapshot(
                query,
                (snap) => setState({ data: snap.docs.map(d => ({ id: d.id, ...d.data() })), loading: false, error: null }),
                (err) => {
                    if (allowFallback && (err.code === 'failed-precondition' || err.message?.includes('index'))) {
                        console.warn(`[LogINV] ${name}: falta índice, se lista sin ordenar`);
                        unsub = listen(base, false);
                        return;
                    }
                    const e = loadError(name, err);
                    reportError(e, { context: `escuchando ${name}` });
                    setState(s => ({ ...s, loading: false, error: describeError(e).message }));
                },
            );
            const constraints = [];
            if (orderByField) constraints.push(fs.orderBy(orderByField, direction));
            if (limitCount) constraints.push(fs.limit(limitCount));
            unsub = constraints.length
                ? listen(fs.query(base, ...constraints), !!orderByField)
                : listen(base, false);
        }).catch((err) => {
            if (cancelled) return;
            const e = loadError(name, err);
            reportError(e, { context: `iniciando ${name}` });
            setState(s => ({ ...s, loading: false, error: describeError(e).message }));
        });

        return () => {
            cancelled = true;
            unsub?.();
        };
    }, [name, orderByField, direction, limitCount]);

    if (USE_MOCK) {
        return { data: limitCount ? mockData.slice(0, limitCount) : mockData, loading: false, error: null };
    }
    return state;
}
