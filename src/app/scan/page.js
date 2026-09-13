'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { useProductos } from '@/hooks/useFirestore';
import { UBICACIONES } from '@/context/LocationContext';
import { StockBar } from '@/components/ui/SharedComponents';
import { ScanBarcode, CheckCircle2, XCircle, RotateCcw, PlusCircle, Pencil } from 'lucide-react';

export default function ScanPage() {
    const { productos } = useProductos();
    const router = useRouter();
    const [showScanner, setShowScanner] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [result, setResult] = useState(undefined); // undefined = sin escanear aún

    const handleScan = useCallback((code) => {
        setShowScanner(false);
        setScannedCode(code);
        const match = productos.find(p => p.codigo_barras === code);
        setResult(match || null);
    }, [productos]);

    function handleReset() {
        setScannedCode('');
        setResult(undefined);
    }

    function goToProduct() {
        router.push(`/productos?buscar=${encodeURIComponent(scannedCode)}`);
    }

    function goToCreate() {
        router.push(`/productos?buscar=${encodeURIComponent(scannedCode)}&crear=1`);
    }

    const ubicInfo = result ? UBICACIONES.find(u => u.id === result.ubicacion) : null;

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Escanear código" />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-lg mx-auto w-full">

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                        <ScanBarcode size={26} className="text-brand-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Buscar producto por código de barras</h3>
                    <p className="text-xs text-slate-500 mt-1">Apunta la cámara al código de barras o etiqueta del artículo para localizarlo al instante en el inventario.</p>
                </div>

                {result === undefined ? (
                    <button
                        onClick={() => setShowScanner(true)}
                        className="btn btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                        <ScanBarcode size={20} /> Iniciar escaneo
                    </button>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Código escaneado</p>
                            <p className="font-mono text-lg font-bold text-slate-800 break-all">{scannedCode}</p>
                        </div>

                        {result ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                    <CheckCircle2 size={16} /> Producto encontrado
                                </div>
                                <p className="font-bold text-slate-900">{result.nombre}</p>
                                <p className="text-sm text-slate-500">{result.categoria}</p>
                                {ubicInfo && (
                                    <p className="text-xs text-slate-400">{ubicInfo.icono} {ubicInfo.nombre}</p>
                                )}
                                <div className="flex items-center gap-3 pt-1">
                                    <span className="font-bold text-slate-800 text-sm">{result.stock_actual} <span className="text-slate-400 font-normal text-xs">{result.unidad}</span></span>
                                    <StockBar actual={result.stock_actual} minimo={result.stock_minimo_rop} />
                                </div>
                                <button
                                    onClick={goToProduct}
                                    className="btn btn-primary w-full mt-2 py-3 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Pencil size={16} /> Ver / editar producto
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                                    <XCircle size={16} /> No se encontró ningún producto con este código
                                </div>
                                <button
                                    onClick={goToCreate}
                                    className="btn btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <PlusCircle size={16} /> Crear producto con este código
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleReset}
                            className="btn btn-ghost w-full py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={16} /> Escanear otro código
                        </button>
                    </div>
                )}
            </div>

            {showScanner && (
                <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
}
