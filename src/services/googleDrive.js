'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  Google Drive Service - LogINV
//  Fotos de productos guardadas en UNA sola carpeta compartida de Google
//  Drive, dentro de la cuenta de Google de quien inicia sesión en la app
//  (src/services/auth.js). Cada archivo se publica como "cualquiera con el
//  enlace puede ver" al subirlo, por lo que TODOS los usuarios de la app ven
//  la foto sin importar su rol y sin necesitar su propia cuenta de Drive.
//
//  El access token con scope `drive.file` se obtiene junto con el login de
//  Google (OAuth 2.0 vía Firebase Auth) — no hay un flujo de autorización
//  aparte. Cuando el token expira (~1h), se pide reautenticación con Google.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { GOOGLE_DRIVE, APP_CONFIG } from '@/lib/constants';
import { compressImage } from '@/lib/imageCompression';
import { authService } from './auth';

// ─── State ───────────────────────────────────────────────────────────────
let accessToken = null;
let folderIdCache = null;

// ─── Token (obtenido junto al login de Google, ver AuthContext) ──────────
export function setDriveAccessToken(token) {
    accessToken = token || null;
}

export function isAuthorized() {
    return !!accessToken;
}

export function signOut() {
    accessToken = null;
    folderIdCache = null;
}

// Vuelve a pedir consentimiento de Google (incluye el scope drive.file) para
// renovar el token cuando expiró o nunca se obtuvo (ej. sesión restaurada).
async function ensureAuthorized() {
    if (accessToken) return accessToken;
    const { accessToken: token } = await authService.signInWithGoogleForDrive();
    if (!token) throw new Error('No se pudo autorizar el acceso a Google Drive');
    setDriveAccessToken(token);
    return token;
}

// ─── Hacer público un archivo ("cualquiera con el enlace puede ver") ─────
async function makeFilePublic(fileId) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
}

// URL estable para <img src> de un archivo público de Drive.
export function getPublicImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

// ─── Subir imagen de producto (comprime, crea/reusa carpeta, sube, publica) ─
export async function uploadImage(file) {
    if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Usa JPEG, PNG, WebP o GIF');
    }
    if (file.size > APP_CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        throw new Error(`El archivo excede ${APP_CONFIG.MAX_UPLOAD_SIZE_MB}MB`);
    }

    const optimized = await compressImage(file);
    if (optimized.size > APP_CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        throw new Error(`El archivo excede ${APP_CONFIG.MAX_UPLOAD_SIZE_MB}MB, incluso comprimido`);
    }

    await ensureAuthorized();

    try {
        const folderId = await getOrCreateFolder(GOOGLE_DRIVE.FOLDER_NAME);

        const metadata = { name: `${Date.now()}_${optimized.name}`, parents: [folderId] };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', optimized);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
        });
        if (!response.ok) throw new Error('Error al subir la imagen a Google Drive');

        const result = await response.json();
        await makeFilePublic(result.id);

        return { id: result.id, name: result.name, url: getPublicImageUrl(result.id) };
    } catch (error) {
        console.error('[LogINV] Error uploading image:', error);
        throw error;
    }
}

// ─── Eliminar imagen de Google Drive ──────────────────────────────────────
export async function deleteImage(fileId) {
    if (!fileId) return;
    await ensureAuthorized();
    try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch (error) {
        // No bloquear la operación principal (ej. borrar producto) si esto falla
        console.error('[LogINV] Error deleting image:', error);
    }
}

// ─── Obtener o crear la carpeta compartida de fotos (auto-asignación) ────
async function getOrCreateFolder(folderName) {
    if (folderIdCache) return folderIdCache;

    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const result = await response.json();
    if (result.files?.length > 0) {
        folderIdCache = result.files[0].id;
        return folderIdCache;
    }

    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
    });
    const folder = await createResponse.json();
    await makeFilePublic(folder.id);
    folderIdCache = folder.id;
    return folderIdCache;
}

// ─── Hook de React ─────────────────────────────────────────────────────────
export function useGoogleDrive() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const authorize = useCallback(async () => {
        setError(null);
        try {
            await ensureAuthorized();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    }, []);

    const upload = useCallback(async (file) => {
        setLoading(true);
        setError(null);
        try {
            return await uploadImage(file);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const remove = useCallback(async (fileId) => {
        setLoading(true);
        setError(null);
        try {
            await deleteImage(fileId);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { authorized: isAuthorized(), loading, error, authorize, upload, remove };
}
