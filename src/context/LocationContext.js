'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// Ubicaciones reales del inventario IACYM CNC
export const UBICACIONES = [
    { id: 'GENERAL', nombre: 'Todas las ubicaciones', icono: '🌐', color: 'violet' },
    { id: 'TEMPLO', nombre: 'Templo', icono: '⛪', color: 'brand' },
    { id: 'BANOS', nombre: 'Baños', icono: '🚻', color: 'slate' },
    { id: 'PATIO_PRIMER_PISO', nombre: 'Patio Primer Piso', icono: '🌿', color: 'emerald' },
    { id: 'ALMACEN_B1', nombre: 'Almacén B1 (Herramientas)', icono: '🧰', color: 'amber' },
    { id: 'ALMACEN_B2', nombre: 'Almacén B2 (Escaleras y Albañilería)', icono: '🪜', color: 'amber' },
    { id: 'SALON_PASTORAL', nombre: 'Salón Pastoral', icono: '🎙️', color: 'violet' },
    { id: 'IMAGEN_PRODUCCION', nombre: 'Imagen Producción', icono: '🎬', color: 'blue' },
    { id: 'AULA_ADMINISTRATIVA', nombre: 'Aula Administrativa', icono: '💼', color: 'slate' },
    { id: 'SALON_209', nombre: 'Salón 209', icono: '🚪', color: 'indigo' },
    { id: 'ALMACEN_B3', nombre: 'Almacén B3 Salón 209 (Ministerio de Adoración)', icono: '🎵', color: 'amber' },
    { id: 'SALON_209_CUNA', nombre: 'Salón 209 (Cuna)', icono: '👶', color: 'pink' },
    { id: 'PATIO_SEGUNDO_PISO', nombre: 'Patio Segundo Piso', icono: '☀️', color: 'emerald' },
    { id: 'SALON_301', nombre: 'Salón 301', icono: '🚪', color: 'indigo' },
    { id: 'ALMACEN_B4', nombre: 'Almacén B4 (Redes Juveniles)', icono: '📦', color: 'amber' },
    { id: 'SALON_302', nombre: 'Salón 302', icono: '🚪', color: 'indigo' },
    { id: 'SALON_303', nombre: 'Salón 303 (Salón Pastoral)', icono: '🎙️', color: 'violet' },
    { id: 'SALON_304', nombre: 'Salón 304 (Salón Pastoral)', icono: '🎙️', color: 'violet' },
    { id: 'SALON_305', nombre: 'Salón 305 (Salón Pastoral)', icono: '🎙️', color: 'violet' },
    { id: 'SALON_306', nombre: 'Salón 306 (Comunicaciones)', icono: '📡', color: 'cyan' },
    { id: 'SALON_307', nombre: 'Salón 307 (Salón Pastoral)', icono: '🎙️', color: 'violet' },
    { id: 'ALMACEN_DISCOVERY', nombre: 'Salón 308 (Almacén Discovery)', icono: '🧸', color: 'emerald' },
    { id: 'SALON_309', nombre: 'Salón 309', icono: '🚪', color: 'indigo' },
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
