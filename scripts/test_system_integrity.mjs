// ═══════════════════════════════════════════════════════════════════════════
//  LogINV - Test de Integridad del Sistema
//  Verifica la creación y actualización de productos, movimientos,
//  préstamos, mantenimientos, ubicaciones y funciones de imagen.
// ═══════════════════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { initializeApp as initClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore as getClientFirestore, collection, addDoc, doc, updateDoc, deleteDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { initializeApp as initAdminApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { formatProductImageUrl, getDriveFallbackUrl } from '../src/lib/imageUtils.js';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Falta configuración en .env.local');
    process.exit(1);
}

// Inicializar Admin SDK
initAdminApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const adminAuth = getAdminAuth();
const adminDb = getAdminFirestore();

// Inicializar Client SDK (emulando navegador)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const clientApp = initClientApp(firebaseConfig);
const clientAuth = getClientAuth(clientApp);
const clientDb = getClientFirestore(clientApp);

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log('\n🚀 INICIANDO TEST DE INTEGRIDAD DEL SISTEMA (LogINV)\n');

    // 0. Autenticar cliente con usuario admin (Ruth Pando o Sebastián)
    console.log('--- 0. Autenticación de Cliente ---');
    const token = await adminAuth.createCustomToken('Aq9qqOcwTyZQErxphBA9kWstAZV2');
    const userCred = await signInWithCustomToken(clientAuth, token);
    assert(!!userCred.user?.uid, 'Inicio de sesión exitoso como Admin');

    // 1. Crear producto con stock = 0
    console.log('\n--- 1. Creación de Producto (Stock 0) ---');
    let prod0Id = null;
    try {
        const nowIso = new Date().toISOString();
        const doc0 = {
            nombre: 'Cable HDMI 5m Test',
            categoria: 'Tecnología',
            ubicacion: 'TEMPLO_PPAL',
            stock_actual: 0,
            stock_minimo: 2,
            unidad: 'pieza',
            codigo_barras: 'TEST_HDMI_0',
            estado: 'OPTIMO',
            responsabilidad: 'Audiovisual',
            piso: 'Piso 1',
            observaciones: 'Test automatizado',
            descripcion: 'Cable HDMI de prueba',
            imagen_url: 'https://lh3.googleusercontent.com/d/1a2b3c4d5e6f7g8h9i0jklmnopqrst',
            imagen_drive_id: '1a2b3c4d5e6f7g8h9i0jklmnopqrst',
            activo: true,
            fecha_creacion: nowIso,
            ultima_actualizacion: nowIso,
        };
        const ref0 = await addDoc(collection(clientDb, 'productos'), doc0);
        prod0Id = ref0.id;
        assert(!!prod0Id, 'Producto con stock 0 creado en Firestore', `ID: ${prod0Id}`);
    } catch (e) {
        assert(false, 'Creación de producto con stock 0', e.message);
    }

    // 2. Crear producto con stock inicial > 0 y movimiento
    console.log('\n--- 2. Creación de Producto con Stock Inicial > 0 y Movimiento ---');
    let prod1Id = null;
    let movId = null;
    try {
        const nowIso = new Date().toISOString();
        const doc1 = {
            nombre: 'Micrófono Shure SM58 Test',
            categoria: 'Instrumentos Musicales',
            ubicacion: 'TEMPLO_PPAL',
            stock_actual: 3,
            stock_minimo: 1,
            unidad: 'pieza',
            codigo_barras: 'TEST_SHURE_1',
            estado: 'OPTIMO',
            responsabilidad: 'Alabanza',
            piso: 'Piso 1',
            observaciones: 'Micrófono de prueba',
            descripcion: 'Shure SM58 dinámico',
            imagen_url: '',
            imagen_drive_id: '',
            activo: true,
            fecha_creacion: nowIso,
            ultima_actualizacion: nowIso,
        };
        const ref1 = await addDoc(collection(clientDb, 'productos'), doc1);
        prod1Id = ref1.id;
        assert(!!prod1Id, 'Producto con stock > 0 creado', `ID: ${prod1Id}`);

        const movDoc = {
            producto_id: prod1Id,
            nombre_producto: doc1.nombre,
            producto_nombre: doc1.nombre,
            tipo: 'INGRESO',
            cantidad: doc1.stock_actual,
            usuario: 'Ruth Pando',
            ubicacion: doc1.ubicacion,
            fecha: nowIso,
            motivo: 'Stock inicial al crear producto',
            notas: 'Stock inicial al crear producto',
            stock_anterior: 0,
            stock_nuevo: doc1.stock_actual,
        };
        const refMov = await addDoc(collection(clientDb, 'movimientos'), movDoc);
        movId = refMov.id;
        assert(!!movId, 'Movimiento de ingreso inicial registrado', `Mov ID: ${movId}`);
    } catch (e) {
        assert(false, 'Creación con stock inicial', e.message);
    }

    // 3. Actualizar Producto
    console.log('\n--- 3. Actualización de Producto ---');
    try {
        if (prod1Id) {
            const nowIso = new Date().toISOString();
            await updateDoc(doc(clientDb, 'productos', prod1Id), {
                stock_actual: 5,
                ultima_actualizacion: nowIso,
                observaciones: 'Stock actualizado por test',
            });
            assert(true, 'Producto actualizado en Firestore');
        }
    } catch (e) {
        assert(false, 'Actualización de producto', e.message);
    }

    // 4. Test de Funciones de Imagen
    console.log('\n--- 4. Funciones de Formateo y URLs de Imagen ---');
    const legacyUrl = 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz&sz=w1000';
    const viewUrl = 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing';
    const formatted1 = formatProductImageUrl(legacyUrl);
    const formatted2 = formatProductImageUrl(viewUrl);
    const fallback1 = getDriveFallbackUrl(legacyUrl);

    assert(formatted1 === 'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz', 'URL Thumbnail convertida al CDN directo de Google Photos/Drive');
    assert(formatted2 === 'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz', 'URL File View convertida al CDN directo de Google Photos/Drive');
    assert(fallback1 === 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz&sz=w1000', 'Fallback URL generado correctamente');

    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
    assert(formatProductImageUrl(dataUrl) === dataUrl, 'Data URL respetada sin alteraciones');

    // 5. Préstamos: Creación y Devolución
    console.log('\n--- 5. Módulo de Préstamos ---');
    let loanId = null;
    try {
        const nowIso = new Date().toISOString();
        const loanDoc = {
            producto_id: prod1Id || 'p_demo',
            producto_nombre: 'Micrófono Shure SM58 Test',
            prestado_a: 'Hermano Carlos',
            contacto: '999111222',
            estado: 'activo',
            fecha_prestamo: nowIso,
            fecha_devolucion_esperada: nowIso,
            fecha_devolucion_real: null,
            created_at: nowIso,
            created_by: 'Ruth Pando',
            notas: 'Préstamo de prueba',
            ubicacion_origen: 'TEMPLO_PPAL',
        };
        const refLoan = await addDoc(collection(clientDb, 'prestamos'), loanDoc);
        loanId = refLoan.id;
        assert(!!loanId, 'Préstamo creado correctamente', `ID: ${loanId}`);

        await updateDoc(doc(clientDb, 'prestamos', loanId), {
            estado: 'devuelto',
            fecha_devolucion_real: new Date().toISOString(),
            notas: 'Devuelto en óptimas condiciones',
        });
        assert(true, 'Devolución de préstamo registrada');
    } catch (e) {
        assert(false, 'Módulo de préstamos', e.message);
    }

    // 6. Mantenimiento: Creación
    console.log('\n--- 6. Módulo de Mantenimientos ---');
    let maintId = null;
    try {
        const nowIso = new Date().toISOString();
        const maintDoc = {
            producto_id: prod1Id || 'p_demo',
            producto_nombre: 'Micrófono Shure SM58 Test',
            tipo: 'preventivo',
            estado: 'programado',
            fecha_programada: nowIso,
            fecha_inicio: null,
            fecha_fin: null,
            created_at: nowIso,
            created_by: 'Ruth Pando',
            tecnico: 'Juan Técnico',
            descripcion: 'Revisión periódica de prueba',
            notas: '',
            costo: 0,
        };
        const refMaint = await addDoc(collection(clientDb, 'mantenimientos'), maintDoc);
        maintId = refMaint.id;
        assert(!!maintId, 'Mantenimiento creado correctamente', `ID: ${maintId}`);
    } catch (e) {
        assert(false, 'Módulo de mantenimientos', e.message);
    }

    // 7. Ubicaciones: Creación
    console.log('\n--- 7. Módulo de Ubicaciones ---');
    let locId = null;
    try {
        const nowIso = new Date().toISOString();
        const locDoc = {
            nombre: 'Almacén de Prueba',
            activa: true,
            descripcion: 'Espacio temporal de prueba',
            direccion: 'Patio trasero',
            responsable: 'Ruth Pando',
            icono: '📦',
            color: 'blue',
            created_at: nowIso,
            fecha_creacion: nowIso,
        };
        const refLoc = await addDoc(collection(clientDb, 'ubicaciones'), locDoc);
        locId = refLoc.id;
        assert(!!locId, 'Ubicación creada correctamente', `ID: ${locId}`);
    } catch (e) {
        assert(false, 'Módulo de ubicaciones', e.message);
    }

    // 8. Limpieza de datos de prueba
    console.log('\n--- 8. Limpieza de Datos de Prueba ---');
    try {
        if (prod0Id) await adminDb.collection('productos').doc(prod0Id).delete();
        if (prod1Id) await adminDb.collection('productos').doc(prod1Id).delete();
        if (movId) await adminDb.collection('movimientos').doc(movId).delete();
        if (loanId) await adminDb.collection('prestamos').doc(loanId).delete();
        if (maintId) await adminDb.collection('mantenimientos').doc(maintId).delete();
        if (locId) await adminDb.collection('ubicaciones').doc(locId).delete();
        assert(true, 'Todos los datos de prueba fueron eliminados limpiamente');
    } catch (e) {
        console.warn('Advertencia en limpieza:', e.message);
    }

    console.log(`\n📊 RESULTADO FINAL: ${passed} pasados, ${failed} fallidos.`);
    if (failed > 0) {
        process.exit(1);
    }
    process.exit(0);
}

runTests().catch(err => {
    console.error('Fatal error en test:', err);
    process.exit(1);
});
