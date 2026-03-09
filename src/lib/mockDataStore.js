// src/lib/mockDataStore.js
// Mock data – Control de Inventario para Bar / Restaurante

function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return { toDate: () => d, seconds: d.getTime() / 1000 };
}

function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return { toDate: () => d, seconds: d.getTime() / 1000 };
}

// ─── CATEGORÍAS ──
export const MOCK_CATEGORIAS = [
    { id: 'cat1', nombre: 'Licores', descripcion: 'Bebidas alcohólicas destiladas y licores', color: '#8b5cf6', icono: '🥃', orden: 1, activa: true, fecha_creacion: daysAgo(90) },
    { id: 'cat2', nombre: 'Cervezas', descripcion: 'Cervezas nacionales e importadas', color: '#f59e0b', icono: '🍺', orden: 2, activa: true, fecha_creacion: daysAgo(90) },
    { id: 'cat3', nombre: 'Vinos', descripcion: 'Vinos tintos, blancos y espumantes', color: '#ef4444', icono: '🍷', orden: 3, activa: true, fecha_creacion: daysAgo(90) },
    { id: 'cat4', nombre: 'Bebidas sin alcohol', descripcion: 'Gaseosas, jugos, agua y energizantes', color: '#10b981', icono: '🥤', orden: 4, activa: true, fecha_creacion: daysAgo(90) },
    { id: 'cat5', nombre: 'Insumos Bar', descripcion: 'Garnish, syrups, hielo y complementos', color: '#3b82f6', icono: '🍋', orden: 5, activa: true, fecha_creacion: daysAgo(90) },
    { id: 'cat6', nombre: 'Snacks', descripcion: 'Bocaditos, frutos secos y acompañamientos', color: '#f97316', icono: '🥜', orden: 6, activa: true, fecha_creacion: daysAgo(90) },
];

// ─── PRODUCTOS ──
export const MOCK_PRODUCTOS = [
    // Licores
    { id: 'p1', nombre: 'Vodka Absolut 750ml', categoria: 'Licores', stock_actual: 8, stock_minimo_rop: 5, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(1), lote: 'VOD-2026-01', codigo_barras: '7750182000123' },
    { id: 'p2', nombre: 'Ron Havana Club 750ml', categoria: 'Licores', stock_actual: 3, stock_minimo_rop: 4, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(0), lote: 'RON-2026-02', codigo_barras: '7750182000456' },
    { id: 'p3', nombre: 'Whisky Johnnie Walker Black', categoria: 'Licores', stock_actual: 5, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(2), lote: 'WHI-2026-01', codigo_barras: '5000267024004' },
    { id: 'p4', nombre: 'Tequila José Cuervo 750ml', categoria: 'Licores', stock_actual: 2, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(1), lote: 'TEQ-2026-01', codigo_barras: '7501035010109' },
    { id: 'p5', nombre: 'Pisco Quebranta 750ml', categoria: 'Licores', stock_actual: 6, stock_minimo_rop: 4, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(0), lote: 'PIS-2026-01', codigo_barras: '7750106000789' },

    // Cervezas
    { id: 'p6', nombre: 'Cerveza Cusqueña Dorada 330ml', categoria: 'Cervezas', stock_actual: 48, stock_minimo_rop: 24, unidad: 'unidades', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(1), lote: 'CER-2026-10', codigo_barras: '7750182001001' },
    { id: 'p7', nombre: 'Cerveza Corona Extra 355ml', categoria: 'Cervezas', stock_actual: 12, stock_minimo_rop: 24, unidad: 'unidades', fecha_vencimiento: daysFromNow(60), ultima_actualizacion: daysAgo(0), lote: 'CER-2026-11', codigo_barras: '7501064100017' },
    { id: 'p8', nombre: 'Cerveza Pilsen Callao 620ml', categoria: 'Cervezas', stock_actual: 30, stock_minimo_rop: 20, unidad: 'unidades', fecha_vencimiento: daysFromNow(75), ultima_actualizacion: daysAgo(2), lote: 'CER-2026-12', codigo_barras: '7750182002002' },

    // Vinos
    { id: 'p9', nombre: 'Vino Tinto Casillero del Diablo', categoria: 'Vinos', stock_actual: 4, stock_minimo_rop: 6, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(3), lote: 'VIN-2026-01', codigo_barras: '7804320063001' },
    { id: 'p10', nombre: 'Vino Blanco Concha y Toro', categoria: 'Vinos', stock_actual: 3, stock_minimo_rop: 4, unidad: 'botellas', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(1), lote: 'VIN-2026-02', codigo_barras: '7804320087543' },
    { id: 'p11', nombre: 'Espumante Chandon Brut', categoria: 'Vinos', stock_actual: 2, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(5), ultima_actualizacion: daysAgo(0), lote: 'ESP-2026-01', codigo_barras: '7790975000015' },

    // Bebidas sin alcohol
    { id: 'p12', nombre: 'Coca-Cola 500ml', categoria: 'Bebidas sin alcohol', stock_actual: 36, stock_minimo_rop: 24, unidad: 'unidades', fecha_vencimiento: daysFromNow(120), ultima_actualizacion: daysAgo(1), lote: 'BEB-2026-01', codigo_barras: '7750183000100' },
    { id: 'p13', nombre: 'Agua San Mateo 600ml', categoria: 'Bebidas sin alcohol', stock_actual: 24, stock_minimo_rop: 30, unidad: 'unidades', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(2), lote: 'BEB-2026-02', codigo_barras: '7750105000200' },
    { id: 'p14', nombre: 'Red Bull 250ml', categoria: 'Bebidas sin alcohol', stock_actual: 6, stock_minimo_rop: 12, unidad: 'unidades', fecha_vencimiento: daysFromNow(3), ultima_actualizacion: daysAgo(0), lote: 'BEB-2026-03', codigo_barras: '9002490100070' },
    { id: 'p15', nombre: 'Tónica Schweppes 350ml', categoria: 'Bebidas sin alcohol', stock_actual: 18, stock_minimo_rop: 12, unidad: 'unidades', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(1), lote: 'BEB-2026-04', codigo_barras: '7750183000300' },

    // Insumos Bar
    { id: 'p16', nombre: 'Limones Frescos', categoria: 'Insumos Bar', stock_actual: 30, stock_minimo_rop: 20, unidad: 'unidades', fecha_vencimiento: daysFromNow(7), ultima_actualizacion: daysAgo(0), lote: 'INS-2026-01', codigo_barras: null },
    { id: 'p17', nombre: 'Jarabe de Goma 750ml', categoria: 'Insumos Bar', stock_actual: 2, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(1), lote: 'INS-2026-02', codigo_barras: '7750190000555' },
    { id: 'p18', nombre: 'Hielo en Bolsa 3kg', categoria: 'Insumos Bar', stock_actual: 5, stock_minimo_rop: 8, unidad: 'bolsas', fecha_vencimiento: daysFromNow(2), ultima_actualizacion: daysAgo(0), lote: 'INS-2026-03', codigo_barras: null },

    // Snacks
    { id: 'p19', nombre: 'Maní Salado 200g', categoria: 'Snacks', stock_actual: 15, stock_minimo_rop: 10, unidad: 'bolsas', fecha_vencimiento: daysFromNow(60), ultima_actualizacion: daysAgo(3), lote: 'SNK-2026-01', codigo_barras: '7750182005001' },
    { id: 'p20', nombre: 'Papas Lays Clásicas 150g', categoria: 'Snacks', stock_actual: 10, stock_minimo_rop: 12, unidad: 'bolsas', fecha_vencimiento: daysFromNow(45), ultima_actualizacion: daysAgo(1), lote: 'SNK-2026-02', codigo_barras: '7622210146571' },
];

