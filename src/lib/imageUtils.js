// ═══════════════════════════════════════════════════════════════════════════
//  Image Utilities - LogINV
//  Funciones puras para normalizar y resolver URLs de imágenes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normaliza URLs de imágenes (especialmente Google Drive) a enlaces directos CDN de alta compatibilidad.
 * @param {string} rawUrl 
 * @returns {string}
 */
export function formatProductImageUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;

    // Extraer File ID de enlaces de Google Drive si aplica
    const driveMatch = rawUrl.match(/(?:id=|file\/d\/|thumbnail\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
        const fileId = driveMatch[1];
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return rawUrl;
}

/**
 * Genera URL de fallback para imágenes de Google Drive en caso de falla del CDN principal.
 * @param {string} rawUrl 
 * @returns {string|null}
 */
export function getDriveFallbackUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const driveMatch = rawUrl.match(/(?:id=|file\/d\/|thumbnail\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    return null;
}
