'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// Ubicaciones reales del inventario IACYM CNC, según la hoja "PLANTEAMIENTO
// ESTRATEGICO (INVENTARIO)" de INVENTARIO CNC.xlsx: 5 almacenes físicos
// (Área Mantenimiento B1-B4 + Almacén Discovery = B5) repartidos en pisos
// distintos, más el Templo (Sección A) y el Salón 204 de Administración.
// Debe mantenerse en sincronía con scripts/lib/excelMapping.js (UBICACIONES_MAP).
export const UBICACIONES = [
    { id: 'GENERAL', nombre: 'General', icono: '🌐', color: 'violet' },
    { id: 'TEMPLO', nombre: 'Templo Principal', icono: '⛪', color: 'brand' },
    { id: 'ALMACEN_B1', nombre: 'Almacén B1', icono: '🧰', color: 'amber' },
    { id: 'ALMACEN_B2', nombre: 'Almacén B2', icono: '🪜', color: 'amber' },
    { id: 'ALMACEN_B3', nombre: 'Almacén B3', icono: '📦', color: 'amber' },
    { id: 'ALMACEN_B4', nombre: 'Almacén B4', icono: '📦', color: 'amber' },
    { id: 'ALMACEN_DISCOVERY', nombre: 'Almacén Discovery', icono: '🧸', color: 'emerald' },
    { id: 'SALON_204', nombre: 'Salón 204', icono: '🖨️', color: 'blue' },
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
