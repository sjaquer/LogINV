// ═══════════════════════════════════════════════════════════════════════════
//  exportWorkbook.mjs - LogINV
//  Módulo compartido para generar:
//   - Excel completo (.xlsx) con miniaturas incrustadas, links y hoja Resumen
//   - CSVs UTF-8 con BOM por colección (compatibles con Excel/Sheets/Airtable)
//   - JSONs limpios por colección
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');

const BRAND = 'FF1E40AF';
const BRAND_LIGHT = 'FFEFF6FF';
const HEADER_TEXT = 'FFFFFFFF';
const SLATE_TEXT = 'FF475569';
const GREEN_BG = 'FFDCFCE7';
const GREEN_TEXT = 'FF166534';
const AMBER_BG = 'FFFEF3C7';
const AMBER_TEXT = 'FF92400E';
const RED_BG = 'FFFEE2E2';
const RED_TEXT = 'FFB91C1C';
const BORDER = { style: 'thin', color: { argb: 'FFCBD5E1' } };
const THIN_BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

export const ESTADO_LABELS = {
    OPTIMO: 'Óptimo',
    DESGASTADO: 'Desgastado',
    NECESITA_MANTENIMIENTO: 'Necesita mantenimiento',
    disponible: 'Disponible',
    prestado: 'Prestado',
    mantenimiento: 'En Mantenimiento',
    dado_de_baja: 'Dado de Baja',
};

export function sanitizeSlug(input, maxLen = 40) {
    const clean = String(input || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, maxLen);
    return clean || 'item';
}

export function sanitizeSheetName(name, usedNames = new Set()) {
    let base = String(name || 'Hoja').replace(/[\\/*?:[\]]/g, '_').slice(0, 31) || 'Hoja';
    let candidate = base;
    let i = 2;
    while (usedNames.has(candidate.toLowerCase())) {
        const suffix = `_${i++}`;
        candidate = base.slice(0, 31 - suffix.length) + suffix;
    }
    usedNames.add(candidate.toLowerCase());
    return candidate;
}

/**
 * Convierte cualquier valor de Firestore (Timestamp, DocumentReference, Array, Object)
 * en una representación serializable JSON-safe manteniendo ISO-8601 para fechas.
 */
export function serializeFirestoreValue(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'object') {
        if (typeof val.toDate === 'function') {
            return val.toDate().toISOString();
        }
        if (typeof val._seconds === 'number') {
            return new Date(val._seconds * 1000).toISOString();
        }
        if (val._firestore && val.path) {
            return val.path;
        }
        if (Array.isArray(val)) {
            return val.map(serializeFirestoreValue);
        }
        const out = {};
        for (const [k, v] of Object.entries(val)) {
            out[k] = serializeFirestoreValue(v);
        }
        return out;
    }
    return String(val);
}

/**
 * Convierte cualquier valor ya serializado en un valor seguro para celda tabular (CSV/Excel).
 * Nunca devuelve "[object Object]" ni supera el límite de 32,767 caracteres de Excel.
 */
export function toCellValue(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'boolean' || typeof val === 'number') return val;
    if (typeof val === 'string') {
        if (val.length > 32000) {
            return val.slice(0, 31950) + '... [TRUNCADO_POR_LIMITE_EXCEL]';
        }
        return val;
    }
    if (Array.isArray(val) || typeof val === 'object') {
        const str = JSON.stringify(val);
        if (str.length > 32000) {
            return str.slice(0, 31950) + '... [TRUNCADO]';
        }
        return str;
    }
    return String(val);
}

function escapeCsvField(val) {
    const cell = toCellValue(val);
    if (cell === '') return '';
    const str = String(cell);
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function writeCsvFile(filePath, columns, rows) {
    const header = columns.map(c => escapeCsvField(c.key)).join(',');
    const lines = rows.map(row =>
        columns.map(c => escapeCsvField(row[c.key])).join(',')
    );
    // UTF-8 con BOM para compatibilidad directa con Excel, Google Sheets y Airtable
    const content = '\uFEFF' + [header, ...lines].join('\r\n') + '\r\n';
    fs.writeFileSync(filePath, content, 'utf8');
}

function styleHeaderRow(row, fillColor = BRAND) {
    row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 10.5 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = THIN_BORDERS;
    });
    row.height = 26;
}

