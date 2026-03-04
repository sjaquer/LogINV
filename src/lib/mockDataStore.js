// src/lib/mockDataStore.js
// Mock data that shows immediately without Firebase configuration

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

export const MOCK_PRODUCTOS = [
    { id: 'p1', nombre: 'Leche UHT 1L', categoria: 'Desayuno', stock_actual: 4, stock_minimo_rop: 10, unidad: 'cajas', fecha_vencimiento: daysFromNow(2), ultima_actualizacion: daysAgo(1) },
    { id: 'p2', nombre: 'Mermelada de Fresa', categoria: 'Desayuno', stock_actual: 3, stock_minimo_rop: 8, unidad: 'frascos', fecha_vencimiento: daysFromNow(5), ultima_actualizacion: daysAgo(2) },
    { id: 'p3', nombre: 'Pan de Molde', categoria: 'Desayuno', stock_actual: 2, stock_minimo_rop: 5, unidad: 'bolsas', fecha_vencimiento: daysFromNow(1), ultima_actualizacion: daysAgo(0) },
    { id: 'p4', nombre: 'Jugo de Naranja 1L', categoria: 'Desayuno', stock_actual: 15, stock_minimo_rop: 10, unidad: 'litros', fecha_vencimiento: daysFromNow(6), ultima_actualizacion: daysAgo(1) },
    { id: 'p5', nombre: 'Mantequilla', categoria: 'Desayuno', stock_actual: 12, stock_minimo_rop: 6, unidad: 'kg', fecha_vencimiento: daysFromNow(14), ultima_actualizacion: daysAgo(3) },
    { id: 'p6', nombre: 'Huevos', categoria: 'Desayuno', stock_actual: 60, stock_minimo_rop: 30, unidad: 'unidades', fecha_vencimiento: daysFromNow(7), ultima_actualizacion: daysAgo(0) },
    { id: 'p7', nombre: 'Jabón Líquido', categoria: 'Limpieza', stock_actual: 5, stock_minimo_rop: 8, unidad: 'galones', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(5) },
    { id: 'p8', nombre: 'Lejía Clorox', categoria: 'Limpieza', stock_actual: 3, stock_minimo_rop: 6, unidad: 'galones', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(5) },
    { id: 'p9', nombre: 'Papel Higiénico', categoria: 'Limpieza', stock_actual: 48, stock_minimo_rop: 24, unidad: 'rollos', fecha_vencimiento: daysFromNow(730), ultima_actualizacion: daysAgo(7) },
    { id: 'p10', nombre: 'Agua San Luis 620ml', categoria: 'Frigobar', stock_actual: 8, stock_minimo_rop: 20, unidad: 'botellas', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(2) },
    { id: 'p11', nombre: 'Coca-Cola Lata', categoria: 'Frigobar', stock_actual: 12, stock_minimo_rop: 24, unidad: 'latas', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(2) },
    { id: 'p12', nombre: 'Maní Tostado', categoria: 'Frigobar', stock_actual: 2, stock_minimo_rop: 10, unidad: 'bolsas', fecha_vencimiento: daysFromNow(3), ultima_actualizacion: daysAgo(1) },
    { id: 'p13', nombre: 'Chocolate Sublime', categoria: 'Frigobar', stock_actual: 18, stock_minimo_rop: 12, unidad: 'unidades', fecha_vencimiento: daysFromNow(45), ultima_actualizacion: daysAgo(4) },
    { id: 'p14', nombre: 'Arroz Extra 1kg', categoria: 'Cocina', stock_actual: 25, stock_minimo_rop: 10, unidad: 'kg', fecha_vencimiento: daysFromNow(300), ultima_actualizacion: daysAgo(10) },
    { id: 'p15', nombre: 'Aceite de Soja 1L', categoria: 'Cocina', stock_actual: 2, stock_minimo_rop: 5, unidad: 'litros', fecha_vencimiento: daysFromNow(120), ultima_actualizacion: daysAgo(3) },
];

