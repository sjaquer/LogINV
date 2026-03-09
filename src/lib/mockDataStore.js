// src/lib/mockDataStore.js
// Mock data – Control de Inventario para Bar / Restaurante – Multi-ubicación

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

// ─── PRODUCTOS (con ubicación) ──
export const MOCK_PRODUCTOS = [
    // ─── BAR 1 ───
    { id: 'p1', nombre: 'Vodka Absolut 750ml', categoria: 'Licores', ubicacion: 'BAR_1', stock_actual: 8, stock_minimo_rop: 5, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(1), lote: 'VOD-2026-01', codigo_barras: '7750182000123' },
    { id: 'p2', nombre: 'Ron Havana Club 750ml', categoria: 'Licores', ubicacion: 'BAR_1', stock_actual: 3, stock_minimo_rop: 4, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(0), lote: 'RON-2026-02', codigo_barras: '7750182000456' },
    { id: 'p3', nombre: 'Whisky Johnnie Walker Black', categoria: 'Licores', ubicacion: 'BAR_1', stock_actual: 5, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(2), lote: 'WHI-2026-01', codigo_barras: '5000267024004' },
    { id: 'p4', nombre: 'Cerveza Cusqueña Dorada 330ml', categoria: 'Cervezas', ubicacion: 'BAR_1', stock_actual: 48, stock_minimo_rop: 24, unidad: 'unidades', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(1), lote: 'CER-2026-10', codigo_barras: '7750182001001' },
    { id: 'p5', nombre: 'Cerveza Corona Extra 355ml', categoria: 'Cervezas', ubicacion: 'BAR_1', stock_actual: 12, stock_minimo_rop: 24, unidad: 'unidades', fecha_vencimiento: daysFromNow(60), ultima_actualizacion: daysAgo(0), lote: 'CER-2026-11', codigo_barras: '7501064100017' },
    { id: 'p6', nombre: 'Vino Tinto Casillero del Diablo', categoria: 'Vinos', ubicacion: 'BAR_1', stock_actual: 4, stock_minimo_rop: 6, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(3), lote: 'VIN-2026-01', codigo_barras: '7804320063001' },
    { id: 'p7', nombre: 'Coca-Cola 500ml', categoria: 'Bebidas sin alcohol', ubicacion: 'BAR_1', stock_actual: 36, stock_minimo_rop: 24, unidad: 'unidades', fecha_vencimiento: daysFromNow(120), ultima_actualizacion: daysAgo(1), lote: 'BEB-2026-01', codigo_barras: '7750183000100' },
    { id: 'p8', nombre: 'Red Bull 250ml', categoria: 'Bebidas sin alcohol', ubicacion: 'BAR_1', stock_actual: 6, stock_minimo_rop: 12, unidad: 'unidades', fecha_vencimiento: daysFromNow(3), ultima_actualizacion: daysAgo(0), lote: 'BEB-2026-03', codigo_barras: '9002490100070' },
    { id: 'p9', nombre: 'Limones Frescos', categoria: 'Insumos Bar', ubicacion: 'BAR_1', stock_actual: 30, stock_minimo_rop: 20, unidad: 'unidades', fecha_vencimiento: daysFromNow(7), ultima_actualizacion: daysAgo(0), lote: 'INS-2026-01', codigo_barras: null },
    { id: 'p10', nombre: 'Maní Salado 200g', categoria: 'Snacks', ubicacion: 'BAR_1', stock_actual: 15, stock_minimo_rop: 10, unidad: 'bolsas', fecha_vencimiento: daysFromNow(60), ultima_actualizacion: daysAgo(3), lote: 'SNK-2026-01', codigo_barras: '7750182005001' },

    // ─── BAR 2 ───
    { id: 'p11', nombre: 'Vodka Absolut 750ml', categoria: 'Licores', ubicacion: 'BAR_2', stock_actual: 5, stock_minimo_rop: 5, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(1), lote: 'VOD-2026-02', codigo_barras: '7750182000123' },
    { id: 'p12', nombre: 'Tequila José Cuervo 750ml', categoria: 'Licores', ubicacion: 'BAR_2', stock_actual: 2, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(1), lote: 'TEQ-2026-01', codigo_barras: '7501035010109' },
    { id: 'p13', nombre: 'Pisco Quebranta 750ml', categoria: 'Licores', ubicacion: 'BAR_2', stock_actual: 6, stock_minimo_rop: 4, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(0), lote: 'PIS-2026-01', codigo_barras: '7750106000789' },
    { id: 'p14', nombre: 'Cerveza Pilsen Callao 620ml', categoria: 'Cervezas', ubicacion: 'BAR_2', stock_actual: 30, stock_minimo_rop: 20, unidad: 'unidades', fecha_vencimiento: daysFromNow(75), ultima_actualizacion: daysAgo(2), lote: 'CER-2026-12', codigo_barras: '7750182002002' },
    { id: 'p15', nombre: 'Vino Blanco Concha y Toro', categoria: 'Vinos', ubicacion: 'BAR_2', stock_actual: 3, stock_minimo_rop: 4, unidad: 'botellas', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(1), lote: 'VIN-2026-02', codigo_barras: '7804320087543' },
    { id: 'p16', nombre: 'Espumante Chandon Brut', categoria: 'Vinos', ubicacion: 'BAR_2', stock_actual: 2, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(5), ultima_actualizacion: daysAgo(0), lote: 'ESP-2026-01', codigo_barras: '7790975000015' },
    { id: 'p17', nombre: 'Tónica Schweppes 350ml', categoria: 'Bebidas sin alcohol', ubicacion: 'BAR_2', stock_actual: 18, stock_minimo_rop: 12, unidad: 'unidades', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(1), lote: 'BEB-2026-04', codigo_barras: '7750183000300' },
    { id: 'p18', nombre: 'Jarabe de Goma 750ml', categoria: 'Insumos Bar', ubicacion: 'BAR_2', stock_actual: 2, stock_minimo_rop: 3, unidad: 'botellas', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(1), lote: 'INS-2026-02', codigo_barras: '7750190000555' },
    { id: 'p19', nombre: 'Papas Lays Clásicas 150g', categoria: 'Snacks', ubicacion: 'BAR_2', stock_actual: 10, stock_minimo_rop: 12, unidad: 'bolsas', fecha_vencimiento: daysFromNow(45), ultima_actualizacion: daysAgo(1), lote: 'SNK-2026-02', codigo_barras: '7622210146571' },

    // ─── ALMACÉN ───
    { id: 'p20', nombre: 'Vodka Absolut 750ml', categoria: 'Licores', ubicacion: 'ALMACEN', stock_actual: 24, stock_minimo_rop: 10, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(0), lote: 'VOD-2026-ALM', codigo_barras: '7750182000123' },
    { id: 'p21', nombre: 'Ron Havana Club 750ml', categoria: 'Licores', ubicacion: 'ALMACEN', stock_actual: 18, stock_minimo_rop: 8, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(0), lote: 'RON-2026-ALM', codigo_barras: '7750182000456' },
    { id: 'p22', nombre: 'Whisky Johnnie Walker Black', categoria: 'Licores', ubicacion: 'ALMACEN', stock_actual: 12, stock_minimo_rop: 6, unidad: 'botellas', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(0), lote: 'WHI-2026-ALM', codigo_barras: '5000267024004' },
    { id: 'p23', nombre: 'Cerveza Cusqueña Dorada 330ml', categoria: 'Cervezas', ubicacion: 'ALMACEN', stock_actual: 120, stock_minimo_rop: 48, unidad: 'unidades', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(0), lote: 'CER-2026-ALM', codigo_barras: '7750182001001' },
    { id: 'p24', nombre: 'Cerveza Corona Extra 355ml', categoria: 'Cervezas', ubicacion: 'ALMACEN', stock_actual: 72, stock_minimo_rop: 48, unidad: 'unidades', fecha_vencimiento: daysFromNow(60), ultima_actualizacion: daysAgo(0), lote: 'CER-2026-ALM2', codigo_barras: '7501064100017' },
    { id: 'p25', nombre: 'Coca-Cola 500ml', categoria: 'Bebidas sin alcohol', ubicacion: 'ALMACEN', stock_actual: 96, stock_minimo_rop: 48, unidad: 'unidades', fecha_vencimiento: daysFromNow(120), ultima_actualizacion: daysAgo(0), lote: 'BEB-2026-ALM', codigo_barras: '7750183000100' },
    { id: 'p26', nombre: 'Red Bull 250ml', categoria: 'Bebidas sin alcohol', ubicacion: 'ALMACEN', stock_actual: 48, stock_minimo_rop: 24, unidad: 'unidades', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(0), lote: 'BEB-2026-ALM2', codigo_barras: '9002490100070' },
    { id: 'p27', nombre: 'Hielo en Bolsa 3kg', categoria: 'Insumos Bar', ubicacion: 'ALMACEN', stock_actual: 20, stock_minimo_rop: 10, unidad: 'bolsas', fecha_vencimiento: daysFromNow(2), ultima_actualizacion: daysAgo(0), lote: 'INS-2026-ALM', codigo_barras: null },
    { id: 'p28', nombre: 'Agua San Mateo 600ml', categoria: 'Bebidas sin alcohol', ubicacion: 'ALMACEN', stock_actual: 60, stock_minimo_rop: 30, unidad: 'unidades', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(2), lote: 'BEB-2026-ALM3', codigo_barras: '7750105000200' },
];

