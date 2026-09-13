// ═══════════════════════════════════════════════════════════════════════════
//  Dashboard Utils - LogINV v2.0
//  Funciones de utilidad para el Dashboard
// ═══════════════════════════════════════════════════════════════════════════

import { UBICACIONES } from '@/context/LocationContext';

/**
 * Genera un reporte PDF del conteo de inventario
 * @param {Object} conteo - Objeto de conteo con items
 */
export function generatePDFReport(conteo) {
    const items = conteo.items || [];
    const conDiff = items.filter(i => i.diferencia !== 0);
    const sinDiff = items.filter(i => i.diferencia === 0);
    const fecha = conteo.fecha?.toDate
        ? conteo.fecha.toDate().toLocaleString('es-PE')
        : new Date(conteo.fecha).toLocaleString('es-PE');

    const ubicNombre = UBICACIONES.find(u => u.id === conteo.ubicacion)?.nombre || conteo.ubicacion || '—';

    const rows = items.map(i => `
        <tr style="${i.diferencia !== 0 ? 'background:#FEF3C7;' : ''}">
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;">${i.producto_nombre}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;">${i.stock_sistema}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:bold;">${i.conteo_fisico}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:bold;color:${i.diferencia < 0 ? '#DC2626' : i.diferencia > 0 ? '#059669' : '#64748B'}">
                ${i.diferencia > 0 ? '+' : ''}${i.diferencia}
            </td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Reporte de Conteo - ${ubicNombre} - ${fecha}</title>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin:0; padding:40px; color:#1e293b; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; border-bottom:3px solid #2563eb; padding-bottom:20px; }
    .logo { font-size:28px; font-weight:900; color:#1e293b; letter-spacing:-0.5px; }
    .logo span { color:#2563eb; }
    .meta { text-align:right; font-size:12px; color:#64748b; line-height:1.8; }
    .meta strong { color:#1e293b; display:block; font-size:15px; }
    .location-badge { display:inline-block; background:#EFF6FF; color:#2563eb; padding:4px 12px; border-radius:8px; font-size:12px; font-weight:700; margin-top:6px; border:1px solid #BFDBFE; }
    .summary { display:flex; gap:16px; margin-bottom:28px; }
    .summary-card { flex:1; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0; }
    .summary-card .val { font-size:32px; font-weight:900; }
    .summary-card .lbl { font-size:10px; text-transform:uppercase; letter-spacing:1.5px; margin-top:6px; font-weight:600; }
    table { width:100%; border-collapse:collapse; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; }
    thead { background:#f1f5f9; }
    th { padding:12px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; font-weight:700; }
    .section-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:24px 0 12px; padding:8px 0; }
    .notes { margin-top:28px; padding:16px 20px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; font-size:13px; color:#475569; }
    .footer { margin-top:48px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; }
    @media print { body { padding:20px; } }
</style>
</head><body>
<div class="header">
    <div>
        <div class="logo">Log<span>INV</span></div>
        <div style="font-size:14px;color:#64748b;margin-top:4px;">Reporte de Conteo de Inventario</div>
        <div class="location-badge">📍 ${ubicNombre}</div>
    </div>
    <div class="meta">
        <strong>${fecha}</strong>
        Responsable: ${conteo.usuario}<br>
        Estado: ${conteo.estado === 'COMPLETADO' ? '✅ Completado' : '⏳ En progreso'}
    </div>
</div>
<div class="summary">
    <div class="summary-card" style="background:#EFF6FF;color:#1D4ED8;">
        <div class="val">${items.length}</div>
        <div class="lbl">Ítems contados</div>
    </div>
    <div class="summary-card" style="background:#F0FDF4;color:#15803D;">
        <div class="val">${sinDiff.length}</div>
        <div class="lbl">Sin diferencias</div>
    </div>
    <div class="summary-card" style="background:#FFFBEB;color:#B45309;">
        <div class="val">${conDiff.length}</div>
        <div class="lbl">Con diferencias</div>
    </div>
    <div class="summary-card" style="background:#FEF2F2;color:#DC2626;">
        <div class="val">${conDiff.reduce((sum, i) => sum + Math.abs(i.diferencia), 0)}</div>
        <div class="lbl">Unidades de desvío</div>
    </div>
</div>
<table>
    <thead><tr>
        <th>Producto</th>
        <th style="text-align:center;">Stock sistema</th>
        <th style="text-align:center;">Conteo físico</th>
        <th style="text-align:center;">Diferencia</th>
    </tr></thead>
    <tbody>${rows}</tbody>
</table>
${conteo.notas ? `<div class="notes"><strong>Observaciones:</strong> ${conteo.notas}</div>` : ''}
<div class="footer">
    <span>LogINV · Control de Inventario · ${ubicNombre}</span>
    <span>Generado el ${new Date().toLocaleString('es-PE')}</span>
</div>
</body></html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    }
}

/**
 * Exporta el inventario a CSV
 * @param {Array} productos - Lista de productos
 * @param {string} ubicacionNombre - Nombre de la ubicación
 */
export function exportInventoryCSV(productos, ubicacionNombre) {
    const headers = ['Producto', 'Categoría', 'Ubicación', 'Stock Actual', 'Stock Mínimo', 'Unidad', 'Lote', 'Código de Barras', 'Vencimiento'];
    const rows = productos.map(p => {
        const ubicName = UBICACIONES.find(u => u.id === p.ubicacion)?.nombre || p.ubicacion || '';
        const venc = p.fecha_vencimiento?.toDate
            ? p.fecha_vencimiento.toDate().toLocaleDateString('es-PE')
            : p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString('es-PE') : '';
        return [p.nombre, p.categoria, ubicName, p.stock_actual, p.stock_minimo_rop, p.unidad || '', p.lote || '', p.codigo_barras || '', venc];
    });

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_${ubicacionNombre || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