export const MOCK_REQUERIMIENTOS = [
    {
        id: 'r1',
        fecha_creacion: daysAgo(2),
        solicitante: 'Chef Masana',
        items: [
            { producto_nombre: 'Leche UHT 1L', cantidad: 20, justificacion: 'Stock crítico para la semana' },
            { producto_nombre: 'Pan de Molde', cantidad: 10, justificacion: 'Agotándose para desayunos' },
        ],
        estado: 'PENDIENTE',
        logs: [{ usuario: 'Chef Masana', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 2 * 86400000).toISOString() }],
    },
    {
        id: 'r2',
        fecha_creacion: daysAgo(4),
        solicitante: 'Chef Masana',
        items: [
            { producto_nombre: 'Jabón Líquido', cantidad: 4, justificacion: 'Para limpieza de habitaciones' },
            { producto_nombre: 'Lejía Clorox', cantidad: 6, justificacion: 'Stock bajo semana anterior' },
        ],
        estado: 'APROBADO_ADMIN',
        logs: [
            { usuario: 'Chef Masana', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 4 * 86400000).toISOString() },
            { usuario: 'Admin López', accion: 'Aprobó como Admin', fecha: new Date(Date.now() - 3 * 86400000).toISOString() },
        ],
    },
    {
        id: 'r3',
        fecha_creacion: daysAgo(7),
        solicitante: 'Chef Masana',
        items: [
            { producto_nombre: 'Agua San Luis 620ml', cantidad: 48, justificacion: 'Frigobar de habitaciones' },
            { producto_nombre: 'Coca-Cola Lata', cantidad: 24, justificacion: 'Reposición semanal frigobar' },
        ],
        estado: 'COMPRADO',
        logs: [
            { usuario: 'Chef Masana', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 7 * 86400000).toISOString() },
            { usuario: 'Admin López', accion: 'Aprobó como Admin', fecha: new Date(Date.now() - 6 * 86400000).toISOString() },
            { usuario: 'Gerente Ramírez', accion: 'Validó como Gerencia', fecha: new Date(Date.now() - 5 * 86400000).toISOString() },
            { usuario: 'Sebastián (Logística)', accion: 'Marcó como Comprado', fecha: new Date(Date.now() - 4 * 86400000).toISOString() },
        ],
    },
];

export const MOCK_MOVIMIENTOS = [
    { id: 'm1', producto_id: 'p3', nombre_producto: 'Pan de Molde', tipo: 'MERMA', cantidad: 3, usuario: 'Sebastián', fecha: daysAgo(1), motivo_merma: 'Producto vencido, no apto para consumo' },
    { id: 'm2', producto_id: 'p1', nombre_producto: 'Leche UHT 1L', tipo: 'MERMA', cantidad: 2, usuario: 'Chef Masana', fecha: daysAgo(2), motivo_merma: 'Derrame en almacén' },
    { id: 'm3', producto_id: 'p12', nombre_producto: 'Maní Tostado', tipo: 'MERMA', cantidad: 5, usuario: 'Sebastián', fecha: daysAgo(3), motivo_merma: 'Vencimiento detectado en inventario' },
    { id: 'm4', producto_id: 'p4', nombre_producto: 'Jugo de Naranja 1L', tipo: 'INGRESO', cantidad: 20, usuario: 'Sebastián', fecha: daysAgo(5), motivo_merma: null },
    { id: 'm5', producto_id: 'p14', nombre_producto: 'Arroz Extra 1kg', tipo: 'INGRESO', cantidad: 25, usuario: 'Sebastián', fecha: daysAgo(6), motivo_merma: null },
    { id: 'm6', producto_id: 'p6', nombre_producto: 'Huevos', tipo: 'SALIDA', cantidad: 12, usuario: 'Chef Masana', fecha: daysAgo(1), motivo_merma: null },
    { id: 'm7', producto_id: 'p5', nombre_producto: 'Mantequilla', tipo: 'MERMA', cantidad: 1, usuario: 'Chef Masana', fecha: daysAgo(4), motivo_merma: 'Contaminación cruzada detectada' },
    { id: 'm8', producto_id: 'p2', nombre_producto: 'Mermelada de Fresa', tipo: 'SALIDA', cantidad: 4, usuario: 'Sebastián', fecha: daysAgo(0), motivo_merma: null },
    { id: 'm9', producto_id: 'p7', nombre_producto: 'Jabón Líquido', tipo: 'INGRESO', cantidad: 8, usuario: 'Sebastián', fecha: daysAgo(8), motivo_merma: null },
    { id: 'm10', producto_id: 'p13', nombre_producto: 'Chocolate Sublime', tipo: 'SALIDA', cantidad: 6, usuario: 'Chef Masana', fecha: daysAgo(2), motivo_merma: null },
];
