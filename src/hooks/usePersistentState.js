'use client';
// Estado persistido en localStorage, compatible con SSR y React 19
// (useSyncExternalStore: sin setState dentro de efectos). Se sincroniza
// entre pestañas y entre componentes que usan la misma clave.
import { useCallback, useSyncExternalStore } from 'react';

const EVENT = 'loginv:storage';

function read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}

function subscribe(callback) {
    window.addEventListener('storage', callback);
    window.addEventListener(EVENT, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(EVENT, callback);
    };
}

/**
 * @param {string} key
 * @param {string} defaultValue  valor en el servidor y cuando no hay nada guardado
 * @returns {[string, (v: string) => void]}
 */
export function usePersistentState(key, defaultValue) {
    const value = useSyncExternalStore(
        subscribe,
        () => read(key) ?? defaultValue,
        () => defaultValue,
    );
    const setValue = useCallback((next) => {
        try { localStorage.setItem(key, next); } catch { /* almacenamiento bloqueado */ }
        window.dispatchEvent(new Event(EVENT));
    }, [key]);
    return [value, setValue];
}

const mqSubscribe = (query) => (callback) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
};

/** true/false según una media query (false en el servidor). */
export function useMediaQuery(query) {
    return useSyncExternalStore(
        useCallback((cb) => mqSubscribe(query)(cb), [query]),
        () => window.matchMedia(query).matches,
        () => false,
    );
}

const noopSubscribe = () => () => {};

/** true solo en el navegador ya hidratado (false durante el render del servidor). */
export function useIsClient() {
    return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
