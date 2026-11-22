// Callback del flujo OAuth de Google Drive: canjea el código y guarda el
// refresh_token en Firestore (configuracion/google_drive, solo servidor).
import { timingSafeEqual } from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { STATE_COOKIE, isSetupEnabled, getRedirectUri, escapeHtml, htmlPage } from '@/lib/driveOAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sameState(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request) {
    if (!isSetupEnabled()) {
        return htmlPage('Vinculación desactivada', '<p>La vinculación de Google Drive está desactivada.</p>', 404);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const expectedState = request.cookies.get(STATE_COOKIE)?.value;

    if (error) {
        return htmlPage('Error al autorizar Google Drive', `<p>${escapeHtml(error)}</p>`, 400);
    }
    if (!sameState(state, expectedState)) {
        return htmlPage('Solicitud no válida', '<p>La sesión de vinculación expiró o no se inició desde este navegador. Vuelve a empezar.</p>', 400);
    }
    if (!code) {
        return htmlPage('Código no recibido', '<p>Google no devolvió un código de autorización.</p>', 400);
    }

    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID,
                client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
                redirect_uri: getRedirectUri(request),
                grant_type: 'authorization_code',
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.refresh_token) {
            const detail = tokenData.error_description || tokenData.error || 'No se recibió refresh_token';
            return htmlPage('Error canjeando el código', `<p>${escapeHtml(detail)}</p>`, 400);
        }

        await (await adminDb()).collection('configuracion').doc('google_drive').set({
            refresh_token: tokenData.refresh_token,
            actualizado_en: new Date(),
        }, { merge: true });

        const res = htmlPage(
            'Google Drive conectado',
            '<p>La cuenta quedó vinculada y el token se guardó de forma segura en el servidor. Recuerda desactivar de nuevo <code>GOOGLE_DRIVE_OAUTH_SETUP</code>.</p>'
        );
        res.headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/api/auth/google-drive; Max-Age=0; HttpOnly; SameSite=Lax`);
        return res;
    } catch (err) {
        console.error('[LogINV] google-drive callback error:', err);
        return htmlPage('Error inesperado', '<p>No se pudo completar la vinculación. Revisa los registros del servidor.</p>', 500);
    }
}
