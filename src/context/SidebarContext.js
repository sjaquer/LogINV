'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SidebarContext = createContext(null);
const STORAGE_KEY = 'loginv_sidebar_collapsed';

export function SidebarProvider({ children }) {
    const [collapsed, setCollapsedState] = useState(false);
    const [hideBottomNav, setHideBottomNav] = useState(false);

    // Recordar si el usuario prefiere el menú lateral colapsado.
    useEffect(() => {
        try { setCollapsedState(localStorage.getItem(STORAGE_KEY) === '1'); } catch (_) {}
    }, []);

    const setCollapsed = useCallback((value) => {
        setCollapsedState(value);
        try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); } catch (_) {}
    }, []);

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed, hideBottomNav, setHideBottomNav }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
