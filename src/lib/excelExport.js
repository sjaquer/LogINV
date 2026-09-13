// ═══════════════════════════════════════════════════════════════════════════
//  excelExport.js - LogINV Iglesia CNC
//  Genera el reporte oficial de inventario en formato Excel (.xlsx),
//  estandarizado para enviar a Contabilidad / control de stock y compras.
//  Reemplaza las exportaciones a CSV (Reportes y Dashboard) por un único
//  generador compartido, con formato, colores y 3 hojas de interés.
// ═══════════════════════════════════════════════════════════════════════════

import { UBICACIONES } from '@/context/LocationContext';

const BRAND = 'FF1E40AF';       // azul institucional (encabezados)
const BRAND_LIGHT = 'FFEFF6FF'; // fondo suave para totales
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

function ubicNombre(id) {
    return UBICACIONES.find(u => u.id === id)?.nombre || id || 'Sin ubicación';
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

// Trae los bytes de una foto de Drive vía el proxy interno (evita CORS) y
// detecta la extensión soportada por exceljs a partir del content-type.
async function fetchImageBuffer(driveId) {
    try {
        const res = await fetch(`/api/drive-image?id=${encodeURIComponent(driveId)}`);
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        const extension = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : 'jpeg';
        const arrayBuffer = await res.arrayBuffer();
        const base64 = `data:${contentType || `image/${extension}`};base64,${arrayBufferToBase64(arrayBuffer)}`;
        return { base64, extension };
    } catch (_) {
        return null;
    }
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

/**
 * Genera y descarga el reporte de inventario en Excel (.xlsx).
 * @param {Array} productos - Productos a incluir (ya filtrados si aplica)
 * @param {Array} categorias - Colección de categorías (para el resumen)
 * @param {string} alcance - Texto descriptivo del alcance (ej: "Todas las ubicaciones")
 */
export async function exportInventoryExcel(productos, categorias = [], alcance = 'Todas las ubicaciones') {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LogINV';
    workbook.created = new Date();

    const fechaTexto = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalStock = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
    const stockBajo = productos.filter(p => p.stock_actual <= (p.stock_minimo ?? 0));

    // ─── Hoja 1: Resumen ──────────────────────────────────────────────────
    const resumen = workbook.addWorksheet('Resumen', { properties: { tabColor: { argb: BRAND } } });
    resumen.columns = [{ width: 32 }, { width: 18 }, { width: 4 }, { width: 32 }, { width: 14 }, { width: 4 }];
    addTitleBlock(resumen, 'Reporte de Inventario — Iglesia CNC', `Alcance: ${alcance} · Generado el ${fechaTexto}`);

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

    // Por categoría / por ubicación, lado a lado
    const catCounts = {};
    productos.forEach(p => { catCounts[p.categoria] = (catCounts[p.categoria] || 0) + 1; });
    const ubiCounts = {};
    productos.forEach(p => { const n = ubicNombre(p.ubicacion); ubiCounts[n] = (ubiCounts[n] || 0) + 1; });

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
        { header: 'Código de barras', key: 'codigo', width: 18 },
        { header: 'Producto', key: 'nombre', width: 32 },
        { header: 'Descripción', key: 'descripcion', width: 28 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Ubicación', key: 'ubicacion', width: 20 },
        { header: 'Piso', key: 'piso', width: 14 },
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

    // Traer todas las fotos en paralelo antes de armar las filas, para poder
    // anclar cada imagen a la fila exacta de su producto.
    const conFoto = productos.filter(p => p.imagen_drive_id);
    const imagenesPorId = new Map();
    await Promise.all(conFoto.map(async p => {
        const img = await fetchImageBuffer(p.imagen_drive_id);
        if (img) imagenesPorId.set(p.imagen_drive_id, img);
    }));

    productos.forEach(p => {
        const bajoStock = p.stock_actual <= (p.stock_minimo ?? 0);
        const row = inv.addRow({
            foto: '',
            codigo: p.codigo_barras || '',
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            categoria: p.categoria,
            ubicacion: ubicNombre(p.ubicacion),
            piso: p.piso || '',
            estado: ESTADO_LABEL[p.estado] || p.estado || '',
            stock_actual: p.stock_actual,
            stock_minimo: p.stock_minimo ?? 0,
            unidad: p.unidad || '',
            responsabilidad: p.responsabilidad || '',
            observaciones: p.observaciones || '',
        });
        row.eachCell(cell => { cell.border = THIN_BORDERS; cell.alignment = { vertical: 'middle', wrapText: false }; });
        row.height = 54;

        const foto = p.imagen_drive_id && imagenesPorId.get(p.imagen_drive_id);
        if (foto) {
            const imageId = workbook.addImage({ base64: foto.base64, extension: foto.extension });
            inv.addImage(imageId, {
                tl: { col: 0.05, row: row.number - 1 + 0.05 },
                ext: { width: 52, height: 52 },
            });
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
    });

    // Fila de totales
    const totalRow = inv.addRow({ nombre: 'TOTAL', stock_actual: totalStock });
    totalRow.eachCell(cell => { cell.border = THIN_BORDERS; });
    totalRow.font = { bold: true };
    totalRow.getCell('nombre').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } };
    totalRow.getCell('stock_actual').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } };

    // ─── Hoja 3: Compras sugeridas (control de stock) ────────────────────
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
            .sort((a, b) => ((b.stock_minimo ?? 0) - b.stock_actual) - ((a.stock_minimo ?? 0) - a.stock_actual))
            .forEach(p => {
                const faltante = Math.max(0, (p.stock_minimo ?? 0) - p.stock_actual);
                const row = compras.addRow({
                    nombre: p.nombre,
                    categoria: p.categoria,
                    ubicacion: ubicNombre(p.ubicacion),
                    stock_actual: p.stock_actual,
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

    // ─── Descargar ────────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_iglesia_cnc_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
