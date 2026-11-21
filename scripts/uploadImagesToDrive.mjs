// ═══════════════════════════════════════════════════════════════════════════
//  uploadImagesToDrive.mjs - LogINV
//  Completa los links https:// públicos de las imágenes ya exportadas en
//  `exports/imagenes/` y regenera Excel + CSV + JSON automáticamente.
//
//  Modos de uso:
//    1) Subir a Google Drive (requiere GOOGLE_DRIVE_REFRESH_TOKEN válido):
//         node scripts/uploadImagesToDrive.mjs
//         node scripts/uploadImagesToDrive.mjs --update-firestore
//
//    2) Mapear a otro hosting/CDN/Storage donde hayas subido `exports/imagenes/`:
//         node scripts/uploadImagesToDrive.mjs --base-url https://mi-cdn.com/imagenes
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { generateExportArtifacts } from './lib/exportWorkbook.mjs';

const require = createRequire(import.meta.url);
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getDriveAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
            'Falta GOOGLE_DRIVE_REFRESH_TOKEN (o CLIENT_ID/CLIENT_SECRET) en .env.local.\n' +
            'Alternativa sin Drive: sube exports/imagenes/ a cualquier hosting y ejecuta:\n' +
            '  node scripts/uploadImagesToDrive.mjs --base-url https://tu-url/imagenes'
        );
    }

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
    if (!tokenRes.ok || !data.access_token) {
        throw new Error(
            `Google Drive rechazó el token (${data.error || tokenRes.status}): ${data.error_description || ''}.\n` +
            'Renueva GOOGLE_DRIVE_REFRESH_TOKEN en .env.local o usa --base-url https://tu-url/imagenes.'
        );
    }
    return data.access_token;
}

async function uploadFileToDrive(accessToken, folderId, filePath, fileName) {
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const metadata = { name: fileName, mimeType };
    if (folderId) metadata.parents = [folderId];

    const boundary = '-------' + crypto.randomBytes(16).toString('hex');
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    const payload = Buffer.concat([
        Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata), 'utf8'),
        Buffer.from(delimiter + `Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`, 'utf8'),
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
        throw new Error(fileData.error?.message || 'Error subiendo archivo a Drive');
    }

    const fileId = fileData.id;
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    return {
        id: fileId,
        publicUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
        driveViewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    };
}

function makeThumbsForExport(productos, exportDir, thumbDir) {
    const items = [];
    for (const p of productos) {
        if (!p.imagen_archivo_local) continue;
        const absImg = path.join(exportDir, p.imagen_archivo_local);
        if (!fs.existsSync(absImg)) continue;
        items.push({
            doc_id: p.doc_id,
            base_name: path.basename(absImg, path.extname(absImg)),
            out_dir: path.join(exportDir, 'imagenes'),
            thumb_dir: thumbDir,
            input_path: absImg,
        });
    }
    if (items.length === 0) return new Map();
    const helperPath = path.join(__dirname, 'lib', 'exportImageHelper.py');
    const res = spawnSync('python3', [helperPath], {
        input: JSON.stringify(items),
        encoding: 'utf8',
        maxBuffer: 128 * 1024 * 1024,
    });
    if (res.status !== 0) {
        throw new Error(`Error generando miniaturas: ${res.stderr}`);
    }
    const parsed = JSON.parse(res.stdout);
    return new Map(parsed.filter(r => r.ok).map(r => [r.doc_id, r]));
}

