// src/lib/mockDataStore.js
// Mock data – Empresa Agroindustrial Alimentaria Veterinaria (Molino de Alimento Balanceado)

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

// ─── PRODUCTOS: Sacos de alimento balanceado, insumos de molino, materias primas ──
export const MOCK_PRODUCTOS = [
    // Alimento Aves
    { id: 'p1', nombre: 'Saco Alimento Pollo Engorde x40kg', categoria: 'Aves', stock_actual: 18, stock_minimo_rop: 50, unidad: 'sacos', fecha_vencimiento: daysFromNow(45), ultima_actualizacion: daysAgo(1), lote: 'L-2026-0301', peso_unitario: 40 },
    { id: 'p2', nombre: 'Saco Alimento Pollo Inicio x40kg', categoria: 'Aves', stock_actual: 12, stock_minimo_rop: 30, unidad: 'sacos', fecha_vencimiento: daysFromNow(30), ultima_actualizacion: daysAgo(0), lote: 'L-2026-0289', peso_unitario: 40 },
    { id: 'p3', nombre: 'Saco Alimento Gallina Ponedora x40kg', categoria: 'Aves', stock_actual: 35, stock_minimo_rop: 25, unidad: 'sacos', fecha_vencimiento: daysFromNow(60), ultima_actualizacion: daysAgo(2), lote: 'L-2026-0295', peso_unitario: 40 },
    { id: 'p4', nombre: 'Premezcla Vitamínica Aves x25kg', categoria: 'Aves', stock_actual: 5, stock_minimo_rop: 10, unidad: 'sacos', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(3), lote: 'L-2026-0210', peso_unitario: 25 },

    // Alimento Ganado
    { id: 'p5', nombre: 'Saco Alimento Ganado Lechero x50kg', categoria: 'Ganado', stock_actual: 40, stock_minimo_rop: 30, unidad: 'sacos', fecha_vencimiento: daysFromNow(75), ultima_actualizacion: daysAgo(1), lote: 'L-2026-0315', peso_unitario: 50 },
    { id: 'p6', nombre: 'Saco Alimento Ganado Engorde x50kg', categoria: 'Ganado', stock_actual: 8, stock_minimo_rop: 25, unidad: 'sacos', fecha_vencimiento: daysFromNow(55), ultima_actualizacion: daysAgo(0), lote: 'L-2026-0310', peso_unitario: 50 },
    { id: 'p7', nombre: 'Saco Sales Minerales Ganado x25kg', categoria: 'Ganado', stock_actual: 15, stock_minimo_rop: 20, unidad: 'sacos', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(5), lote: 'L-2026-0280', peso_unitario: 25 },
    { id: 'p8', nombre: 'Bloque Sal Mineralizado 10kg', categoria: 'Ganado', stock_actual: 22, stock_minimo_rop: 15, unidad: 'bloques', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(7), lote: 'L-2026-0250', peso_unitario: 10 },

    // Alimento Porcinos
    { id: 'p9', nombre: 'Saco Alimento Cerdo Crecimiento x40kg', categoria: 'Porcinos', stock_actual: 6, stock_minimo_rop: 20, unidad: 'sacos', fecha_vencimiento: daysFromNow(35), ultima_actualizacion: daysAgo(2), lote: 'L-2026-0298', peso_unitario: 40 },
    { id: 'p10', nombre: 'Saco Alimento Cerdo Engorde x40kg', categoria: 'Porcinos', stock_actual: 10, stock_minimo_rop: 20, unidad: 'sacos', fecha_vencimiento: daysFromNow(40), ultima_actualizacion: daysAgo(1), lote: 'L-2026-0302', peso_unitario: 40 },
    { id: 'p11', nombre: 'Saco Alimento Cerda Gestante x40kg', categoria: 'Porcinos', stock_actual: 3, stock_minimo_rop: 10, unidad: 'sacos', fecha_vencimiento: daysFromNow(5), ultima_actualizacion: daysAgo(0), lote: 'L-2026-0265', peso_unitario: 40 },

    // Materias Primas
    { id: 'p12', nombre: 'Maíz Amarillo Molido x50kg', categoria: 'Materia Prima', stock_actual: 120, stock_minimo_rop: 80, unidad: 'sacos', fecha_vencimiento: daysFromNow(120), ultima_actualizacion: daysAgo(3), lote: 'L-2026-0320', peso_unitario: 50 },
    { id: 'p13', nombre: 'Torta de Soya x50kg', categoria: 'Materia Prima', stock_actual: 25, stock_minimo_rop: 40, unidad: 'sacos', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: daysAgo(2), lote: 'L-2026-0308', peso_unitario: 50 },
    { id: 'p14', nombre: 'Harina de Pescado x25kg', categoria: 'Materia Prima', stock_actual: 10, stock_minimo_rop: 15, unidad: 'sacos', fecha_vencimiento: daysFromNow(3), ultima_actualizacion: daysAgo(1), lote: 'L-2026-0275', peso_unitario: 25 },
    { id: 'p15', nombre: 'Afrecho de Trigo x40kg', categoria: 'Materia Prima', stock_actual: 55, stock_minimo_rop: 30, unidad: 'sacos', fecha_vencimiento: daysFromNow(150), ultima_actualizacion: daysAgo(4), lote: 'L-2026-0312', peso_unitario: 40 },
    { id: 'p16', nombre: 'Carbonato de Calcio x25kg', categoria: 'Materia Prima', stock_actual: 30, stock_minimo_rop: 20, unidad: 'sacos', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: daysAgo(10), lote: 'L-2026-0240', peso_unitario: 25 },

    // Insumos Veterinarios
    { id: 'p17', nombre: 'Antibiótico Oxitetraciclina x1kg', categoria: 'Veterinario', stock_actual: 4, stock_minimo_rop: 8, unidad: 'frascos', fecha_vencimiento: daysFromNow(7), ultima_actualizacion: daysAgo(1), lote: 'L-2026-0188', peso_unitario: 1 },
    { id: 'p18', nombre: 'Desparasitante Bovino Ivermectina', categoria: 'Veterinario', stock_actual: 6, stock_minimo_rop: 10, unidad: 'frascos', fecha_vencimiento: daysFromNow(60), ultima_actualizacion: daysAgo(3), lote: 'L-2026-0200', peso_unitario: 0.5 },
    { id: 'p19', nombre: 'Vacuna Newcastle Aviar x500 dosis', categoria: 'Veterinario', stock_actual: 2, stock_minimo_rop: 5, unidad: 'frascos', fecha_vencimiento: daysFromNow(14), ultima_actualizacion: daysAgo(0), lote: 'L-2026-0220', peso_unitario: 0.1 },
    { id: 'p20', nombre: 'Vitamina AD3E Inyectable x100ml', categoria: 'Veterinario', stock_actual: 8, stock_minimo_rop: 6, unidad: 'frascos', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: daysAgo(5), lote: 'L-2026-0195', peso_unitario: 0.1 },
];

