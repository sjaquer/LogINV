'use client';
import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardList, History, Zap } from 'lucide-react';
import Header from '@/components/layout/Header';
import { PageBody, SegmentedTabs } from '@/components/ui/Page';
import { useToast, useConfirm } from '@/components/ui/Feedback';
import { useProductos, useCategorias, useConteos } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, getLocationInfo } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import RouteGuard from '@/components/ui/RouteGuard';
import { findProductByBarcode } from '@/lib/barcodeUtils';
import { useConteoSession, clearConteoBackup } from './useConteoSession';
import {
    TapCountModal, ConteoDetailModal, QuickStockModal, ConteoTab, QuickStockTab, HistorialTab,
} from './components';

const TABS = ['conteo', 'rapido', 'historial'];

export default function InventarioPage() {
    return (
        <RouteGuard>
            <Suspense fallback={null}>
                <InventarioPageInner />
            </Suspense>
        </RouteGuard>
    );
}

function InventarioPageInner() {
    const { productos, loading: pLoading, updateStock } = useProductos();
    const { categorias } = useCategorias();
    const { conteos, loading: cLoading, crearConteo, actualizarConteo, finalizarConteo } = useConteos();
    const { user } = useAuth();
    const { ubicacion, ubicacionInfo, isGeneral } = useLocation();
    const { setHideBottomNav } = useSidebar();
    const searchParams = useSearchParams();
    const toast = useToast();
    const confirm = useConfirm();
    const userName = user?.nombre || 'Usuario';

    const [tab, setTab] = useState(TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'conteo');
    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState('Todas');
    const [scanMode, setScanMode] = useState(null); // null | 'conteo' | 'INGRESO' | 'SALIDA'
    const [feedback, setFeedback] = useState(null);
    const [saving, setSaving] = useState(false);
    const [detailConteo, setDetailConteo] = useState(null);
    const [tapProduct, setTapProduct] = useState(null);
    const [quick, setQuick] = useState(null); // { producto, tipo }

    const session = useConteoSession(conteos, ubicacion);
    const { conteoActivo, items, notas, setItems, recovered } = session;
    const loading = pLoading || cLoading;

    // Oculta la barra inferior móvil mientras hay un modal a pantalla completa.
    useEffect(() => {
        setHideBottomNav(!!(tapProduct || scanMode || detailConteo || quick));
        return () => setHideBottomNav(false);
    }, [tapProduct, scanMode, detailConteo, quick, setHideBottomNav]);

    useEffect(() => {
        if (recovered) toast.info('Se recuperó tu conteo sin guardar desde este dispositivo.');
    }, [recovered, toast]);

    const showFeedback = useCallback((fb) => {
        setFeedback(fb);
        setTimeout(() => setFeedback(null), 4000);
    }, []);

    const productosUbicacion = useMemo(
        () => (isGeneral ? productos : productos.filter(p => p.ubicacion === ubicacion)),
        [productos, ubicacion, isGeneral]
    );

    const productosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return productosUbicacion
            .filter(p => categoria === 'Todas' || p.categoria === categoria)
            .filter(p => !q || p.nombre?.toLowerCase().includes(q) || String(p.codigo_barras || '').toLowerCase().includes(q));
    }, [productosUbicacion, categoria, busqueda]);

    const filters = {
        busqueda,
        onBusqueda: setBusqueda,
        categorias: ['Todas', ...categorias.map(c => c.nombre)],
        categoria,
        onCategoria: setCategoria,
    };

    // ── Conteo ──
    const handleNuevoConteo = useCallback(async () => {
        try {
            await crearConteo({ usuario: userName, notas: '', items: [], ubicacion });
        } catch (err) {
            toast.error(err);
        }
    }, [crearConteo, userName, ubicacion, toast]);

    const openTapCount = useCallback((producto) => {
        const existing = items.find(i => i.producto_id === producto.id);
        setTapProduct({ ...producto, _existingCount: existing ? existing.conteo_fisico : 0 });
    }, [items]);

    const handleTapConfirm = useCallback((count) => {
        if (!tapProduct) return;
        setItems(prev => {
            const exists = prev.some(i => i.producto_id === tapProduct.id);
            if (exists) {
                return prev.map(i => (i.producto_id === tapProduct.id ? { ...i, conteo_fisico: count, diferencia: count - i.stock_sistema } : i));
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
    }, [tapProduct, setItems]);

    const handleSaveConteo = useCallback(async () => {
        if (!conteoActivo) return;
        setSaving(true);
        try {
            await actualizarConteo(conteoActivo.id, { items, notas });
            toast.success('Avance del conteo guardado');
        } catch (err) {
            toast.error(err);
        } finally {
            setSaving(false);
        }
    }, [conteoActivo, items, notas, actualizarConteo, toast]);

    const handleFinalizarConteo = useCallback(async () => {
        if (!conteoActivo || items.length === 0) return;
        const conDiff = items.filter(i => i.diferencia !== 0);
        const ok = await confirm({
            title: 'Finalizar conteo',
            message: conDiff.length
                ? `Se contaron ${items.length} productos. ${conDiff.length} tienen diferencias y su stock se ajustará al valor contado. Esta acción queda registrada.`
                : `Se contaron ${items.length} productos y todos coinciden con el sistema.`,
            confirmLabel: 'Finalizar',
        });
        if (!ok) return;

        setSaving(true);
        try {
            await actualizarConteo(conteoActivo.id, { items, notas });
            for (const item of conDiff) {
                await updateStock(item.producto_id, item.conteo_fisico, userName, { motivo: 'Ajuste por conteo físico' });
            }
            await finalizarConteo(conteoActivo.id);
            clearConteoBackup();
            toast.success(conDiff.length ? `Conteo finalizado: se ajustó el stock de ${conDiff.length} producto(s)` : 'Conteo finalizado sin diferencias');
        } catch (err) {
            toast.error(err);
        } finally {
            setSaving(false);
        }
    }, [conteoActivo, items, notas, actualizarConteo, finalizarConteo, updateStock, userName, confirm, toast]);

    // ── Escaneo ──
    const handleBarcodeScan = useCallback((code) => {
        const mode = scanMode;
        setScanMode(null);
        if (mode === 'INGRESO' || mode === 'SALIDA') {
            const matched = findProductByBarcode(productos, code);
            if (matched) setQuick({ producto: matched, tipo: mode });
            else showFeedback({ type: 'error', code });
            return;
        }
        const matched = findProductByBarcode(productosUbicacion, code);
        if (matched) {
            if (conteoActivo) openTapCount(matched);
            showFeedback({ type: 'success', name: matched.nombre });
            return;
        }
        const global = findProductByBarcode(productos, code);
        if (global) {
            const loc = getLocationInfo(global.ubicacion);
            showFeedback({ type: 'warning', name: global.nombre, ubicacion: loc?.nombre || global.ubicacion, icono: loc?.icono || '📍', code });
        } else {
            showFeedback({ type: 'error', code });
        }
    }, [scanMode, productos, productosUbicacion, conteoActivo, openTapCount, showFeedback]);

    // ── Ingreso / salida rápida (una sola operación atómica) ──
    const handleQuickStock = useCallback(async (cantidad, motivo) => {
        if (!quick) return;
        const { producto, tipo } = quick;
        try {
            const r = await updateStock(producto.id, tipo === 'INGRESO' ? cantidad : -cantidad, userName, {
                modo: 'delta',
                tipo,
                motivo: motivo || (tipo === 'INGRESO' ? 'Ingreso rápido' : 'Salida rápida'),
            });
            setQuick(null);
            toast.success(`${producto.nombre}: ${r?.anterior ?? producto.stock_actual} → ${r?.nuevo ?? '—'} ${producto.unidad || ''}`);
        } catch (err) {
            toast.error(err);
        }
    }, [quick, updateStock, userName, toast]);

    const tabs = [
        { id: 'conteo', label: 'Conteo', icon: ClipboardList },
        { id: 'rapido', label: 'Ingreso / salida', icon: Zap },
        { id: 'historial', label: 'Historial', icon: History },
    ];

    return (
        <div className="flex flex-col flex-1">
            <Header title="Inventario" />
            <PageBody width="max-w-5xl">
                <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

                {tab === 'conteo' && (
                    <ConteoTab
                        isGeneral={isGeneral}
                        ubicacionInfo={ubicacionInfo}
                        loading={loading}
                        session={session}
                        productosUbicacion={productosUbicacion}
                        productosFiltrados={productosFiltrados}
                        filters={filters}
                        feedback={feedback}
                        saving={saving}
                        onNuevo={handleNuevoConteo}
                        onScan={() => setScanMode('conteo')}
                        onSave={handleSaveConteo}
                        onFinalizar={handleFinalizarConteo}
                        onTap={openTapCount}
                    />
                )}
                {tab === 'rapido' && (
                    <QuickStockTab
                        isGeneral={isGeneral}
                        loading={loading}
                        productosFiltrados={productosFiltrados}
                        filters={filters}
                        feedback={feedback}
                        onScan={setScanMode}
                        onMove={(producto, tipo) => setQuick({ producto, tipo })}
                    />
                )}
                {tab === 'historial' && (
                    <HistorialTab conteos={conteos} isGeneral={isGeneral} ubicacion={ubicacion} loading={loading} onSelect={setDetailConteo} />
                )}
            </PageBody>

            {scanMode && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setScanMode(null)} />}
            {detailConteo && <ConteoDetailModal conteo={detailConteo} onClose={() => setDetailConteo(null)} />}
            {tapProduct && conteoActivo && (
                <TapCountModal
                    producto={tapProduct}
                    currentCount={tapProduct._existingCount}
                    onConfirm={handleTapConfirm}
                    onDiscard={() => setTapProduct(null)}
                    onClose={() => setTapProduct(null)}
                />
            )}
            {quick && (
                <QuickStockModal
                    producto={quick.producto}
                    tipo={quick.tipo}
                    onConfirm={handleQuickStock}
                    onClose={() => setQuick(null)}
                />
            )}
        </div>
    );
}
