'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// Modes: 'light' | 'dark' | 'auto'
export function ThemeProvider({ children }) {
    const [mode, setMode] = useState('auto');
    const [resolved, setResolved] = useState('light');

    // Load preference
    useEffect(() => {
        try {
            const stored = localStorage.getItem('loginv_theme');
            if (stored === 'light' || stored === 'dark' || stored === 'auto') setMode(stored);
        } catch (_) {}
    }, []);

    // Resolve auto mode and apply class
    useEffect(() => {
        function resolve() {
            if (mode === 'auto') {
                const hour = new Date().getHours();
                setResolved(hour >= 18 || hour < 6 ? 'dark' : 'light');
            } else {
                setResolved(mode);
            }
        }
        resolve();
        // Re-check every minute for auto mode
        const interval = mode === 'auto' ? setInterval(resolve, 60000) : null;
        return () => { if (interval) clearInterval(interval); };
    }, [mode]);

    // Apply class to html
    useEffect(() => {
        const html = document.documentElement;
        if (resolved === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [resolved]);

    const setTheme = useCallback((newMode) => {
        setMode(newMode);
        try { localStorage.setItem('loginv_theme', newMode); } catch (_) {}
    }, []);

    const toggleTheme = useCallback(() => {
        const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
        setTheme(next);
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
