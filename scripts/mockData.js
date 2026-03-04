// scripts/mockData.js
// Ejecutar con: node scripts/mockData.js
// Requiere configurar Firebase Admin SDK o usar el SDK cliente desde Node.

// ─── INSTRUCCIONES ─────────────────────────────────────────────────────────
// Este script usa el SDK de Firebase (cliente) desde Node.js para inyectar
// datos de prueba en Firestore – Molino Agroindustrial / Alimento Balanceado.
//
// Colecciones: categorias, productos, requerimientos, movimientos
//
// 1. Instala las dependencias: npm install
// 2. Configura tus credenciales de Firebase abajo
// 3. Ejecuta: node scripts/mockData.js
// ──────────────────────────────────────────────────────────────────────────

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
    // ⚠️ PEGA AQUÍ TUS CREDENCIALES DE FIREBASE
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return Timestamp.fromDate(d);
}

// ═══════════════════════════════════════════════════════════════════════════
//  CATEGORÍAS
// ═══════════════════════════════════════════════════════════════════════════
const categorias = [
    { nombre: 'Aves', descripcion: 'Alimentos balanceados para pollos, gallinas y aves de corral', color: '#f59e0b', icono: '🐔', orden: 1, activa: true, fecha_creacion: Timestamp.now() },
    { nombre: 'Ganado', descripcion: 'Alimento para ganado vacuno, lechero y de engorde', color: '#10b981', icono: '🐄', orden: 2, activa: true, fecha_creacion: Timestamp.now() },
    { nombre: 'Porcinos', descripcion: 'Alimento balanceado para cerdos', color: '#f472b6', icono: '🐷', orden: 3, activa: true, fecha_creacion: Timestamp.now() },
    { nombre: 'Materia Prima', descripcion: 'Insumos base para formulación de alimentos', color: '#8b5cf6', icono: '🌾', orden: 4, activa: true, fecha_creacion: Timestamp.now() },
    { nombre: 'Veterinario', descripcion: 'Productos veterinarios, suplementos y medicamentos', color: '#ef4444', icono: '💊', orden: 5, activa: true, fecha_creacion: Timestamp.now() },
];

// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCTOS (20 productos agroindustriales)
// ═══════════════════════════════════════════════════════════════════════════
const productos = [
    { nombre: 'Saco Alimento Pollo Engorde x40kg', categoria: 'Aves', stock_actual: 4, stock_minimo_rop: 15, unidad: 'sacos', peso_unitario: 40, lote: 'L-2025-0301', fecha_vencimiento: daysFromNow(2), proveedor: 'Molinos del Centro SAC', descripcion: 'Alimento balanceado para pollo de engorde, alto en proteínas', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Saco Alimento Gallina Ponedora x40kg', categoria: 'Aves', stock_actual: 8, stock_minimo_rop: 12, unidad: 'sacos', peso_unitario: 40, lote: 'L-2025-0302', fecha_vencimiento: daysFromNow(5), proveedor: 'Molinos del Centro SAC', descripcion: 'Fórmula especial para gallinas ponedoras', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Saco Alimento Pato x25kg', categoria: 'Aves', stock_actual: 6, stock_minimo_rop: 8, unidad: 'sacos', peso_unitario: 25, lote: 'L-2025-0310', fecha_vencimiento: daysFromNow(14), proveedor: 'CONTILATIN', descripcion: '', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Premezcla Vitamínica Aves x20kg', categoria: 'Aves', stock_actual: 3, stock_minimo_rop: 5, unidad: 'sacos', peso_unitario: 20, lote: 'L-2025-0315', fecha_vencimiento: daysFromNow(45), proveedor: 'Vita-Agro Perú', descripcion: 'Premezcla vitamínica para aves de corral', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Saco Alimento Ganado Lechero x50kg', categoria: 'Ganado', stock_actual: 12, stock_minimo_rop: 10, unidad: 'sacos', peso_unitario: 50, lote: 'L-2025-0401', fecha_vencimiento: daysFromNow(30), proveedor: 'Purina Perú', descripcion: 'Alimento balanceado para ganado lechero', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Saco Alimento Ganado Engorde x50kg', categoria: 'Ganado', stock_actual: 5, stock_minimo_rop: 10, unidad: 'sacos', peso_unitario: 50, lote: 'L-2025-0402', fecha_vencimiento: daysFromNow(7), proveedor: 'Purina Perú', descripcion: 'Alto en energía para engorde de ganado vacuno', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Bloque Sal Mineral Ganado x5kg', categoria: 'Ganado', stock_actual: 20, stock_minimo_rop: 15, unidad: 'bloques', peso_unitario: 5, lote: 'L-2025-0410', fecha_vencimiento: daysFromNow(180), proveedor: 'Sales del Valle', descripcion: 'Bloque de sal mineralizado para ganado en pastoreo', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Suplemento Calcio Bovino x25kg', categoria: 'Ganado', stock_actual: 2, stock_minimo_rop: 6, unidad: 'sacos', peso_unitario: 25, lote: 'L-2025-0411', fecha_vencimiento: daysFromNow(60), proveedor: 'NutriGanado SRL', descripcion: '', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Saco Alimento Cerdo Inicio x40kg', categoria: 'Porcinos', stock_actual: 7, stock_minimo_rop: 8, unidad: 'sacos', peso_unitario: 40, lote: 'L-2025-0501', fecha_vencimiento: daysFromNow(3), proveedor: 'CONTILATIN', descripcion: 'Alimento de inicio para lechones', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Saco Alimento Cerdo Engorde x40kg', categoria: 'Porcinos', stock_actual: 10, stock_minimo_rop: 12, unidad: 'sacos', peso_unitario: 40, lote: 'L-2025-0502', fecha_vencimiento: daysFromNow(21), proveedor: 'CONTILATIN', descripcion: 'Alimento de engorde para cerdos', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Saco Alimento Cerda Gestante x40kg', categoria: 'Porcinos', stock_actual: 4, stock_minimo_rop: 6, unidad: 'sacos', peso_unitario: 40, lote: 'L-2025-0510', fecha_vencimiento: daysFromNow(1), proveedor: 'Molinos del Centro SAC', descripcion: 'Fórmula especial para cerdas en gestación', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Harina de Soya x50kg', categoria: 'Materia Prima', stock_actual: 25, stock_minimo_rop: 20, unidad: 'sacos', peso_unitario: 50, lote: 'L-2025-0601', fecha_vencimiento: daysFromNow(90), proveedor: 'CargillPerú', descripcion: 'Harina de soya 48% proteína para formulación', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Maíz Molido x50kg', categoria: 'Materia Prima', stock_actual: 30, stock_minimo_rop: 25, unidad: 'sacos', peso_unitario: 50, lote: 'L-2025-0602', fecha_vencimiento: daysFromNow(120), proveedor: 'Agroindustrias Peruanas', descripcion: 'Maíz amarillo molido para alimentos balanceados', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Harina de Pescado x25kg', categoria: 'Materia Prima', stock_actual: 8, stock_minimo_rop: 10, unidad: 'sacos', peso_unitario: 25, lote: 'L-2025-0610', fecha_vencimiento: daysFromNow(6), proveedor: 'TASA', descripcion: 'Harina de pescado alto contenido proteico', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Aceite de Soya x20L', categoria: 'Materia Prima', stock_actual: 6, stock_minimo_rop: 8, unidad: 'bidones', peso_unitario: 18, lote: 'L-2025-0615', fecha_vencimiento: daysFromNow(150), proveedor: 'AGD Perú', descripcion: 'Aceite de soya crudo para formulación de alimentos', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Carbonato de Calcio x25kg', categoria: 'Materia Prima', stock_actual: 15, stock_minimo_rop: 10, unidad: 'sacos', peso_unitario: 25, lote: 'L-2025-0620', fecha_vencimiento: daysFromNow(365), proveedor: 'Minerales Andes', descripcion: '', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Antibiótico Oxitetraciclina x1L', categoria: 'Veterinario', stock_actual: 3, stock_minimo_rop: 5, unidad: 'frascos', peso_unitario: 1, lote: 'L-2025-0701', fecha_vencimiento: daysFromNow(10), proveedor: 'Agrovet Market', descripcion: 'Antibiótico de amplio espectro para aves y ganado', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Vitamina AD3E x500ml', categoria: 'Veterinario', stock_actual: 8, stock_minimo_rop: 6, unidad: 'frascos', peso_unitario: 0.5, lote: 'L-2025-0702', fecha_vencimiento: daysFromNow(75), proveedor: 'Agrovet Market', descripcion: 'Suplemento vitamínico inyectable', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Desparasitante Ivermectina x500ml', categoria: 'Veterinario', stock_actual: 2, stock_minimo_rop: 4, unidad: 'frascos', peso_unitario: 0.5, lote: 'L-2025-0710', fecha_vencimiento: daysFromNow(200), proveedor: 'Montana SA', descripcion: 'Desparasitante para ganado y porcinos', ultima_actualizacion: Timestamp.now() },
    { nombre: 'Vacuna Newcastle x100 dosis', categoria: 'Veterinario', stock_actual: 10, stock_minimo_rop: 8, unidad: 'frascos', peso_unitario: 0.1, lote: 'L-2025-0715', fecha_vencimiento: daysFromNow(15), proveedor: 'Biovet SAC', descripcion: 'Vacuna viva contra enfermedad de Newcastle para aves', ultima_actualizacion: Timestamp.now() },
];

