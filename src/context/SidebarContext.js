'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
    // Recuerda si el usuario prefiere el menú lateral colapsado.
    const [stored, setStored] = usePersistentState('loginv_sidebar_collapsed', '0');
    const collapsed = stored === '1';
    const setCollapsed = useCallback((value) => setStored(value ? '1' : '0'), [setStored]);
    const [hideBottomNav, setHideBottomNav] = useState(false);

    const value = useMemo(() => ({ collapsed, setCollapsed, hideBottomNav, setHideBottomNav }), [collapsed, setCollapsed, hideBottomNav]);
    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
    return useContext(SidebarContext);
}
