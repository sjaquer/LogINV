// ═══════════════════════════════════════════════════════════════════════════
//  /api/drive-upload - LogINV
//  Sube/elimina fotos de productos en la carpeta de Google Drive usando la
//  Cuenta de Servicio. Requiere un usuario de LogINV autenticado y activo
//  (ID token de Firebase en `Authorization: Bearer …`).
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { uploadImageToDrive, deleteImageFromDrive } from '@/lib/googleDriveServiceAccount';
import { HttpError, requireUser, handleApiError } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // las fotos se comprimen en el navegador (~50 KB)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,200}$/;

export async function POST(request) {
    try {
        await requireUser(request);
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') throw new HttpError('No se envió ningún archivo', 400, 'VAL-01');
        if (!ALLOWED_TYPES.includes(file.type)) throw new HttpError('Formato de imagen no permitido', 415, 'IMG-01');
        if (file.size > MAX_BYTES) throw new HttpError('La imagen supera el tamaño máximo (5 MB)', 413, 'IMG-02');

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
        const result = await uploadImageToDrive(buffer, `prod_${Date.now()}_${safeName}`, file.type);

        return NextResponse.json(result);
    } catch (err) {
        return handleApiError(err, '/api/drive-upload POST');
    }
}

export async function DELETE(request) {
    try {
        await requireUser(request);
        const id = new URL(request.url).searchParams.get('id');
        if (!id || !DRIVE_ID_RE.test(id)) throw new HttpError('Id de archivo inválido', 400, 'VAL-01');

        await deleteImageFromDrive(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return handleApiError(err, '/api/drive-upload DELETE');
    }
}
