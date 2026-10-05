'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { printSingleBarcode, printBarcodeSheet } from '@/lib/barcodePrinter';

// Genera un código de barras CODE128 (soporta letras y números, como los
// códigos de item de la iglesia: INSTB1, MOBIL1, etc.) usando JsBarcode.
export function useBarcodeSvg(value) {
    const svgRef = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let mounted = true;
        setReady(false);
        (async () => {
            if (!value || !svgRef.current) return;
            const JsBarcode = (await import('jsbarcode')).default;
            if (!mounted || !svgRef.current) return;
            try {
                JsBarcode(svgRef.current, String(value), {
                    format: 'CODE128',
                    width: 2,
                    height: 55,
                    displayValue: true,
                    fontSize: 13,
                    margin: 6,
                });
                setReady(true);
            } catch (_) {
                setReady(false);
            }
        })();
        return () => { mounted = false; };
    }, [value]);

    return { svgRef, ready };
}

// Vista embebida (sin modal) — usada dentro de formularios para previsualizar.
export function BarcodeLabelPreview({ value, className = '' }) {
    const { svgRef, ready } = useBarcodeSvg(value);
    if (!value) return null;
    return (
        <div className={`flex justify-center bg-white dark:bg-black/50 rounded-xl border border-slate-200 dark:border-white/10 p-3 ${className}`}>
            <svg ref={svgRef} className={ready ? '' : 'hidden'} />
            {!ready && <p className="text-xs text-slate-400 py-3">Código no válido para generar barras</p>}
        </div>
    );
}

// Modal de etiqueta individual imprimible (1 sola hoja, exactamente 1 página).
export default function BarcodeLabelModal({ producto, onClose }) {
    const { svgRef, ready } = useBarcodeSvg(producto?.codigo_barras);
    const [printing, setPrinting] = useState(false);

    async function handlePrint() {
        if (!producto?.codigo_barras) return;
        setPrinting(true);
        try {
            await printSingleBarcode(producto);
        } finally {
            setPrinting(false);
        }
    }

    function handleDownload() {
        const svg = svgRef.current;
        if (!svg) return;
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const blob = new Blob([source], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${producto.codigo_barras || 'codigo'}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#0d0d10] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl animate-slide-up flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Etiqueta de código de barras</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-2 bg-white dark:bg-[#0d0d10]">
                    <p className="text-base font-bold text-slate-900 dark:text-white text-center">{producto?.nombre}</p>
                    {producto?.ubicacion_nombre && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{producto.ubicacion_nombre}</p>
                    )}
                    
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center min-h-[90px] w-full">
                        {producto?.codigo_barras ? (
                            <svg ref={svgRef} className={ready ? '' : 'hidden'} />
                        ) : (
                            <p className="text-sm text-slate-400 py-6 text-center">Este producto no tiene código de barras asignado.</p>
                        )}
                        {producto?.codigo_barras && !ready && (
                            <p className="text-xs text-slate-400">Generando código...</p>
                        )}
                    </div>
                </div>

                {producto?.codigo_barras && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/40">
                        <button onClick={handleDownload} className="btn btn-ghost px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl flex items-center gap-2">
                            <Download size={16} /> SVG
                        </button>
                        <button 
                            onClick={handlePrint} 
                            disabled={printing}
                            className="btn btn-primary px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl shadow-sm"
                        >
                            {printing ? (
                                <><span className="spinner border-white border-t-transparent w-4 h-4" /> Preparando...</>
                            ) : (
                                <><Printer size={16} /> Imprimir (1 hoja)</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Modal de impresión masiva en cuadrícula de hoja (aprovecha 1 sola hoja para hasta 18-21 productos).
export function BulkBarcodeLabelsModal({ productos, onClose }) {
    const conCodigo = productos.filter(p => p.codigo_barras);
    const sinCodigo = productos.length - conCodigo.length;
    const [copias, setCopias] = useState(1);
    const [printing, setPrinting] = useState(false);

    const totalEtiquetas = conCodigo.length * copias;
    const hojasEstimadas = Math.max(1, Math.ceil(totalEtiquetas / 18));

    async function handlePrint() {
        if (conCodigo.length === 0) return;
        setPrinting(true);
        try {
            await printBarcodeSheet(conCodigo, copias);
        } finally {
            setPrinting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#0d0d10] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Hoja de impresión de etiquetas</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {conCodigo.length} producto{conCodigo.length === 1 ? '' : 's'} seleccionado{conCodigo.length === 1 ? '' : 's'} · Todas en cuadrícula optimizada
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                {/* Subheader Controls */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-black/30 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                    {/* Control de copias */}
                    <div className="flex items-center gap-2">
                        <Copy size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Copias por producto:</span>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setCopias(n)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                        copias === n
                                            ? 'bg-violet-600 text-white shadow-xs'
                                            : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resumen de hojas */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        <span>Total: <strong className="text-violet-600 dark:text-violet-400 font-bold">{totalEtiquetas}</strong> etiquetas (~{hojasEstimadas} hoja{hojasEstimadas > 1 ? 's' : ''})</span>
                    </div>
                </div>

                {sinCodigo > 0 && (
                    <div className="mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2 flex-shrink-0">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>{sinCodigo} producto{sinCodigo === 1 ? '' : 's'} seleccionado{sinCodigo === 1 ? '' : 's'} no tiene código de barras y no se incluirá{sinCodigo === 1 ? '' : 'n'}.</span>
                    </div>
                )}

                {/* Vista previa de etiquetas en cuadrícula */}
                <div className="flex-1 overflow-y-auto p-5">
                    {conCodigo.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-12">Ningún producto seleccionado tiene código de barras asignado.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {conCodigo.map(p => (
                                <div key={p.id} className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131317] rounded-xl p-3 flex flex-col items-center text-center shadow-2xs">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.nombre}</p>
                                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-2">{p.codigo_barras}</p>
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-center w-full">
                                        <BarcodeLabelPreview value={p.codigo_barras} className="border-0 p-0" />
                                    </div>
                                    {copias > 1 && (
                                        <span className="mt-2 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full">
                                            ×{copias} copias
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {conCodigo.length > 0 && (
                    <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/40 flex-shrink-0">
                        <button type="button" onClick={onClose} className="btn btn-ghost px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Cerrar
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={printing}
                            className="btn btn-primary px-6 py-2.5 text-sm font-bold flex items-center gap-2 shadow-sm"
                        >
                            {printing ? (
                                <><span className="spinner border-white border-t-transparent w-4 h-4" /> Generando hoja...</>
                            ) : (
                                <><Printer size={16} /> Imprimir {totalEtiquetas} etiqueta{totalEtiquetas === 1 ? '' : 's'} en {hojasEstimadas} hoja{hojasEstimadas > 1 ? 's' : ''}</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

