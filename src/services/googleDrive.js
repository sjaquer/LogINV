'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  Google Drive Service - LogINV Iglesia CNC
//  Fotos de productos guardadas en UNA sola cuenta de Google Drive (la de
//  quien autoriza, ej. el/la encargado/a de inventario). Cada archivo se
//  publica como "cualquiera con el enlace puede ver" al subirlo, por lo que
//  TODOS los usuarios de la app ven la foto sin importar su rol y sin
//  necesitar su propia cuenta de Google — solo quien sube/cambia la foto
//  necesita autorizar una vez por sesión.
//
//  Usa exclusivamente Google Identity Services (GIS) con flujo implícito de
//  token en el navegador: no requiere API Key ni client_secret, solo el
//  Client ID (NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID).
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_DRIVE, APP_CONFIG } from '@/lib/constants';

// ─── State ───────────────────────────────────────────────────────────────
let gis = null;
let tokenClient = null;
let accessToken = null;
let initPromise = null;

// ─── Cargar Google Identity Services ──────────────────────────────────────
export async function initGoogleDrive() {
    if (typeof window === 'undefined') return false;
    if (tokenClient) return true;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            if (!window.google?.accounts) {
                await loadScript('https://accounts.google.com/gsi/client');
            }
            gis = window.google;

            tokenClient = gis.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_DRIVE.CLIENT_ID,
                scope: GOOGLE_DRIVE.SCOPE,
                callback: () => {}, // se sobreescribe por petición en requestAccessToken()
            });

            return true;
        } catch (error) {
            console.error('[LogINV] Error initializing Google Drive:', error);
            return false;
        }
    })();

    return initPromise;
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ─── Solicitar autorización (devuelve una Promise) ───────────────────────
export function requestAccessToken() {
    if (!tokenClient) {
        return Promise.reject(new Error('Google Drive no está inicializado'));
    }
    return new Promise((resolve, reject) => {
        tokenClient.callback = (tokenResponse) => {
            if (tokenResponse.error) { reject(new Error(tokenResponse.error)); return; }
            accessToken = tokenResponse.access_token;
            resolve(accessToken);
        };
        tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
    });
}

export function isAuthorized() {
    return !!accessToken;
}

export function signOut() {
    if (accessToken && gis) {
        gis.accounts.oauth2.revoke(accessToken);
        accessToken = null;
    }
}

// ─── Asegurar autorización antes de una operación ────────────────────────
async function ensureAuthorized() {
    if (accessToken) return accessToken;
    await initGoogleDrive();
    return requestAccessToken();
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

// ─── Subir imagen de producto (crea/reusa carpeta, sube, publica) ────────
export async function uploadImage(file) {
    if (file.size > APP_CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        throw new Error(`El archivo excede ${APP_CONFIG.MAX_UPLOAD_SIZE_MB}MB`);
    }
    if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Usa JPEG, PNG, WebP o GIF');
    }

    await ensureAuthorized();

    try {
        const folderId = await getOrCreateFolder(GOOGLE_DRIVE.FOLDER_NAME);

        const metadata = { name: `${Date.now()}_${file.name}`, parents: [folderId] };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

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

// ─── Obtener o crear la carpeta compartida de fotos ──────────────────────
async function getOrCreateFolder(folderName) {
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const result = await response.json();
    if (result.files?.length > 0) return result.files[0].id;

    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
    });
    const folder = await createResponse.json();
    await makeFilePublic(folder.id);
    return folder.id;
}

// ─── Hook de React ─────────────────────────────────────────────────────────
export function useGoogleDrive() {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        initGoogleDrive();
    }, []);

    const authorize = useCallback(async () => {
        setError(null);
        try {
            await initGoogleDrive();
            await requestAccessToken();
            setAuthorized(true);
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
            const result = await uploadImage(file);
            setAuthorized(true);
            return result;
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

    return { authorized: authorized || isAuthorized(), loading, error, authorize, upload, remove };
}
