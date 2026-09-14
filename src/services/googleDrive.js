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

function loadGisScript() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('Window not available'));
        if (window.google?.accounts?.oauth2) return resolve(window.google.accounts.oauth2);
        const existing = document.getElementById('google-gis-script');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.google?.accounts?.oauth2));
            existing.addEventListener('error', reject);
            return;
        }
        const script = document.createElement('script');
        script.id = 'google-gis-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google?.accounts?.oauth2);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Obtiene access token con Google Identity Services sin tocar la sesión de Firebase Auth
async function ensureAuthorized() {
    if (accessToken) return accessToken;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
    if (!clientId) {
        throw new Error('Google Drive Client ID no está configurado');
    }

    try {
        const oauth2 = await loadGisScript();
        return await new Promise((resolve, reject) => {
            const tokenClient = oauth2.initTokenClient({
                client_id: clientId,
                scope: GOOGLE_DRIVE.SCOPE,
                callback: (tokenResponse) => {
                    if (tokenResponse.error) {
                        reject(new Error(tokenResponse.error_description || tokenResponse.error));
                        return;
                    }
                    if (tokenResponse.access_token) {
                        setDriveAccessToken(tokenResponse.access_token);
                        resolve(tokenResponse.access_token);
                    } else {
                        reject(new Error('No se recibió token de acceso de Google Drive'));
                    }
                },
            });
            tokenClient.requestAccessToken({ prompt: '' });
        });
    } catch (err) {
        console.warn('[LogINV] Falló autorización GIS Drive:', err);
        throw err;
    }
}

// ─── Hacer público un archivo ("cualquiera con el enlace puede ver") ─────
async function makeFilePublic(fileId) {
    try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        });
    } catch (err) {
        console.warn('[LogINV] Error publicando archivo en Drive:', err);
    }
}

// URL estable para <img src> de un archivo público de Drive (CDN de Google Photos/Drive).
export function getPublicImageUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
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
