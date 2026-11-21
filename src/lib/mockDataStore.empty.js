// Sustituto vacío de mockDataStore.js para builds de producción.
// next.config.js lo usa salvo que NEXT_PUBLIC_USE_MOCK=true, para que los
// datos de demostración (generados desde el inventario real) no se incluyan
// en el JavaScript público.
export const MOCK_CATEGORIAS = [];
export const MOCK_PRODUCTOS = [];
export const MOCK_CONTEOS = [];
export const MOCK_MOVIMIENTOS = [];