// ─── CONTEOS DIARIOS ──
export const MOCK_CONTEOS = [
    {
        id: 'cnt1',
        fecha: daysAgo(0),
        usuario: 'Bartender García',
        estado: 'EN_PROGRESO',
        items: [
            { producto_id: 'p1', producto_nombre: 'Vodka Absolut 750ml', conteo_fisico: 8, stock_sistema: 8, diferencia: 0 },
            { producto_id: 'p2', producto_nombre: 'Ron Havana Club 750ml', conteo_fisico: 3, stock_sistema: 3, diferencia: 0 },
            { producto_id: 'p6', producto_nombre: 'Cerveza Cusqueña Dorada 330ml', conteo_fisico: 46, stock_sistema: 48, diferencia: -2 },
        ],
        notas: 'Conteo de apertura del turno mañana',
        fecha_cierre: null,
    },
    {
        id: 'cnt2',
        fecha: daysAgo(1),
        usuario: 'Bartender López',
        estado: 'COMPLETADO',
        items: [
            { producto_id: 'p1', producto_nombre: 'Vodka Absolut 750ml', conteo_fisico: 9, stock_sistema: 9, diferencia: 0 },
            { producto_id: 'p7', producto_nombre: 'Cerveza Corona Extra 355ml', conteo_fisico: 22, stock_sistema: 24, diferencia: -2 },
            { producto_id: 'p12', producto_nombre: 'Coca-Cola 500ml', conteo_fisico: 35, stock_sistema: 36, diferencia: -1 },
            { producto_id: 'p14', producto_nombre: 'Red Bull 250ml', conteo_fisico: 8, stock_sistema: 8, diferencia: 0 },
        ],
        notas: 'Conteo de cierre nocturno',
        fecha_cierre: daysAgo(1),
    },
];

// ─── MOVIMIENTOS ──
export const MOCK_MOVIMIENTOS = [
    { id: 'm1', producto_id: 'p7', nombre_producto: 'Cerveza Corona Extra 355ml', tipo: 'CONTEO', cantidad: -2, usuario: 'Bartender López', fecha: daysAgo(1), motivo_merma: 'Diferencia detectada en conteo diario' },
    { id: 'm2', producto_id: 'p12', nombre_producto: 'Coca-Cola 500ml', tipo: 'CONTEO', cantidad: -1, usuario: 'Bartender López', fecha: daysAgo(1), motivo_merma: 'Ajuste por conteo diario' },
    { id: 'm3', producto_id: 'p6', nombre_producto: 'Cerveza Cusqueña Dorada 330ml', tipo: 'INGRESO', cantidad: 24, usuario: 'Admin Paredes', fecha: daysAgo(2), motivo_merma: null },
    { id: 'm4', producto_id: 'p1', nombre_producto: 'Vodka Absolut 750ml', tipo: 'INGRESO', cantidad: 6, usuario: 'Admin Paredes', fecha: daysAgo(3), motivo_merma: null },
    { id: 'm5', producto_id: 'p14', nombre_producto: 'Red Bull 250ml', tipo: 'INGRESO', cantidad: 12, usuario: 'Admin Paredes', fecha: daysAgo(4), motivo_merma: null },
    { id: 'm6', producto_id: 'p11', nombre_producto: 'Espumante Chandon Brut', tipo: 'CONTEO', cantidad: -1, usuario: 'Bartender García', fecha: daysAgo(3), motivo_merma: 'Botella no registrada como vendida' },
];

// Mantener compatibilidad con imports existentes
export const MOCK_REQUERIMIENTOS = [];

