'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';

// Genera un código de barras CODE128 (soporta letras y números, como los
// códigos de item de la iglesia: INSTB1, MOBIL1, etc.) usando JsBarcode.
function useBarcodeSvg(value) {
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
                    height: 60,
                    displayValue: true,
                    fontSize: 14,
                    margin: 8,
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
        <div className={`flex justify-center bg-white rounded-lg border border-slate-200 p-2 ${className}`}>
            <svg ref={svgRef} className={ready ? '' : 'hidden'} />
            {!ready && <p className="text-xs text-slate-400 py-4">Código no válido para generar barras</p>}
        </div>
    );
}

// Modal de etiqueta imprimible: nombre + código de barras, con impresión.
export default function BarcodeLabelModal({ producto, onClose }) {
    const { svgRef, ready } = useBarcodeSvg(producto?.codigo_barras);

    function handlePrint() {
        window.print();
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center animate-fade-in p-4 print:bg-white print:p-0" onClick={onClose}>
            <div
                className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl print:shadow-none print:rounded-none print:max-w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden">
                    <h3 className="font-bold text-slate-900 text-base">Etiqueta de código de barras</h3>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                <div id="barcode-print-area" className="p-6 flex flex-col items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 text-center">{producto?.nombre}</p>
                    {producto?.ubicacion_nombre && (
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider">{producto.ubicacion_nombre}</p>
                    )}
                    {producto?.codigo_barras ? (
                        <svg ref={svgRef} className={ready ? '' : 'hidden'} />
                    ) : (
                        <p className="text-sm text-slate-400 py-6">Este producto no tiene código de barras asignado.</p>
                    )}
                    {producto?.codigo_barras && !ready && (
                        <p className="text-xs text-slate-400">No se pudo generar el código de barras.</p>
                    )}
                </div>

                {producto?.codigo_barras && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50 print:hidden">
                        <button onClick={handleDownload} className="btn btn-ghost px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl flex items-center gap-2">
                            <Download size={16} /> Descargar SVG
                        </button>
                        <button onClick={handlePrint} className="btn btn-primary px-4 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl">
                            <Printer size={16} /> Imprimir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
