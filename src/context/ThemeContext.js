'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'loginv_theme';

// Script que se ejecuta antes de pintar (ver layout.js) para aplicar el tema
// guardado sin "flash" de tema claro al cargar en modo oscuro.
export const themeInitScript = `(function(){try{var m=localStorage.getItem('${STORAGE_KEY}')||'auto';var d=m==='dark'||(m==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

// Modos: 'light' | 'dark' | 'auto' (auto = preferencia del sistema operativo)
export function ThemeProvider({ children }) {
    const [mode, setMode] = useState('auto');
    const [resolved, setResolved] = useState('light');

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark' || stored === 'auto') setMode(stored);
        } catch (_) {}
    }, []);

    useEffect(() => {
        if (mode !== 'auto') {
            setResolved(mode);
            return;
        }
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => setResolved(mq.matches ? 'dark' : 'light');
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [mode]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolved === 'dark');
    }, [resolved]);

    const setTheme = useCallback((newMode) => {
        setMode(newMode);
        try { localStorage.setItem(STORAGE_KEY, newMode); } catch (_) {}
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light');
    }, [mode, setTheme]);

    return (
        <ThemeContext.Provider value={{ mode, resolved, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
