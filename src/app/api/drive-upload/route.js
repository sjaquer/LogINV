// ═══════════════════════════════════════════════════════════════════════════
//  /api/drive-upload - LogINV
//  Endpoint server-side para subir imágenes a Google Drive directamente a la
//  carpeta compartida en nutikuenta@gmail.com usando la Cuenta de Servicio.
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { uploadImageToDrive, deleteImageFromDrive } from '@/lib/googleDriveServiceAccount';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `prod_${Date.now()}_${file.name?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.jpg'}`;
        const mimeType = file.type || 'image/jpeg';

        const result = await uploadImageToDrive(buffer, fileName, mimeType);

        return NextResponse.json(result);
    } catch (err) {
        console.error('[API drive-upload] Error:', err);
        return NextResponse.json({ error: err.message || 'Error al subir a Google Drive' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Falta el id del archivo' }, { status: 400 });
        }

        await deleteImageFromDrive(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[API drive-upload DELETE] Error:', err);
        return NextResponse.json({ error: err.message || 'Error al eliminar de Drive' }, { status: 500 });
    }
}
