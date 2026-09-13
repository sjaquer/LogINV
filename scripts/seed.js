// ═══════════════════════════════════════════════════════════════════════════
//  Seed Script - LogINV Iglesia
//  Datos mockups para sistema de inventario de iglesia
// ═══════════════════════════════════════════════════════════════════════════
//
//  INSTRUCCIONES:
//  1. Ejecuta: node scripts/seed.js
//  2. O ejecuta desde la consola de Firebase Functions
//
//  Este script crea datos de ejemplo para todas las colecciones:
//  - Categorías de artículos litúrgicos
//  - Ubicaciones de la iglesia
//  - Productos de inventario
//  - Movimientos de stock
//  - Conteos de inventario
//  - Préstamos activos
//  - Mantenimiento programado
//  - Usuarios del sistema
//  - Registros de auditoría
//
// ═══════════════════════════════════════════════════════════════════════════

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    setDoc,
    deleteDoc,
    getDocs,
    writeBatch,
    serverTimestamp 
} = require('firebase/firestore');

// ─── Firebase Config from Environment Variables ──────────────────────────
const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Validate environment variables
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing environment variable: ${envVar}`);
        console.error('   Please create .env.local with Firebase credentials');
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

// ─── Initialize Firebase ─────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Helper Functions ────────────────────────────────────────────────────
function randomId() {
    return Math.random().toString(36).substring(2, 15);
}

function randomDate(daysAgo = 30) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
}

function randomFutureDate(daysAhead = 30) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
    return date.toISOString();
}

// ─── Clear Existing Data ─────────────────────────────────────────────────
async function clearCollection(collectionName) {
    console.log(`   Limpiando ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`   ✓ ${snapshot.docs.length} documentos eliminados`);
}

// ─── Seed Data ───────────────────────────────────────────────────────────

// Categorías de artículos litúrgicos
const categorias = [
    { nombre: 'Muebles', descripcion: 'Sillas, mesas, bancas, etc.', icono: '🪑', color: '#8B5CF6', orden: 1, activa: true },
    { nombre: 'Audio/Video', descripcion: 'Equipos de sonido y proyección', icono: '🔊', color: '#3B82F6', orden: 2, activa: true },
    { nombre: 'Iluminación', descripcion: 'Luces, cables, reguladores', icono: '💡', color: '#F59E0B', orden: 3, activa: true },
    { nombre: 'Limpieza', descripcion: 'Artículos de limpieza y mantenimiento', icono: '🧹', color: '#10B981', orden: 4, activa: true },
    { nombre: 'Cocina', descripcion: 'Utensilios y equipos de cocina', icono: '🍳', color: '#EF4444', orden: 5, activa: true },
    { nombre: 'Litúrgico', descripcion: 'Artículos para liturgia y culto', icono: '✝️', color: '#6366F1', orden: 6, activa: true },
    { nombre: 'Oficina', descripcion: 'Materiales de oficina y administración', icono: '📄', color: '#64748B', orden: 7, activa: true },
    { nombre: 'Seguridad', descripcion: 'Extintores, cámaras, alarmas', icono: '🔒', color: '#DC2626', orden: 8, activa: true },
    { nombre: 'Jardín', descripcion: 'Herramientas y decorative para jardín', icono: '🌱', color: '#22C55E', orden: 9, activa: true },
    { nombre: 'Deportes', descripcion: 'Equipos para actividades deportivas', icono: '⚽', color: '#F97316', orden: 10, activa: true },
];