function getColumnLetter(colNumber) {
    let letter = '';
    let n = colNumber;
    while (n > 0) {
        const mod = (n - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        n = Math.floor((n - mod) / 26);
    }
    return letter;
}

function inferColumnWidth(key, rows, min = 12, max = 42) {
    let maxLen = String(key).length + 2;
    const sample = rows.slice(0, 120);
    for (const r of sample) {
        const v = toCellValue(r[key]);
        const len = String(v).length;
        if (len > maxLen) maxLen = len;
    }
    return Math.max(min, Math.min(max, maxLen + 3));
}

/**
 * Construye el catálogo de columnas ordenadas para `productos`, incluyendo
 * cualquier campo dinámico adicional encontrado en Firestore (excepto `imagen_url`
 * si es base64 gigante, ya que ese pasa a `imagen_archivo_local` / `imagen_url_publica`).
 */
export function buildProductosColumns(productos) {
    const preferredOrder = [
        'foto',
        'doc_id',
        'codigo_barras',
        'nombre',
        'descripcion',
        'categoria',
        'categoria_id',
        'ubicacion',
        'ubicacion_id',
        'ubicacion_nombre',
        'ubicacion_nombre_resuelto',
        'piso',
        'sub_ubicacion',
        'stock_actual',
        'stock_minimo',
        'unidad',
        'estado',
        'estado_legible',
        'responsabilidad',
        'observaciones',
        'activo',
        'fuente',
        'imagen_estado',
        'imagen_formato_original',
        'imagen_archivo_local',
        'imagen_link_abrir',
        'imagen_url_publica',
        'imagen_url_drive_ver',
        'imagen_drive_id',
        'imagen_dimensiones',
        'imagen_tamano_kb',
        'fecha_creacion',
        'ultima_actualizacion',
    ];

    const extraKeys = new Set();
    const internalExcluded = new Set(['imagen_url', '_thumb_path', '_excel_ext']);
    for (const p of productos) {
        for (const k of Object.keys(p)) {
            if (!preferredOrder.includes(k) && !internalExcluded.has(k)) {
                extraKeys.add(k);
            }
        }
    }
    const allKeys = [...preferredOrder, ...[...extraKeys].sort()];

    const widthOverrides = {
        foto: 12,
        doc_id: 24,
        codigo_barras: 18,
        nombre: 34,
        descripcion: 32,
        categoria: 22,
        categoria_id: 22,
        ubicacion: 20,
        ubicacion_id: 22,
        ubicacion_nombre: 26,
        ubicacion_nombre_resuelto: 30,
        piso: 16,
        sub_ubicacion: 20,
        stock_actual: 13,
        stock_minimo: 13,
        unidad: 12,
        estado: 22,
        estado_legible: 20,
        responsabilidad: 24,
        observaciones: 34,
        activo: 10,
        fuente: 14,
        imagen_estado: 20,
        imagen_formato_original: 16,
        imagen_archivo_local: 38,
        imagen_link_abrir: 18,
        imagen_url_publica: 44,
        imagen_url_drive_ver: 44,
        imagen_drive_id: 30,
        imagen_dimensiones: 16,
        imagen_tamano_kb: 14,
        fecha_creacion: 25,
        ultima_actualizacion: 25,
    };

    return allKeys.map(key => ({
        header: key,
        key,
        width: widthOverrides[key] || inferColumnWidth(key, productos),
    }));
}

export function buildGenericColumns(docs, preferredFirst = ['doc_id']) {
    const keySet = new Set();
    for (const d of docs) {
        for (const k of Object.keys(d)) {
            keySet.add(k);
        }
    }
    const ordered = [];
    for (const k of preferredFirst) {
        if (keySet.has(k)) {
            ordered.push(k);
            keySet.delete(k);
        }
    }
    for (const k of [...keySet].sort()) {
        ordered.push(k);
    }
    return ordered.map(key => ({
        header: key,
        key,
        width: inferColumnWidth(key, docs),
    }));
}

/**
 * Genera el paquete completo de exportación:
 *  - Excel (.xlsx)
 *  - CSVs por colección
 *  - JSONs limpios por colección
 */
export async function generateExportArtifacts({
    exportDir,
    excelFilename,
    projectId,
    collectionsData,
    omittedCollections = [],
    imageAudit = {},
    subcollectionsData = [],
}) {
    const csvDir = path.join(exportDir, 'csv');
    const jsonDir = path.join(exportDir, 'json');
    fs.mkdirSync(csvDir, { recursive: true });
    fs.mkdirSync(jsonDir, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LogINV Exporter';
    workbook.created = new Date();

    const usedSheetNames = new Set(['resumen']);
    const resumen = workbook.addWorksheet('Resumen', { properties: { tabColor: { argb: BRAND } } });

    const productos = collectionsData.productos || [];
    const categorias = collectionsData.categorias || [];
    const ubicaciones = collectionsData.ubicaciones || [];
    const movimientos = collectionsData.movimientos || [];

    // ─── Construir Hoja Productos ──────────────────────────────────────────
    const prodCols = buildProductosColumns(productos);
    const prodCsvCols = prodCols.filter(c => c.key !== 'foto' && c.key !== 'imagen_link_abrir');

    // Escribir CSV y JSON limpio de productos
    const cleanProductos = productos.map(p => {
        const copy = { ...p };
        delete copy._thumb_path;
        delete copy._excel_ext;
        delete copy.imagen_url; // base64 gigante queda solo en backup_completo_raw.json
        return copy;
    });
    writeCsvFile(path.join(csvDir, 'productos.csv'), prodCsvCols, cleanProductos);
    fs.writeFileSync(path.join(jsonDir, 'productos.json'), JSON.stringify(cleanProductos, null, 2), 'utf8');

    const prodSheetName = sanitizeSheetName('productos', usedSheetNames);
    const prodSheet = workbook.addWorksheet(prodSheetName, { properties: { tabColor: { argb: BRAND } } });
    prodSheet.columns = prodCols;
    styleHeaderRow(prodSheet.getRow(1));
    prodSheet.views = [{ state: 'frozen', ySplit: 1 }];
    prodSheet.autoFilter = { from: 'A1', to: `${getColumnLetter(prodCols.length)}1` };

    for (const p of productos) {
        const rowObj = {};
        for (const col of prodCols) {
            if (col.key === 'foto') {
                rowObj.foto = '';
            } else if (col.key === 'imagen_link_abrir') {
                rowObj.imagen_link_abrir = p.imagen_url_publica || p.imagen_archivo_local ? 'Abrir imagen' : '';
            } else {
                rowObj[col.key] = toCellValue(p[col.key]);
            }
        }
        const row = prodSheet.addRow(rowObj);
        row.eachCell(cell => {
            cell.border = THIN_BORDERS;
            cell.alignment = { vertical: 'middle', wrapText: false };
        });
        row.height = 50;

        // Incrustar miniatura si existe
        if (p._thumb_path && fs.existsSync(p._thumb_path) && p._excel_ext) {
            const imgId = workbook.addImage({
                filename: p._thumb_path,
                extension: p._excel_ext,
            });
            prodSheet.addImage(imgId, {
                tl: { col: 0.1, row: row.number - 1 + 0.08 },
                ext: { width: 54, height: 54 },
            });
        }

        // Hipervínculos clickeables en Excel
        const linkTarget = p.imagen_url_publica || p.imagen_archivo_local;
        if (linkTarget) {
            const abrirCell = row.getCell('imagen_link_abrir');
            abrirCell.value = { text: 'Abrir imagen', hyperlink: linkTarget };
            abrirCell.font = { color: { argb: 'FF1D4ED8' }, underline: true, bold: true };
        }
        if (p.imagen_archivo_local) {
            const localCell = row.getCell('imagen_archivo_local');
            localCell.value = { text: p.imagen_archivo_local, hyperlink: p.imagen_archivo_local };
            localCell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
        }
        if (p.imagen_url_publica) {
            const pubCell = row.getCell('imagen_url_publica');
            pubCell.value = { text: p.imagen_url_publica, hyperlink: p.imagen_url_publica };
            pubCell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
        }
        if (p.imagen_url_drive_ver) {
            const driveCell = row.getCell('imagen_url_drive_ver');
            driveCell.value = { text: p.imagen_url_drive_ver, hyperlink: p.imagen_url_drive_ver };
            driveCell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
        }

        // Formato condicional visual de stock y estado
        const stockActual = Number(p.stock_actual ?? 0);
        const stockMin = Number(p.stock_minimo ?? 0);
        if (stockActual <= stockMin) {
            row.getCell('stock_actual').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_BG } };
            row.getCell('stock_actual').font = { bold: true, color: { argb: RED_TEXT } };
        }
        const estadoCell = row.getCell('estado_legible');
        if (p.estado === 'OPTIMO') {
            estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
            estadoCell.font = { bold: true, color: { argb: GREEN_TEXT } };
        } else if (p.estado === 'DESGASTADO') {
            estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
            estadoCell.font = { bold: true, color: { argb: AMBER_TEXT } };
        } else if (p.estado === 'NECESITA_MANTENIMIENTO') {
            estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_BG } };
            estadoCell.font = { bold: true, color: { argb: RED_TEXT } };
        }
    }

    // ─── Resto de colecciones ──────────────────────────────────────────────
    const preferredOrdersByCol = {
        categorias: ['doc_id', 'orden', 'nombre', 'descripcion', 'icono', 'color', 'activa', 'fecha_creacion'],
        ubicaciones: ['doc_id', 'id', 'codigo', 'nombre', 'piso', 'descripcion', 'capacidad', 'icono', 'color', 'activa', 'fecha_creacion', 'created_at'],
        movimientos: ['doc_id', 'fecha', 'tipo', 'producto_id', 'producto_nombre', 'nombre_producto', 'cantidad', 'stock_anterior', 'stock_nuevo', 'ubicacion', 'usuario', 'motivo', 'notas'],
        conteos: ['doc_id', 'fecha', 'fecha_cierre', 'ubicacion', 'estado', 'usuario', 'notas', 'items'],
        usuarios: ['doc_id', 'nombre', 'email', 'rol', 'departamento', 'telefono', 'activo', 'fecha_creacion'],
    };

    const collectionMeta = [
        {
            collection: 'productos',
            sheetName: prodSheetName,
            csvFile: 'csv/productos.csv',
            jsonFile: 'json/productos.json',
            count: productos.length,
            notes: 'Incluye miniaturas incrustadas, links locales/públicos y todos los campos.',
        },
    ];

    const otherNames = Object.keys(collectionsData).filter(k => k !== 'productos');
    const orderedOthers = [
        ...['categorias', 'ubicaciones', 'movimientos', 'conteos', 'usuarios'].filter(k => otherNames.includes(k)),
        ...otherNames.filter(k => !['categorias', 'ubicaciones', 'movimientos', 'conteos', 'usuarios'].includes(k)).sort(),
    ];

    for (const colName of orderedOthers) {
        const docs = collectionsData[colName] || [];
        const cols = buildGenericColumns(docs, preferredOrdersByCol[colName] || ['doc_id']);
        const csvFile = `csv/${colName}.csv`;
        const jsonFile = `json/${colName}.json`;
        writeCsvFile(path.join(exportDir, csvFile), cols, docs);
        fs.writeFileSync(path.join(exportDir, jsonFile), JSON.stringify(docs, null, 2), 'utf8');

        const sheetName = sanitizeSheetName(colName, usedSheetNames);
        const sheet = workbook.addWorksheet(sheetName, { properties: { tabColor: { argb: 'FF0F766E' } } });
        sheet.columns = cols.length > 0 ? cols : [{ header: 'info', key: 'info', width: 40 }];
        styleHeaderRow(sheet.getRow(1), 'FF0F766E');
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        if (cols.length > 0) {
            sheet.autoFilter = { from: 'A1', to: `${getColumnLetter(cols.length)}1` };
        }

        if (docs.length === 0) {
            sheet.addRow({ [cols[0]?.key || 'info']: '(Colección sin documentos)' });
        } else {
            for (const d of docs) {
                const rowObj = {};
                for (const c of cols) {
                    rowObj[c.key] = toCellValue(d[c.key]);
                }
                const r = sheet.addRow(rowObj);
                r.eachCell(cell => {
                    cell.border = THIN_BORDERS;
                    cell.alignment = { vertical: 'middle', wrapText: false };
                });
                r.height = 22;
            }
        }

        collectionMeta.push({
            collection: colName,
            sheetName,
            csvFile,
            jsonFile,
            count: docs.length,
            notes: '',
        });
    }

    // Subcolecciones si existieran
    if (subcollectionsData.length > 0) {
        const subCols = buildGenericColumns(subcollectionsData, ['parent_collection', 'parent_doc_id', 'subcollection', 'doc_id']);
        writeCsvFile(path.join(csvDir, 'subcolecciones.csv'), subCols, subcollectionsData);
        fs.writeFileSync(path.join(jsonDir, 'subcolecciones.json'), JSON.stringify(subcollectionsData, null, 2), 'utf8');
        const subSheetName = sanitizeSheetName('subcolecciones', usedSheetNames);
        const subSheet = workbook.addWorksheet(subSheetName);
        subSheet.columns = subCols;
        styleHeaderRow(subSheet.getRow(1), 'FF6D28D9');
        subSheet.views = [{ state: 'frozen', ySplit: 1 }];
        for (const item of subcollectionsData) {
            const rowObj = {};
            for (const c of subCols) rowObj[c.key] = toCellValue(item[c.key]);
            const r = subSheet.addRow(rowObj);
            r.eachCell(cell => { cell.border = THIN_BORDERS; });
        }
        collectionMeta.push({
            collection: 'subcolecciones',
            sheetName: subSheetName,
            csvFile: 'csv/subcolecciones.csv',
            jsonFile: 'json/subcolecciones.json',
            count: subcollectionsData.length,
            notes: 'Documentos anidados descubiertos dinámicamente.',
        });
    }

    // ─── Construir Hoja Resumen (Auditoría + Guía de Migración) ───────────
    resumen.columns = [
        { width: 28 },
        { width: 24 },
        { width: 22 },
        { width: 24 },
        { width: 16 },
        { width: 52 },
    ];

    resumen.mergeCells('A1:F1');
    resumen.getCell('A1').value = 'Exportación Completa de Base de Datos — LogINV (Iglesia CNC)';
    resumen.getCell('A1').font = { bold: true, size: 16, color: { argb: BRAND } };
    resumen.getRow(1).height = 28;

    resumen.mergeCells('A2:F2');
    resumen.getCell('A2').value = `Proyecto Firebase: ${projectId} · Exportado el ${new Date().toISOString()}`;
    resumen.getCell('A2').font = { italic: true, size: 10, color: { argb: SLATE_TEXT } };
    resumen.getRow(2).height = 18;

    resumen.addRow([]);
    const sec1 = resumen.addRow(['1. Colecciones exportadas']);
    sec1.getCell(1).font = { bold: true, size: 12, color: { argb: BRAND } };

    const colHeader = resumen.addRow(['Colección Firestore', 'Hoja Excel', 'Archivo CSV', 'Archivo JSON', 'Registros', 'Notas']);
    styleHeaderRow(colHeader);
    for (const m of collectionMeta) {
        const r = resumen.addRow([m.collection, m.sheetName, m.csvFile, m.jsonFile, m.count, m.notes]);
        r.eachCell(cell => { cell.border = THIN_BORDERS; cell.alignment = { vertical: 'middle' }; });
        r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell(5).font = { bold: true };
    }
    for (const om of omittedCollections) {
        const r = resumen.addRow([om.collection, '(Omitida)', '(Omitida)', '(Omitida)', om.count ?? '—', om.reason]);
        r.eachCell(cell => {
            cell.border = THIN_BORDERS;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
        });
    }

    // Sección 2: Auditoría de imágenes
    resumen.addRow([]);
    const sec2 = resumen.addRow(['2. Auditoría de Imágenes (productos)']);
    sec2.getCell(1).font = { bold: true, size: 12, color: { argb: BRAND } };
    const imgHeader = resumen.addRow(['Indicador', 'Valor', 'Detalle']);
    styleHeaderRow(imgHeader);

    const imgRows = [
        ['Total de productos', productos.length, 'Registros en colección productos'],
        ['Productos con imagen', imageAudit.withImage ?? 0, 'Extraídas a exports/imagenes/ e incrustadas en la hoja productos'],
        ['Productos sin imagen', imageAudit.withoutImage ?? 0, 'No tenían imagen_url ni imagen_drive_id en Firestore'],
        ['Imágenes con link https:// público', imageAudit.withPublicUrl ?? 0, 'Listas para Google Sheets =IMAGE() y Airtable'],
        ['Imágenes extraídas desde base64 local', imageAudit.fromBase64 ?? 0, 'Convertidas a .jpg/.png universales en exports/imagenes/'],
        ['Errores de extracción/conversión', imageAudit.errors ?? 0, imageAudit.errorNote || 'Sin errores'],
        ['Formatos originales detectados', JSON.stringify(imageAudit.origFormats || {}), 'Convertidos a JPEG/PNG para compatibilidad total'],
    ];
    for (const [k, v, d] of imgRows) {
        const r = resumen.addRow([k, v, d]);
        r.getCell(1).border = THIN_BORDERS;
        r.getCell(2).border = THIN_BORDERS;
        r.getCell(3).border = THIN_BORDERS;
        r.getCell(2).alignment = { horizontal: 'center' };
        r.getCell(2).font = { bold: true };
    }

    // Sección 3: Integridad referencial e inventario
    const ubiIds = new Set(ubicaciones.flatMap(u => [u.doc_id, u.id, u.codigo].filter(Boolean)));
    const prodIds = new Set(productos.map(p => p.doc_id));
    const prodsSinUbicacion = productos.filter(p => p.ubicacion && !ubiIds.has(p.ubicacion) && !ubiIds.has(p.ubicacion_id));
    const movsHuerfanos = movimientos.filter(m => m.producto_id && !prodIds.has(m.producto_id));
    const stockTotal = productos.reduce((s, p) => s + Number(p.stock_actual || 0), 0);
    const stockBajo = productos.filter(p => Number(p.stock_actual ?? 0) <= Number(p.stock_minimo ?? 0));

    resumen.addRow([]);
    const sec3 = resumen.addRow(['3. Chequeo de Integridad y Stock']);
    sec3.getCell(1).font = { bold: true, size: 12, color: { argb: BRAND } };
    const intHeader = resumen.addRow(['Validación', 'Resultado', 'Observación']);
    styleHeaderRow(intHeader);
    const intRows = [
        ['Unidades totales en stock', stockTotal, 'Suma de stock_actual en productos'],
        ['Productos con stock <= mínimo', stockBajo.length, 'Resaltados en rojo en la hoja productos'],
        ['Productos con ubicación no hallada en ubicaciones', prodsSinUbicacion.length, prodsSinUbicacion.length ? prodsSinUbicacion.slice(0, 5).map(p => p.ubicacion).join(', ') : 'OK: todas las ubicaciones coinciden'],
        ['Movimientos con producto_id inexistente', movsHuerfanos.length, movsHuerfanos.length ? 'Productos eliminados tras movimientos históricos' : 'OK: integridad referencial al 100%'],
    ];
    for (const [k, v, d] of intRows) {
        const r = resumen.addRow([k, v, d]);
        r.getCell(1).border = THIN_BORDERS;
        r.getCell(2).border = THIN_BORDERS;
        r.getCell(3).border = THIN_BORDERS;
        r.getCell(2).alignment = { horizontal: 'center' };
        r.getCell(2).font = { bold: true };
    }

    // Sección 4: Guía rápida para Google Sheets / Excel / Airtable
    resumen.addRow([]);
    const sec4 = resumen.addRow(['4. Guía Rápida de Migración (Excel / Google Sheets / Airtable)']);
    sec4.getCell(1).font = { bold: true, size: 12, color: { argb: BRAND } };
    const guideLines = [
        ['Excel / LibreOffice', 'Abre este .xlsx manteniendo la carpeta imagenes/ al lado. Verás las miniaturas incrustadas y el enlace "Abrir imagen" funciona localmente.'],
        ['Google Sheets / Airtable', 'Importa los archivos de exports/csv/. Para mostrar fotos por URL https:// en Sheets (=IMAGE) o Airtable (Attachment), sube exports/imagenes/ a Google Drive (o tu hosting) y ejecuta npm run export:upload-images para rellenar imagen_url_publica automáticamente.'],
        ['Respaldo maestro 100%', 'exports/json/backup_completo_raw.json conserva absolutamente todos los documentos crudos de Firestore, incluyendo el base64 original de cada imagen.'],
    ];
    for (const [k, d] of guideLines) {
        const r = resumen.addRow([k, '', d]);
        r.getCell(1).font = { bold: true };
        r.getCell(1).border = THIN_BORDERS;
        resumen.mergeCells(`B${r.number}:F${r.number}`);
        r.getCell(2).value = d;
        r.getCell(2).border = THIN_BORDERS;
        r.getCell(2).alignment = { wrapText: true };
        r.height = 30;
    }

    const excelPath = path.join(exportDir, excelFilename);
    await workbook.xlsx.writeFile(excelPath);

    return {
        excelPath,
        collectionMeta,
    };
}
