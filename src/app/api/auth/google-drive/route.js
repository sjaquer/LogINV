import { NextResponse } from 'next/server';

export async function GET(request) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ error: 'NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID no configurado' }, { status: 400 });
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

    const redirectUri = getRedirectUri(request);

    const scope = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
        access_type: 'offline',
        prompt: 'consent',
    }).toString();

    return NextResponse.redirect(authUrl);
}