// Ubicaciones de la iglesia
const ubicaciones = [
    { nombre: 'Templo Principal', descripcion: 'Sala principal de culto', direccion: 'Av. Iglesia 123', responsable: 'Carlos García', activa: true, capacidad: 500 },
    { nombre: 'Salón de Eventos', descripcion: 'Salón para reuniones y eventos', direccion: 'Av. Iglesia 123', responsable: 'María López', activa: true, capacidad: 200 },
    { nombre: 'Cocina Comunitaria', descripcion: 'Cocina para preparación de alimentos', direccion: 'Av. Iglesia 123', responsable: 'Ana Martínez', activa: true, capacidad: 50 },
    { nombre: 'Oficina Pastoral', descripcion: 'Oficina de administración y pastoral', direccion: 'Av. Iglesia 123', responsable: 'Pedro Sánchez', activa: true, capacidad: 10 },
    { nombre: 'Almacén General', descripcion: 'Almacén principal de almacenamiento', direccion: 'Av. Iglesia 123', responsable: 'Juan Rodríguez', activa: true, capacidad: 100 },
    { nombre: 'Patio de Entrada', descripcion: 'Área de recepción y entrada', direccion: 'Av. Iglesia 123', responsable: 'Luis Hernández', activa: true, capacidad: 100 },
    { nombre: 'Sala de Consejo', descripcion: 'Sala de reuniones del consejo', direccion: 'Av. Iglesia 123', responsable: 'Diana Flores', activa: true, capacidad: 20 },
    { nombre: 'Bodega de Mantenimiento', descripcion: 'Almacén de herramientas y equipos', direccion: 'Av. Iglesia 123', responsable: 'Roberto Díaz', activa: true, capacidad: 30 },
];

