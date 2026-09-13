// ═══════════════════════════════════════════════════════════════════════════
//  generateMockData.js - LogINV Iglesia CNC
//  Genera src/lib/mockDataStore.js a partir de "CODIGOS CNC.xlsx" usando la
//  misma normalización que scripts/seedExcel.js (scripts/lib/excelMapping.js),
//  para que el modo MOCK (sin Firebase configurado) refleje el inventario
//  real de la iglesia en vez de datos de bar/restaurante.
//
//  Uso: node scripts/generateMockData.js
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const {
    normalizeCategory,
    normalizeLocation,
    normalizeStatus,
    normalizeResponsibility,
    readExcelData,
} = require('./lib/excelMapping');

const excelPath = path.join(__dirname, '../data/CODIGOS CNC.xlsx');
const outPath = path.join(__dirname, '../src/lib/mockDataStore.js');

const items = readExcelData(excelPath);
console.log(`📖 ${items.length} items leídos de CODIGOS CNC.xlsx`);

// ─── Categorías únicas ────────────────────────────────────────────────────
const categoriasPorNombre = new Map();
for (const item of items) {
    const cat = normalizeCategory(item.categoria_raw);
    if (!categoriasPorNombre.has(cat.nombre)) {
        categoriasPorNombre.set(cat.nombre, {
            id: `cat_${slugify(cat.nombre)}`,
            nombre: cat.nombre,
            descripcion: `Categoría de ${cat.nombre}`,
            color: cat.color,
            icono: cat.icono,
            orden: cat.orden,
            activa: true,
        });
    }
}
const categorias = [...categoriasPorNombre.values()].sort((a, b) => a.orden - b.orden);

// ─── Productos ────────────────────────────────────────────────────────────
const productos = items.map((item, i) => {
    const cat = normalizeCategory(item.categoria_raw);
    const ubi = normalizeLocation(item.ubicacion_raw);
    const estado = normalizeStatus(item.estado_raw);
    const responsabilidad = normalizeResponsibility(item.responsabilidad_raw);

    return {
        id: `p${i + 1}`,
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoria: cat.nombre,
        ubicacion: ubi.id,
        ubicacion_nombre: ubi.nombre,
        stock_actual: item.stock_inicial,
        stock_minimo: Math.max(1, Math.floor(item.stock_inicial * 0.2)),
        unidad: 'pieza',
        estado,
        responsabilidad,
        observaciones: item.observaciones,
        piso: typeof item.piso === 'string' ? item.piso : `Piso ${item.piso}`,
        fuente: item.fuente,
        codigo_barras: item.codigo_barras,
    };
});

function slugify(str) {
    return String(str)
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function jsLiteral(value) {
    return JSON.stringify(value, null, 4)
        .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:');
}

const header = `// src/lib/mockDataStore.js
// ═══════════════════════════════════════════════════════════════════════════
//  GENERADO AUTOMÁTICAMENTE por scripts/generateMockData.js
//  Fuente: data/CODIGOS CNC.xlsx (inventario real IACYM CNC)
//  No editar a mano — para regenerar: node scripts/generateMockData.js
// ═══════════════════════════════════════════════════════════════════════════

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
export const MOCK_CATEGORIAS = ${jsLiteral(categorias)}.map((c, i) => ({ ...c, fecha_creacion: daysAgo(90 - i) }));

// ─── PRODUCTOS (inventario real de la iglesia) ──
export const MOCK_PRODUCTOS = ${jsLiteral(productos)}.map((p, i) => ({ ...p, ultima_actualizacion: daysAgo(i % 30) }));

// ─── CONTEOS DIARIOS ──
export const MOCK_CONTEOS = [];

// ─── MOVIMIENTOS ──
export const MOCK_MOVIMIENTOS = MOCK_PRODUCTOS.filter(p => p.stock_actual > 0).map((p, i) => ({
    id: \`m\${i + 1}\`,
    producto_id: p.id,
    nombre_producto: p.nombre,
    tipo: 'INGRESO',
    cantidad: p.stock_actual,
    usuario: 'Sistema',
    ubicacion: p.ubicacion,
    fecha: daysAgo(90),
    motivo_merma: null,
}));
`;

fs.writeFileSync(outPath, header, 'utf-8');
console.log(`✅ ${categorias.length} categorías y ${productos.length} productos escritos en src/lib/mockDataStore.js`);