// ─── REQUERIMIENTOS ──
export const MOCK_REQUERIMIENTOS = [
    {
        id: 'r1',
        fecha_creacion: daysAgo(1),
        solicitante: 'Jefe de Planta Rodríguez',
        items: [
            { producto_nombre: 'Saco Alimento Pollo Engorde x40kg', cantidad: 80, justificacion: 'Producción semanal – lote de pollos en fase final de engorde' },
            { producto_nombre: 'Premezcla Vitamínica Aves x25kg', cantidad: 10, justificacion: 'Stock crítico, se necesita para formulación' },
        ],
        estado: 'PENDIENTE',
        logs: [{ usuario: 'Jefe de Planta Rodríguez', accion: 'Creó el requerimiento de producción', fecha: new Date(Date.now() - 1 * 86400000).toISOString() }],
    },
    {
        id: 'r2',
        fecha_creacion: daysAgo(3),
        solicitante: 'Encargado Almacén Torres',
        items: [
            { producto_nombre: 'Torta de Soya x50kg', cantidad: 40, justificacion: 'Materia prima para formulación mensual' },
            { producto_nombre: 'Maíz Amarillo Molido x50kg', cantidad: 100, justificacion: 'Reposición para producción continua' },
        ],
        estado: 'APROBADO_ADMIN',
        logs: [
            { usuario: 'Encargado Almacén Torres', accion: 'Creó el requerimiento de materia prima', fecha: new Date(Date.now() - 3 * 86400000).toISOString() },
            { usuario: 'Administrador Quispe', accion: 'Aprobó como Administración', fecha: new Date(Date.now() - 2 * 86400000).toISOString() },
        ],
    },
    {
        id: 'r3',
        fecha_creacion: daysAgo(6),
        solicitante: 'Veterinario Sánchez',
        items: [
            { producto_nombre: 'Vacuna Newcastle Aviar x500 dosis', cantidad: 10, justificacion: 'Campaña de vacunación trimestral galpones 1-5' },
            { producto_nombre: 'Antibiótico Oxitetraciclina x1kg', cantidad: 8, justificacion: 'Tratamiento preventivo lote porcino' },
        ],
        estado: 'COMPRADO',
        logs: [
            { usuario: 'Veterinario Sánchez', accion: 'Creó el requerimiento veterinario', fecha: new Date(Date.now() - 6 * 86400000).toISOString() },
            { usuario: 'Administrador Quispe', accion: 'Aprobó como Administración', fecha: new Date(Date.now() - 5 * 86400000).toISOString() },
            { usuario: 'Gerente General Mendoza', accion: 'Validó como Gerencia', fecha: new Date(Date.now() - 4 * 86400000).toISOString() },
            { usuario: 'Jefe Logística Paredes', accion: 'Marcó como Comprado – OC #2026-0087', fecha: new Date(Date.now() - 3 * 86400000).toISOString() },
        ],
    },
    {
        id: 'r4',
        fecha_creacion: daysAgo(5),
        solicitante: 'Jefe de Planta Rodríguez',
        items: [
            { producto_nombre: 'Saco Alimento Ganado Engorde x50kg', cantidad: 30, justificacion: 'Despacho urgente a granja El Porvenir' },
            { producto_nombre: 'Saco Sales Minerales Ganado x25kg', cantidad: 15, justificacion: 'Complemento nutricional faltante' },
        ],
        estado: 'VALIDADO_GERENCIA',
        logs: [
            { usuario: 'Jefe de Planta Rodríguez', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 5 * 86400000).toISOString() },
            { usuario: 'Administrador Quispe', accion: 'Aprobó como Administración', fecha: new Date(Date.now() - 4 * 86400000).toISOString() },
            { usuario: 'Gerente General Mendoza', accion: 'Validó como Gerencia', fecha: new Date(Date.now() - 3 * 86400000).toISOString() },
        ],
    },
];

