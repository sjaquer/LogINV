// ═══════════════════════════════════════════════════════════════════════════
//  Utilidades del flujo OAuth de Google Drive (SOLO SERVIDOR)
//  El flujo vincula la cuenta de Drive donde se guardan las fotos. Es una
//  configuración puntual, así que está DESACTIVADO por defecto: para volver a
//  vincular, define GOOGLE_DRIVE_OAUTH_SETUP=enabled, completa el flujo y
//  vuelve a quitar la variable.
// ═══════════════════════════════════════════════════════════════════════════

export const STATE_COOKIE = 'loginv_gd_oauth_state';

export function isSetupEnabled() {
    return process.env.GOOGLE_DRIVE_OAUTH_SETUP === 'enabled';
}

export function getRedirectUri(req) {
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

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

export function htmlPage(title, body, status = 200) {
    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} · LogINV</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#0b0b0e;color:#f4f4f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
.card{background:#131317;border:1px solid #26262b;border-radius:16px;padding:32px;max-width:520px;text-align:center}
h1{font-size:20px;margin:0 0 8px}p{font-size:14px;color:#a1a1aa;line-height:1.6}
a{display:inline-block;background:#2563eb;color:#fff;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:12px;font-size:14px}
</style></head><body><div class="card"><h1>${escapeHtml(title)}</h1>${body}<a href="/productos">Volver a LogINV</a></div></body></html>`;
    return new Response(html, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
}
