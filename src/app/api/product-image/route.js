// ═══════════════════════════════════════════════════════════════════════════
//  /api/product-image - LogINV
//  Sirve la foto de un producto guardada como base64 (DataURL) en Firestore,
//  para que el Excel exportado tenga un link https:// clicable por imagen.
//  Si la foto es una URL externa (Drive u otra), redirige a ella.
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ID_RE = /^[a-zA-Z0-9_-]{1,200}$/;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !ID_RE.test(id)) {
        return new Response('Missing or invalid id', { status: 400 });
    }

    try {
        const db = await adminDb();
        const snap = await db.collection('productos').doc(id).get();
        if (!snap.exists) return new Response('Image not found', { status: 404 });

        const raw = String(snap.data()?.imagen_url || '').trim();
        if (!raw) return new Response('Image not found', { status: 404 });

        if (/^https?:\/\//i.test(raw)) {
            return NextResponse.redirect(raw, 302);
        }

        if (!raw.startsWith('data:')) {
            return new Response('Unsupported image source', { status: 415 });
        }

        const comma = raw.indexOf(',');
        const header = raw.slice(0, comma);
        const base64 = raw.slice(comma + 1);
        const contentType = header.slice(5).split(';')[0] || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
            return new Response('Unsupported image type', { status: 415 });
        }

        const buffer = Buffer.from(base64, 'base64');
        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
            },
        });
    } catch (err) {
        console.error('[LogINV] /api/product-image:', err?.message || err);
        return new Response('Error fetching image', { status: 502 });
    }
}
