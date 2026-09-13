// ═══════════════════════════════════════════════════════════════════════════
//  Seed Script desde Excel - LogINV Iglesia CNC
//  Migra datos reales del inventario desde "CODIGOS CNC.xlsx"
// ═══════════════════════════════════════════════════════════════════════════

require('dotenv').config({ path: '.env.local' });
const path = require('path');
const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    writeBatch,
    query,
    where
} = require('firebase/firestore');
const {
    normalizeCategory,
    normalizeLocation,
    normalizeStatus,
    normalizeResponsibility,
    readExcelData: readExcelDataShared,
} = require('./lib/excelMapping');

// ─── Firebase Config ─────────────────────────────────────────────────────
const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Falta variable de entorno: ${envVar}`);
        process.exit(1);
    }
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Leer Excel (lógica compartida con generateMockData.js) ─────────────
function readExcelData() {
    console.log('\n📖 Leyendo archivo Excel...');
    const excelPath = path.join(__dirname, '../data/CODIGOS CNC.xlsx');
    const allItems = readExcelDataShared(excelPath);
    const temploCount = allItems.filter(i => i.fuente === 'TEMPLO').length;
    const almacenesCount = allItems.filter(i => i.fuente === 'ALMACENES').length;
    console.log(`   ✓ ${temploCount} items del Templo`);
    console.log(`   ✓ ${almacenesCount} items de Almacenes`);
    console.log(`\n📊 Total de items a migrar: ${allItems.length}`);
    return allItems;
}

// ─── Limpiar Firestore ───────────────────────────────────────────────────
async function clearFirestore() {
    console.log('\n🗑️  Limpiando colecciones existentes...');
    
    const collections = ['categorias', 'ubicaciones', 'productos', 'movimientos', 'usuarios'];
    
    for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`   ✓ ${colName}: ${snapshot.docs.length} documentos eliminados`);
    }
}

// ─── Seed Categorías ─────────────────────────────────────────────────────
async function seedCategorias(items) {
    console.log('\n📁 Creando categorías...');
    
    const categoriasUsadas = new Set();
    const categoriasToCreate = [];
    
    for (const item of items) {
        const cat = normalizeCategory(item.categoria_raw);
        if (!categoriasUsadas.has(cat.nombre)) {
            categoriasUsadas.add(cat.nombre);
            categoriasToCreate.push(cat);
        }
    }
    
    // Agregar categorías predefinidas que falten
    const defaultCats = [
        { nombre: 'Pintura', icono: '🎨', color: '#A855F7', orden: 11 },
        { nombre: 'Litúrgico', icono: '✝️', color: '#6366F1', orden: 12 },
        { nombre: 'Cocina', icono: '🍳', color: '#EF4444', orden: 13 },
        { nombre: 'Oficina', icono: '📄', color: '#64748B', orden: 14 },
        { nombre: 'Seguridad', icono: '🔒', color: '#DC2626', orden: 15 },
        { nombre: 'Jardín', icono: '🌱', color: '#22C55E', orden: 16 },
        { nombre: 'Deportes', icono: '⚽', color: '#F97316', orden: 17 },
    ];
    
    for (const cat of defaultCats) {
        if (!categoriasUsadas.has(cat.nombre)) {
            categoriasToCreate.push(cat);
        }
    }
    
    const createdCats = [];
    for (const cat of categoriasToCreate) {
        const docRef = await addDoc(collection(db, 'categorias'), {
            ...cat,
            descripcion: `Categoría de ${cat.nombre}`,
            activa: true,
            fecha_creacion: new Date().toISOString()
        });
        createdCats.push({ id: docRef.id, ...cat });
        console.log(`   ✓ ${cat.nombre}`);
    }
    
    return createdCats;
}

// ─── Seed Ubicaciones ────────────────────────────────────────────────────
async function seedUbicaciones(items) {
    console.log('\n📍 Creando ubicaciones...');
    
    const ubicacionesUsadas = new Set();
    const ubicacionesToCreate = [];
    
    for (const item of items) {
        const ubi = normalizeLocation(item.ubicacion_raw);
        if (!ubicacionesUsadas.has(ubi.id)) {
            ubicacionesUsadas.add(ubi.id);
            ubicacionesToCreate.push(ubi);
        }
    }

    const createdUbicaciones = [];
    for (const ubi of ubicacionesToCreate) {
        const docRef = await addDoc(collection(db, 'ubicaciones'), {
            codigo: ubi.id,
            nombre: ubi.nombre,
            descripcion: ubi.descripcion,
            piso: ubi.piso,
            tipo: ubi.tipo,
            icono: ubi.icono,
            color: ubi.color,
            direccion: 'Iglesia CNC',
            responsable: 'Por asignar',
            activa: true,
            capacidad: 100,
            fecha_creacion: new Date().toISOString()
        });
        createdUbicaciones.push({ ...ubi, docId: docRef.id });
        console.log(`   ✓ ${ubi.nombre} (${ubi.id})`);
    }

    return createdUbicaciones;
}

// ─── Seed Productos ──────────────────────────────────────────────────────
async function seedProductos(items, categorias, ubicaciones) {
    console.log('\n📦 Creando productos...');
    
    // Crear mapas de búsqueda
    const catMap = {};
    for (const cat of categorias) {
        catMap[cat.nombre] = cat.id;
    }
    
    const ubiMap = {};
    for (const ubi of ubicaciones) {
        ubiMap[ubi.id] = ubi.docId;
    }
    
    const createdProductos = [];
    
    for (const item of items) {
        const cat = normalizeCategory(item.categoria_raw);
        const ubi = normalizeLocation(item.ubicacion_raw);
        const estado = normalizeStatus(item.estado_raw);
        const responsabilidad = normalizeResponsibility(item.responsabilidad_raw);
        
        const docRef = await addDoc(collection(db, 'productos'), {
            // Datos básicos
            codigo_barras: item.codigo_barras,
            nombre: item.nombre,
            descripcion: item.descripcion,
            
            // Categoría y ubicación
            categoria: cat.nombre,
            categoria_id: catMap[cat.nombre] || null,
            ubicacion: ubi.id,
            ubicacion_nombre: ubi.nombre,
            ubicacion_id: ubiMap[ubi.id] || null,
            
            // Stock
            stock_actual: item.stock_inicial,
            stock_minimo: Math.max(1, Math.floor(item.stock_inicial * 0.2)),
            unidad: 'pieza',
            
            // Estado y control
            estado: estado,
            responsabilidad: responsabilidad,
            observaciones: item.observaciones,
            fuente: item.fuente,
            piso: typeof item.piso === 'string' ? item.piso : `Piso ${item.piso}`,
            
            // Metadatos
            activo: true,
            fecha_creacion: new Date().toISOString(),
            ultima_actualizacion: new Date().toISOString()
        });
        
        createdProductos.push({ 
            id: docRef.id, 
            ...item,
            categoria_nombre: cat.nombre,
            ubicacion_nombre: ubi.nombre
        });
    }
    
    console.log(`   ✓ ${createdProductos.length} productos creados`);
    return createdProductos;
}

// ─── Seed Movimientos Iniciales ──────────────────────────────────────────
async function seedMovimientos(productos) {
    console.log('\n🔄 Creando movimientos iniciales...');
    
    let count = 0;
    for (const prod of productos) {
        if (prod.stock_inicial > 0) {
            await addDoc(collection(db, 'movimientos'), {
                producto_id: prod.id,
                producto_nombre: prod.nombre,
                tipo: 'INGRESO',
                cantidad: prod.stock_inicial,
                stock_anterior: 0,
                stock_nuevo: prod.stock_inicial,
                ubicacion: prod.ubicacion_nombre,
                usuario: 'Sistema',
                motivo: 'Inventario inicial - Migración desde Excel',
                notas: `Migrado desde ${prod.fuente}`,
                fecha: new Date().toISOString()
            });
            count++;
        }
    }
    
    console.log(`   ✓ ${count} movimientos creados`);
}

// ─── Seed Usuarios ───────────────────────────────────────────────────────
async function seedUsuarios() {
    console.log('\n👤 Creando usuarios...');
    
    const usuarios = [
        { nombre: 'Juan Carlos Cárdenas', email: 'juan@iglesia.com', rol: 'admin', activo: true, telefono: '', departamento: 'Dirección' },
        { nombre: 'Ruth Pando', email: 'ruth@iglesia.com', rol: 'encargado', activo: true, telefono: '', departamento: 'Inventario' },
        { nombre: 'Ministerio de Adoración', email: 'adoracion@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Adoración' },
        { nombre: 'Imagen y Producción', email: 'imagen@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Producción' },
        { nombre: 'Mantenimiento', email: 'mantenimiento@iglesia.com', rol: 'voluntario', activo: true, telefono: '', departamento: 'Mantenimiento' },
    ];
    
    for (const user of usuarios) {
        await addDoc(collection(db, 'usuarios'), {
            ...user,
            fecha_creacion: new Date().toISOString()
        });
        console.log(`   ✓ ${user.nombre} (${user.rol})`);
    }
}

// ─── Main Seed Function ──────────────────────────────────────────────────
async function seed() {
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  🌱 SEED DESDE EXCEL - LOGINV IGLESIA CNC');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    
    try {
        // 1. Leer datos del Excel
        const items = readExcelData();
        
        // 2. Limpiar Firestore
        await clearFirestore();
        
        // 3. Crear categorías
        const categorias = await seedCategorias(items);
        
        // 4. Crear ubicaciones
        const ubicaciones = await seedUbicaciones(items);
        
        // 5. Crear productos
        const productos = await seedProductos(items, categorias, ubicaciones);
        
        // 6. Crear movimientos iniciales
        await seedMovimientos(productos);
        
        // 7. Crear usuarios
        await seedUsuarios();
        
        console.log('\n═══════════════════════════════════════════════════════════════════════════');
        console.log('  ✅ ¡MIGRACIÓN COMPLETADA!');
        console.log('═══════════════════════════════════════════════════════════════════════════');
        
        console.log('\n📊 Resumen:');
        console.log(`   • ${categorias.length} categorías`);
        console.log(`   • ${ubicaciones.length} ubicaciones`);
        console.log(`   • ${productos.length} productos migrados`);
        console.log(`   • 5 usuarios creados`);
        
        // Estadísticas por categoría
        console.log('\n📁 Productos por categoría:');
        const catStats = {};
        for (const prod of productos) {
            catStats[prod.categoria_nombre] = (catStats[prod.categoria_nombre] || 0) + 1;
        }
        for (const [cat, count] of Object.entries(catStats).sort((a, b) => b[1] - a[1])) {
            console.log(`   - ${cat}: ${count}`);
        }
        
        // Estadísticas por ubicación
        console.log('\n📍 Productos por ubicación:');
        const ubiStats = {};
        for (const prod of productos) {
            ubiStats[prod.ubicacion_nombre] = (ubiStats[prod.ubicacion_nombre] || 0) + 1;
        }
        for (const [ubi, count] of Object.entries(ubiStats).sort((a, b) => b[1] - a[1])) {
            console.log(`   - ${ubi}: ${count}`);
        }
        
        console.log('\n🚀 Puedes iniciar la aplicación con: npm run dev');
        
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        process.exit(1);
    }
}

// ─── Run Seed ────────────────────────────────────────────────────────────
seed().then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
