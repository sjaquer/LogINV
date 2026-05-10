'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias, useConteos, useCrearMovimiento } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { formatDateTime } from '@/lib/utils';
import {
    Search, X, Plus, Minus, Package,
    Save, AlertTriangle,
    Check, ClipboardList, History, ScanBarcode,
    ChevronRight, RotateCcw, MapPin, Calendar,
    ArrowDownCircle, ArrowUpCircle, Zap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
//  TapCountModal – Full-screen counting modal (tap = +1)
// ═══════════════════════════════════════════════════════════════════════════
function TapCountModal({ producto, currentCount, onConfirm, onDiscard, onClose }) {
    const [count, setCount] = useState(currentCount);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleTap = useCallback(() => {
        setCount(prev => prev + 1);
        setPulse(true);
        if (navigator.vibrate) navigator.vibrate(30);
        setTimeout(() => setPulse(false), 150);
    }, []);

    const handleMinus = useCallback(() => {
        setCount(prev => Math.max(0, prev - 1));
        if (navigator.vibrate) navigator.vibrate(15);
    }, []);

    const handleReset = useCallback(() => {
        setCount(0);
    }, []);

    const diff = count - producto.stock_actual;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col animate-fade-in select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 flex-shrink-0">
                <button onClick={onClose} className="p-3 rounded-2xl bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 transition-all">
                    <X size={24} />
                </button>
                <div className="text-center flex-1 px-4 min-w-0">
                    <p className="text-white font-bold text-lg sm:text-xl truncate">{producto.nombre}</p>
                    <p className="text-white/50 text-sm">{producto.categoria} {producto.gramaje ? `· ${producto.gramaje}` : ''}</p>
                </div>
                <div className="w-12" /> {/* spacer */}
            </div>

            {/* Current count display */}
            <div className="flex flex-col items-center justify-center px-6 py-4 flex-shrink-0">
                <p className={`text-8xl sm:text-9xl font-black text-white tabular-nums transition-transform duration-150 ${pulse ? 'scale-110' : 'scale-100'}`}>
                    {count}
                </p>
                <p className="text-white/40 text-sm sm:text-base font-medium mt-2 uppercase tracking-wider">Conteo físico</p>
                <div className="flex items-center gap-4 mt-3">
                    <span className="text-white/40 text-sm">Stock sistema: <strong className="text-white/70">{producto.stock_actual}</strong></span>
                    {diff !== 0 && (
                        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${diff < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                        </span>
                    )}
                </div>
            </div>

            {/* TAP ZONE – big touch area */}
            <div className="flex-1 flex items-center justify-center px-6 py-4">
                <button
                    onClick={handleTap}
                    className={`w-full max-w-sm aspect-square rounded-[2rem] bg-brand-600 hover:bg-brand-700 active:scale-95 active:bg-brand-800 transition-all duration-100 flex flex-col items-center justify-center shadow-2xl shadow-brand-500/30 border-4 border-brand-400/20 ${pulse ? 'scale-95' : 'scale-100'}`}
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                    <Plus size={64} className="text-white/90" strokeWidth={3} />
                    <p className="text-white/80 text-lg sm:text-xl font-bold mt-3">Toca para contar</p>
                </button>
            </div>

            {/* Bottom controls */}
            <div className="flex items-center gap-3 p-4 sm:p-6 flex-shrink-0 pb-safe">
                <button
                    onClick={handleReset}
                    className="p-4 rounded-2xl bg-white/10 text-white/60 hover:bg-white/20 active:scale-95 transition-all"
                    title="Reset"
                >
                    <RotateCcw size={24} />
                </button>
                <button
                    onClick={handleMinus}
                    className="p-4 rounded-2xl bg-white/10 text-white/60 hover:bg-white/20 active:scale-95 transition-all"
                    title="-1"
                >
                    <Minus size={24} />
                </button>
                <button
                    onClick={onDiscard}
                    className="flex-1 py-4 rounded-2xl bg-white/10 text-white/80 font-bold text-base hover:bg-white/20 active:scale-95 transition-all"
                >
                    Descartar
                </button>
                <button
                    onClick={() => onConfirm(count)}
                    className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                    <Check size={22} /> Confirmar
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ConteoHistoryCard
// ═══════════════════════════════════════════════════════════════════════════
function ConteoHistoryCard({ conteo, onSelect }) {
    const totalItems = conteo.items?.length || 0;
    const conDiff = conteo.items?.filter(i => i.diferencia !== 0).length || 0;
    const isCompleted = conteo.estado === 'COMPLETADO';

    return (
        <button
            type="button"
            onClick={() => onSelect(conteo)}
            className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {isCompleted ? 'Completado' : 'En progreso'}
                    </span>
                    <p className="text-sm text-slate-500 mt-2 font-medium">{conteo.usuario}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(conteo.fecha)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ítems contados</p>
                    {conDiff > 0 && (
                        <p className="text-xs text-amber-600 font-bold mt-1">{conDiff} con diferencias</p>
                    )}
                </div>
            </div>
            {conteo.notas && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic">&quot;{conteo.notas}&quot;</p>
            )}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ConteoDetailModal – view completed count detail
// ═══════════════════════════════════════════════════════════════════════════
function ConteoDetailModal({ conteo, onClose }) {
    const items = conteo.items || [];
    const conDiff = items.filter(i => i.diferencia !== 0);
    const sinDiff = items.filter(i => i.diferencia === 0);

    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">Detalle del conteo</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{conteo.usuario} · {formatDateTime(conteo.fecha)}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={22} />
                    </button>
                </div>
                {conteo.notas && (
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 text-sm text-slate-600 italic">
                        &quot;{conteo.notas}&quot;
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    {conDiff.length > 0 && (
                        <div>
                            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Con diferencias ({conDiff.length})</p>
                            </div>
                            {conDiff.map(item => (
                                <div key={item.producto_id} className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-amber-50/30">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-semibold text-slate-800 truncate">{item.producto_nombre}</p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Stock sistema: {item.stock_sistema} → Conteo físico: {item.conteo_fisico}
                                        </p>
                                    </div>
                                    <span className={`text-base font-bold ${item.diferencia < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {sinDiff.length > 0 && (
                        <div>
                            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sin diferencias ({sinDiff.length})</p>
                            </div>
                            {sinDiff.map(item => (
                                <div key={item.producto_id} className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                                    <p className="text-base text-slate-700 truncate flex-1">{item.producto_nombre}</p>
                                    <span className="text-base text-emerald-500 flex items-center gap-1"><Check size={16} /> {item.conteo_fisico}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {items.length === 0 && (
                        <div className="p-8 text-center text-base text-slate-400">Sin datos</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  QuickStockModal – Quick add/subtract stock for a product
// ═══════════════════════════════════════════════════════════════════════════
function QuickStockModal({ producto, tipo, onConfirm, onClose }) {
    const [cantidad, setCantidad] = useState(1);
    const [motivo, setMotivo] = useState('');

    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const isIngreso = tipo === 'INGRESO';

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-6 border border-slate-200 shadow-2xl bg-white max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isIngreso ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                        {isIngreso ? <ArrowDownCircle size={28} className="text-emerald-600" /> : <ArrowUpCircle size={28} className="text-amber-600" />}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{isIngreso ? 'Ingreso rápido' : 'Salida rápida'}</h3>
                    <p className="text-sm text-slate-500 mt-1">{producto.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Stock actual: <strong>{producto.stock_actual}</strong> {producto.unidad}</p>
                </div>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCantidad(c => Math.max(1, c - 1))} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                                <Minus size={18} />
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={cantidad}
                                onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                                className="inp text-center text-2xl font-bold py-3 flex-1 bg-white border-slate-200 text-slate-900"
                            />
                            <button onClick={() => setCantidad(c => c + 1)} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>
                        {!isIngreso && cantidad > producto.stock_actual && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Excede el stock actual</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Motivo (opcional)</label>
                        <input
                            type="text"
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder={isIngreso ? 'Ej: Recepción de pedido' : 'Ej: Consumo diario'}
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900 w-full"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn btn-ghost flex-1 py-3 text-base font-semibold text-slate-600">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(cantidad, motivo)}
                        disabled={!isIngreso && cantidad > producto.stock_actual}
                        className={`btn flex-1 py-3 text-base font-bold flex items-center justify-center gap-2 ${isIngreso ? 'btn-primary' : 'bg-amber-500 hover:bg-amber-600 text-white rounded-xl'} disabled:opacity-50`}
                    >
                        {isIngreso ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  INVENTORY PAGE – Tap-to-count daily counting tool
// ═══════════════════════════════════════════════════════════════════════════
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

    // ── Products filtered by location ──  ← debe declararse ANTES de handleBarcodeScan
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

    // helper: is product already counted?
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
                                <p className="text-base text-slate-500 mt-2 max-w-sm">Para crear un conteo, selecciona una ubicación específica (Bar 1, Bar 2 o Almacén) desde el selector de ubicación.</p>
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
