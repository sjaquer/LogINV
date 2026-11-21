// ═══════════════════════════════════════════════════════════════════════════
//  exportFullDatabase.mjs - LogINV
//  Exporta TODA la base de datos de Firestore para migración y respaldo:
//   - exports/loginv_base_datos_completa_YYYY-MM-DD.xlsx (Resumen + todas las hojas + miniaturas)
//   - exports/imagenes/ (todas las fotos convertidas a .jpg/.png universales)
//   - exports/csv/*.csv (UTF-8 con BOM, compatible con Google Sheets / Excel / Airtable)
//   - exports/json/*.json (+ backup_completo_raw.json con respaldo lossless)
//
//  Uso:
//    node scripts/exportFullDatabase.mjs
//    npm run export:db
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import {
    ESTADO_LABELS,
    sanitizeSlug,
    serializeFirestoreValue,
    generateExportArtifacts,
} from './lib/exportWorkbook.mjs';

const require = createRequire(import.meta.url);
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OMITTED_COLLECTIONS = new Set(['configuracion']);

function initDb() {
    if (!getApps().length) {
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '').trim();
        let privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').trim();
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
            (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n').trim();

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error(
                'Faltan credenciales de Firebase Admin en .env.local ' +
                '(FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY).'
            );
        }

        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
        return { db: getFirestore(), projectId };
    }
    return {
        db: getFirestore(),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };
}

function extractDriveId(rawUrl, driveId) {
    if (driveId && /^[a-zA-Z0-9_-]{10,}$/.test(String(driveId).trim())) {
        return String(driveId).trim();
    }
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const m = rawUrl.match(/(?:id=|file\/d\/|thumbnail\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    return m ? m[1] : '';
}

async function fetchRemoteImageBase64(url) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        return buf.toString('base64');
    } catch {
        return null;
    }
}

async function collectSubcollections(colName, docSnaps) {
    const found = [];
    const batchSize = 30;
    for (let i = 0; i < docSnaps.length; i += batchSize) {
        const chunk = docSnaps.slice(i, i + batchSize);
        const results = await Promise.all(chunk.map(async doc => {
            const subcols = await doc.ref.listCollections();
            if (!subcols.length) return [];
            const items = [];
            for (const sc of subcols) {
                const scSnap = await sc.get();
                for (const scDoc of scSnap.docs) {
                    items.push({
                        parent_collection: colName,
                        parent_doc_id: doc.id,
                        subcollection: sc.id,
                        doc_id: scDoc.id,
                        ...serializeFirestoreValue(scDoc.data()),
                    });
                }
            }
            return items;
        }));
        for (const r of results) found.push(...r);
    }
    return found;
}

