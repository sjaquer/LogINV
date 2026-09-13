// ═══════════════════════════════════════════════════════════════════════════
//  excelMapping.js - LogINV Iglesia CNC
//  Lógica única de normalización de "CODIGOS CNC.xlsx" → esquema interno.
//  Usada tanto por scripts/seedExcel.js (migración a Firestore) como por
//  scripts/generateMockData.js (datos mock para desarrollo sin Firebase).
//
//  IMPORTANTE: los `id` de UBICACIONES_MAP deben coincidir exactamente con
//  los `id` definidos en src/context/LocationContext.js (UBICACIONES), ya
//  que esa constante es la que colorea/etiqueta las ubicaciones en la UI.
// ═══════════════════════════════════════════════════════════════════════════

const XLSX = require('xlsx');
const path = require('path');

// ─── Mapeo de Categorías del Excel ───────────────────────────────────────
const CATEGORIAS_MAP = {
    'INSTRUMENTO MUSICAL': { nombre: 'Instrumentos Musicales', icono: '🎵', color: '#8B5CF6', orden: 1 },
    'MOBILARIO': { nombre: 'Mobiliario', icono: '🪑', color: '#3B82F6', orden: 2 },
    'MOBILIARIO': { nombre: 'Mobiliario', icono: '🪑', color: '#3B82F6', orden: 2 },
    'TECNOLOGIA': { nombre: 'Tecnología', icono: '💻', color: '#10B981', orden: 3 },
    'TECNOLOGÍA': { nombre: 'Tecnología', icono: '💻', color: '#10B981', orden: 3 },
    'TECNOLOGICO': { nombre: 'Tecnología', icono: '💻', color: '#10B981', orden: 3 },
    'EQUIPO': { nombre: 'Equipos', icono: '⚙️', color: '#F59E0B', orden: 4 },
    'EQUIPO DE AUDIO': { nombre: 'Equipos', icono: '⚙️', color: '#F59E0B', orden: 4 },
    'EQUIPO DE RED': { nombre: 'Equipos', icono: '⚙️', color: '#F59E0B', orden: 4 },
    'LUCES': { nombre: 'Iluminación', icono: '💡', color: '#EAB308', orden: 5 },
    'ACCESORIOS': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'ACCESORIO': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'ACCESORIOS DE APUNTES': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'ACCESORIOS DE CORRIENTE': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'ACCESORIOS DE SOPORTE': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'ACCESORIOS INALAMBRICOS': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'ACCESORIO DE RED': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'CONEXIONES': { nombre: 'Accesorios', icono: '🔧', color: '#6366F1', orden: 6 },
    'ACCESORIOS DE PINTURA': { nombre: 'Accesorios de Pintura', icono: '🎨', color: '#EC4899', orden: 7 },
    'ACCESORIO DE PINTURA': { nombre: 'Accesorios de Pintura', icono: '🎨', color: '#EC4899', orden: 7 },
    'HERRAMIENTAS': { nombre: 'Herramientas', icono: '🔨', color: '#F97316', orden: 8 },
    'HERRAMIENTA': { nombre: 'Herramientas', icono: '🔨', color: '#F97316', orden: 8 },
    'HERREMIENTAS': { nombre: 'Herramientas', icono: '🔨', color: '#F97316', orden: 8 },
    'HERRAMIENTAS ELECTRICAS': { nombre: 'Herramientas', icono: '🔨', color: '#F97316', orden: 8 },
    // Celdas combinadas mal interpretadas por el parser del Excel original (texto corrupto)
    'LLADORCCDOR DEONITNO DE IMPACTO': { nombre: 'Herramientas', icono: '🔨', color: '#F97316', orden: 8 },
    'CCRTDTIDT DE HERRAMIENTAS': { nombre: 'Herramientas', icono: '🔨', color: '#F97316', orden: 8 },
    'HERRAMIENTAS DE PINTURA': { nombre: 'Herramientas de Pintura', icono: '🖌️', color: '#D946EF', orden: 9 },
    'LIMPIEZA': { nombre: 'Limpieza', icono: '🧹', color: '#14B8A6', orden: 10 },
    'PINTURA': { nombre: 'Pintura', icono: '🎨', color: '#A855F7', orden: 11 },
    'DECORACION': { nombre: 'Decoración', icono: '🎉', color: '#EF4444', orden: 12 },
    'LLA33 COLORMR ORM COLOR BEIGE': { nombre: 'Decoración', icono: '🎉', color: '#EF4444', orden: 12 },
    'SEGURIDAD': { nombre: 'Seguridad', icono: '🔒', color: '#DC2626', orden: 13 },
};

