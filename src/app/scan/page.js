'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import ProductThumb from '@/components/ui/ProductThumb';
import { useProductos } from '@/hooks/useFirestore';
import { getLocationInfo } from '@/context/LocationContext';
import { StockBar } from '@/components/ui/SharedComponents';
import { findProductByBarcode } from '@/lib/barcodeUtils';
import RouteGuard from '@/components/ui/RouteGuard';
import { useToast, useConfirm } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';
import { 
    ScanBarcode, CheckCircle2, XCircle, RotateCcw, 
    PlusCircle, Pencil, Link as LinkIcon, Search, X, Check 
} from 'lucide-react';

export default function ScanPage() {
    const { productos, actualizarProducto } = useProductos();
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const { user } = useAuth();
    const canManage = user?.rol === 'admin' || user?.rol === 'encargado';
    const [manualCode, setManualCode] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [result, setResult] = useState(undefined); // undefined = sin escanear aún
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkSearch, setLinkSearch] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkSuccess, setLinkSuccess] = useState('');

    const handleScan = useCallback((code) => {
        setShowScanner(false);
        const trimmed = String(code || '').trim();
        setScannedCode(trimmed);
        const match = findProductByBarcode(productos, trimmed);
        setResult(match || null);
    }, [productos]);

    function handleReset() {
        setScannedCode('');
        setResult(undefined);
        setLinkSuccess('');
    }

    function goToProduct() {
        if (!result) return;
        const param = result.codigo_barras || result.nombre || scannedCode;
        const ubicParam = result.ubicacion ? `&ubicacion=${encodeURIComponent(result.ubicacion)}` : '';
        router.push(`/productos?buscar=${encodeURIComponent(param)}${ubicParam}`);
    }

    function goToCreate() {
        router.push(`/productos?buscar=${encodeURIComponent(scannedCode)}&crear=1`);
    }

    async function handleLinkProduct(prod) {
        if (!prod || !scannedCode) return;
        if (prod.codigo_barras && prod.codigo_barras !== scannedCode) {
            const ok = await confirm({
                title: 'Reemplazar código',
                message: `"${prod.nombre}" ya tiene el código ${prod.codigo_barras}. ¿Reemplazarlo por ${scannedCode}? Las etiquetas impresas con el código anterior dejarán de funcionar.`,
                confirmLabel: 'Reemplazar',
                danger: true,
            });
            if (!ok) return;
        }
        setLinking(true);
        try {
            await actualizarProducto(prod.id, { codigo_barras: scannedCode });
            setResult({ ...prod, codigo_barras: scannedCode });
            setShowLinkModal(false);
            setLinkSuccess(`Código asignado exitosamente a "${prod.nombre}"`);
            setTimeout(() => setLinkSuccess(''), 4000);
        } catch (err) {
            toast.error('No se pudo asignar el código: ' + err.message);
        } finally {
            setLinking(false);
        }
    }

    const filteredForLinking = useMemo(() => {
        if (!linkSearch.trim()) return productos.slice(0, 20);
        const q = linkSearch.toLowerCase().trim();
        return productos.filter(p => 
            p.nombre?.toLowerCase().includes(q) || 
            p.codigo_barras?.toLowerCase().includes(q) ||
            p.categoria?.toLowerCase().includes(q)
        ).slice(0, 30);
    }, [productos, linkSearch]);

    const ubicInfo = result ? getLocationInfo(result.ubicacion) : null;

    return (
        <RouteGuard>
        <div className="flex flex-col flex-1">
            <Header title="Escanear código" />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-lg mx-auto w-full">

                <div className="bg-surface border border-slate-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                        <ScanBarcode size={26} className="text-brand-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Buscar producto por código de barras</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Apunta la cámara a cualquier código de barras (Code 128, EAN, UPC, Code 39 o QR) para localizar el artículo al instante.
                    </p>
                </div>

                {linkSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in">
                        <Check size={18} className="text-emerald-600 flex-shrink-0" />
                        <span>{linkSuccess}</span>
                    </div>
                )}

                {result === undefined ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="btn-primary w-full py-4 text-base font-bold rounded-xl"
                        >
                            <ScanBarcode size={20} /> Escanear con la cámara
                        </button>
                        <form
                            className="glass-panel p-4"
                            onSubmit={e => { e.preventDefault(); if (manualCode.trim()) { handleScan(manualCode); setManualCode(''); } }}
                        >
                            <label htmlFor="manual-code" className="field-label">¿Sin cámara? Escribe el código o usa un lector USB</label>
                            <div className="flex gap-2">
                                <input
                                    id="manual-code"
                                    value={manualCode}
                                    onChange={e => setManualCode(e.target.value)}
                                    placeholder="Ej: INSTB1 o 7751234567890"
                                    className="inp font-mono"
                                    autoComplete="off"
                                    inputMode="text"
                                />
                                <button type="submit" disabled={!manualCode.trim()} className="btn-secondary px-4">
                                    <Search size={16} /> Buscar
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-surface border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Código escaneado</p>
                            <p className="font-mono text-base sm:text-lg font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 break-all mt-1">
                                {scannedCode || '(vacío)'}
                            </p>
                        </div>

                        {result ? (
                            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                    <CheckCircle2 size={18} /> Producto encontrado
                                </div>
                                <div className="flex items-start gap-3.5">
                                    <ProductThumb
                                        url={result.imagen_url}
                                        icon="📦"
                                        size="md"
                                        className="w-16 h-16 rounded-2xl flex-shrink-0 object-cover shadow-xs border border-emerald-200/80 bg-surface"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 text-base leading-snug">{result.nombre}</p>
                                        <p className="text-xs text-brand-600 font-semibold uppercase mt-0.5">{result.categoria}</p>
                                        {ubicInfo && (
                                            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-surface border border-emerald-200 text-emerald-800 shadow-xs">
                                                <span>{ubicInfo.icono}</span>
                                                <span>{ubicInfo.nombre}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-sm">
                                    <span className="text-xs text-slate-500 font-medium">Stock disponible:</span>
                                    <span className="font-bold text-slate-800">{result.stock_actual} {result.unidad || 'uds.'}</span>
                                </div>
                                <StockBar actual={result.stock_actual} minimo={result.stock_minimo} />

                                <button
                                    onClick={goToProduct}
                                    className="btn btn-primary w-full mt-2 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl"
                                >
                                    <Pencil size={16} /> Ver / gestionar producto
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                    <XCircle size={18} className="text-amber-600 flex-shrink-0" />
                                    <span>No se encontró ningún producto con este código</span>
                                </div>
                                <p className="text-xs text-slate-600">
                                    El código no coincide con ningún producto existente. Puedes crear un nuevo producto con este código o vincularlo a uno ya registrado.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {canManage && <button
                                        onClick={goToCreate}
                                        className="btn btn-primary py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 rounded-lg"
                                    >
                                        <PlusCircle size={16} /> Crear producto
                                    </button>}
                                    <button
                                        onClick={() => setShowLinkModal(true)}
                                        className="btn btn-ghost bg-surface border border-amber-300 text-amber-900 hover:bg-amber-100/50 py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 rounded-lg"
                                    >
                                        <LinkIcon size={16} /> Asignar a existente
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleReset}
                            className="btn btn-ghost w-full py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50"
                        >
                            <RotateCcw size={16} /> Escanear otro código
                        </button>
                    </div>
                )}
            </div>

            {/* Modal para vincular a un producto existente */}
            {showLinkModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowLinkModal(false)}>
                    <div className="modal-box max-w-md overflow-hidden flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Asignar código a producto</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">Código: {scannedCode}</p>
                            </div>
                            <button onClick={() => setShowLinkModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-3 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={linkSearch}
                                    onChange={e => setLinkSearch(e.target.value)}
                                    placeholder="Buscar producto por nombre..."
                                    className="inp pl-9 py-2 text-sm bg-surface"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
                            {filteredForLinking.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-8">No se encontraron productos coincidentes</p>
                            ) : (
                                filteredForLinking.map(prod => (
                                    <div key={prod.id} className="p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl flex items-center justify-between gap-3 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <ProductThumb url={prod.imagen_url} size="sm" className="w-10 h-10 rounded-lg flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate">{prod.nombre}</p>
                                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                                    {prod.categoria} • Cód. actual: {prod.codigo_barras || 'ninguno'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            disabled={linking}
                                            onClick={() => handleLinkProduct(prod)}
                                            className="btn btn-primary text-xs py-1.5 px-3 rounded-lg flex-shrink-0 font-bold"
                                        >
                                            Asignar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showScanner && (
                <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}
        </div>
        </RouteGuard>
    );
}
