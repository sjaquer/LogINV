'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias, useConteos, useCrearMovimiento } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { TapCountModal, ConteoHistoryCard, ConteoDetailModal, QuickStockModal } from './components';
import {
    Search, X, Plus, Package,
    Save, AlertTriangle,
    Check, ClipboardList, History, ScanBarcode,
    ChevronRight, MapPin, Calendar,
    ArrowDownCircle, ArrowUpCircle, Zap,
} from 'lucide-react';

export default function InventarioPage() {
    const { productos, loading: pLoading, updateStock } = useProductos();
    const { categorias } = useCategorias();
    const { conteos, loading: cLoading, crearConteo, actualizarConteo, finalizarConteo } = useConteos();
    const crearMovimiento = useCrearMovimiento();
    const { user } = useAuth();
    const { ubicacion, ubicacionInfo, isGeneral } = useLocation();
    const { setHideBottomNav } = useSidebar();
    const userName = user?.nombre || 'Usuario';

    // ── State ──
    const [tab, setTab] = useState('conteo');
    const [conteoItems, setConteoItems] = useState([]);
    const [conteoActivo, setConteoActivo] = useState(null);
    const [notas, setNotas] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [scannedFeedback, setScannedFeedback] = useState(null);
    const [saving, setSaving] = useState(false);
    const [detailConteo, setDetailConteo] = useState(null);
    const [tapProduct, setTapProduct] = useState(null);

    // Quick stock state
    const [quickStockProduct, setQuickStockProduct] = useState(null);
    const [quickStockTipo, setQuickStockTipo] = useState('INGRESO');

    // Date range filter for historial
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [recoveredFromBackup, setRecoveredFromBackup] = useState(false);

    const loading = pLoading || cLoading;

    // ── Ocultar BottomNav cuando hay un modal a pantalla completa ──
    useEffect(() => {
        const open = !!(tapProduct && conteoActivo) || !!showScanner || !!detailConteo || !!quickStockProduct;
        setHideBottomNav(open);
        return () => setHideBottomNav(false);
    }, [tapProduct, conteoActivo, showScanner, detailConteo, quickStockProduct, setHideBottomNav]);

    // ── Reset active conteo when location changes ──
    useEffect(() => {
        if (conteoActivo && conteoActivo.ubicacion !== ubicacion) {
            setConteoActivo(null);
            setConteoItems([]);
            setNotas('');
        }
    }, [ubicacion, conteoActivo]);

    // ── Resume in-progress count on load (filtered by current location) ──
    useEffect(() => {
        if (!cLoading && conteos.length > 0) {
            const enProgreso = conteos.find(c => c.estado === 'EN_PROGRESO' && c.ubicacion === ubicacion);
            if (enProgreso && !conteoActivo) {
                setConteoActivo(enProgreso);
                setConteoItems(enProgreso.items || []);
                setNotas(enProgreso.notas || '');
            }
        }
    }, [cLoading, conteos, conteoActivo, ubicacion]);

    // ── LocalStorage backup for conteo items ──
    useEffect(() => {
        if (conteoActivo && conteoItems.length > 0) {
            try {
                localStorage.setItem('loginv_conteo_backup', JSON.stringify({ id: conteoActivo.id, items: conteoItems, notas }));
            } catch (_) { /* quota exceeded, ignore */ }
        }
    }, [conteoItems, conteoActivo, notas]);

    // ── Restore from localStorage if no active conteo found ──
    useEffect(() => {
        if (!cLoading && !conteoActivo) {
            try {
                const backup = localStorage.getItem('loginv_conteo_backup');
                if (backup) {
                    const { id, items, notas: n } = JSON.parse(backup);
                    const match = conteos.find(c => c.id === id && c.estado === 'EN_PROGRESO' && c.ubicacion === ubicacion);
                    if (items?.length > 0 && match) {
                        setConteoActivo(match);
                        setConteoItems(items);
                        setNotas(n || '');
                        setRecoveredFromBackup(true);
                        setTimeout(() => setRecoveredFromBackup(false), 4000);
                    }
                }
            } catch (_) {}
        }
    }, [cLoading, conteoActivo, conteos, ubicacion]);

    // ── Start new count ──
    const handleNuevoConteo = useCallback(async () => {
        const id = await crearConteo({ usuario: userName, notas: '', items: [], ubicacion });
        setConteoActivo({ id, usuario: userName, estado: 'EN_PROGRESO', items: [], notas: '', ubicacion });
        setConteoItems([]);
        setNotas('');
    }, [crearConteo, userName, ubicacion]);

    // ── Open tap modal for product ──
    const openTapCount = useCallback((producto) => {
        const existing = conteoItems.find(i => i.producto_id === producto.id);
        setTapProduct({ ...producto, _existingCount: existing ? existing.conteo_fisico : 0 });
    }, [conteoItems]);

    // ── Confirm tap count for a product ──
    const handleTapConfirm = useCallback((count) => {
        if (!tapProduct) return;
        setConteoItems(prev => {
            const exists = prev.find(i => i.producto_id === tapProduct.id);
            if (exists) {
                return prev.map(i => i.producto_id === tapProduct.id
                    ? { ...i, conteo_fisico: count, diferencia: count - i.stock_sistema }
                    : i
                );
            }
            return [...prev, {
                producto_id: tapProduct.id,
                producto_nombre: tapProduct.nombre,
                conteo_fisico: count,
                stock_sistema: tapProduct.stock_actual,
                diferencia: count - tapProduct.stock_actual,
            }];
        });
        setTapProduct(null);
    }, [tapProduct]);

    // ── Category names ──
    const catNames = useMemo(() => ['Todas', ...categorias.map(c => c.nombre)], [categorias]);

    // ── Products filtered by location ──
    const productosUbicacion = useMemo(
        () => isGeneral ? productos : productos.filter(p => p.ubicacion === ubicacion),
        [productos, ubicacion, isGeneral]
    );

    // ── Handle barcode scan ──
    const handleBarcodeScan = useCallback((code) => {
        const matched = productosUbicacion.find(p => p.codigo_barras === code);
        if (matched) {
            if (conteoActivo) {
                openTapCount(matched);
            }
            setScannedFeedback({ type: 'success', name: matched.nombre });
            setShowScanner(false);
        } else {
            setScannedFeedback({ type: 'error', code });
        }
        setTimeout(() => setScannedFeedback(null), 3000);
    }, [productosUbicacion, conteoActivo, openTapCount]);

    // ── Save current count ──
    const handleSaveConteo = useCallback(async () => {
        if (!conteoActivo) return;
        setSaving(true);
        try {
            await actualizarConteo(conteoActivo.id, { items: conteoItems, notas });
        } finally {
            setSaving(false);
        }
    }, [conteoActivo, conteoItems, notas, actualizarConteo]);

    // ── Finalize count & adjust stock ──
    const handleFinalizarConteo = useCallback(async () => {
        if (!conteoActivo || conteoItems.length === 0) return;
        setSaving(true);
        try {
            await actualizarConteo(conteoActivo.id, { items: conteoItems, notas });
            await finalizarConteo(conteoActivo.id);
            for (const item of conteoItems) {
                if (item.diferencia !== 0) {
                    await updateStock(item.producto_id, item.conteo_fisico, userName);
                }
            }
            setConteoActivo(null);
            setConteoItems([]);
            setNotas('');
            try { localStorage.removeItem('loginv_conteo_backup'); } catch (_) {}
        } finally {
            setSaving(false);
        }
    }, [conteoActivo, conteoItems, notas, actualizarConteo, finalizarConteo, updateStock, userName]);

    // ── Quick stock entry/exit ──
    const handleQuickStock = useCallback(async (cantidad, motivo) => {
        if (!quickStockProduct) return;
        setSaving(true);
        try {
            const newStock = quickStockTipo === 'INGRESO'
                ? quickStockProduct.stock_actual + cantidad
                : Math.max(0, quickStockProduct.stock_actual - cantidad);
            await updateStock(quickStockProduct.id, newStock, userName);
            await crearMovimiento({
                producto_id: quickStockProduct.id,
                producto_nombre: quickStockProduct.nombre,
                tipo: quickStockTipo,
                cantidad,
                stock_anterior: quickStockProduct.stock_actual,
                stock_nuevo: newStock,
                usuario: userName,
                ubicacion: quickStockProduct.ubicacion,
                motivo: motivo || (quickStockTipo === 'INGRESO' ? 'Ingreso rápido' : 'Salida rápida'),
            });
            setQuickStockProduct(null);
        } finally {
            setSaving(false);
        }
    }, [quickStockProduct, quickStockTipo, updateStock, crearMovimiento, userName]);

    const handleRefresh = useCallback(() => {
        return new Promise(resolve => setTimeout(resolve, 600));
    }, []);

    const productosFiltrados = useMemo(() => {
        return productosUbicacion
            .filter(p => categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro)
            .filter(p => {
                if (!busqueda.trim()) return true;
                const q = busqueda.toLowerCase();
                return p.nombre.toLowerCase().includes(q)
                    || (p.codigo_barras && p.codigo_barras.includes(q));
            });
    }, [productosUbicacion, categoriaFiltro, busqueda]);

    // ── Summary stats ──
    const summary = useMemo(() => {
        const total = conteoItems.length;
        const conDiff = conteoItems.filter(i => i.diferencia !== 0).length;
        return { total, conDiff, sinDiff: total - conDiff };
    }, [conteoItems]);

    // ── Completed counts for history (with date range filter) ──
    const historialConteos = useMemo(() => {
        let list = conteos
            .filter(c => c.estado === 'COMPLETADO' && (isGeneral || c.ubicacion === ubicacion))
            .sort((a, b) => {
                const fA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                return fB - fA;
            });

        if (fechaDesde) {
            const desde = new Date(fechaDesde);
            desde.setHours(0, 0, 0, 0);
            list = list.filter(c => {
                const f = c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha);
                return f >= desde;
            });
        }
        if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            hasta.setHours(23, 59, 59, 999);
            list = list.filter(c => {
                const f = c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha);
                return f <= hasta;
            });
        }
        return list;
    }, [conteos, ubicacion, isGeneral, fechaDesde, fechaHasta]);

    const isProductCounted = useCallback((pid) => conteoItems.some(i => i.producto_id === pid), [conteoItems]);
    const getConteoForProduct = useCallback((pid) => conteoItems.find(i => i.producto_id === pid), [conteoItems]);

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Conteo de inventario" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-4">

                {/* Recovery toast*/}
                {recoveredFromBackup && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 animate-fade-in">
                        <span>💾</span>
                        <span>Conteo restaurado desde respaldo local</span>
                    </div>
                )}
                {isGeneral && tab === 'conteo' && (
                    <div className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700">
                        <MapPin size={18} className="flex-shrink-0" />
                        <span>Selecciona una ubicación específica para crear conteos. La vista General solo permite consultar el historial y registrar movimientos rápidos.</span>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
                    <button
                        onClick={() => setTab('conteo')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${tab === 'conteo' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <ClipboardList size={20} /> Conteo
                    </button>
                    <button
                        onClick={() => setTab('rapido')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${tab === 'rapido' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Zap size={20} /> Rápido
                    </button>
                    <button
                        onClick={() => setTab('historial')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${tab === 'historial' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <History size={20} /> Historial
                    </button>
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/*  TAB: CONTEO                                          */}
                {/* ══════════════════════════════════════════════════════ */}
                {tab === 'conteo' && (
                    <>
                        {/* Scanned feedback toast */}
                        {scannedFeedback && (
                            <div className={`p-3.5 rounded-xl text-base font-medium flex items-center gap-2 animate-fade-in ${scannedFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {scannedFeedback.type === 'success' ? (
                                    <><Check size={18} /> Producto identificado: <strong>{scannedFeedback.name}</strong></>
                                ) : (
                                    <><AlertTriangle size={18} /> No se encontró producto con ese código ({scannedFeedback.code})</>
                                )}
                            </div>
                        )}

                        {/* GENERAL: cannot create conteo */}
                        {isGeneral && !conteoActivo && (
                            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                                <div className="w-24 h-24 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-6">
                                    <MapPin size={44} className="text-violet-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Vista General</h2>
                                <p className="text-base text-slate-500 mt-2 max-w-sm">Para crear un conteo, selecciona una ubicación específica (Templo o un Almacén) desde el selector de ubicación.</p>
                            </div>
                        )}

                        {/* No active count → Start (only when NOT general) */}
                        {!conteoActivo && !isGeneral && (
                            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                                <div className="w-24 h-24 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-6">
                                    <ClipboardList size={44} className="text-brand-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Conteo de inventario</h2>
                                <p className="text-base text-slate-500 mt-2 max-w-sm">Toca un producto para contar — {ubicacionInfo.icono} {ubicacionInfo.nombre}</p>
                                <button
                                    onClick={handleNuevoConteo}
                                    className="btn btn-primary px-8 py-4 mt-8 text-lg font-bold flex items-center gap-3 shadow-lg rounded-2xl"
                                >
                                    <Plus size={24} /> Nuevo conteo
                                </button>
                            </div>
                        )}

                        {/* Active count */}
                        {conteoActivo && (
                            <div className="space-y-4">
                                {/* Action bar */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <button
                                        onClick={() => setShowScanner(true)}
                                        className="btn btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center"
                                    >
                                        <ScanBarcode size={20} /> Escanear código
                                    </button>
                                    <div className="ml-auto flex items-center gap-2">
                                        <button
                                            onClick={handleSaveConteo}
                                            disabled={saving || conteoItems.length === 0}
                                            className="btn btn-ghost px-4 py-3 text-base font-semibold flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            <Save size={18} /> Guardar conteo
                                        </button>
                                    </div>
                                </div>

                                {/* Summary strip */}
                                {conteoItems.length > 0 && (
                                    <div className="space-y-3">
                                        {/* Progress bar */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-bold text-slate-700">Progreso del conteo</p>
                                                <p className="text-sm font-bold text-brand-600">{conteoItems.length} / {productosUbicacion.length}</p>
                                            </div>
                                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                                                    style={{ width: `${productosUbicacion.length > 0 ? Math.round((conteoItems.length / productosUbicacion.length) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-sm">
                                            <p className="text-3xl font-bold text-slate-900">{summary.total}</p>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Ítems contados</p>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center shadow-sm">
                                            <p className="text-3xl font-bold text-emerald-700">{summary.sinDiff}</p>
                                            <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mt-1">Sin diferencias</p>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-center shadow-sm">
                                            <p className="text-3xl font-bold text-amber-700">{summary.conDiff}</p>
                                            <p className="text-xs text-amber-600 uppercase tracking-wider font-semibold mt-1">Con diferencias</p>
                                        </div>
                                    </div>
                                    </div>
                                )}

                                {/* Search + category filter */}
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar producto, código de barras o lote"
                                            value={busqueda}
                                            onChange={e => setBusqueda(e.target.value)}
                                            className="inp pl-12 pr-10 py-3.5 text-base h-14 shadow-sm bg-white border-slate-200 text-slate-900 focus:ring-brand-500/10 focus:border-brand-500 w-full"
                                        />
                                        {busqueda && (
                                            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400" aria-label="Limpiar búsqueda">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {catNames.map(cat => {
                                            const label = cat === 'Todas' ? 'Todas' : cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setCategoriaFiltro(cat)}
                                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all shadow-sm whitespace-nowrap ${
                                                        categoriaFiltro === cat
                                                            ? 'bg-brand-50 text-brand-700 border-brand-200 ring-1 ring-brand-500/10'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >{label}</button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Product grid — tap to count */}
                                <div className="space-y-2">
                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="bg-white border border-slate-200 rounded-xl h-20 animate-pulse shadow-sm" />
                                            ))}
                                        </div>
                                    ) : productosFiltrados.length === 0 ? (
                                        <EmptyState icon={Package} title="Sin resultados" subtitle="Ajusta tus filtros de búsqueda" />
                                    ) : (
                                        productosFiltrados.map(p => {
                                            const counted = isProductCounted(p.id);
                                            const conteoInfo = counted ? getConteoForProduct(p.id) : null;
                                            const diff = conteoInfo ? conteoInfo.diferencia : 0;
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => openTapCount(p)}
                                                    className={`w-full text-left rounded-xl border p-4 flex items-center gap-4 transition-all active:scale-[0.98] shadow-sm ${
                                                        counted
                                                            ? diff !== 0
                                                                ? 'bg-amber-50 border-amber-200 hover:shadow-md'
                                                                : 'bg-emerald-50/50 border-emerald-200 hover:shadow-md'
                                                            : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'
                                                    }`}
                                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                                >
                                                    {/* Icon / Status */}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                                                        counted
                                                            ? diff !== 0
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {counted ? (
                                                            <span className="text-xl font-black">{conteoInfo.conteo_fisico}</span>
                                                        ) : (
                                                            <Plus size={24} />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 text-base truncate">{p.nombre}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-semibold text-brand-600 uppercase">{p.categoria}</span>
                                                            {p.gramaje && <span className="text-xs text-slate-400">· {p.gramaje}</span>}
                                                        </div>
                                                        <p className="text-sm text-slate-500 mt-1">
                                                            Stock sistema: <strong className="text-slate-700">{p.stock_actual}</strong> {p.unidad}
                                                        </p>
                                                    </div>

                                                    {/* Right: status badge / arrow */}
                                                    <div className="flex-shrink-0">
                                                        {counted ? (
                                                            diff !== 0 ? (
                                                                <span className={`text-base font-bold px-3 py-1.5 rounded-full ${diff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                    {diff > 0 ? '+' : ''}{diff}
                                                                </span>
                                                            ) : (
                                                                <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                    <Check size={20} className="text-emerald-600" />
                                                                </span>
                                                            )
                                                        ) : (
                                                            <ChevronRight size={22} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Notas</label>
                                    <textarea
                                        rows={2}
                                        value={notas}
                                        onChange={e => setNotas(e.target.value)}
                                        placeholder="Observaciones del conteo"
                                        className="inp resize-none text-base py-3 bg-slate-50 border-slate-200 text-slate-900 w-full"
                                    />
                                </div>

                                {/* Finalize */}
                                {conteoItems.length > 0 && (
                                    <button
                                        onClick={handleFinalizarConteo}
                                        disabled={saving}
                                        className="w-full btn btn-primary py-5 text-lg font-bold flex items-center justify-center gap-3 shadow-lg rounded-2xl mb-2"
                                    >
                                        {saving ? (
                                            <><span className="spinner border-white border-t-transparent w-6 h-6" /> Guardando...</>
                                        ) : (
                                            <><Check size={24} /> Finalizar conteo</>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/*  TAB: RÁPIDO (Quick stock entry/exit)                 */}
                {/* ══════════════════════════════════════════════════════ */}
                {tab === 'rapido' && (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                                <Zap size={18} className="text-emerald-500" /> Movimientos rápidos
                            </h3>
                            <p className="text-xs text-slate-500">Registra ingresos o salidas rápidas sin crear un conteo completo.</p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="inp pl-12 pr-10 py-3.5 text-base h-14 shadow-sm bg-white border-slate-200 text-slate-900 w-full"
                            />
                            {busqueda && (
                                <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400">
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Product list with +/- buttons */}
                        {loading ? (
                            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-xl h-20 animate-pulse" />)}</div>
                        ) : productosFiltrados.length === 0 ? (
                            <EmptyState icon={Package} title="Sin resultados" />
                        ) : (
                            <div className="space-y-2">
                                {productosFiltrados.map(p => {
                                    const ubicInfo = isGeneral ? UBICACIONES.find(u => u.id === p.ubicacion) : null;
                                    return (
                                        <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-base truncate">{p.nombre}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-500">{p.categoria}</span>
                                                    {ubicInfo && (
                                                        <span className="text-[10px] font-bold text-slate-400">{ubicInfo.icono} {ubicInfo.nombre}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">Stock: <strong className="text-slate-800">{p.stock_actual}</strong> {p.unidad}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => { setQuickStockProduct(p); setQuickStockTipo('SALIDA'); }}
                                                    className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-95 transition-all"
                                                    title="Salida"
                                                >
                                                    <ArrowUpCircle size={20} />
                                                </button>
                                                <button
                                                    onClick={() => { setQuickStockProduct(p); setQuickStockTipo('INGRESO'); }}
                                                    className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all"
                                                    title="Ingreso"
                                                >
                                                    <ArrowDownCircle size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/*  TAB: HISTORIAL                                        */}
                {/* ══════════════════════════════════════════════════════ */}
                {tab === 'historial' && (
                    <div className="space-y-3">
                        {/* Date range filter */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={16} className="text-slate-500" />
                                <span className="text-sm font-bold text-slate-700">Filtrar por fecha</span>
                                {(fechaDesde || fechaHasta) && (
                                    <button
                                        onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                                        className="ml-auto text-xs text-brand-600 font-semibold hover:underline"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 font-medium mb-1">Desde</label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={e => setFechaDesde(e.target.value)}
                                        className="inp text-sm py-2.5 bg-white border-slate-200 text-slate-900 w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 font-medium mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={e => setFechaHasta(e.target.value)}
                                        className="inp text-sm py-2.5 bg-white border-slate-200 text-slate-900 w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-xl h-28 animate-pulse shadow-sm" />
                                ))}
                            </div>
                        ) : historialConteos.length === 0 ? (
                            <div className="py-12">
                                <EmptyState icon={History} title="No hay conteos registrados" />
                            </div>
                        ) : (
                            historialConteos.map(c => {
                                const ubicInfo = isGeneral ? UBICACIONES.find(u => u.id === c.ubicacion) : null;
                                return (
                                    <div key={c.id}>
                                        {ubicInfo && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mb-1">
                                                {ubicInfo.icono} {ubicInfo.nombre}
                                            </span>
                                        )}
                                        <ConteoHistoryCard conteo={c} onSelect={setDetailConteo} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
            </PullToRefresh>

            {/* ── Modals ── */}
            {showScanner && (
                <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
            )}
            {detailConteo && (
                <ConteoDetailModal conteo={detailConteo} onClose={() => setDetailConteo(null)} />
            )}
            {tapProduct && conteoActivo && (
                <TapCountModal
                    producto={tapProduct}
                    currentCount={tapProduct._existingCount}
                    onConfirm={handleTapConfirm}
                    onDiscard={() => setTapProduct(null)}
                    onClose={() => setTapProduct(null)}
                />
            )}
            {quickStockProduct && (
                <QuickStockModal
                    producto={quickStockProduct}
                    tipo={quickStockTipo}
                    onConfirm={handleQuickStock}
                    onClose={() => setQuickStockProduct(null)}
                />
            )}
        </div>
    );
}