// ─── MOVIMIENTOS ──
export const MOCK_MOVIMIENTOS = [
    { id: 'm1', producto_id: 'p14', nombre_producto: 'Harina de Pescado x25kg', tipo: 'MERMA', cantidad: 5, usuario: 'Encargado Almacén Torres', fecha: daysAgo(1), motivo_merma: 'Sacos rotos por humedad en zona de almacenamiento' },
    { id: 'm2', producto_id: 'p11', nombre_producto: 'Saco Alimento Cerda Gestante x40kg', tipo: 'MERMA', cantidad: 2, usuario: 'Jefe de Planta Rodríguez', fecha: daysAgo(2), motivo_merma: 'Producto vencido – lote L-2026-0265' },
    { id: 'm3', producto_id: 'p17', nombre_producto: 'Antibiótico Oxitetraciclina x1kg', tipo: 'MERMA', cantidad: 1, usuario: 'Veterinario Sánchez', fecha: daysAgo(3), motivo_merma: 'Frasco dañado durante transporte interno' },
    { id: 'm4', producto_id: 'p12', nombre_producto: 'Maíz Amarillo Molido x50kg', tipo: 'INGRESO', cantidad: 200, usuario: 'Jefe Logística Paredes', fecha: daysAgo(4), motivo_merma: null },
    { id: 'm5', producto_id: 'p1', nombre_producto: 'Saco Alimento Pollo Engorde x40kg', tipo: 'INGRESO', cantidad: 100, usuario: 'Jefe Logística Paredes', fecha: daysAgo(5), motivo_merma: null },
    { id: 'm6', producto_id: 'p5', nombre_producto: 'Saco Alimento Ganado Lechero x50kg', tipo: 'SALIDA', cantidad: 20, usuario: 'Encargado Almacén Torres', fecha: daysAgo(1), motivo_merma: null },
    { id: 'm7', producto_id: 'p9', nombre_producto: 'Saco Alimento Cerdo Crecimiento x40kg', tipo: 'SALIDA', cantidad: 15, usuario: 'Jefe de Planta Rodríguez', fecha: daysAgo(2), motivo_merma: null },
    { id: 'm8', producto_id: 'p13', nombre_producto: 'Torta de Soya x50kg', tipo: 'INGRESO', cantidad: 60, usuario: 'Jefe Logística Paredes', fecha: daysAgo(6), motivo_merma: null },
    { id: 'm9', producto_id: 'p3', nombre_producto: 'Saco Alimento Gallina Ponedora x40kg', tipo: 'SALIDA', cantidad: 25, usuario: 'Encargado Almacén Torres', fecha: daysAgo(0), motivo_merma: null },
    { id: 'm10', producto_id: 'p15', nombre_producto: 'Afrecho de Trigo x40kg', tipo: 'INGRESO', cantidad: 40, usuario: 'Jefe Logística Paredes', fecha: daysAgo(8), motivo_merma: null },
    { id: 'm11', producto_id: 'p6', nombre_producto: 'Saco Alimento Ganado Engorde x50kg', tipo: 'MERMA', cantidad: 3, usuario: 'Encargado Almacén Torres', fecha: daysAgo(4), motivo_merma: 'Contaminación por roedores detectada en inspección' },
    { id: 'm12', producto_id: 'p2', nombre_producto: 'Saco Alimento Pollo Inicio x40kg', tipo: 'SALIDA', cantidad: 10, usuario: 'Jefe de Planta Rodríguez', fecha: daysAgo(0), motivo_merma: null },
];

