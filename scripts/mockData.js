// scripts/mockData.js
// Ejecutar con: node scripts/mockData.js
// Requiere configurar Firebase Admin SDK o usar el SDK cliente desde Node.

// ─── INSTRUCCIONES ─────────────────────────────────────────────────────────
// Este script usa el SDK de Firebase (cliente) desde Node.js para inyectar
// datos de prueba en Firestore.
//
// 1. Instala las dependencias: npm install
// 2. Copia tus credenciales de Firebase en src/lib/firebase.js
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

const productos = [
    { nombre: 'Leche UHT 1L', categoria: 'Desayuno', stock_actual: 4, stock_minimo_rop: 10, unidad: 'cajas', fecha_vencimiento: daysFromNow(2), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Mermelada de Fresa', categoria: 'Desayuno', stock_actual: 3, stock_minimo_rop: 8, unidad: 'frascos', fecha_vencimiento: daysFromNow(5), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Pan de Molde', categoria: 'Desayuno', stock_actual: 2, stock_minimo_rop: 5, unidad: 'bolsas', fecha_vencimiento: daysFromNow(1), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Jugo de Naranja', categoria: 'Desayuno', stock_actual: 15, stock_minimo_rop: 10, unidad: 'litros', fecha_vencimiento: daysFromNow(6), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Mantequilla', categoria: 'Desayuno', stock_actual: 12, stock_minimo_rop: 6, unidad: 'kg', fecha_vencimiento: daysFromNow(14), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Huevos', categoria: 'Desayuno', stock_actual: 60, stock_minimo_rop: 30, unidad: 'unidades', fecha_vencimiento: daysFromNow(7), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Jabón Líquido', categoria: 'Limpieza', stock_actual: 5, stock_minimo_rop: 8, unidad: 'galones', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Lejía Clorox', categoria: 'Limpieza', stock_actual: 3, stock_minimo_rop: 6, unidad: 'galones', fecha_vencimiento: daysFromNow(365), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Papel Higiénico', categoria: 'Limpieza', stock_actual: 48, stock_minimo_rop: 24, unidad: 'rollos', fecha_vencimiento: daysFromNow(730), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Agua San Luis 620ml', categoria: 'Frigobar', stock_actual: 8, stock_minimo_rop: 20, unidad: 'botellas', fecha_vencimiento: daysFromNow(180), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Coca-Cola Lata', categoria: 'Frigobar', stock_actual: 12, stock_minimo_rop: 24, unidad: 'latas', fecha_vencimiento: daysFromNow(90), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Maní Tostado', categoria: 'Frigobar', stock_actual: 2, stock_minimo_rop: 10, unidad: 'bolsas', fecha_vencimiento: daysFromNow(3), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Chocolate Sublime', categoria: 'Frigobar', stock_actual: 18, stock_minimo_rop: 12, unidad: 'unidades', fecha_vencimiento: daysFromNow(45), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Arroz Extra', categoria: 'Cocina', stock_actual: 25, stock_minimo_rop: 10, unidad: 'kg', fecha_vencimiento: daysFromNow(300), ultima_actualizacion: Timestamp.now() },
    { nombre: 'Aceite de Soja', categoria: 'Cocina', stock_actual: 2, stock_minimo_rop: 5, unidad: 'litros', fecha_vencimiento: daysFromNow(120), ultima_actualizacion: Timestamp.now() },
];

const requerimientos = [
    {
        fecha_creacion: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        solicitante: 'Chef Masana',
        items: [
            { producto_nombre: 'Leche UHT 1L', cantidad: 20, justificacion: 'Stock crítico para la semana' },
            { producto_nombre: 'Pan de Molde', cantidad: 10, justificacion: 'Agotándose para desayunos' },
        ],
        estado: 'PENDIENTE',
        logs: [{ usuario: 'Chef Masana', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }],
    },
    {
        fecha_creacion: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
        solicitante: 'Chef Masana',
        items: [
            { producto_nombre: 'Jabón Líquido', cantidad: 4, justificacion: 'Para limpieza de habitaciones' },
            { producto_nombre: 'Lejía Clorox', cantidad: 6, justificacion: 'Stock bajo semana anterior' },
        ],
        estado: 'APROBADO_ADMIN',
        logs: [
            { usuario: 'Chef Masana', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Admin López', accion: 'Aprobó como Admin', fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        ],
    },
    {
        fecha_creacion: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        solicitante: 'Chef Masana',
        items: [
            { producto_nombre: 'Agua San Luis 620ml', cantidad: 48, justificacion: 'Frigobar de habitaciones' },
            { producto_nombre: 'Coca-Cola Lata', cantidad: 24, justificacion: 'Reposición semanal frigobar' },
        ],
        estado: 'COMPRADO',
        logs: [
            { usuario: 'Chef Masana', accion: 'Creó el requerimiento', fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Admin López', accion: 'Aprobó como Admin', fecha: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Gerente Ramírez', accion: 'Validó como Gerencia', fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { usuario: 'Sebastián (Logística)', accion: 'Marcó como Comprado', fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        ],
    },
];

const movimientos = [
    { producto_id: 'mock1', nombre_producto: 'Pan de Molde', tipo: 'MERMA', cantidad: 3, usuario: 'Sebastián', fecha: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), motivo_merma: 'Producto vencido, no apto para consumo' },
    { producto_id: 'mock2', nombre_producto: 'Leche UHT 1L', tipo: 'MERMA', cantidad: 2, usuario: 'Chef Masana', fecha: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), motivo_merma: 'Derrame en almacén' },
    { producto_id: 'mock3', nombre_producto: 'Maní Tostado', tipo: 'MERMA', cantidad: 5, usuario: 'Sebastián', fecha: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), motivo_merma: 'Vencimiento' },
    { producto_id: 'mock4', nombre_producto: 'Jugo de Naranja', tipo: 'INGRESO', cantidad: 20, usuario: 'Sebastián', fecha: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'mock5', nombre_producto: 'Arroz Extra', tipo: 'INGRESO', cantidad: 25, usuario: 'Sebastián', fecha: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), motivo_merma: null },
    { producto_id: 'mock6', nombre_producto: 'Huevos', tipo: 'SALIDA', cantidad: 12, usuario: 'Chef Masana', fecha: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3600000)), motivo_merma: null },
    { producto_id: 'mock7', nombre_producto: 'Mantequilla', tipo: 'MERMA', cantidad: 1, usuario: 'Chef Masana', fecha: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)), motivo_merma: 'Contaminación cruzada' },
    { producto_id: 'mock8', nombre_producto: 'Mermelada de Fresa', tipo: 'SALIDA', cantidad: 4, usuario: 'Sebastián', fecha: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), motivo_merma: null },
];

async function seed() {
    console.log('🌱 Iniciando seeding de datos de prueba en Firestore...\n');

    console.log('📦 Insertando productos...');
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
    console.log('📌 Ahora puedes iniciar el servidor con: npm run dev');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Error durante el seeding:', err);
    process.exit(1);
});
