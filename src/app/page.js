'use client';
import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useProductos, useConteos, useMovimientos } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES } from '@/context/LocationContext';
import Header from '@/components/layout/Header';
import { KPICard, SemaforoBadge, StockBar, EmptyState } from '@/components/ui/SharedComponents';
import { daysUntil, formatDate, formatDateTime, semaforoRowBg } from '@/lib/utils';
import {
    AlertTriangle, Package, ClipboardCheck, TrendingDown,
    FileText, Check, X as XIcon, Wine, ClipboardList,
    ArrowRight, ScanBarcode, Download, MapPin,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
//  PDF Report Generator (browser print) – Professional format
// ═══════════════════════════════════════════════════════════════════════════
function generatePDFReport(conteo) {
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

// ═══════════════════════════════════════════════════════════════════════════
//  Export inventory to CSV
// ═══════════════════════════════════════════════════════════════════════════
function exportInventoryCSV(productos, ubicacionNombre) {
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

// ═══════════════════════════════════════════════════════════════════════════
//  Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
    const { productos, loading: pLoading } = useProductos();
    const { conteos, loading: cLoading } = useConteos();
    const { movimientos, loading: mLoading } = useMovimientos();
    const { user } = useAuth();
    const { ubicacion, ubicacionInfo } = useLocation();

    // ── KPI: products below stock minimum (current location) ──
    const productosUbicacion = useMemo(
        () => productos.filter(p => p.ubicacion === ubicacion),
        [productos, ubicacion]
    );

    const alertasStock = useMemo(
        () => productosUbicacion.filter((p) => p.stock_actual <= p.stock_minimo_rop).length,
        [productosUbicacion]
    );

    // ── KPI: counts today (current location) ──
    const conteosHoy = useMemo(() => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return conteos.filter(c => {
            const f = c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha);
            return f >= hoy && c.ubicacion === ubicacion;
        }).length;
    }, [conteos, ubicacion]);

    // ── KPI: products with differences in latest count ──
    const diferenciasUltimoConteo = useMemo(() => {
        const completados = conteos.filter(c => c.estado === 'COMPLETADO' && c.ubicacion === ubicacion);
        if (completados.length === 0) return 0;
        const ultimo = completados.sort((a, b) => {
            const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
            const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
            return fB - fA;
        })[0];
        return (ultimo.items || []).filter(i => i.diferencia !== 0).length;
    }, [conteos, ubicacion]);

    // ── Semáforo: products expiring soon (current location) ──
    const productosSemaforo = useMemo(() => {
        return [...productosUbicacion]
            .map((p) => ({ ...p, dias: daysUntil(p.fecha_vencimiento) }))
            .filter((p) => p.dias < 30)
            .sort((a, b) => a.dias - b.dias)
            .slice(0, 12);
    }, [productosUbicacion]);

    // ── Low stock alerts ──
    const stockBajo = useMemo(
        () => productosUbicacion.filter((p) => p.stock_actual <= p.stock_minimo_rop).slice(0, 8),
        [productosUbicacion]
    );

    // ── Recent completed counts (current location) ──
    const conteosRecientes = useMemo(() => {
        return conteos
            .filter(c => c.estado === 'COMPLETADO' && c.ubicacion === ubicacion)
            .sort((a, b) => {
                const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                return fB - fA;
            })
            .slice(0, 5);
    }, [conteos, ubicacion]);

    // ── Multi-location summary for dashboard ──
    const locationSummary = useMemo(() => {
        return UBICACIONES.map(loc => {
            const prods = productos.filter(p => p.ubicacion === loc.id);
            const alertas = prods.filter(p => p.stock_actual <= p.stock_minimo_rop).length;
            return { ...loc, totalProductos: prods.length, alertas };
        });
    }, [productos]);

    const handleGenerarPDF = useCallback((conteo) => {
        generatePDFReport(conteo);
    }, []);

    const handleExportCSV = useCallback(() => {
        exportInventoryCSV(productosUbicacion, ubicacionInfo.nombre);
    }, [productosUbicacion, ubicacionInfo.nombre]);

    const loading = pLoading || cLoading || mLoading;

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Panel de Control" />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 animate-fade-in max-w-7xl mx-auto w-full pb-4">

                {/* ── Welcome Hero ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-5 sm:p-8 text-white shadow-lg">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                                <Wine size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-white/70 font-medium">Bienvenido</p>
                                <p className="text-lg sm:text-xl font-bold">{user?.nombre}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <MapPin size={14} className="text-white/50" />
                            <p className="text-white/60 text-sm">Resumen del día — {ubicacionInfo.icono} {ubicacionInfo.nombre}</p>
                        </div>
                    </div>
                </div>

                {/* ── Multi-location Overview ── */}
                <div className="grid grid-cols-3 gap-3">
                    {locationSummary.map(loc => (
                        <div key={loc.id} className={`bg-white border rounded-xl p-3 sm:p-4 text-center shadow-sm ${loc.id === ubicacion ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200'}`}>
                            <span className="text-2xl">{loc.icono}</span>
                            <p className="text-sm font-bold text-slate-800 mt-1">{loc.nombre}</p>
                            <p className="text-xs text-slate-500">{loc.totalProductos} productos</p>
                            {loc.alertas > 0 && (
                                <p className="text-[10px] text-amber-600 font-bold mt-1">⚠ {loc.alertas} alertas</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Quick Actions ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link href="/inventario" className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-brand-200 transition-all group active:scale-[0.98]" style={{ WebkitTapHighlightColor: 'transparent' }}>
                        <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                            <ClipboardList size={22} className="text-brand-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 truncate">Nuevo conteo</p>
                            <p className="text-[10px] text-slate-400 font-medium">Iniciar conteo</p>
                        </div>
                    </Link>
                    <Link href="/productos" className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group active:scale-[0.98]" style={{ WebkitTapHighlightColor: 'transparent' }}>
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                            <Package size={22} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 truncate">Productos</p>
                            <p className="text-[10px] text-slate-400 font-medium">Ver catálogo</p>
                        </div>
                    </Link>
                    <Link href="/inventario" className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all group active:scale-[0.98]" style={{ WebkitTapHighlightColor: 'transparent' }}>
                        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                            <ScanBarcode size={22} className="text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 truncate">Escanear código</p>
                            <p className="text-[10px] text-slate-400 font-medium">Identificar producto</p>
                        </div>
                    </Link>
                    <button onClick={handleExportCSV} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-violet-200 transition-all group active:scale-[0.98]" style={{ WebkitTapHighlightColor: 'transparent' }}>
                        <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                            <Download size={22} className="text-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-sm font-bold text-slate-800 truncate">Exportar</p>
                            <p className="text-[10px] text-slate-400 font-medium">Descargar CSV</p>
                        </div>
                    </button>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <KPICard
                        title="Stock Bajo"
                        value={loading ? '—' : alertasStock}
                        subtitle="Productos bajo stock mínimo"
                        icon={AlertTriangle}
                        color="yellow"
                        loading={loading}
                    />
                    <KPICard
                        title="Conteos Hoy"
                        value={loading ? '—' : conteosHoy}
                        subtitle="Conteos realizados hoy"
                        icon={ClipboardCheck}
                        color="blue"
                        loading={loading}
                    />
                    <KPICard
                        title="Diferencias"
                        value={loading ? '—' : diferenciasUltimoConteo}
                        subtitle="Productos con diferencias en conteo"
                        icon={TrendingDown}
                        color="red"
                        loading={loading}
                    />
                    <KPICard
                        title="Total Productos"
                        value={loading ? '—' : productosUbicacion.length}
                        subtitle="SKU activos en inventario"
                        icon={Package}
                        color="brand"
                        loading={loading}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

                    {/* ── Recent counts + PDF export ── */}
                    <div className="xl:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <ClipboardCheck size={18} className="text-brand-600" />
                                Historial de conteos
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">Reporte de conteo — {ubicacionInfo.nombre}</p>
                        </div>

                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : conteosRecientes.length === 0 ? (
                            <EmptyState title="No hay conteos registrados" />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {conteosRecientes.map((c) => {
                                    const totalItems = c.items?.length || 0;
                                    const conDiff = c.items?.filter(i => i.diferencia !== 0).length || 0;
                                    return (
                                        <div key={c.id} className="px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                                                        {c.usuario}
                                                    </p>
                                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                                                        Completado
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(c.fecha)}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs">
                                                    <span className="text-slate-500">{totalItems} ítems contados</span>
                                                    {conDiff > 0 ? (
                                                        <span className="text-amber-600 font-semibold">{conDiff} con diferencias</span>
                                                    ) : (
                                                        <span className="text-emerald-500 flex items-center gap-0.5"><Check size={12} /> Sin diferencias</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleGenerarPDF(c)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-600 hover:bg-brand-50 border border-transparent hover:border-brand-200 transition-all flex-shrink-0"
                                                title="Generar PDF"
                                            >
                                                <FileText size={16} /> PDF
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Stock bajo mínimo ── */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-amber-50">
                            <h2 className="text-base sm:text-lg font-bold text-amber-600 tracking-tight flex items-center gap-2">
                                <AlertTriangle size={18} />
                                Stock bajo mínimo
                            </h2>
                            <p className="text-xs text-amber-600/70 mt-1 font-medium">Productos que necesitan reposición</p>
                        </div>
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : stockBajo.length === 0 ? (
                            <EmptyState title="Stock saludable" subtitle="Sin alertas de stock bajo." />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {stockBajo.map((p) => {
                                    const deficit = p.stock_minimo_rop - p.stock_actual;
                                    return (
                                        <div key={p.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-amber-50/50 transition-colors group">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-700 transition-colors truncate">{p.nombre}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">{p.categoria} · Stock: <span className="text-rose-600 font-bold">{p.stock_actual}</span> / Mín {p.stock_minimo_rop}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm text-amber-600 font-bold">+{deficit} <span className="text-xs text-slate-400 font-normal">{p.unidad || 'u'}</span></p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">A reponer</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Semáforo de vencimientos ── */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Productos próximos a vencer</h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">Prioridad según proximidad a fecha de vencimiento</p>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;3d</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> &lt;7d</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> OK</span>
                        </div>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="data-table w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Stock</th>
                                    <th>Vencimiento</th>
                                    <th>Alerta</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-full max-w-[120px]" /></td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            ) : productosSemaforo.length === 0 ? (
                                <tbody>
                                    <tr><td colSpan={5}><EmptyState title="No hay productos próximos a vencer" subtitle="Todos los productos tienen fecha de vencimiento mayor a 30 días." /></td></tr>
                                </tbody>
                            ) : (
                                <tbody>
                                    {productosSemaforo.map((p) => (
                                        <tr key={p.id} className={`${semaforoRowBg(p.dias)} group border-b border-slate-50 hover:bg-slate-50/50`}>
                                            <td className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{p.nombre}</td>
                                            <td><span className="badge-gray bg-white border-slate-200">{p.categoria}</span></td>
                                            <td>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-slate-700 font-bold text-sm">{p.stock_actual} <span className="text-slate-400 text-xs font-normal">{p.unidad || 'u'}</span></span>
                                                    <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                                </div>
                                            </td>
                                            <td className="text-slate-500 text-xs font-medium">{formatDate(p.fecha_vencimiento)}</td>
                                            <td><SemaforoBadge days={p.dias} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-4 h-20 animate-pulse bg-slate-50" />
                            ))
                        ) : productosSemaforo.length === 0 ? (
                            <EmptyState title="No hay productos próximos a vencer" subtitle="Todos los productos tienen fecha de vencimiento mayor a 30 días." />
                        ) : (
                            productosSemaforo.map((p) => (
                                <div key={p.id} className={`p-4 ${semaforoRowBg(p.dias)}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate">{p.nombre}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-500 font-medium uppercase">{p.categoria}</span>
                                                <span className="text-xs text-slate-400">·</span>
                                                <span className="text-xs text-slate-500 font-medium">{formatDate(p.fecha_vencimiento)}</span>
                                            </div>
                                        </div>
                                        <SemaforoBadge days={p.dias} />
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-sm font-bold text-slate-800">{p.stock_actual} <span className="text-xs text-slate-400 font-normal">{p.unidad || 'u'}</span></span>
                                        <div className="flex-1">
                                            <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
