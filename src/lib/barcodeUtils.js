// ═══════════════════════════════════════════════════════════════════════════
//  barcodeUtils.js - LogINV Iglesia CNC
//  Utilidades para normalización, resolución y búsqueda inteligente de
//  códigos de barras y etiquetas de productos.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normaliza un código eliminando espacios, guiones, barras y pasando a mayúsculas
 */
export function normalizeBarcode(code) {
    if (!code) return '';
    return String(code).trim().replace(/[\s\-_\/]/g, '').toUpperCase();
}

/**
 * Busca un producto en el inventario según el código escaneado,
 * empleando múltiples estrategias de coincidencia progresiva:
 * 1. Coincidencia exacta con `codigo_barras`
 * 2. Coincidencia insensible a mayúsculas y espacios/guiones (ej. "HERAL 4" vs "HERAL4" vs "heral 4")
 * 3. Coincidencia con ID de Firestore (si el código de barras impreso contiene el ID del ítem)
 * 4. Coincidencia con Nombre exacto o normalizado
 * 5. Coincidencia numérica ignorando ceros a la izquierda (padding de estándares EAN/UPC)
 * 6. Extracción de ID o código desde URL (si el escáner leyó un QR con enlace web)
 *
 * @param {Array} productos - Lista completa de productos
 * @param {string} rawCode - Texto decodificado por el escáner
 * @returns {Object|null} Producto encontrado o null
 */
export function findProductByBarcode(productos = [], rawCode = '') {
    if (!rawCode || !Array.isArray(productos) || productos.length === 0) return null;
    const cleanRaw = String(rawCode).trim();
    if (!cleanRaw) return null;

    const normRaw = normalizeBarcode(cleanRaw);
    const noLeadingZerosRaw = normRaw.replace(/^0+/, '');

    // Intentar extraer parámetro o ID si es una URL web
    let urlExtracted = null;
    try {
        if (cleanRaw.startsWith('http://') || cleanRaw.startsWith('https://')) {
            const urlObj = new URL(cleanRaw);
            urlExtracted = urlObj.searchParams.get('buscar') ||
                           urlObj.searchParams.get('id') ||
                           urlObj.searchParams.get('codigo') ||
                           urlObj.searchParams.get('code') ||
                           urlObj.pathname.split('/').filter(Boolean).pop();
        }
    } catch (_) {}
    const normUrlExtracted = urlExtracted ? normalizeBarcode(urlExtracted) : null;

    // Estrategia 1: Coincidencia exacta con codigo_barras
    const exactMatch = productos.find(p => p.codigo_barras && String(p.codigo_barras).trim() === cleanRaw);
    if (exactMatch) return exactMatch;

    // Estrategia 2: Coincidencia normalizada insensible a mayúsculas/espacios/guiones
    const normMatch = productos.find(p => p.codigo_barras && normalizeBarcode(p.codigo_barras) === normRaw);
    if (normMatch) return normMatch;

    // Estrategia 3: Coincidencia con Firestore Document ID
    const idMatch = productos.find(p => p.id && (String(p.id).trim() === cleanRaw || normalizeBarcode(p.id) === normRaw));
    if (idMatch) return idMatch;

    // Estrategia 4: Coincidencia numérica sin ceros iniciales
    if (noLeadingZerosRaw) {
        const zeroMatch = productos.find(p => {
            if (!p.codigo_barras) return false;
            const pNorm = normalizeBarcode(p.codigo_barras).replace(/^0+/, '');
            return pNorm && pNorm === noLeadingZerosRaw;
        });
        if (zeroMatch) return zeroMatch;
    }

    // Estrategia 5: Coincidencia con URL extraída
    if (normUrlExtracted) {
        const urlMatch = productos.find(p => {
            const pNorm = normalizeBarcode(p.codigo_barras);
            const pNormId = normalizeBarcode(p.id);
            return pNorm === normUrlExtracted || pNormId === normUrlExtracted;
        });
        if (urlMatch) return urlMatch;
    }

    // Estrategia 6: Coincidencia con Nombre exacto o normalizado
    const nameMatch = productos.find(p => p.nombre && normalizeBarcode(p.nombre) === normRaw);
    if (nameMatch) return nameMatch;

    return null;
}
