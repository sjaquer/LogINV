// ═══════════════════════════════════════════════════════════════════════════
//  Compresión de imágenes en el navegador (canvas) - LogINV
//  Redimensiona y recomprime la foto de un producto antes de subirla a
//  Google Drive: menos espacio, cargas más rápidas, sin depender de una
//  librería externa.
// ═══════════════════════════════════════════════════════════════════════════

import { IMAGE_COMPRESSION } from '@/lib/constants';

/**
 * Comprime/redimensiona una imagen manteniendo su relación de aspecto.
 * Los GIF se devuelven sin tocar (para no perder animación).
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressImage(file) {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

    const bitmap = await loadBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, IMAGE_COMPRESSION.MAX_DIMENSION);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, outputType, IMAGE_COMPRESSION.QUALITY)
    );
    if (!blob) return file;

    // Si la compresión no ayudó (imagen ya pequeña), conserva el original.
    if (blob.size >= file.size) return file;

    const newName = outputType === 'image/jpeg'
        ? file.name.replace(/\.\w+$/, '') + '.jpg'
        : file.name;
    return new File([blob], newName, { type: outputType, lastModified: Date.now() });
}

async function loadBitmap(file) {
    if (typeof createImageBitmap === 'function') {
        return createImageBitmap(file);
    }
    // Fallback para navegadores sin createImageBitmap
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function fitWithin(width, height, maxDimension) {
    if (width <= maxDimension && height <= maxDimension) return { width, height };
    const scale = maxDimension / Math.max(width, height);
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
