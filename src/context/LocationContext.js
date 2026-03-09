'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export const UBICACIONES = [
    { id: 'BAR_1', nombre: 'Bar 1', icono: '🍸', color: 'brand' },
    { id: 'BAR_2', nombre: 'Bar 2', icono: '🍹', color: 'emerald' },
    { id: 'ALMACEN', nombre: 'Almacén', icono: '📦', color: 'amber' },
];

const LocationContext = createContext({
    ubicacion: 'BAR_1',
    setUbicacion: () => {},
    ubicacionInfo: UBICACIONES[0],
    UBICACIONES,
});

export function LocationProvider({ children }) {
    const [ubicacion, setUbicacion] = useState('BAR_1');

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

    return (
        <LocationContext.Provider value={{ ubicacion, setUbicacion: handleSetUbicacion, ubicacionInfo, UBICACIONES }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}
