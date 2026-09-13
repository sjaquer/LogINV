'use client';
import { useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias, useMovimientos } from '@/hooks/useFirestore';
import { UBICACIONES } from '@/context/LocationContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import { exportInventoryExcel } from '@/lib/excelExport';
import {
    FileText, FileSpreadsheet, Printer, Package, AlertTriangle, MapPin, Layers,
} from 'lucide-react';

export default function ReportsPage() {
    const { productos, loading } = useProductos();
    const { categorias } = useCategorias();
    const { movimientos } = useMovimientos();
    const [exporting, setExporting] = useState(false);

    const ubicNombre = (id) => UBICACIONES.find(u => u.id === id)?.nombre || id || '—';

    const stockBajo = useMemo(
        () => productos.filter(p => p.stock_actual <= (p.stock_minimo ?? 0)),
        [productos]
    );

    const porCategoria = useMemo(() => {
        const map = {};
        productos.forEach(p => { map[p.categoria] = (map[p.categoria] || 0) + 1; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [productos]);

    const porUbicacion = useMemo(() => {
        const map = {};
        productos.forEach(p => { const k = ubicNombre(p.ubicacion); map[k] = (map[k] || 0) + 1; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [productos]);

    const movimientosRecientes = useMemo(() => movimientos.slice(0, 15), [movimientos]);

    const totalStock = useMemo(() => productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0), [productos]);

    async function exportarInventarioExcel() {
        setExporting(true);
        try {
            await exportInventoryExcel(productos, categorias, 'Todas las ubicaciones');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Reportes" />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-8">

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText size={18} className="text-brand-500" /> Reporte de inventario
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Resumen general del inventario de la iglesia, listo para exportar o imprimir.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={exportarInventarioExcel}
                            disabled={exporting}
                            className="btn btn-primary px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-60"
                        >
                            {exporting ? (
                                <><span className="spinner border-white border-t-transparent w-4 h-4" /> Generando...</>
                            ) : (
                                <><FileSpreadsheet size={16} /> Exportar a Excel</>
                            )}
                        </button>
                        <button onClick={() => window.print()} className="btn btn-ghost px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 rounded-xl flex items-center gap-2">
                            <Printer size={16} /> Imprimir
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <Package size={18} className="text-brand-500 mb-2" />
                        <p className="text-2xl font-black text-slate-900">{productos.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Productos registrados</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <Layers size={18} className="text-violet-500 mb-2" />
                        <p className="text-2xl font-black text-slate-900">{totalStock}</p>
                        <p className="text-xs text-slate-500 font-medium">Unidades en stock</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <AlertTriangle size={18} className="text-amber-500 mb-2" />
                        <p className="text-2xl font-black text-slate-900">{stockBajo.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Con stock bajo</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <MapPin size={18} className="text-emerald-500 mb-2" />
                        <p className="text-2xl font-black text-slate-900">{porUbicacion.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Ubicaciones con ítems</p>
                    </div>
                </div>

                {/* Stock bajo */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" /> Productos con stock bajo
                    </h3>
                    {loading ? (
                        <p className="text-sm text-slate-400">Cargando...</p>
                    ) : stockBajo.length === 0 ? (
                        <EmptyState icon={Package} title="Todo en orden" subtitle="Ningún producto está por debajo de su stock mínimo" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                        <th className="py-2 pr-3 font-bold">Producto</th>
                                        <th className="py-2 pr-3 font-bold">Ubicación</th>
                                        <th className="py-2 pr-3 font-bold text-right">Stock</th>
                                        <th className="py-2 font-bold text-right">Mínimo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockBajo.map(p => (
                                        <tr key={p.id} className="border-b border-slate-50 last:border-0">
                                            <td className="py-2 pr-3 font-semibold text-slate-800">{p.nombre}</td>
                                            <td className="py-2 pr-3 text-slate-500">{ubicNombre(p.ubicacion)}</td>
                                            <td className="py-2 pr-3 text-right font-bold text-amber-600">{p.stock_actual}</td>
                                            <td className="py-2 text-right text-slate-400">{p.stock_minimo ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Por categoría / ubicación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3">Productos por categoría</h3>
                        <div className="space-y-2">
                            {porCategoria.map(([nombre, count]) => (
                                <div key={nombre} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{nombre}</span>
                                    <span className="font-bold text-slate-800">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3">Productos por ubicación</h3>
                        <div className="space-y-2">
                            {porUbicacion.map(([nombre, count]) => (
                                <div key={nombre} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{nombre}</span>
                                    <span className="font-bold text-slate-800">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Movimientos recientes */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3">Movimientos recientes</h3>
                    {movimientosRecientes.length === 0 ? (
                        <EmptyState icon={FileText} title="Sin movimientos" subtitle="Aún no se han registrado movimientos de stock" />
                    ) : (
                        <div className="space-y-2">
                            {movimientosRecientes.map(m => (
                                <div key={m.id} className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">{m.producto_nombre || m.nombre_producto}</p>
                                        <p className="text-xs text-slate-400">{m.tipo} · {m.usuario || 'Sistema'}</p>
                                    </div>
                                    <span className={`font-bold ${m.cantidad < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
