'use client';
import { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { usePersistentState, useMediaQuery } from '@/hooks/usePersistentState';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'loginv_theme';
const MODES = ['light', 'dark', 'auto'];

// Script que se ejecuta antes de pintar (ver layout.js) para aplicar el tema
// guardado sin "flash" de tema claro al cargar en modo oscuro.
export const themeInitScript = `(function(){try{var m=localStorage.getItem('${STORAGE_KEY}')||'auto';var d=m==='dark'||(m==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

// Modos: 'light' | 'dark' | 'auto' (auto = preferencia del sistema operativo)
export function ThemeProvider({ children }) {
    const [stored, setStored] = usePersistentState(STORAGE_KEY, 'auto');
    const mode = MODES.includes(stored) ? stored : 'auto';
    const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
    const resolved = mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode;

    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolved === 'dark');
    }, [resolved]);

    const setTheme = useCallback((m) => setStored(m), [setStored]);
    const toggleTheme = useCallback(() => {
        setStored(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light');
    }, [mode, setStored]);

    const value = useMemo(() => ({ mode, resolved, setTheme, toggleTheme }), [mode, resolved, setTheme, toggleTheme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
