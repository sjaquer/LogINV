// ═══════════════════════════════════════════════════════════════════════════
//  googleDriveServiceAccount.js - LogINV
//  Sube archivos a Google Drive usando la Cuenta de Servicio del proyecto
//  directamente a una carpeta compartida en nutikuenta@gmail.com.
//  No requiere que los usuarios inicien sesión con Google ni verificación de OAuth.
// ═══════════════════════════════════════════════════════════════════════════

import crypto from 'crypto';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtiene un access token válido para Google Drive.
 * Prioriza el Refresh Token de nutikuenta@gmail.com (para usar su cuota de 15 GB sin errores).
 * Si no está disponible, utiliza la Service Account (JWT flow).
 */
async function getDriveAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken && tokenExpiresAt > now + 60) {
        return cachedToken;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    let refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    // 1. Si no está en env, intentar leer de Firestore (configuracion/google_drive)
    if (!refreshToken) {
        try {
            const { adminDb } = await import('@/lib/firebaseAdmin');
            const doc = await adminDb().collection('configuracion').doc('google_drive').get();
            if (doc.exists) {
                refreshToken = doc.data()?.refresh_token;
            }
        } catch (_) {}
    }

    // 2. Canjear Refresh Token por Access Token (Actúa a nombre de nutikuenta@gmail.com)
    if (refreshToken && clientId && clientSecret) {
        try {
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                }),
            });
            const data = await tokenRes.json();
            if (tokenRes.ok && data.access_token) {
                cachedToken = data.access_token;
                tokenExpiresAt = now + (data.expires_in || 3600);
                return cachedToken;
            }
            console.warn('[LogINV] Falló canje con refresh_token:', data.error_description || data.error);
        } catch (err) {
            console.warn('[LogINV] Error solicitando token con refresh_token:', err.message);
        }
    }

    // 3. Fallback: Service Account JWT Bearer flow
    const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!email || !key) {
        throw new Error('Credenciales de Google Drive / Service Account no configuradas en el servidor');
    }

    key = key.replace(/\\n/g, '\n');

    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
        iss: email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    };

    const encodeBase64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(claimSet)}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    sign.end();
    const signature = sign.sign(key, 'base64url');
    const jwt = `${unsignedToken}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.access_token) {
        throw new Error(`Error obteniendo token de Google Drive: ${data.error_description || data.error || 'Token no recibido'}`);
    }

    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);
    return cachedToken;
}

/**
 * Sube una imagen a Google Drive dentro de la carpeta compartida designada
 * @param {Buffer} fileBuffer - Bytes del archivo
 * @param {string} fileName - Nombre del archivo (ej: 'prod_123.jpg')
 * @param {string} mimeType - Tipo de archivo (ej: 'image/jpeg')
 * @returns {Promise<{ id: string, url: string }>}
 */
export async function uploadImageToDrive(fileBuffer, fileName, mimeType = 'image/jpeg') {
    const accessToken = await getDriveAccessToken();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const metadata = {
        name: fileName,
        mimeType: mimeType,
    };

    if (folderId) {
        metadata.parents = [folderId];
    }

    const boundary = '-------' + crypto.randomBytes(16).toString('hex');
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata);

    const mediaHeader = delimiter +
        `Content-Type: ${mimeType}\r\n` +
        'Content-Transfer-Encoding: binary\r\n\r\n';

    const payload = Buffer.concat([
        Buffer.from(metadataPart, 'utf8'),
        Buffer.from(mediaHeader, 'utf8'),
        fileBuffer,
        Buffer.from(closeDelimiter, 'utf8'),
    ]);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: payload,
    });

    const fileData = await uploadRes.json();
    if (!uploadRes.ok || !fileData.id) {
        throw new Error(fileData.error?.message || 'Error al subir archivo a Google Drive');
    }

    const fileId = fileData.id;

    // Hacer el archivo visible para lectura pública
    try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        });
    } catch (permErr) {
        console.warn('[LogINV] Aviso: no se pudo configurar permiso público en Drive:', permErr);
    }

    const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

    return {
        id: fileId,
        url: directUrl,
    };
}

/**
 * Elimina un archivo de Google Drive por su ID
 */
export async function deleteImageFromDrive(fileId) {
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) return;
    try {
        const accessToken = await getDriveAccessToken();
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch (err) {
        console.warn('[LogINV] Error eliminando archivo en Drive:', err.message);
    }
}