// Productos de inventario
const productos = [
    // Muebles
    { nombre: 'Silla Plástica Blanca', categoria: 'Muebles', stock_actual: 150, stock_minimo: 50, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Silla plegable para eventos', codigo_barras: 'INV001', activo: true },
    { nombre: 'Mesa Redonda 6 Personas', categoria: 'Muebles', stock_actual: 20, stock_minimo: 5, unidad: 'pieza', ubicacion: 'Salón de Eventos', descripcion: 'Mesa plegable redonda', codigo_barras: 'INV002', activo: true },
    { nombre: 'Banco de Madera', categoria: 'Muebles', stock_actual: 80, stock_minimo: 20, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Banco para capilla', codigo_barras: 'INV003', activo: true },
    { nombre: 'Podio de Madera', categoria: 'Muebles', stock_actual: 3, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Podio para predicación', codigo_barras: 'INV004', activo: true },
    { nombre: 'Mesa de Comunión', categoria: 'Muebles', stock_actual: 2, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Mesa para Santa Cena', codigo_barras: 'INV005', activo: true },
    
    // Audio/Video
    { nombre: 'Micrófono Inalámbrico', categoria: 'Audio/Video', stock_actual: 8, stock_minimo: 3, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Micrófono Shure', codigo_barras: 'INV010', activo: true },
    { nombre: 'Bocina Portátil', categoria: 'Audio/Video', stock_actual: 5, stock_minimo: 2, unidad: 'pieza', ubicacion: 'Salón de Eventos', descripcion: 'Bocina JBL 15"', codigo_barras: 'INV011', activo: true },
    { nombre: 'Proyector HD', categoria: 'Audio/Video', stock_actual: 2, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Proyector Epson 4000 lúmenes', codigo_barras: 'INV012', activo: true },
    { nombre: 'Pantalla de Proyección', categoria: 'Audio/Video', stock_actual: 3, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Pantalla motorizada 120"', codigo_barras: 'INV013', activo: true },
    { nombre: 'Mesa de Mezclas', categoria: 'Audio/Video', stock_actual: 1, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Mesa Yamaha 16 canales', codigo_barras: 'INV014', activo: true },
    { nombre: 'Cable XLR 10m', categoria: 'Audio/Video', stock_actual: 25, stock_minimo: 10, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Cable de audio profesional', codigo_barras: 'INV015', activo: true },
    
    // Iluminación
    { nombre: 'Focused Light LED', categoria: 'Iluminación', stock_actual: 12, stock_minimo: 4, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Foco LED profesional', codigo_barras: 'INV020', activo: true },
    { nombre: 'Dimmer 6 Canales', categoria: 'Iluminación', stock_actual: 2, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Controlador de iluminación', codigo_barras: 'INV021', activo: true },
    { nombre: 'Cable Eléctrico 2x2.5', categoria: 'Iluminación', stock_actual: 200, stock_minimo: 50, unidad: 'metro', ubicacion: 'Almacén General', descripcion: 'Cable para instalaciones', codigo_barras: 'INV022', activo: true },
    { nombre: 'Guirnalda LED Navideña', categoria: 'Iluminación', stock_actual: 10, stock_minimo: 3, unidad: 'serie', ubicacion: 'Almacén General', descripcion: 'Decoración navideña', codigo_barras: 'INV023', activo: true },
    
    // Limpieza
    { nombre: 'Jabón Líquido 5L', categoria: 'Limpieza', stock_actual: 15, stock_minimo: 5, unidad: 'litro', ubicacion: 'Almacén General', descripcion: 'Jabón para pisos', codigo_barras: 'INV030', activo: true },
    { nombre: 'Cloro 5L', categoria: 'Limpieza', stock_actual: 10, stock_minimo: 3, unidad: 'litro', ubicacion: 'Almacén General', descripcion: 'Desinfectante', codigo_barras: 'INV031', activo: true },
    { nombre: 'Escoba de Trigo', categoria: 'Limpieza', stock_actual: 12, stock_minimo: 4, unidad: 'pieza', ubicacion: 'Almacén General', descripcion: 'Escoba para limpieza', codigo_barras: 'INV032', activo: true },
    { nombre: 'Trapeador con Cubeta', categoria: 'Limpieza', stock_actual: 6, stock_minimo: 2, unidad: 'pieza', ubicacion: 'Almacén General', descripcion: 'Trappeador profesional', codigo_barras: 'INV033', activo: true },
    { nombre: 'Bolsa de Basura 100L', categoria: 'Limpieza', stock_actual: 500, stock_minimo: 100, unidad: 'pieza', ubicacion: 'Almacén General', descripcion: 'Bolsas negras grandes', codigo_barras: 'INV034', activo: true },
    
    // Cocina
    { nombre: 'Olla de Acero 20L', categoria: 'Cocina', stock_actual: 4, stock_minimo: 2, unidad: 'pieza', ubicacion: 'Cocina Comunitaria', descripcion: 'Olla para eventos', codigo_barras: 'INV040', activo: true },
    { nombre: 'Sartén Antiadherente', categoria: 'Cocina', stock_actual: 8, stock_minimo: 3, unidad: 'pieza', ubicacion: 'Cocina Comunitaria', descripcion: 'Sartén 30cm', codigo_barras: 'INV041', activo: true },
    { nombre: 'Plato Desechable 100u', categoria: 'Cocina', stock_actual: 200, stock_minimo: 50, unidad: 'paquete', ubicacion: 'Cocina Comunitaria', descripcion: 'Platos para eventos', codigo_barras: 'INV042', activo: true },
    { nombre: 'Vaso Desechable 100u', categoria: 'Cocina', stock_actual: 200, stock_minimo: 50, unidad: 'paquete', ubicacion: 'Cocina Comunitaria', descripcion: 'Vasos para eventos', codigo_barras: 'INV043', activo: true },
    { nombre: 'Cuchara de Madera', categoria: 'Cocina', stock_actual: 15, stock_minimo: 5, unidad: 'pieza', ubicacion: 'Cocina Comunitaria', descripcion: 'Cuchara para cocinar', codigo_barras: 'INV044', activo: true },
    
    // Litúrgico
    { nombre: 'Cera de Vela 1kg', categoria: 'Litúrgico', stock_actual: 10, stock_minimo: 3, unidad: 'kilogramo', ubicacion: 'Templo Principal', descripcion: 'Cera para velas', codigo_barras: 'INV050', activo: true },
    { nombre: 'Vino para Misa 5L', categoria: 'Litúrgico', stock_actual: 5, stock_minimo: 2, unidad: 'litro', ubicacion: 'Templo Principal', descripcion: 'Vino consagrado', codigo_barras: 'INV051', activo: true },
    { nombre: 'Hostia 500u', categoria: 'Litúrgico', stock_actual: 3, stock_minimo: 1, unidad: 'paquete', ubicacion: 'Templo Principal', descripcion: 'Hostias para comunión', codigo_barras: 'INV052', activo: true },
    { nombre: 'Incienso 500g', categoria: 'Litúrgico', stock_actual: 4, stock_minimo: 2, unidad: 'kilogramo', ubicacion: 'Templo Principal', descripcion: 'Incienso para liturgia', codigo_barras: 'INV053', activo: true },
    { nombre: 'Banda Litúrgica', categoria: 'Litúrgico', stock_actual: 2, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Banda para procesiones', codigo_barras: 'INV054', activo: true },
    
    // Oficina
    { nombre: 'Resma de Papel 500h', categoria: 'Oficina', stock_actual: 20, stock_minimo: 5, unidad: 'paquete', ubicacion: 'Oficina Pastoral', descripcion: 'Papel bond A4', codigo_barras: 'INV060', activo: true },
    { nombre: 'Cartucho de Tinta Negro', categoria: 'Oficina', stock_actual: 5, stock_minimo: 2, unidad: 'pieza', ubicacion: 'Oficina Pastoral', descripcion: 'Tinta para impresora HP', codigo_barras: 'INV061', activo: true },
    { nombre: 'Cartucho de Tinta Color', categoria: 'Oficina', stock_actual: 3, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Oficina Pastoral', descripcion: 'Tinta para impresora HP', codigo_barras: 'INV062', activo: true },
    { nombre: 'Bolígrafo Azul 12u', categoria: 'Oficina', stock_actual: 30, stock_minimo: 10, unidad: 'paquete', ubicacion: 'Oficina Pastoral', descripcion: 'Bolígrafos para oficina', codigo_barras: 'INV063', activo: true },
    
    // Seguridad
    { nombre: 'Extintor 6kg ABC', categoria: 'Seguridad', stock_actual: 8, stock_minimo: 3, unidad: 'pieza', ubicacion: 'Templo Principal', descripcion: 'Extintor multipropósito', codigo_barras: 'INV070', activo: true },
    { nombre: 'Máscara de Gas', categoria: 'Seguridad', stock_actual: 4, stock_minimo: 2, unidad: 'pieza', ubicacion: 'Bodega de Mantenimiento', descripcion: 'Máscara para mantenimiento', codigo_barras: 'INV071', activo: true },
    { nombre: 'Chaleco Reflectante', categoria: 'Seguridad', stock_actual: 10, stock_minimo: 3, unidad: 'pieza', ubicacion: 'Bodega de Mantenimiento', descripcion: 'Chaleco de seguridad', codigo_barras: 'INV072', activo: true },
    
    // Jardín
    { nombre: 'Maceta de Cerámica 30cm', categoria: 'Jardín', stock_actual: 25, stock_minimo: 8, unidad: 'pieza', ubicacion: 'Patio de Entrada', descripcion: 'Maceta para plantas', codigo_barras: 'INV080', activo: true },
    { nombre: 'Manguera 30m', categoria: 'Jardín', stock_actual: 3, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Jardín', descripcion: 'Manguera para riego', codigo_barras: 'INV081', activo: true },
    { nombre: 'Fertilizante 10kg', categoria: 'Jardín', stock_actual: 5, stock_minimo: 2, unidad: 'saco', ubicacion: 'Jardín', descripcion: 'Fertilizante para plantas', codigo_barras: 'INV082', activo: true },
    
    // Deportes
    { nombre: 'Balón de Fútbol', categoria: 'Deportes', stock_actual: 8, stock_minimo: 3, unidad: 'pieza', ubicacion: 'Salón de Eventos', descripcion: 'Balón oficial', codigo_barras: 'INV090', activo: true },
    { nombre: 'Balón de Básquetbol', categoria: 'Deportes', stock_actual: 5, stock_minimo: 2, unidad: 'pieza', ubicacion: 'Salón de Eventos', descripcion: 'Balón moldeado', codigo_barras: 'INV091', activo: true },
    { nombre: 'Red de Voleibol', categoria: 'Deportes', stock_actual: 2, stock_minimo: 1, unidad: 'pieza', ubicacion: 'Salón de Eventos', descripcion: 'Red para voleibol', codigo_barras: 'INV092', activo: true },
];

// Usuarios del sistema
const usuarios = [
    { nombre: 'Carlos García', email: 'carlos@iglesia.com', rol: 'admin', activo: true, telefono: '555-0101', fecha_creacion: randomDate(180) },
    { nombre: 'María López', email: 'maria@iglesia.com', rol: 'encargado', activo: true, telefono: '555-0102', fecha_creacion: randomDate(150) },
    { nombre: 'Pedro Sánchez', email: 'pedro@iglesia.com', rol: 'encargado', activo: true, telefono: '555-0103', fecha_creacion: randomDate(120) },
    { nombre: 'Ana Martínez', email: 'ana@iglesia.com', rol: 'voluntario', activo: true, telefono: '555-0104', fecha_creacion: randomDate(90) },
    { nombre: 'Juan Rodríguez', email: 'juan@iglesia.com', rol: 'voluntario', activo: true, telefono: '555-0105', fecha_creacion: randomDate(60) },
    { nombre: 'Luis Hernández', email: 'luis@iglesia.com', rol: 'voluntario', activo: true, telefono: '555-0106', fecha_creacion: randomDate(30) },
];

// ─── Main Seed Function ──────────────────────────────────────────────────
async function seed() {
    console.log('🌱 Iniciando seed de datos para LogINV Iglesia...\n');
    
    try {
        // Limpiar colecciones existentes
        console.log('🗑️  Limpiando colecciones existentes...');
        const collections = ['categorias', 'productos', 'movimientos', 'conteos', 'requerimientos', 'ubicaciones', 'prestamos', 'mantenimiento', 'usuarios', 'auditoria'];
        
        for (const col of collections) {
            await clearCollection(col);
        }
        console.log('✓ Colecciones limpiadas\n');
        
        // 1. Crear Categorías
        console.log('📁 Creando categorías...');
        const categoriasIds = [];
        for (const cat of categorias) {
            const docRef = await addDoc(collection(db, 'categorias'), {
                ...cat,
                fecha_creacion: new Date().toISOString()
            });
            categoriasIds.push({ id: docRef.id, ...cat });
            console.log(`   ✓ ${cat.nombre}`);
        }
        console.log('✓ Categorías creadas\n');
        
        // 2. Crear Ubicaciones
        console.log('📍 Creando ubicaciones...');
        const ubicacionesIds = [];
        for (const ubi of ubicaciones) {
            const docRef = await addDoc(collection(db, 'ubicaciones'), {
                ...ubi,
                fecha_creacion: new Date().toISOString()
            });
            ubicacionesIds.push({ id: docRef.id, ...ubi });
            console.log(`   ✓ ${ubi.nombre}`);
        }
        console.log('✓ Ubicaciones creadas\n');
        
        // 3. Crear Usuarios
        console.log('👤 Creando usuarios...');
        const usuariosIds = [];
        for (const user of usuarios) {
            const docRef = await addDoc(collection(db, 'usuarios'), {
                ...user
            });
            usuariosIds.push({ id: docRef.id, ...user });
            console.log(`   ✓ ${user.nombre} (${user.rol})`);
        }
        console.log('✓ Usuarios creados\n');
        
        // 4. Crear Productos
        console.log('📦 Creando productos...');
        const productosIds = [];
        for (const prod of productos) {
            const docRef = await addDoc(collection(db, 'productos'), {
                ...prod,
                fecha_creacion: randomDate(60),
                ultima_actualizacion: new Date().toISOString()
            });
            productosIds.push({ id: docRef.id, ...prod });
            console.log(`   ✓ ${prod.nombre}`);
        }
        console.log('✓ Productos creados\n');
        
        // 5. Crear Movimientos de Stock
        console.log('🔄 Creando movimientos de stock...');
        const tiposMovimiento = ['INGRESO', 'SALIDA', 'MERMA', 'AJUSTE'];
        for (let i = 0; i < 30; i++) {
            const producto = productosIds[Math.floor(Math.random() * productosIds.length)];
            const tipo = tiposMovimiento[Math.floor(Math.random() * tiposMovimiento.length)];
            const cantidad = Math.floor(Math.random() * 10) + 1;
            const stockAnterior = producto.stock_actual;
            let stockNuevo;
            
            switch(tipo) {
                case 'INGRESO':
                    stockNuevo = stockAnterior + cantidad;
                    break;
                case 'SALIDA':
                    stockNuevo = Math.max(0, stockAnterior - cantidad);
                    break;
                case 'MERMA':
                    stockNuevo = Math.max(0, stockAnterior - 1);
                    break;
                default:
                    stockNuevo = stockAnterior;
            }
            
            await addDoc(collection(db, 'movimientos'), {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                tipo,
                cantidad,
                stock_anterior: stockAnterior,
                stock_nuevo: stockNuevo,
                ubicacion: producto.ubicacion,
                usuario: usuariosIds[Math.floor(Math.random() * usuariosIds.length)].nombre,
                motivo: tipo === 'INGRESO' ? 'Compra de mercancía' : 
                        tipo === 'SALIDA' ? 'Uso en evento' : 
                        tipo === 'MERMA' ? 'Producto dañado' : 'Ajuste de inventario',
                notas: '',
                fecha: randomDate(30)
            });
            
            if (i < 10) console.log(`   ✓ ${tipo} - ${producto.nombre} (${cantidad} ${producto.unidad})`);
        }
        console.log('✓ Movimientos creados (30 total)\n');
        
        // 6. Crear Conteos de Inventario
        console.log('📋 Creando conteos de inventario...');
        const estadosConteo = ['COMPLETADO', 'EN_PROGRESO'];
        for (let i = 0; i < 5; i++) {
            const ubicacion = ubicacionesIds[Math.floor(Math.random() * ubicacionesIds.length)];
            const estado = i === 0 ? 'EN_PROGRESO' : 'COMPLETADO';
            const items = [];
            
            // Agregar items al conteo
            const productosEnUbicacion = productosIds.filter(p => p.ubicacion === ubicacion.nombre);
            for (const prod of productosEnUbicacion.slice(0, 5)) {
                items.push({
                    producto_id: prod.id,
                    producto_nombre: prod.nombre,
                    cantidad_sistema: prod.stock_actual,
                    cantidad_fisica: prod.stock_actual + Math.floor(Math.random() * 5) - 2,
                    diferencias: Math.floor(Math.random() * 3) - 1
                });
            }
            
            await addDoc(collection(db, 'conteos'), {
                usuario: usuariosIds[Math.floor(Math.random() * usuariosIds.length)].nombre,
                ubicacion: ubicacion.nombre,
                estado,
                items,
                notas: i === 0 ? 'Conteo en progreso' : 'Conteo completado sin observaciones',
                fecha: randomDate(15),
                fecha_cierre: estado === 'COMPLETADO' ? randomDate(10) : null
            });
            console.log(`   ✓ Conteo ${i + 1} - ${ubicacion.nombre} (${estado})`);
        }
        console.log('✓ Conteos creados (5 total)\n');
        
        // 7. Crear Préstamos
        console.log('🤝 Creando préstamos...');
        const estadosPrestamo = ['ACTIVO', 'DEVUELTO', 'VENCIDO'];
        for (let i = 0; i < 8; i++) {
            const producto = productosIds[Math.floor(Math.random() * productosIds.length)];
            const estado = estadosPrestamo[Math.floor(Math.random() * estadosPrestamo.length)];
            const cantidad = Math.floor(Math.random() * 5) + 1;
            
            await addDoc(collection(db, 'prestamos'), {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                cantidad,
                prestado_a: ['Familia García', 'Familia López', 'Grupo Juvenil', 'Ministerio de Mujeres', 'Grupo de Jóvenes'][Math.floor(Math.random() * 5)],
                telefono: `555-${Math.floor(Math.random() * 9000) + 1000}`,
                motivo: ['Evento especial', 'Reunión de grupo', 'Actividad pastoral', 'Emergencia'][Math.floor(Math.random() * 4)],
                estado,
                notas: estado === 'DEVUELTO' ? 'Devuelto en buen estado' : '',
                usuario_registro: usuariosIds[Math.floor(Math.random() * usuariosIds.length)].nombre,
                fecha_prestamo: randomDate(20),
                fecha_devolucion: estado === 'DEVUELTO' ? randomDate(5) : null,
                fecha_limite: randomFutureDate(10)
            });
            console.log(`   ✓ Préstamo ${i + 1} - ${producto.nombre} (${estado})`);
        }
        console.log('✓ Préstamos creados (8 total)\n');
        
        // 8. Crear Mantenimiento
        console.log('🔧 Creando registros de mantenimiento...');
        const tiposMantenimiento = ['PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA'];
        const estadosMantenimiento = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'];
        for (let i = 0; i < 6; i++) {
            const producto = productosIds[Math.floor(Math.random() * productosIds.length)];
            const tipo = tiposMantenimiento[Math.floor(Math.random() * tiposMantenimiento.length)];
            const estado = estadosMantenimiento[Math.floor(Math.random() * estadosMantenimiento.length)];
            
            await addDoc(collection(db, 'mantenimiento'), {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                tipo,
                estado,
                tecnico: ['Juan Pérez', 'Carlos López', 'María García'][Math.floor(Math.random() * 3)],
                descripcion: `${tipo === 'PREVENTIVO' ? 'Mantenimiento preventivo programado' : 
                             tipo === 'CORRECTIVO' ? 'Reparación por falla detectada' : 
                             'Reparación de emergencia'} - ${producto.nombre}`,
                notas: estado === 'COMPLETADO' ? 'Trabajo completado satisfactoriamente' : '',
                costo: estado === 'COMPLETADO' ? Math.floor(Math.random() * 500) + 100 : 0,
                fecha_programada: randomDate(10),
                fecha_completado: estado === 'COMPLETADO' ? randomDate(3) : null,
                usuario_registro: usuariosIds[Math.floor(Math.random() * usuariosIds.length)].nombre
            });
            console.log(`   ✓ Mantenimiento ${i + 1} - ${producto.nombre} (${tipo}/${estado})`);
        }
        console.log('✓ Mantenimiento creado (6 registros)\n');
        
        // 9. Crear Auditoría
        console.log('📝 Creando registros de auditoría...');
        const accionesAuditoria = ['CREAR', 'EDITAR', 'ELIMINAR', 'LOGIN', 'LOGOUT'];
        const entidades = ['PRODUCTO', 'USUARIO', 'UBICACION', 'PRESTAMO', 'MANTENIMIENTO'];
        for (let i = 0; i < 20; i++) {
            const usuario = usuariosIds[Math.floor(Math.random() * usuariosIds.length)];
            const accion = accionesAuditoria[Math.floor(Math.random() * accionesAuditoria.length)];
            const entidad = entidades[Math.floor(Math.random() * entidades.length)];
            
            await addDoc(collection(db, 'auditoria'), {
                usuario_id: usuario.id,
                usuario_nombre: usuario.nombre,
                accion,
                entidad,
                entidad_id: randomId(),
                detalles: { 
                    ip: '192.168.1.' + Math.floor(Math.random() * 255),
                    navegador: 'Chrome'
                },
                timestamp: randomDate(30)
            });
            
            if (i < 10) console.log(`   ✓ ${accion} en ${entidad} por ${usuario.nombre}`);
        }
        console.log('✓ Auditoría creada (20 registros)\n');
        
        console.log('═══════════════════════════════════════════════════════════════════');
        console.log('✅ ¡Seed completado exitosamente!');
        console.log('═══════════════════════════════════════════════════════════════════');
        console.log('\n📊 Resumen de datos creados:');
        console.log(`   • ${categorias.length} categorías`);
        console.log(`   • ${ubicaciones.length} ubicaciones`);
        console.log(`   • ${usuarios.length} usuarios`);
        console.log(`   • ${productos.length} productos`);
        console.log(`   • 30 movimientos de stock`);
        console.log(`   • 5 conteos de inventario`);
        console.log(`   • 8 préstamos`);
        console.log(`   • 6 registros de mantenimiento`);
        console.log(`   • 20 registros de auditoría`);
        console.log('\n🚀 Puedes iniciar la aplicación con: npm run dev');
        
    } catch (error) {
        console.error('❌ Error durante el seed:', error);
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
