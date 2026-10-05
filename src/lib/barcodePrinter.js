'use client';

/**
 * Genera el SVG como string HTML para un código de barras CODE128
 */
export async function generateBarcodeSvgString(code, options = {}) {
    if (!code) return '';
    try {
        const JsBarcode = (await import('jsbarcode')).default;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svg, String(code), {
            format: 'CODE128',
            width: options.width || 1.6,
            height: options.height || 42,
            displayValue: options.displayValue !== false,
            fontSize: options.fontSize || 11,
            margin: options.margin ?? 3,
            textMargin: options.textMargin ?? 2,
        });
        return svg.outerHTML;
    } catch (err) {
        console.warn('[barcodePrinter] Error generating barcode SVG:', err);
        return '';
    }
}

/**
 * Imprime una sola etiqueta en una sola hoja limpia sin páginas vacías ni repeticiones
 */
export async function printSingleBarcode(producto) {
    if (!producto?.codigo_barras) return;
    const svgHtml = await generateBarcodeSvgString(producto.codigo_barras, {
        width: 2.0,
        height: 60,
        fontSize: 13,
        margin: 6,
    });

    const html = `
        <div class="single-sheet">
            <div class="single-label-card">
                <div class="label-name">${escapeHtml(producto.nombre || 'Producto')}</div>
                ${producto.ubicacion_nombre || producto.ubicacion ? `
                    <div class="label-location">${escapeHtml(producto.ubicacion_nombre || producto.ubicacion)}</div>
                ` : ''}
                <div class="label-svg-wrap">
                    ${svgHtml}
                </div>
            </div>
        </div>
    `;

    executeIframePrint(html, `Etiqueta_${producto.codigo_barras}`);
}

/**
 * Imprime múltiples etiquetas organizadas en cuadrícula compacta (3 columnas) en la misma hoja
 */
export async function printBarcodeSheet(productos, copies = 1) {
    const validProducts = productos.filter(p => p.codigo_barras);
    if (validProducts.length === 0) return;

    const labelsHtmlArray = [];
    for (const prod of validProducts) {
        const svgHtml = await generateBarcodeSvgString(prod.codigo_barras, {
            width: 1.5,
            height: 38,
            fontSize: 10.5,
            margin: 2,
        });

        const singleItemHtml = `
            <div class="label-card">
                <div class="label-name">${escapeHtml(prod.nombre || 'Producto')}</div>
                ${prod.ubicacion_nombre || prod.ubicacion ? `
                    <div class="label-location">${escapeHtml(prod.ubicacion_nombre || prod.ubicacion)}</div>
                ` : ''}
                <div class="label-svg-wrap">
                    ${svgHtml}
                </div>
            </div>
        `;

        for (let i = 0; i < copies; i++) {
            labelsHtmlArray.push(singleItemHtml);
        }
    }

    const html = `
        <div class="sheet-grid">
            ${labelsHtmlArray.join('')}
        </div>
    `;

    executeIframePrint(html, `Etiquetas_Inventario_${labelsHtmlArray.length}`);
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function executeIframePrint(contentHtml, documentTitle = 'Etiquetas - LogINV') {
    // Si ya existe un iframe anterior, eliminarlo
    if (typeof document === 'undefined') return;
    const oldIframe = document.getElementById('loginv-print-iframe');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'loginv-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${documentTitle}</title>
            <style>
                @page {
                    size: letter portrait;
                    margin: 8mm 6mm;
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background: #ffffff;
                    color: #000000;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .sheet-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 3.5mm 3mm;
                    width: 100%;
                }
                .label-card {
                    border: 1px dashed #94a3b8;
                    border-radius: 6px;
                    padding: 6px 4px 4px 4px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    min-height: 36mm;
                    max-height: 42mm;
                    overflow: hidden;
                    background: #ffffff;
                }
                .label-name {
                    font-size: 10.5px;
                    font-weight: 700;
                    line-height: 1.15;
                    max-height: 2.3em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    margin-bottom: 2px;
                    color: #0f172a;
                }
                .label-location {
                    font-size: 8.5px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                    margin-bottom: 2px;
                }
                .label-svg-wrap {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .label-svg-wrap svg {
                    max-width: 95%;
                    height: auto !important;
                    max-height: 22mm;
                    display: block;
                }

                /* Single label mode */
                .single-sheet {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 85vh;
                    width: 100%;
                }
                .single-label-card {
                    border: 1.5px solid #0f172a;
                    border-radius: 12px;
                    padding: 24px 28px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    max-width: 320px;
                    margin: auto;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .single-label-card .label-name {
                    font-size: 15px;
                    font-weight: 800;
                    line-height: 1.25;
                    margin-bottom: 4px;
                    max-height: none;
                    color: #0f172a;
                }
                .single-label-card .label-location {
                    font-size: 11px;
                    font-weight: 700;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                    margin-bottom: 10px;
                }
                .single-label-card .label-svg-wrap svg {
                    max-width: 100%;
                    height: auto !important;
                }
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
            iframe.remove();
        }, 3000);
    }, 400);
}
