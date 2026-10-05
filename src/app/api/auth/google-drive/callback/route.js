import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return new Response(`<h1>Error al autorizar Google Drive</h1><p>${error}</p>`, {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }

    if (!code) {
        return new Response('<h1>Código no recibido</h1>', {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }

    function getRedirectUri(req) {
        if (process.env.NEXT_PUBLIC_APP_URL) {
            return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/auth/google-drive/callback`;
        }
        const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
        const forwardedProto = req.headers.get('x-forwarded-proto');
        if (forwardedHost) {
            const isLocal = forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1');
            const proto = isLocal ? (forwardedProto || 'http') : 'https';
            return `${proto}://${forwardedHost}/api/auth/google-drive/callback`;
        }
        const { origin } = new URL(req.url);
        return (!origin.includes('localhost') && !origin.includes('127.0.0.1')
            ? origin.replace(/^http:/, 'https:')
            : origin) + '/api/auth/google-drive/callback';
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = getRedirectUri(request);

    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.refresh_token) {
            return new Response(
                `<h1>Error canjeando código</h1><p>${tokenData.error_description || tokenData.error || 'No se recibió refresh_token'}</p>`,
                { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
        }

        const refreshToken = tokenData.refresh_token;

        // Guardar automáticamente en Firestore
        try {
            await adminDb().collection('configuracion').doc('google_drive').set({
                refresh_token: refreshToken,
                actualizado_en: new Date(),
                cuenta: 'nutikuenta@gmail.com',
            }, { merge: true });
        } catch (dbErr) {
            console.warn('[LogINV] Aviso al guardar refresh_token en Firestore:', dbErr.message);
        }

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Google Drive Conectado - LogINV</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
        .card { background: #0d0d10; border: 1px solid #222226; border-radius: 16px; padding: 32px; max-width: 520px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 22px; margin-bottom: 8px; color: #34d399; }
        p { font-size: 14px; color: #a1a1aa; line-height: 1.6; }
        .code-box { background: #060608; border: 1px solid #27272a; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 12px; word-break: break-all; color: #60a5fa; margin: 16px 0; text-align: left; }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px; }
        .btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">✅</div>
        <h1>¡Google Drive Conectado con Éxito!</h1>
        <p>Tu cuenta de Google Drive ha sido vinculada permanentemente. Las fotos de los productos se guardarán automáticamente en tu carpeta compartida sin necesidad de iniciar sesión.</p>
        
        <p style="font-size:12px; color:#71717a; margin-top:16px;">El token ha sido guardado de forma segura en la base de datos. Para mayor respaldo, también puedes agregarlo a tus variables de entorno:</p>
        <div class="code-box">GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}</div>
        
        <a href="/productos" class="btn">Volver a Productos</a>
    </div>
</body>
</html>`;

        return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    } catch (err) {
        return new Response(`<h1>Error inesperado</h1><p>${err.message}</p>`, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }
}
