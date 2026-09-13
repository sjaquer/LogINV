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

// ─── Mapeo de Ubicaciones del Excel ───────────────────────────────────────
// Basado en la hoja "PLANTEAMIENTO ESTRATEGICO (INVENTARIO)" de
// INVENTARIO CNC.xlsx: la iglesia tiene 5 almacenes físicos reales
// (Área Mantenimiento: B1-B4, más el Almacén Discovery = B5), cada uno en
// un piso distinto del edificio. Los códigos "B9".."B14" que aparecen en
// la hoja operativa CODIGOS CNC.xlsx NO son almacenes adicionales: son
// herramientas individuales (taladros, atornilladores, kits) registradas
// una por una, todas con piso=1, categoría HERRAMIENTAS y responsable
// MANTENIMIENTO — es decir, físicamente viven en el Almacén B1 (Primer
// Piso), y aquí se pliegan a ese mismo id.
//
// El `id` corto es el que usa la app (LocationContext, filtros, mock data).
const UBICACIONES_MAP = {
    // Templo = Sección A (Primer Piso). A1/A2/A3 son las puertas de acceso
    // (izquierda/central/derecha), no ubicaciones distintas.
    'SECCION A': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A (Primer Piso)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCION A1': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A, puerta izquierda (A1)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCION A2': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A, puerta central (A2)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCION': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección General', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCCION': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección General', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },
    'SECCCION A1': { id: 'TEMPLO', nombre: 'Templo Principal', descripcion: 'Templo - Sección A, puerta izquierda (A1)', piso: 1, tipo: 'templo', icono: '⛪', color: 'violet' },

    // Almacén B1 - Primer Piso: herramientas y limpieza. Los códigos B9-B14
    // del levantamiento operativo son herramientas individuales guardadas
    // aquí mismo (ver nota arriba), por eso comparten el mismo id.
    'B1': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
    'B9': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
    'B10': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
    'B11': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
    'B12': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
    'B13': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
    'B14': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },

    // Almacén B2 - Primer Piso: escaleras y material de albañilería.
    'B2': { id: 'ALMACEN_B2', nombre: 'Almacén B2', descripcion: 'Almacén B2 - Escaleras y Albañilería (Primer Piso)', piso: 1, tipo: 'almacen', icono: '🪜', color: 'amber' },

    // Almacén B3 - Segundo Piso.
    'B3': { id: 'ALMACEN_B3', nombre: 'Almacén B3', descripcion: 'Almacén B3 - Segundo Piso', piso: 2, tipo: 'almacen', icono: '📦', color: 'amber' },

    // Almacén B4 - Tercer Piso: materiales MD, EJ, DS. Pendiente de revisión
    // (nota original: verificar si es servible para las redes).
    'B4': { id: 'ALMACEN_B4', nombre: 'Almacén B4', descripcion: 'Almacén B4 - Tercer Piso (pendiente de revisión de material para redes)', piso: 3, tipo: 'almacen', icono: '📦', color: 'amber' },

    // Almacén Discovery Land (B5) - material y mobiliario para clases de niños.
    'B5': { id: 'ALMACEN_DISCOVERY', nombre: 'Almacén Discovery', descripcion: 'Almacén Discovery Land (B5) - Material para uso de clases y mobiliario', piso: 2, tipo: 'almacen', icono: '🧸', color: 'emerald' },

    // Baños (Primer Piso).
    'M1': { id: 'BANO_MUJERES', nombre: 'Baño de Mujeres', descripcion: 'Baño de Mujeres - Puerta 1 (M1)', piso: 1, tipo: 'otro', icono: '🚻', color: 'slate' },
    'M2': { id: 'BANO_MUJERES', nombre: 'Baño de Mujeres', descripcion: 'Baño de Mujeres - Puerta 2 (M2)', piso: 1, tipo: 'otro', icono: '🚻', color: 'slate' },
    'V1': { id: 'BANO_VARONES', nombre: 'Baño de Varones', descripcion: 'Baño de Varones - Puerta 1 (V1)', piso: 1, tipo: 'otro', icono: '🚻', color: 'slate' },
    'V2': { id: 'BANO_VARONES', nombre: 'Baño de Varones', descripcion: 'Baño de Varones - Puerta 2 (V2)', piso: 1, tipo: 'otro', icono: '🚻', color: 'slate' },

    // Filas de la hoja ALMACENES con celda de ubicación vacía (continuación
    // visual de un bloque de celdas combinadas): mismo perfil que B1
    // (piso 1, herramientas, responsable Mantenimiento) → Almacén B1.
    '': { id: 'ALMACEN_B1', nombre: 'Almacén B1', descripcion: 'Almacén B1 - Primer Piso (Herramientas y Productos de Aseo)', piso: 1, tipo: 'almacen', icono: '🧰', color: 'amber' },
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
