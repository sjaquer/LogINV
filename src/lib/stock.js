// ═══════════════════════════════════════════════════════════════════════════
//  Reglas de stock - LogINV
//  Única fuente de verdad para decidir si un artículo está bajo mínimo.
//  Un artículo está "bajo stock" cuando tiene un mínimo definido (> 0) y su
//  stock actual queda POR DEBAJO de ese mínimo. Estar exactamente en el
//  mínimo es correcto (p. ej. 1 guitarra con mínimo 1 no requiere reposición).
// ═══════════════════════════════════════════════════════════════════════════

const num = (v) => Number(v) || 0;

/** @returns {'agotado'|'bajo'|'ok'|'sin_minimo'} */
export function getStockStatus(producto) {
    const actual = num(producto?.stock_actual);
    const minimo = num(producto?.stock_minimo);
    if (minimo <= 0) return actual <= 0 ? 'agotado' : 'sin_minimo';
    if (actual <= 0) return 'agotado';
    if (actual < minimo) return 'bajo';
    return 'ok';
}

export function isLowStock(producto) {
    const minimo = num(producto?.stock_minimo);
    return minimo > 0 && num(producto?.stock_actual) < minimo;
}
