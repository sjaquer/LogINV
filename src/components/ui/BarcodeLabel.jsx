'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';

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

// Una etiqueta individual dentro de la hoja de impresión masiva.
function BulkLabelItem({ producto }) {
    const { svgRef, ready } = useBarcodeSvg(producto.codigo_barras);
    return (
        <div className="flex flex-col items-center gap-1 border border-slate-200 rounded-lg p-3 [break-inside:avoid]">
            <p className="text-xs font-bold text-slate-800 text-center line-clamp-2">{producto.nombre}</p>
            {producto.ubicacion_nombre && (
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">{producto.ubicacion_nombre}</p>
            )}
            <svg ref={svgRef} className={ready ? '' : 'hidden'} />
            {!ready && <p className="text-[10px] text-slate-400 py-3">Generando…</p>}
        </div>
    );
}

// Modal de impresión masiva: una etiqueta por producto seleccionado, en una
// hoja lista para imprimir (reutiliza el mismo aislamiento de impresión que
// BarcodeLabelModal, vía #barcode-print-area — ver globals.css).
export function BulkBarcodeLabelsModal({ productos, onClose }) {
    const conCodigo = productos.filter(p => p.codigo_barras);
    const sinCodigo = productos.length - conCodigo.length;

    function handlePrint() {
        window.print();
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center animate-fade-in p-4 print:bg-white print:p-0" onClick={onClose}>
            <div
                className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl print:shadow-none print:rounded-none print:max-w-full print:max-h-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">Imprimir códigos de barras</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{conCodigo.length} etiqueta{conCodigo.length === 1 ? '' : 's'} lista{conCodigo.length === 1 ? '' : 's'}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                {sinCodigo > 0 && (
                    <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 print:hidden flex-shrink-0">
                        {sinCodigo} producto{sinCodigo === 1 ? '' : 's'} sin código de barras — se omitió{sinCodigo === 1 ? '' : 'ron'} de la hoja.
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 print:overflow-visible">
                    {conCodigo.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-10">Ningún producto seleccionado tiene código de barras asignado.</p>
                    ) : (
                        <div id="barcode-print-area" className="print-sheet grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {conCodigo.map(p => <BulkLabelItem key={p.id} producto={p} />)}
                        </div>
                    )}
                </div>

                {conCodigo.length > 0 && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50 print:hidden flex-shrink-0">
                        <button onClick={handlePrint} className="btn btn-primary px-4 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl">
                            <Printer size={16} /> Imprimir {conCodigo.length} etiqueta{conCodigo.length === 1 ? '' : 's'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
