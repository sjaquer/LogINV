// ═══════════════════════════════════════════════════════════════════════════
//  /api/drive-image - LogINV
//  Proxy server-side para leer los bytes de una foto pública de Google Drive
//  (fetch desde el navegador falla por CORS contra drive.google.com; desde
//  el servidor no aplica esa restricción). Se usa para incrustar las fotos
//  de los productos dentro del reporte Excel.
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return new Response('Missing or invalid id', { status: 400 });
    }

    try {
        const res = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w800`);
        if (!res.ok) {
            return new Response('Image not found', { status: 404 });
        }
        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (err) {
        return new Response('Error fetching image', { status: 502 });
    }
}
