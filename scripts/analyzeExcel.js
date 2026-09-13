// Script para leer y analizar archivos Excel
const XLSX = require('xlsx');
const path = require('path');

function readExcelFile(filePath) {
    console.log(`\n📁 Leyendo: ${path.basename(filePath)}`);
    console.log('─'.repeat(80));
    
    const workbook = XLSX.readFile(filePath);
    
    for (const sheetName of workbook.SheetNames) {
        console.log(`\n📋 Hoja: ${sheetName}`);
        console.log('─'.repeat(60));
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (data.length === 0) {
            console.log('   (vacía)');
            continue;
        }
        
        // Mostrar columnas
        const headers = Object.keys(data[0]);
        console.log(`   Columnas (${headers.length}):`, headers.join(', '));
        
        // Mostrar primeras 5 filas
        console.log(`\n   Primeras filas (total: ${data.length}):`);
        data.slice(0, 10).forEach((row, i) => {
            console.log(`   [${i + 1}]`, JSON.stringify(row, null, 0));
        });
        
        // Estadísticas básicas
        console.log(`\n   📊 Estadísticas:`);
        console.log(`   - Total de registros: ${data.length}`);
        
        // Buscar columnas con categorías/estados
        for (const header of headers) {
            const values = [...new Set(data.map(row => row[header]).filter(v => v !== undefined && v !== null && v !== ''))];
            if (values.length > 0 && values.length <= 20) {
                console.log(`   - Valores únicos en "${header}" (${values.length}):`, values.slice(0, 10).join(', '));
            }
        }
    }
    
    return workbook;
}

// Leer ambos archivos
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('  ANÁLISIS DE ARCHIVOS EXCEL - LOGINV IGLESIA');
console.log('═══════════════════════════════════════════════════════════════════════════');

const codigosPath = path.join(__dirname, '../data/CODIGOS CNC.xlsx');
const inventarioPath = path.join(__dirname, '../data/INVENTARIO CNC.xlsx');

readExcelFile(codigosPath);
readExcelFile(inventarioPath);

console.log('\n═══════════════════════════════════════════════════════════════════════════');
console.log('  FIN DEL ANÁLISIS');
console.log('═══════════════════════════════════════════════════════════════════════════');