// ─── Mapeo de Ubicaciones del Excel (según levantamiento real CNC) ───────
// El `id` corto es el que usa la app (LocationContext, filtros, mock data).
const UBICACIONES_MAP = {
    // Templo (Sección A y variantes de escritura del levantamiento)
    'SECCION A': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A (auditorio principal)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCION A1': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A1 (puerta izquierda)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCION A2': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A2 (puerta central)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCION': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección General', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCCION': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección General', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCCION A1': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A1 (puerta izquierda)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    // Almacenes (numerados según levantamiento físico B1-B14)
    'B1': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Herramientas y Limpieza (Primer Piso)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
    'B2': { id: 'ALMACEN_B2', nombre: 'Almacén B2', descripcion: 'Almacén B2 - Accesorios y Albañilería', piso: 1, tipo: 'almacen', icono: '📦', color: 'amber' },
    'B3': { id: 'ALMACEN_B3', nombre: 'Almacén B3', descripcion: 'Almacén B3 - Pintura (Segundo Piso)', piso: 2, tipo: 'almacen', icono: '🎨', color: 'amber' },
    'B9': { id: 'ALMACEN_B9', nombre: 'Almacén B9', descripcion: 'Almacén B9 - General', piso: 2, tipo: 'almacen', icono: '📦', color: 'amber' },
    'B10': { id: 'ALMACEN_B10', nombre: 'Almacén B10', descripcion: 'Almacén B10 - General', piso: 2, tipo: 'almacen', icono: '📦', color: 'amber' },
    'B11': { id: 'ALMACEN_B11', nombre: 'Almacén B11', descripcion: 'Almacén B11 - General', piso: 3, tipo: 'almacen', icono: '📦', color: 'amber' },
    'B12': { id: 'ALMACEN_B12', nombre: 'Almacén B12', descripcion: 'Almacén B12 - General', piso: 3, tipo: 'almacen', icono: '📦', color: 'amber' },
    'B13': { id: 'ALMACEN_B13', nombre: 'Almacén B13', descripcion: 'Almacén B13 - General', piso: 3, tipo: 'almacen', icono: '📦', color: 'amber' },
    'B14': { id: 'ALMACEN_B14', nombre: 'Almacén B14', descripcion: 'Almacén B14 - General', piso: 3, tipo: 'almacen', icono: '📦', color: 'amber' },
};

// ─── Mapeo de Estados del Excel ──────────────────────────────────────────
const ESTADOS_MAP = {
    'OPTIMO': 'OPTIMO',
    'OPTIMO ': 'OPTIMO',
    'OPTIIMO': 'OPTIMO',
    'OPTMO': 'OPTIMO',
    'OTIMO': 'OPTIMO',
    'DESGASTADO': 'DESGASTADO',
    'MA ESTADO': 'NECESITA_MANTENIMIENTO',
};

// ─── Mapeo de Responsabilidades del Excel ─────────────────────────────────
const RESPONSABILIDADES_MAP = {
    'MINISTERIO DE ADORACION': 'Ministerio de Adoración',
    'MINISTERIO DE ADORACION ': 'Ministerio de Adoración',
    'MINISTERIO DE ADORACION , INDEPENDIENTE': 'Ministerio de Adoración',
    'MANTENIMIENTO': 'Mantenimiento',
    'MANTEMIENTO': 'Mantenimiento',
    'IMAGEN Y PRODUCCION': 'Imagen y Producción',
    'INDEPENDIENTE': 'Independiente',
};

// ─── Funciones de Limpieza ───────────────────────────────────────────────
function cleanString(str) {
    if (!str) return '';
    return String(str).trim().replace(/\s+/g, ' ');
}

function normalizeCategory(cat) {
    const cleaned = cleanString(cat).toUpperCase();
    return CATEGORIAS_MAP[cleaned] || { nombre: cleaned || 'Sin Categoría', icono: '📦', color: '#6B7280', orden: 99 };
}