// ═══════════════════════════════════════════════════════════════════════════
//  REQUERIMIENTOS
// ═══════════════════════════════════════════════════════════════════════════
const requerimientos = [
    {
        fecha_creacion: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        solicitante: 'Jefe de Planta Rodríguez',
        items: [
            { producto_nombre: 'Saco Alimento Pollo Engorde x40kg', cantidad: 30, justificacion: 'Stock crítico, producción semanal de galpones' },
            { producto_nombre: 'Premezcla Vitamínica Aves x20kg', cantidad: 8, justificacion: 'Lote próximo a agotar' },
        ],
        estado: 'PENDIENTE',
        logs: [{ usuario: 'Jefe de Planta Rodríguez', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }],
    },
    {
        fecha_creacion: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
        solicitante: 'Jefe de Planta Rodríguez',
        items: [
            { producto_nombre: 'Harina de Pescado x25kg', cantidad: 15, justificacion: 'Para formulación semanal de alimento de aves' },
            { producto_nombre: 'Aceite de Soya x20L', cantidad: 10, justificacion: 'Stock bajo para la línea de engorde' },
        ],
        estado: 'APROBADO_ADMIN',
        logs: [
            { usuario: 'Jefe de Planta Rodríguez', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Administrador Quispe', accion: 'Aprobó como Admin', fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        ],
    },
    {
        fecha_creacion: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        solicitante: 'Jefe de Planta Rodríguez',
        items: [
            { producto_nombre: 'Antibiótico Oxitetraciclina x1L', cantidad: 10, justificacion: 'Prevención sanitaria galpón 3' },
            { producto_nombre: 'Vacuna Newcastle x100 dosis', cantidad: 20, justificacion: 'Calendario de vacunación' },
        ],
        estado: 'COMPRADO',
        logs: [
            { usuario: 'Jefe de Planta Rodríguez', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Administrador Quispe', accion: 'Aprobó como Admin', fecha: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Gerente General Mendoza', accion: 'Validó como Gerencia', fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Jefe Logística Paredes', accion: 'Marcó como Comprado', fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        ],
    },
    {
        fecha_creacion: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
        solicitante: 'Jefe Logística Paredes',
        items: [
            { producto_nombre: 'Maíz Molido x50kg', cantidad: 50, justificacion: 'Abastecimiento quincenal para planta de molienda' },
        ],
        estado: 'PENDIENTE',
        logs: [{ usuario: 'Jefe Logística Paredes', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }],
    },
];

// ═══════════════════════════════════════════════════════════════════════════
//  MOVIMIENTOS
// ═══════════════════════════════════════════════════════════════════════════
const movimientos = [
    { producto_id: 'seed1', nombre_producto: 'Saco Alimento Pollo Engorde x40kg', tipo: 'MERMA', cantidad: 5, usuario: 'Jefe Logística Paredes', fecha: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), motivo_merma: 'Sacos rotos por humedad en almacén' },
    { producto_id: 'seed2', nombre_producto: 'Saco Alimento Cerda Gestante x40kg', tipo: 'MERMA', cantidad: 2, usuario: 'Jefe de Planta Rodríguez', fecha: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), motivo_merma: 'Producto vencido, descarte sanitario' },
    { producto_id: 'seed3', nombre_producto: 'Harina de Pescado x25kg', tipo: 'MERMA', cantidad: 3, usuario: 'Jefe Logística Paredes', fecha: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), motivo_merma: 'Contaminación por roedores' },
    { producto_id: 'seed4', nombre_producto: 'Maíz Molido x50kg', tipo: 'INGRESO', cantidad: 40, usuario: 'Jefe Logística Paredes', fecha: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'seed5', nombre_producto: 'Harina de Soya x50kg', tipo: 'INGRESO', cantidad: 30, usuario: 'Jefe Logística Paredes', fecha: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'seed6', nombre_producto: 'Saco Alimento Ganado Lechero x50kg', tipo: 'SALIDA', cantidad: 8, usuario: 'Jefe de Planta Rodríguez', fecha: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3600000)), motivo_merma: null },
    { producto_id: 'seed7', nombre_producto: 'Bloque Sal Mineral Ganado x5kg', tipo: 'SALIDA', cantidad: 10, usuario: 'Jefe de Planta Rodríguez', fecha: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'seed8', nombre_producto: 'Saco Alimento Gallina Ponedora x40kg', tipo: 'INGRESO', cantidad: 20, usuario: 'Jefe Logística Paredes', fecha: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'seed9', nombre_producto: 'Antibiótico Oxitetraciclina x1L', tipo: 'MERMA', cantidad: 1, usuario: 'Jefe de Planta Rodríguez', fecha: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), motivo_merma: 'Frasco dañado en transporte' },
    { producto_id: 'seed10', nombre_producto: 'Saco Alimento Cerdo Engorde x40kg', tipo: 'INGRESO', cantidad: 15, usuario: 'Jefe Logística Paredes', fecha: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'seed11', nombre_producto: 'Desparasitante Ivermectina x500ml', tipo: 'SALIDA', cantidad: 2, usuario: 'Jefe de Planta Rodríguez', fecha: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'seed12', nombre_producto: 'Vacuna Newcastle x100 dosis', tipo: 'SALIDA', cantidad: 5, usuario: 'Jefe de Planta Rodríguez', fecha: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 7200000)), motivo_merma: null },
];

