'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// Ubicaciones reales del inventario IACYM CNC (ver scripts/lib/excelMapping.js
// - UBICACIONES_MAP - que debe mantenerse en sincronía con estos ids).
export const UBICACIONES = [
    { id: 'GENERAL', nombre: 'General', icono: '🌐', color: 'violet' },
    { id: 'TEMPLO', nombre: 'Templo Principal', icono: '⛪', color: 'brand' },
    { id: 'ALMACEN_B1', nombre: 'Almacén B1', icono: '🧰', color: 'amber' },
    { id: 'ALMACEN_B9', nombre: 'Almacén B9', icono: '📦', color: 'amber' },
    { id: 'ALMACEN_B10', nombre: 'Almacén B10', icono: '📦', color: 'amber' },
    { id: 'ALMACEN_B11', nombre: 'Almacén B11', icono: '📦', color: 'amber' },
    { id: 'ALMACEN_B12', nombre: 'Almacén B12', icono: '📦', color: 'amber' },
    { id: 'ALMACEN_B13', nombre: 'Almacén B13', icono: '📦', color: 'amber' },
    { id: 'ALMACEN_B14', nombre: 'Almacén B14', icono: '📦', color: 'amber' },
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