function normalizeLocation(loc) {
    const cleaned = cleanString(loc).toUpperCase();
    return UBICACIONES_MAP[cleaned] || {
        id: `OTRO_${cleaned.replace(/[^A-Z0-9]/g, '_') || 'SIN_UBICACION'}`,
        nombre: cleaned ? `Ubicación ${cleaned}` : 'Sin Ubicación',
        descripcion: cleaned ? `Ubicación ${cleaned}` : 'Sin ubicación asignada',
        piso: 1,
        tipo: 'otro',
        icono: '📍',
        color: 'slate',
    };
}

function normalizeStatus(status) {
    const cleaned = cleanString(status).toUpperCase();
    return ESTADOS_MAP[cleaned] || 'OPTIMO';
}

function normalizeResponsibility(resp) {
    const cleaned = cleanString(resp).toUpperCase();
    return RESPONSABILIDADES_MAP[cleaned] || cleanString(resp) || 'Sin Asignar';
}

// ─── Leer "CODIGOS CNC.xlsx" (hojas TEMPLO y ALMACENES) ──────────────────
function readExcelData(excelPath) {
    const resolvedPath = excelPath || path.join(__dirname, '../../data/CODIGOS CNC.xlsx');
    const workbook = XLSX.readFile(resolvedPath);
    const allItems = [];

    if (workbook.Sheets['TEMPLO']) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets['TEMPLO']);
        for (const row of data) {
            const codigo = cleanString(row['__EMPTY_2'] || row['CODIGO']);
            const item = cleanString(row['INVENTARIO DATA DE INFORMACION '] || row['ITEM']);
            if (!codigo || !item || codigo === 'CODIGO' || item === 'ITEM') continue;

            allItems.push({
                codigo_barras: codigo,
                nombre: item,
                descripcion: cleanString(row['__EMPTY_5'] || row['DESCRIPCION']),
                categoria_raw: cleanString(row['__EMPTY_6'] || row['CATEGORIA']),
                ubicacion_raw: cleanString(row['__EMPTY_7'] || row['UBICACIÓN']),
                estado_raw: cleanString(row['__EMPTY_8'] || row['ESTADO']),
                stock_inicial: parseInt(row['__EMPTY_9'] || row['STOCK INICIAL']) || 1,
                responsabilidad_raw: cleanString(row['__EMPTY_10'] || row['RESPONSABILIDAD']),
                observaciones: cleanString(row['__EMPTY_11'] || row['OBSERVACIONES']),
                fuente: 'TEMPLO',
                piso: cleanString(row['__EMPTY_13'] || 'PRIMER PISO') || 'PRIMER PISO',
            });
        }
    }

    if (workbook.Sheets['ALMACENES']) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets['ALMACENES']);
        for (const row of data) {
            const codigo = cleanString(row['__EMPTY_1'] || row['CODIGO']);
            const item = cleanString(row['__EMPTY_4'] || row['ITEM']);
            if (!codigo || !item || codigo === 'CODIGO' || item === 'ITEM') continue;

            allItems.push({
                codigo_barras: codigo,
                nombre: item,
                descripcion: cleanString(row['DATA DE INFORMACION DE LOS ALMACENES DE B1, B2 , B3'] || row['DESCRIPCION']),
                categoria_raw: cleanString(row['__EMPTY_5'] || row['CATEGORIA']),
                ubicacion_raw: cleanString(row['__EMPTY_6'] || row['UBICACIÓN']),
                estado_raw: cleanString(row['__EMPTY_8'] || row['ESTADO']),
                stock_inicial: parseInt(row['__EMPTY_9'] || row['STOCK INICIAL']) || 1,
                responsabilidad_raw: cleanString(row['__EMPTY_10'] || row['RESPONSABILIDAD']),
                observaciones: cleanString(row['__EMPTY_11'] || row['OBSERVACION']),
                fuente: 'ALMACENES',
                piso: parseInt(row['__EMPTY_7'] || '1') || 1,
            });
        }
    }

    return allItems;
}

module.exports = {
    CATEGORIAS_MAP,
    UBICACIONES_MAP,
    ESTADOS_MAP,
    RESPONSABILIDADES_MAP,
    cleanString,
    normalizeCategory,
    normalizeLocation,
    normalizeStatus,
    normalizeResponsibility,
    readExcelData,
};
