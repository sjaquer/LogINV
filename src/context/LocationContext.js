'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// Ubicaciones reales del inventario IACYM CNC, según la hoja "AVANCES DE INVENTARIO":
// Distribución exacta por piso (Primer Piso, Segundo Piso y Tercer Piso).
export const UBICACIONES = [
    { id: 'GENERAL', nombre: 'Todas las ubicaciones', icono: '🌐', color: 'violet', piso: null },

    // ─── PRIMER PISO ──────────────────────────────────────────────────────────
    { id: 'TEMPLO', nombre: 'Templo', icono: '⛪', color: 'brand', piso: 'Primer Piso' },
    { id: 'BANOS', nombre: 'Baños', icono: '🚻', color: 'slate', piso: 'Primer Piso' },
    { id: 'PATIO_PRIMER_PISO', nombre: 'Patio Primer Piso', icono: '🌿', color: 'emerald', piso: 'Primer Piso' },
    { id: 'ALMACEN_B1', nombre: 'Almacén B1 (Herramientas)', icono: '🧰', color: 'amber', piso: 'Primer Piso' },
    { id: 'ALMACEN_B2', nombre: 'Almacén B2 (Escaleras y Albañilería)', icono: '🪜', color: 'amber', piso: 'Primer Piso' },

    // ─── SEGUNDO PISO ─────────────────────────────────────────────────────────
    { id: 'SALON_PASTORAL', nombre: 'Salón Pastoral', icono: '🎙️', color: 'violet', piso: 'Segundo Piso' },
    { id: 'IMAGEN_PRODUCCION', nombre: 'Imagen Producción', icono: '🎬', color: 'blue', piso: 'Segundo Piso' },
    { id: 'AULA_ADMINISTRATIVA', nombre: 'Aula Administrativa', icono: '💼', color: 'slate', piso: 'Segundo Piso' },
    { id: 'SALON_209', nombre: 'Salón 209', icono: '🚪', color: 'indigo', piso: 'Segundo Piso' },
    { id: 'ALMACEN_B3', nombre: 'Almacén B3 Salón 209 (Ministerio de Adoración)', icono: '🎵', color: 'amber', piso: 'Segundo Piso' },
    { id: 'SALON_209_CUNA', nombre: 'Salón 209 (Cuna)', icono: '👶', color: 'pink', piso: 'Segundo Piso' },
    { id: 'PATIO_SEGUNDO_PISO', nombre: 'Patio Segundo Piso', icono: '☀️', color: 'emerald', piso: 'Segundo Piso' },

    // ─── TERCER PISO ──────────────────────────────────────────────────────────
    { id: 'SALON_301', nombre: 'Salón 301', icono: '🚪', color: 'indigo', piso: 'Tercer Piso' },
    { id: 'ALMACEN_B4', nombre: 'Almacén B4 (Redes Juveniles)', icono: '📦', color: 'amber', piso: 'Tercer Piso' },
    { id: 'SALON_302', nombre: 'Salón 302', icono: '🚪', color: 'indigo', piso: 'Tercer Piso' },
    { id: 'SALON_303', nombre: 'Salón 303 (Salón Pastoral)', icono: '🎙️', color: 'violet', piso: 'Tercer Piso' },
    { id: 'SALON_304', nombre: 'Salón 304 (Salón Pastoral)', icono: '🎙️', color: 'violet', piso: 'Tercer Piso' },
    { id: 'SALON_305', nombre: 'Salón 305 (Salón Pastoral)', icono: '🎙️', color: 'violet', piso: 'Tercer Piso' },
    { id: 'SALON_306', nombre: 'Salón 306 (Comunicaciones)', icono: '📡', color: 'cyan', piso: 'Tercer Piso' },
    { id: 'SALON_307', nombre: 'Salón 307 (Salón Pastoral)', icono: '🎙️', color: 'violet', piso: 'Tercer Piso' },
    { id: 'ALMACEN_DISCOVERY', nombre: 'Salón 308 (Almacén Discovery)', icono: '🧸', color: 'emerald', piso: 'Tercer Piso' },
    { id: 'SALON_309', nombre: 'Salón 309', icono: '🚪', color: 'indigo', piso: 'Tercer Piso' },
];

// Ubicaciones físicas (para operaciones que requieren ubicación real)
export const UBICACIONES_FISICAS = UBICACIONES.filter(u => u.id !== 'GENERAL');

// Lista canónica de pisos del inventario
export const PISOS = ['Primer Piso', 'Segundo Piso', 'Tercer Piso'];

// Obtiene las ubicaciones físicas asociadas a un piso específico
export function getUbicacionesPorPiso(piso) {
    return UBICACIONES_FISICAS.filter(u => u.piso === piso);
}

// Obtiene el piso asociado a un ID de ubicación
export function getPisoDeUbicacion(id) {
    return UBICACIONES.find(u => u.id === id)?.piso || '';
}

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