// ─── CONTEOS DIARIOS ──
export const MOCK_CONTEOS = [
    {
        id: 'cnt1',
        fecha: daysAgo(0),
        usuario: 'Carlos Paredes',
        ubicacion: 'BAR_1',
        estado: 'EN_PROGRESO',
        items: [
            { producto_id: 'p1', producto_nombre: 'Vodka Absolut 750ml', conteo_fisico: 8, stock_sistema: 8, diferencia: 0 },
            { producto_id: 'p2', producto_nombre: 'Ron Havana Club 750ml', conteo_fisico: 3, stock_sistema: 3, diferencia: 0 },
            { producto_id: 'p4', producto_nombre: 'Cerveza Cusqueña Dorada 330ml', conteo_fisico: 46, stock_sistema: 48, diferencia: -2 },
        ],
        notas: 'Conteo de apertura del turno mañana',
        fecha_cierre: null,
    },
    {
        id: 'cnt2',
        fecha: daysAgo(1),
        usuario: 'Miguel Rodríguez',
        ubicacion: 'BAR_2',
        estado: 'COMPLETADO',
        items: [
            { producto_id: 'p11', producto_nombre: 'Vodka Absolut 750ml', conteo_fisico: 5, stock_sistema: 5, diferencia: 0 },
            { producto_id: 'p14', producto_nombre: 'Cerveza Pilsen Callao 620ml', conteo_fisico: 28, stock_sistema: 30, diferencia: -2 },
            { producto_id: 'p17', producto_nombre: 'Tónica Schweppes 350ml', conteo_fisico: 17, stock_sistema: 18, diferencia: -1 },
        ],
        notas: 'Conteo de cierre nocturno',
        fecha_cierre: daysAgo(1),
    },
];

