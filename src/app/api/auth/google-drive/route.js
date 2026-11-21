// Inicia el flujo OAuth para vincular la cuenta de Google Drive de las fotos.
// Desactivado salvo GOOGLE_DRIVE_OAUTH_SETUP=enabled (ver src/lib/driveOAuth.js).
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { STATE_COOKIE, isSetupEnabled, getRedirectUri, htmlPage } from '@/lib/driveOAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
    if (!isSetupEnabled()) {
        return htmlPage('Vinculación desactivada', '<p>La vinculación de Google Drive está desactivada. Un administrador debe habilitarla temporalmente en el servidor (GOOGLE_DRIVE_OAUTH_SETUP=enabled).</p>', 404);
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
    if (!clientId) {
        return htmlPage('Falta configuración', '<p>NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID no está configurado.</p>', 500);
    }

    // `state` aleatorio ligado a este navegador: el callback solo acepta
    // respuestas de un flujo iniciado aquí (protección CSRF).
    const state = randomBytes(24).toString('hex');
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: clientId,
        redirect_uri: getRedirectUri(request),
        response_type: 'code',
        // `drive` completo: hace falta para escribir en la carpeta compartida
        // existente (GOOGLE_DRIVE_FOLDER_ID), que no fue creada por la app.
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
        access_type: 'offline',
        prompt: 'consent',
        state,
    }).toString();

    const res = NextResponse.redirect(authUrl);
    res.cookies.set(STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/google-drive',
        maxAge: 600,
    });
    return res;
}
