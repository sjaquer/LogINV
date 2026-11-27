// ═══════════════════════════════════════════════════════════════════════════
//  exportInventoryExcel.mjs - LogINV
//  Genera el mismo "Reporte de Inventario" que exporta la app (Resumen,
//  Inventario completo y Compras sugeridas) leyendo Firestore directamente.
//
//  Las fotos nuevas viven como base64 en `productos.imagen_url`; cada fila
//  incrusta la miniatura y agrega un link https:// público vía
//  /api/product-image para abrirla desde el Excel.
//
//  Uso:
//    node scripts/exportInventoryExcel.mjs
//    node scripts/exportInventoryExcel.mjs --out-dir exports --app-url https://log-inv.vercel.app
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import ExcelJS from 'exceljs';

const require = createRequire(import.meta.url);
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRAND = 'FF1E40AF';
const BRAND_LIGHT = 'FFEFF6FF';
const HEADER_TEXT = 'FFFFFFFF';
const RED = 'FFFEE2E2';
const RED_TEXT = 'FFB91C1C';
const AMBER = 'FFFEF3C7';
const AMBER_TEXT = 'FF92400E';
const GREEN = 'FFDCFCE7';
const GREEN_TEXT = 'FF166534';
const BORDER = { style: 'thin', color: { argb: 'FFCBD5E1' } };
const THIN_BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

const ESTADO_LABEL = {
    OPTIMO: 'Óptimo',
    DESGASTADO: 'Desgastado',
    NECESITA_MANTENIMIENTO: 'Necesita mantenimiento',
};

const num = (v) => Number(v) || 0;
const isLowStock = (p) => num(p.stock_minimo) > 0 && num(p.stock_actual) < num(p.stock_minimo);

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
            throw new Error('Faltan credenciales de Firebase Admin en .env.local.');
        }
        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    }
    return getFirestore();
}

function dataUrlExtension(dataUrl) {
    const mime = dataUrl.slice(5, dataUrl.indexOf(';')).toLowerCase();
    if (mime.includes('png')) return 'png';
    if (mime.includes('gif')) return 'gif';
    return 'jpeg';
}

function imageLinkFor(p, appUrl) {
    const url = typeof p.imagen_url === 'string' ? p.imagen_url.trim() : '';
    if (/^https?:\/\//i.test(url)) return url;
    if (p.imagen_drive_id) return `https://drive.google.com/file/d/${p.imagen_drive_id}/view`;
    if (url.startsWith('data:') && p.doc_id) {
        return `${appUrl}/api/product-image?id=${encodeURIComponent(p.doc_id)}`;
    }
    return '';
}

function styleHeaderRow(row, fillColor = BRAND) {
    row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = THIN_BORDERS;
    });
    row.height = 24;
}

function addTitleBlock(sheet, title, subtitle) {
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: BRAND } };
    titleCell.alignment = { vertical: 'middle' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:F2');
    const subCell = sheet.getCell('A2');
    subCell.value = subtitle;
    subCell.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
    sheet.getRow(2).height = 18;
}