function sortCollectionDocs(colName, docs) {
    const copy = [...docs];
    if (colName === 'productos') {
        copy.sort((a, b) => {
            const u = String(a.ubicacion_nombre_resuelto || a.ubicacion || '').localeCompare(
                String(b.ubicacion_nombre_resuelto || b.ubicacion || ''), 'es'
            );
            if (u !== 0) return u;
            return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
        });
    } else if (colName === 'categorias') {
        copy.sort((a, b) => (Number(a.orden ?? 9999) - Number(b.orden ?? 9999)) || String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
    } else if (colName === 'ubicaciones') {
        copy.sort((a, b) => String(a.nombre || a.codigo || '').localeCompare(String(b.nombre || b.codigo || ''), 'es'));
    } else if (colName === 'movimientos' || colName === 'conteos') {
        copy.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
    } else if (colName === 'usuarios') {
        copy.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
    }
    return copy;
}

function runPythonImageProcessor(items) {
    if (items.length === 0) return [];
    const helperPath = path.join(__dirname, 'lib', 'exportImageHelper.py');
    const res = spawnSync('python3', [helperPath], {
        input: JSON.stringify(items),
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
    });
    if (res.status !== 0) {
        throw new Error(`Error procesando imágenes en Python: ${res.stderr || res.error?.message}`);
    }
    return JSON.parse(res.stdout);
}

function writeMigrationReadme(exportDir, summary) {
    const content = `# Exportación Completa de Base de Datos — LogINV

- **Fecha de exportación:** ${new Date().toISOString()}
- **Proyecto Firebase:** \`${summary.projectId}\`
- **Archivo Excel principal:** \`${summary.excelFilename}\`

## Contenido de esta carpeta

- \`${summary.excelFilename}\`: Libro Excel completo con hoja \`Resumen\` (conteos e integridad), hoja \`productos\` (con miniaturas incrustadas, enlaces clickeables y todos los campos), y una hoja por cada colección de Firestore.
- \`imagenes/\`: Todas las fotos de productos (${summary.imageAudit.withImage} imágenes) convertidas a formatos universales (\`.jpg\` / \`.png\`).
- \`csv/\`: Archivos CSV (UTF-8 con BOM) por cada colección, listos para importar en **Google Sheets**, **Excel** o **Airtable**.
- \`json/\`: Archivos JSON limpios por colección + \`json/backup_completo_raw.json\` (respaldo maestro 100% íntegro con el base64 original de Firestore).

## Cómo usar las imágenes al migrar a otro servicio

1. **En Excel / LibreOffice:** Abre \`${summary.excelFilename}\` manteniendo la carpeta \`imagenes/\` en la misma ubicación. Cada fila tiene su miniatura incrustada y la columna \`imagen_link_abrir\` apunta directamente al archivo local.
2. **En Google Sheets / Airtable (URLs \`https://\`):**
   - Actualmente las imágenes estaban guardadas en base64 dentro de Firestore (\`${summary.imageAudit.fromBase64}\` fotos).
   - Para tener links \`https://\` públicos en \`imagen_url_publica\`:
     - **Opción A (Google Drive):** Renueva el \`GOOGLE_DRIVE_REFRESH_TOKEN\` en \`.env.local\` y ejecuta:
       \`\`\`bash
       npm run export:upload-images
       \`\`\`
     - **Opción B (Cualquier hosting / Bucket / CDN):** Sube la carpeta \`imagenes/\` a tu nuevo servidor/storage y ejecuta:
       \`\`\`bash
       node scripts/uploadImagesToDrive.mjs --base-url https://tu-dominio.com/imagenes
       \`\`\`
     Ambos comandos actualizan automáticamente \`productos.json\`, \`csv/productos.csv\` y regeneran el Excel con las URLs \`https://\` listas para \`=IMAGE(url)\` en Google Sheets o campos *Attachment* en Airtable.
`;
    fs.writeFileSync(path.join(exportDir, 'README_MIGRACION.md'), content, 'utf8');
}

async function main() {
    const args = process.argv.slice(2);
    const outDirIdx = args.indexOf('--out-dir');
    const exportDir = outDirIdx >= 0 && args[outDirIdx + 1]
        ? path.resolve(args[outDirIdx + 1])
        : path.resolve(process.cwd(), 'exports');

    const imagenesDir = path.join(exportDir, 'imagenes');
    const thumbDir = path.join(exportDir, '.thumbs_cache');
    fs.mkdirSync(imagenesDir, { recursive: true });
    fs.mkdirSync(thumbDir, { recursive: true });

    console.log('🔌 Conectando a Firestore...');
    const { db, projectId } = initDb();

    const rootCollections = await db.listCollections();
    console.log(`📚 Colecciones raíz detectadas (${rootCollections.length}): ${rootCollections.map(c => c.id).join(', ')}`);

    const rawBackup = {};
    const collectionsData = {};
    const omittedCollections = [];
    const subcollectionsData = [];

    for (const col of rootCollections) {
        if (OMITTED_COLLECTIONS.has(col.id)) {
            const snap = await col.get();
            omittedCollections.push({
                collection: col.id,
                count: snap.size,
                reason: 'Omitida por seguridad (contiene credenciales/tokens OAuth).',
            });
            console.log(`⏭️  Omitiendo '${col.id}' (${snap.size} docs) por seguridad.`);
            continue;
        }

        const snap = await col.get();
        console.log(`📥 Descargando '${col.id}': ${snap.size} documentos...`);

        const serializedDocs = snap.docs.map(doc => ({
            doc_id: doc.id,
            ...serializeFirestoreValue(doc.data()),
        }));
        rawBackup[col.id] = serializedDocs;
        collectionsData[col.id] = serializedDocs;

        // Revisar subcolecciones en todos los documentos de esta colección
        const subs = await collectSubcollections(col.id, snap.docs);
        if (subs.length > 0) {
            console.log(`   ↳ Subcolecciones encontradas en '${col.id}': ${subs.length} docs`);
            subcollectionsData.push(...subs);
        }
    }

    // Guardar backup maestro crudo 100% lossless
    const jsonDir = path.join(exportDir, 'json');
    fs.mkdirSync(jsonDir, { recursive: true });
    fs.writeFileSync(
        path.join(jsonDir, 'backup_completo_raw.json'),
        JSON.stringify({ exported_at: new Date().toISOString(), project_id: projectId, collections: rawBackup, subcollections: subcollectionsData }, null, 2),
        'utf8'
    );

    // Construir mapa de ubicaciones para resolver nombres legibles en productos
    const ubiLookup = new Map();
    for (const u of (collectionsData.ubicaciones || [])) {
        if (u.doc_id) ubiLookup.set(u.doc_id, u.nombre || u.codigo || u.doc_id);
        if (u.id) ubiLookup.set(u.id, u.nombre || u.codigo || u.id);
        if (u.codigo) ubiLookup.set(u.codigo, u.nombre || u.codigo);
    }

    // Procesar productos e imágenes
    const productosRaw = collectionsData.productos || [];
    const imagePayloads = [];
    const imageMetaByDocId = new Map();
    let fromBase64 = 0;
    let fromRemote = 0;
    let withoutImage = 0;

    console.log(`🖼️  Analizando imágenes de ${productosRaw.length} productos...`);

    for (const p of productosRaw) {
        const driveId = extractDriveId(p.imagen_url, p.imagen_drive_id);
        const rawUrl = typeof p.imagen_url === 'string' ? p.imagen_url.trim() : '';
        const baseName = `${sanitizeSlug(p.codigo_barras || p.nombre, 28)}_${p.doc_id}`;

        if (rawUrl.startsWith('data:')) {
            fromBase64++;
            const commaIdx = rawUrl.indexOf(',');
            const b64 = commaIdx >= 0 ? rawUrl.slice(commaIdx + 1) : '';
            if (b64) {
                imagePayloads.push({
                    doc_id: p.doc_id,
                    base_name: baseName,
                    out_dir: imagenesDir,
                    thumb_dir: thumbDir,
                    input_base64: b64,
                });
                imageMetaByDocId.set(p.doc_id, {
                    sourceType: 'LOCAL_DESDE_BASE64',
                    driveId: '',
                    publicUrl: '',
                    driveViewUrl: '',
                });
            }
        } else if (driveId || /^https?:\/\//i.test(rawUrl)) {
            fromRemote++;
            const publicUrl = driveId ? `https://lh3.googleusercontent.com/d/${driveId}` : rawUrl;
            const driveViewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/view` : '';
            const fetchUrl = driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000` : rawUrl;
            const b64 = await fetchRemoteImageBase64(fetchUrl);
            if (b64) {
                imagePayloads.push({
                    doc_id: p.doc_id,
                    base_name: baseName,
                    out_dir: imagenesDir,
                    thumb_dir: thumbDir,
                    input_base64: b64,
                });
            }
            imageMetaByDocId.set(p.doc_id, {
                sourceType: driveId ? 'DRIVE_OK' : 'URL_EXTERNA',
                driveId,
                publicUrl,
                driveViewUrl,
            });
        } else {
            withoutImage++;
            imageMetaByDocId.set(p.doc_id, {
                sourceType: 'SIN_IMAGEN',
                driveId: '',
                publicUrl: '',
                driveViewUrl: '',
            });
        }
    }

    console.log(`⚙️  Convirtiendo y validando ${imagePayloads.length} imágenes con Pillow...`);
    const processedResults = runPythonImageProcessor(imagePayloads);
    const processedByDocId = new Map(processedResults.map(r => [r.doc_id, r]));

    const origFormats = {};
    let imgErrors = 0;
    let withPublicUrl = 0;

    for (const r of processedResults) {
        if (r.ok) {
            origFormats[r.orig_format] = (origFormats[r.orig_format] || 0) + 1;
        } else {
            imgErrors++;
            console.warn(`   ⚠️ Error en imagen ${r.doc_id}: ${r.error}`);
        }
    }

    const enrichedProductos = productosRaw.map(p => {
        const meta = imageMetaByDocId.get(p.doc_id);
        const proc = processedByDocId.get(p.doc_id);
        if (meta?.publicUrl) withPublicUrl++;

        const ubicNombreResuelto =
            ubiLookup.get(p.ubicacion) ||
            ubiLookup.get(p.ubicacion_id) ||
            p.ubicacion_nombre ||
            p.ubicacion ||
            '';

        return {
            ...p,
            ubicacion_nombre_resuelto: ubicNombreResuelto,
            estado_legible: ESTADO_LABELS[p.estado] || p.estado || '',
            imagen_estado: proc && !proc.ok ? 'ERROR_EXTRACCION' : (meta?.sourceType || 'SIN_IMAGEN'),
            imagen_formato_original: proc?.ok ? proc.orig_format : '',
            imagen_archivo_local: proc?.ok ? `imagenes/${proc.filename}` : '',
            imagen_url_publica: meta?.publicUrl || '',
            imagen_url_drive_ver: meta?.driveViewUrl || '',
            imagen_drive_id: meta?.driveId || p.imagen_drive_id || '',
            imagen_dimensiones: proc?.ok ? `${proc.width}x${proc.height}` : '',
            imagen_tamano_kb: proc?.ok ? Math.round((proc.size_bytes / 1024) * 10) / 10 : '',
            _thumb_path: proc?.ok ? proc.thumb_path : '',
            _excel_ext: proc?.ok ? proc.excel_ext : '',
        };
    });

    // Ordenar todas las colecciones
    for (const colName of Object.keys(collectionsData)) {
        if (colName === 'productos') {
            collectionsData.productos = sortCollectionDocs('productos', enrichedProductos);
        } else {
            collectionsData[colName] = sortCollectionDocs(colName, collectionsData[colName]);
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    const excelFilename = `loginv_base_datos_completa_${today}.xlsx`;
    const imageAudit = {
        withImage: fromBase64 + fromRemote - imgErrors,
        withoutImage,
        fromBase64,
        fromRemote,
        withPublicUrl,
        errors: imgErrors,
        origFormats,
        errorNote: imgErrors ? `${imgErrors} imágenes fallaron al decodificar` : 'Todas las imágenes procesadas correctamente',
    };

    console.log('📊 Generando Excel completo, CSVs y JSONs...');
    const { excelPath, collectionMeta } = await generateExportArtifacts({
        exportDir,
        excelFilename,
        projectId,
        collectionsData,
        omittedCollections,
        imageAudit,
        subcollectionsData,
    });

    writeMigrationReadme(exportDir, { projectId, excelFilename, imageAudit });

    // Limpiar caché temporal de miniaturas
    fs.rmSync(thumbDir, { recursive: true, force: true });

    console.log('\n✅ Exportación completa finalizada:');
    console.log(`   📘 Excel:    ${excelPath}`);
    console.log(`   🖼️  Imágenes: ${imagenesDir} (${imageAudit.withImage} archivos)`);
    console.log(`   📄 CSVs:     ${path.join(exportDir, 'csv')}`);
    console.log(`   📦 JSONs:    ${jsonDir}`);
    console.log('   📋 Colecciones:', collectionMeta.map(c => `${c.collection}=${c.count}`).join(', '));
}

main().catch(err => {
    console.error('❌ Error en exportación:', err);
    process.exit(1);
});
