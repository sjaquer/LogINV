'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export const UBICACIONES = [
    { id: 'GENERAL', nombre: 'General', icono: '🌐', color: 'violet' },
    { id: 'BAR_1', nombre: 'Bar 1', icono: '🍸', color: 'brand' },
    { id: 'BAR_2', nombre: 'Bar 2', icono: '🍹', color: 'emerald' },
    { id: 'ALMACEN', nombre: 'Almacén', icono: '📦', color: 'amber' },
];

// Ubicaciones físicas (para operaciones que requieren ubicación real)
export const UBICACIONES_FISICAS = UBICACIONES.filter(u => u.id !== 'GENERAL');

const LocationContext = createContext({
    ubicacion: 'GENERAL',
    setUbicacion: () => {},
    ubicacionInfo: UBICACIONES[0],
    isGeneral: true,
    UBICACIONES,
});

export function LocationProvider({ children }) {
    const [ubicacion, setUbicacion] = useState('GENERAL');

    useEffect(() => {
        try {
            const stored = localStorage.getItem('loginv_ubicacion');
            if (stored && UBICACIONES.find(u => u.id === stored)) {
                setUbicacion(stored);
            }
        } catch (_) {}
    }, []);

    function handleSetUbicacion(id) {
        setUbicacion(id);
        try { localStorage.setItem('loginv_ubicacion', id); } catch (_) {}
    }

    const ubicacionInfo = UBICACIONES.find(u => u.id === ubicacion) || UBICACIONES[0];
    const isGeneral = ubicacion === 'GENERAL';

    return (
        <LocationContext.Provider value={{ ubicacion, setUbicacion: handleSetUbicacion, ubicacionInfo, isGeneral, UBICACIONES }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}