async function main() {
    const args = process.argv.slice(2);
    const baseUrlIdx = args.indexOf('--base-url');
    const baseUrl = baseUrlIdx >= 0 && args[baseUrlIdx + 1]
        ? args[baseUrlIdx + 1].replace(/\/+$/, '')
        : '';
    const updateFirestore = args.includes('--update-firestore');
    const force = args.includes('--force');

    const exportDir = path.resolve(process.cwd(), 'exports');
    const jsonDir = path.join(exportDir, 'json');
    const productosPath = path.join(jsonDir, 'productos.json');

    if (!fs.existsSync(productosPath)) {
        console.error('Primero ejecuta `npm run export:db` para generar exports/json/productos.json e imagenes/.');
        process.exit(1);
    }

    const productos = JSON.parse(fs.readFileSync(productosPath, 'utf8'));
    let accessToken = '';
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

    if (!baseUrl) {
        console.log('🔑 Validando acceso a Google Drive...');
        accessToken = await getDriveAccessToken();
    } else {
        console.log(`🌐 Usando URL base personalizada: ${baseUrl}`);
    }

    let db = null;
    if (updateFirestore) {
        const { initializeApp, cert, getApps } = require('firebase-admin/app');
        const { getFirestore } = require('firebase-admin/firestore');
        if (!getApps().length) {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                }),
            });
        }
        db = getFirestore();
    }

    let updatedCount = 0;
    for (const p of productos) {
        if (!p.imagen_archivo_local) continue;
        if (p.imagen_url_publica && !force) continue;

        const fileName = path.basename(p.imagen_archivo_local);
        const absFile = path.join(exportDir, p.imagen_archivo_local);
        if (!fs.existsSync(absFile)) continue;

        if (baseUrl) {
            p.imagen_url_publica = `${baseUrl}/${encodeURIComponent(fileName)}`;
            p.imagen_estado = 'URL_EXTERNA';
            updatedCount++;
        } else {
            const uploaded = await uploadFileToDrive(accessToken, folderId, absFile, fileName);
            p.imagen_drive_id = uploaded.id;
            p.imagen_url_publica = uploaded.publicUrl;
            p.imagen_url_drive_ver = uploaded.driveViewUrl;
            p.imagen_estado = 'DRIVE_OK';
            updatedCount++;
            if (db) {
                await db.collection('productos').doc(p.doc_id).update({
                    imagen_drive_id: uploaded.id,
                    imagen_url: uploaded.publicUrl,
                });
            }
            console.log(`   ☁️  Subida (${updatedCount}): ${fileName} → ${uploaded.publicUrl}`);
        }
    }

    // Reconstruir colecciones desde exports/json/
    const collectionsData = {};
    for (const f of fs.readdirSync(jsonDir)) {
        if (!f.endsWith('.json') || f === 'backup_completo_raw.json' || f === 'subcolecciones.json') continue;
        const name = f.replace(/\.json$/, '');
        collectionsData[name] = name === 'productos' ? productos : JSON.parse(fs.readFileSync(path.join(jsonDir, f), 'utf8'));
    }

    const thumbDir = path.join(exportDir, '.thumbs_cache');
    fs.mkdirSync(thumbDir, { recursive: true });
    const thumbMap = makeThumbsForExport(productos, exportDir, thumbDir);
    collectionsData.productos = productos.map(p => {
        const t = thumbMap.get(p.doc_id);
        return {
            ...p,
            _thumb_path: t?.thumb_path || '',
            _excel_ext: t?.excel_ext || '',
        };
    });

    const today = new Date().toISOString().slice(0, 10);
    const excelFilename = `loginv_base_datos_completa_${today}.xlsx`;
    const withImage = productos.filter(p => p.imagen_archivo_local).length;
    const withPublicUrl = productos.filter(p => p.imagen_url_publica).length;

    await generateExportArtifacts({
        exportDir,
        excelFilename,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'LogINV',
        collectionsData,
        omittedCollections: [{ collection: 'configuracion', count: 1, reason: 'Omitida por seguridad (credenciales OAuth).' }],
        imageAudit: {
            withImage,
            withoutImage: productos.length - withImage,
            fromBase64: productos.filter(p => p.imagen_estado === 'LOCAL_DESDE_BASE64').length,
            withPublicUrl,
            errors: 0,
            origFormats: {},
            errorNote: `Actualizadas ${updatedCount} URLs públicas`,
        },
    });

    fs.rmSync(thumbDir, { recursive: true, force: true });
    console.log(`\n✅ Listo: ${updatedCount} URLs actualizadas. Excel y CSVs regenerados en ${exportDir}`);
}

main().catch(err => {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
});