// ═══════════════════════════════════════════════════════════════════════════
//  SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════
async function seed() {
    console.log('🌱 Iniciando seeding – MolinoINV (Agroindustrial)\n');

    console.log('📂 Insertando categorías...');
    for (const c of categorias) {
        await addDoc(collection(db, 'categorias'), c);
        console.log(`  ✅ ${c.icono} ${c.nombre}`);
    }

    console.log('\n📦 Insertando productos...');
    for (const p of productos) {
        await addDoc(collection(db, 'productos'), p);
        console.log(`  ✅ ${p.nombre}`);
    }

    console.log('\n📋 Insertando requerimientos...');
    for (const r of requerimientos) {
        await addDoc(collection(db, 'requerimientos'), r);
        console.log(`  ✅ Requerimiento de ${r.solicitante} (${r.estado})`);
    }

    console.log('\n📊 Insertando movimientos...');
    for (const m of movimientos) {
        await addDoc(collection(db, 'movimientos'), m);
        console.log(`  ✅ ${m.tipo} - ${m.nombre_producto}`);
    }

    console.log('\n🎉 ¡Seeding completado exitosamente!');
    console.log('📌 Colecciones creadas: categorias, productos, requerimientos, movimientos');
    console.log('📌 Ahora puedes iniciar el servidor con: npm run dev');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Error durante el seeding:', err);
    process.exit(1);
});