async function main() {
    const args = process.argv.slice(2);
    const outDirIdx = args.indexOf('--out-dir');
    const outDir = outDirIdx >= 0 && args[outDirIdx + 1]
        ? path.resolve(args[outDirIdx + 1])
        : path.resolve(process.cwd(), 'exports');
    const appUrlIdx = args.indexOf('--app-url');
    const appUrl = (appUrlIdx >= 0 && args[appUrlIdx + 1]
        ? args[appUrlIdx + 1]
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://log-inv.vercel.app')).replace(/\/+$/, '');

    fs.mkdirSync(outDir, { recursive: true });

    console.log('🔌 Conectando a Firestore...');
    const db = initDb();

    const [productosSnap, categoriasSnap, ubicacionesSnap] = await Promise.all([
        db.collection('productos').orderBy('nombre').get(),
        db.collection('categorias').get(),
        db.collection('ubicaciones').get(),
    ]);

    const productos = productosSnap.docs.map(d => ({ doc_id: d.id, id: d.id, ...d.data() }));
    const categorias = categoriasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const ubiLookup = new Map();
    for (const d of ubicacionesSnap.docs) {
        const u = d.data();
        ubiLookup.set(d.id, u.nombre || u.codigo || d.id);
        if (u.codigo) ubiLookup.set(u.codigo, u.nombre || u.codigo);
    }
    const ubicNombre = (p) =>
        ubiLookup.get(p.ubicacion) || p.ubicacion_nombre || p.ubicacion || 'Sin ubicación';

    console.log(`📦 ${productos.length} productos · ${categorias.length} categorías`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LogINV';
    workbook.created = new Date();

    const fechaTexto = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalStock = productos.reduce((sum, p) => sum + num(p.stock_actual), 0);
    const stockBajo = productos.filter(isLowStock);

    // ─── Hoja 1: Resumen ──────────────────────────────────────────────────
    const resumen = workbook.addWorksheet('Resumen', { properties: { tabColor: { argb: BRAND } } });
    resumen.columns = [{ width: 32 }, { width: 18 }, { width: 4 }, { width: 32 }, { width: 14 }, { width: 4 }];
    addTitleBlock(resumen, 'Reporte de Inventario — Iglesia CNC', `Alcance: Todas las ubicaciones · Generado el ${fechaTexto}`);

    resumen.addRow([]);
    const kpiHeaderRow = resumen.addRow(['Indicador', 'Valor']);
    styleHeaderRow(kpiHeaderRow);
    const kpis = [
        ['Total de productos', productos.length],
        ['Unidades totales en stock', totalStock],
        ['Productos con stock bajo', stockBajo.length],
        ['Categorías registradas', categorias.length],
        ['Ubicaciones con inventario', new Set(productos.map(p => p.ubicacion)).size],
    ];
    kpis.forEach(([label, value]) => {
        const row = resumen.addRow([label, value]);
        row.getCell(1).border = THIN_BORDERS;
        row.getCell(2).border = THIN_BORDERS;
        row.getCell(2).alignment = { horizontal: 'center' };
        row.getCell(2).font = { bold: true };
    });

    const catCounts = {};
    productos.forEach(p => { catCounts[p.categoria] = (catCounts[p.categoria] || 0) + 1; });
    const ubiCounts = {};
    productos.forEach(p => { const n = ubicNombre(p); ubiCounts[n] = (ubiCounts[n] || 0) + 1; });

    const startRow = resumen.rowCount + 2;
    resumen.getCell(`A${startRow}`).value = 'Productos por categoría';
    resumen.getCell(`A${startRow}`).font = { bold: true, size: 12, color: { argb: BRAND } };
    resumen.getCell(`D${startRow}`).value = 'Productos por ubicación';
    resumen.getCell(`D${startRow}`).font = { bold: true, size: 12, color: { argb: BRAND } };

    const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const ubiEntries = Object.entries(ubiCounts).sort((a, b) => b[1] - a[1]);
    const maxRows = Math.max(catEntries.length, ubiEntries.length);
    for (let i = 0; i < maxRows; i++) {
        const r = resumen.getRow(startRow + 1 + i);
        if (catEntries[i]) {
            r.getCell(1).value = catEntries[i][0];
            r.getCell(2).value = catEntries[i][1];
            r.getCell(1).border = THIN_BORDERS;
            r.getCell(2).border = THIN_BORDERS;
        }
        if (ubiEntries[i]) {
            r.getCell(4).value = ubiEntries[i][0];
            r.getCell(5).value = ubiEntries[i][1];
            r.getCell(4).border = THIN_BORDERS;
            r.getCell(5).border = THIN_BORDERS;
        }
    }

    // ─── Hoja 2: Inventario completo ──────────────────────────────────────
    const inv = workbook.addWorksheet('Inventario completo', { properties: { tabColor: { argb: BRAND } } });
    inv.columns = [
        { header: 'Foto', key: 'foto', width: 12 },
        { header: 'Link de imagen', key: 'link', width: 46 },
        { header: 'Código de barras', key: 'codigo', width: 18 },
        { header: 'Producto', key: 'nombre', width: 32 },
        { header: 'Descripción', key: 'descripcion', width: 28 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Ubicación', key: 'ubicacion', width: 26 },
        { header: 'Estado', key: 'estado', width: 18 },
        { header: 'Stock actual', key: 'stock_actual', width: 12 },
        { header: 'Stock mínimo', key: 'stock_minimo', width: 12 },
        { header: 'Unidad', key: 'unidad', width: 10 },
        { header: 'Responsable', key: 'responsabilidad', width: 22 },
        { header: 'Observaciones', key: 'observaciones', width: 30 },
    ];
    styleHeaderRow(inv.getRow(1));
    inv.views = [{ state: 'frozen', ySplit: 1 }];
    inv.autoFilter = { from: 'A1', to: 'M1' };

    let conFoto = 0;
    for (const p of productos) {
        const bajoStock = isLowStock(p);
        const row = inv.addRow({
            foto: '',
            link: '',
            codigo: p.codigo_barras || '',
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            categoria: p.categoria,
            ubicacion: ubicNombre(p),
            estado: ESTADO_LABEL[p.estado] || p.estado || '',
            stock_actual: num(p.stock_actual),
            stock_minimo: p.stock_minimo ?? 0,
            unidad: p.unidad || '',
            responsabilidad: p.responsabilidad || '',
            observaciones: p.observaciones || '',
        });
        row.eachCell(cell => { cell.border = THIN_BORDERS; cell.alignment = { vertical: 'middle', wrapText: false }; });
        row.height = 54;

        const linkUrl = imageLinkFor(p, appUrl);
        if (linkUrl) {
            const linkCell = row.getCell('link');
            linkCell.value = { text: linkUrl, hyperlink: linkUrl, tooltip: 'Abrir imagen' };
            linkCell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
        }

        const url = typeof p.imagen_url === 'string' ? p.imagen_url.trim() : '';
        if (url.startsWith('data:')) {
            const imageId = workbook.addImage({ base64: url, extension: dataUrlExtension(url) });
            inv.addImage(imageId, {
                tl: { col: 0.05, row: row.number - 1 + 0.05 },
                ext: { width: 52, height: 52 },
            });
            conFoto++;
        }

        if (bajoStock) {
            row.getCell('stock_actual').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } };
            row.getCell('stock_actual').font = { bold: true, color: { argb: RED_TEXT } };
        }
        const estadoCell = row.getCell('estado');
        if (p.estado === 'OPTIMO') {
            estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
            estadoCell.font = { color: { argb: GREEN_TEXT }, bold: true };
        } else if (p.estado === 'DESGASTADO') {
            estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
            estadoCell.font = { color: { argb: AMBER_TEXT }, bold: true };
        } else if (p.estado === 'NECESITA_MANTENIMIENTO') {
            estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } };
            estadoCell.font = { color: { argb: RED_TEXT }, bold: true };
        }
    }

    const totalRow = inv.addRow({ nombre: 'TOTAL', stock_actual: totalStock });
    totalRow.eachCell(cell => { cell.border = THIN_BORDERS; });
    totalRow.font = { bold: true };
    totalRow.getCell('nombre').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } };
    totalRow.getCell('stock_actual').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } };

    // ─── Hoja 3: Compras sugeridas ────────────────────────────────────────
    const compras = workbook.addWorksheet('Compras sugeridas', { properties: { tabColor: { argb: AMBER_TEXT } } });
    compras.columns = [
        { header: 'Producto', key: 'nombre', width: 32 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Ubicación', key: 'ubicacion', width: 20 },
        { header: 'Stock actual', key: 'stock_actual', width: 12 },
        { header: 'Stock mínimo', key: 'stock_minimo', width: 12 },
        { header: 'Faltante sugerido', key: 'faltante', width: 16 },
        { header: 'Responsable', key: 'responsabilidad', width: 22 },
    ];
    styleHeaderRow(compras.getRow(1), AMBER_TEXT);
    compras.views = [{ state: 'frozen', ySplit: 1 }];
    compras.autoFilter = { from: 'A1', to: 'G1' };

    if (stockBajo.length === 0) {
        compras.mergeCells('A2:G2');
        const cell = compras.getCell('A2');
        cell.value = '✓ Ningún producto está por debajo de su stock mínimo.';
        cell.font = { italic: true, color: { argb: GREEN_TEXT } };
        cell.alignment = { horizontal: 'center' };
    } else {
        [...stockBajo]
            .sort((a, b) => (num(b.stock_minimo) - num(b.stock_actual)) - (num(a.stock_minimo) - num(a.stock_actual)))
            .forEach(p => {
                const faltante = Math.max(0, num(p.stock_minimo) - num(p.stock_actual));
                const row = compras.addRow({
                    nombre: p.nombre,
                    categoria: p.categoria,
                    ubicacion: ubicNombre(p),
                    stock_actual: num(p.stock_actual),
                    stock_minimo: p.stock_minimo ?? 0,
                    faltante: faltante || '—',
                    responsabilidad: p.responsabilidad || '',
                });
                row.eachCell(cell => { cell.border = THIN_BORDERS; });
                row.getCell('stock_actual').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } };
                row.getCell('stock_actual').font = { bold: true, color: { argb: RED_TEXT } };
                row.getCell('faltante').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
                row.getCell('faltante').font = { bold: true, color: { argb: AMBER_TEXT } };
            });
    }

    const filename = `inventario_iglesia_cnc_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const excelPath = path.join(outDir, filename);
    await workbook.xlsx.writeFile(excelPath);

    console.log('\n✅ Reporte de inventario exportado:');
    console.log(`   📘 Excel:    ${excelPath}`);
    console.log(`   🖼️  Fotos incrustadas: ${conFoto}/${productos.length}`);
    console.log(`   🔗 Links:    ${appUrl}/api/product-image?id=<producto>`);
}

main().catch(err => {
    console.error('❌ Error exportando el inventario:', err);
    process.exit(1);
});
