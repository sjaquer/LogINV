'use client';
import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocations } from '@/hooks/useLocations';
import { usePersistentState } from '@/hooks/usePersistentState';

// Ubicaciones reales y base del inventario IACYM CNC
export const UBICACIONES_DEFAULT = [
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

export const UBICACIONES = UBICACIONES_DEFAULT;
export const UBICACIONES_FISICAS = UBICACIONES_DEFAULT.filter(u => u.id !== 'GENERAL');

const GENERAL_DEFAULT = UBICACIONES_DEFAULT[0];

// Live in-memory cache for helper functions outside React hook lifecycle
let liveLocationsCache = [...UBICACIONES_DEFAULT];

/**
 * Resilient lookup helper to resolve any location ID, code, or name to its location object.
 * Safe for use in components, hooks, export scripts, and modals.
 */
export function getLocationInfo(id, customList) {
    if (!id || id === 'GENERAL') return GENERAL_DEFAULT;
    const list = customList || liveLocationsCache;
    const found = list.find(u => 
        u.id === id || 
        u.codigo === id || 
        (u.nombre && u.nombre.toLowerCase() === String(id).toLowerCase())
    );
    if (found) return found;
    return {
        id: String(id),
        codigo: String(id),
        nombre: String(id),
        icono: '📍',
        color: 'slate',
        activa: true,
    };
}

const LocationContext = createContext({
    ubicacion: 'GENERAL',
    setUbicacion: () => {},
    ubicacionInfo: GENERAL_DEFAULT,
    isGeneral: true,
    UBICACIONES: UBICACIONES_DEFAULT,
    ubicaciones: UBICACIONES_DEFAULT,
    ubicacionesActivas: UBICACIONES_DEFAULT,
    ubicacionesFisicas: UBICACIONES_FISICAS,
    todasLasUbicacionesFisicas: UBICACIONES_FISICAS,
    getLocationInfo,
});

export function LocationProvider({ children }) {
    const { ubicaciones: dbUbicaciones, loading } = useLocations();
    // Ubicación elegida por el usuario (persistida entre sesiones).
    const [selected, setSelected] = usePersistentState('loginv_ubicacion', 'GENERAL');

    // Lista: la de Firestore (ordenada) o la predeterminada si aún no hay datos.
    // La caché de getLocationInfo() se actualiza aquí mismo (no en un efecto)
    // para que los hijos que se renderizan a continuación ya la vean.
    const ubicacionesList = useMemo(() => {
        let list = UBICACIONES_DEFAULT;
        if (dbUbicaciones.length) {
            const sorted = [...dbUbicaciones].sort((a, b) =>
                (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
            list = [GENERAL_DEFAULT, ...sorted];
        }
        // eslint-disable-next-line react-hooks/globals -- caché de lectura para getLocationInfo() fuera de React
        liveLocationsCache = list;
        return list;
    }, [dbUbicaciones]);

    // Si la ubicación elegida ya no existe (fue eliminada), se usa la vista general.
    const ubicacion = useMemo(() => {
        if (selected === 'GENERAL' || loading) return selected;
        return ubicacionesList.some(u => u.id === selected) ? selected : 'GENERAL';
    }, [selected, ubicacionesList, loading]);

    const handleSetUbicacion = useCallback((id) => setSelected(id || 'GENERAL'), [setSelected]);

    const ubicacionInfo = useMemo(() => {
        return ubicacionesList.find(u => u.id === ubicacion) || GENERAL_DEFAULT;
    }, [ubicacionesList, ubicacion]);

    const isGeneral = ubicacion === 'GENERAL';

    // Ubicaciones activas para el switcher del header
    const ubicacionesActivas = useMemo(() => {
        return ubicacionesList.filter(u => u.id === 'GENERAL' || u.activa !== false);
    }, [ubicacionesList]);

    // Ubicaciones físicas activas para asignación de productos
    const ubicacionesFisicas = useMemo(() => {
        return ubicacionesList.filter(u => u.id !== 'GENERAL' && u.activa !== false);
    }, [ubicacionesList]);

    // Todas las ubicaciones físicas (incluye inactivas para administración o historial)
    const todasLasUbicacionesFisicas = useMemo(() => {
        return ubicacionesList.filter(u => u.id !== 'GENERAL');
    }, [ubicacionesList]);

    return (
        <LocationContext.Provider value={{
            ubicacion,
            setUbicacion: handleSetUbicacion,
            ubicacionInfo,
            isGeneral,
            UBICACIONES: ubicacionesList,
            ubicaciones: ubicacionesList,
            ubicacionesActivas,
            ubicacionesFisicas,
            todasLasUbicacionesFisicas,
            getLocationInfo,
        }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}
