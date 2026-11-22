'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  Sesión de conteo físico
//  El conteo activo se DERIVA del listado (el EN_PROGRESO de la ubicación
//  actual), así cambiar de ubicación o finalizar no deja estado desfasado.
//  Los ítems contados son un borrador local con respaldo en localStorage
//  por si se cierra la pestaña antes de guardar.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react';

const BACKUP_KEY = 'loginv_conteo_backup';

function readBackup(conteoId) {
    if (typeof window === 'undefined' || !conteoId) return null;
    try {
        const raw = localStorage.getItem(BACKUP_KEY);
        if (!raw) return null;
        const backup = JSON.parse(raw);
        return backup.id === conteoId && backup.items?.length ? backup : null;
    } catch {
        return null;
    }
}

export function clearConteoBackup() {
    try { localStorage.removeItem(BACKUP_KEY); } catch { /* sin almacenamiento */ }
}

export function useConteoSession(conteos, ubicacion) {
    const conteoActivo = useMemo(
        () => conteos.find(c => c.estado === 'EN_PROGRESO' && c.ubicacion === ubicacion) || null,
        [conteos, ubicacion]
    );
    const activeId = conteoActivo?.id || null;

    // Borrador inicial para el conteo activo: respaldo local (si es más
    // reciente que lo guardado) o los ítems guardados en el servidor.
    const base = useMemo(() => {
        if (!conteoActivo) return { conteoId: null, items: [], notas: '', recovered: false };
        const backup = readBackup(conteoActivo.id);
        const saved = conteoActivo.items || [];
        if (backup && backup.items.length > saved.length) {
            return { conteoId: conteoActivo.id, items: backup.items, notas: backup.notas || '', recovered: true };
        }
        return { conteoId: conteoActivo.id, items: saved, notas: conteoActivo.notas || '', recovered: false };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de conteo
    }, [activeId]);

    const [draft, setDraft] = useState(base);
    const current = draft.conteoId === activeId ? draft : base;

    const update = useCallback((patch) => {
        setDraft(d => {
            const cur = d.conteoId === activeId ? d : base;
            const next = typeof patch === 'function' ? patch(cur) : patch;
            return { ...cur, ...next, conteoId: activeId };
        });
    }, [activeId, base]);

    const setItems = useCallback((fn) => update(cur => ({ items: typeof fn === 'function' ? fn(cur.items) : fn })), [update]);
    const setNotas = useCallback((notas) => update({ notas }), [update]);

    // Respaldo local mientras se cuenta.
    useEffect(() => {
        if (!activeId || current.items.length === 0) return;
        try {
            localStorage.setItem(BACKUP_KEY, JSON.stringify({ id: activeId, items: current.items, notas: current.notas }));
        } catch { /* cuota llena */ }
    }, [activeId, current.items, current.notas]);

    const summary = useMemo(() => {
        const total = current.items.length;
        const conDiff = current.items.filter(i => i.diferencia !== 0).length;
        return { total, conDiff, sinDiff: total - conDiff };
    }, [current.items]);

    return {
        conteoActivo,
        items: current.items,
        notas: current.notas,
        recovered: base.recovered,
        setItems,
        setNotas,
        summary,
    };
}