// ─── MOVIMIENTOS ──
export const MOCK_MOVIMIENTOS = [
    { id: 'm1', producto_id: 'p14', nombre_producto: 'Cerveza Pilsen Callao 620ml', tipo: 'CONTEO', cantidad: -2, usuario: 'Miguel Rodríguez', ubicacion: 'BAR_2', fecha: daysAgo(1), motivo_merma: 'Diferencia detectada en conteo diario' },
    { id: 'm2', producto_id: 'p17', nombre_producto: 'Tónica Schweppes 350ml', tipo: 'CONTEO', cantidad: -1, usuario: 'Miguel Rodríguez', ubicacion: 'BAR_2', fecha: daysAgo(1), motivo_merma: 'Ajuste por conteo diario' },
    { id: 'm3', producto_id: 'p4', nombre_producto: 'Cerveza Cusqueña Dorada 330ml', tipo: 'INGRESO', cantidad: 24, usuario: 'Carlos Paredes', ubicacion: 'BAR_1', fecha: daysAgo(2), motivo_merma: null },
    { id: 'm4', producto_id: 'p1', nombre_producto: 'Vodka Absolut 750ml', tipo: 'INGRESO', cantidad: 6, usuario: 'Carlos Paredes', ubicacion: 'BAR_1', fecha: daysAgo(3), motivo_merma: null },
    { id: 'm5', producto_id: 'p26', nombre_producto: 'Red Bull 250ml', tipo: 'INGRESO', cantidad: 48, usuario: 'Ana Quispe', ubicacion: 'ALMACEN', fecha: daysAgo(4), motivo_merma: null },
    { id: 'm6', producto_id: 'p16', nombre_producto: 'Espumante Chandon Brut', tipo: 'CONTEO', cantidad: -1, usuario: 'Miguel Rodríguez', ubicacion: 'BAR_2', fecha: daysAgo(3), motivo_merma: 'Botella no registrada como vendida' },
];

// Mantener compatibilidad con imports existentes
export const MOCK_REQUERIMIENTOS = [];

