// ═══════════════════════════════════════════════════════════════════════════
//  Almacén de datos de demostración (NEXT_PUBLIC_USE_MOCK=true)
//  Un único store en memoria por colección, compatible con
//  useSyncExternalStore. Cada hook registra sus datos iniciales con
//  registerMock(); se materializan la primera vez que se leen.
// ═══════════════════════════════════════════════════════════════════════════

const EMPTY = Object.freeze([]);
const store = new Map();
const subscribers = new Map();
const initializers = new Map();

export function registerMock(name, init) {
    if (!initializers.has(name)) initializers.set(name, init);
}

export function getMock(name) {
    if (!store.has(name)) {
        const init = initializers.get(name);
        store.set(name, init ? init() : EMPTY);
    }
    return store.get(name);
}

export function setMock(name, updater) {
    const next = typeof updater === 'function' ? updater(getMock(name)) : updater;
    store.set(name, next);
    subscribers.get(name)?.forEach(fn => fn());
}

export function subscribeMock(name, fn) {
    if (!subscribers.has(name)) subscribers.set(name, new Set());
    subscribers.get(name).add(fn);
    return () => subscribers.get(name)?.delete(fn);
}

/** Imita un Timestamp de Firestore ({ toDate, seconds }). */
export function mockTimestamp(date = new Date()) {
    const d = new Date(date);
    return { toDate: () => d, seconds: d.getTime() / 1000 };
}

export function mockId(prefix = 'doc') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const DAY = 24 * 60 * 60 * 1000;
