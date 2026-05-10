'use client';
import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [hideBottomNav, setHideBottomNav] = useState(false);
    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed, hideBottomNav, setHideBottomNav }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
