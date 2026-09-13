// ═══════════════════════════════════════════════════════════════════════════
//  MOCK HELPERS - LogINV v2.0
//  Funciones auxiliares para datos de prueba (mock mode)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea un timestamp mock compatible con Firestore
 * @param {Date} [date] - Fecha a usar (default: ahora)
 * @returns {Object} Timestamp mock con toDate() y seconds
 */
export function mockTimestamp(date = new Date()) {
  return {
    toDate: () => date,
    seconds: date.getTime() / 1000,
    nanoseconds: 0,
  };
}

/**
 * Crea un ID mock único
 * @param {string} prefix - Prefijo del ID
 * @returns {string} ID único
 */
export function mockId(prefix = 'mock') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simula un delay de red
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promise que se resuelve después del delay
 */
export function mockDelay(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Crea un objeto de auditoría mock
 * @param {string} usuarioId - ID del usuario
 * @param {string} accion - Acción realizada
 * @param {string} entidad - Tipo de entidad
 * @param {string} entidadId - ID de la entidad
 * @param {Object} [detalles] - Detalles adicionales
 * @returns {Object} Objeto de auditoría
 */
export function mockAuditLog(usuarioId, accion, entidad, entidadId, detalles = {}) {
  return {
    id: mockId('audit'),
    usuario_id: usuarioId,
    accion,
    entidad,
    entidad_id: entidadId,
    detalles,
    timestamp: mockTimestamp(),
  };
}

/**
 * Valida si el sistema está en modo mock
 * @returns {boolean} True si está en modo mock
 */
export function isMockMode() {
  if (typeof window === 'undefined') return true;
  return (
    process.env.NEXT_PUBLIC_USE_MOCK === 'true' ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

/**
 * Crea un listener mock para simular onSnapshot
 * @param {Function} callback - Función a llamar con los datos
 * @param {Array} data - Datos iniciales
 * @returns {Function} Función de unsubscribe
 */
export function mockOnSnapshot(callback, data) {
  // Llamar inmediatamente con los datos actuales
  callback([...data]);

  // Retornar función de unsubscribe
  return () => {
    // Cleanup mock
  };
}

/**
 * Simula una operación de escritura en Firestore
 * @param {Object} data - Datos a "guardar"
 * @param {string} operation - Tipo de operación (set, update, add)
 * @returns {Promise<Object>} Resultado mock
 */
export async function mockWriteOperation(data, operation = 'add') {
  await mockDelay(50);
  
  if (operation === 'add') {
    return { id: mockId('doc'), ...data };
  }
  
  return data;
}

/**
 * Simula una operación de eliminación en Firestore
 * @param {string} id - ID del documento a "eliminar"
 * @returns {Promise<void>}
 */
export async function mockDeleteOperation(id) {
  await mockDelay(50);
  return;
}

/**
 * Crea un mock timestamp a partir de una cadena de fecha
 * @param {string} dateString - Cadena de fecha (ISO o parseable)
 * @returns {Object} Timestamp mock
 */
export function mockTimestampFromDate(dateString) {
  const date = new Date(dateString);
  return mockTimestamp(date);
}

/**
 * Calcula días hasta una fecha (mock)
 * @param {Object} timestamp - Timestamp mock o Date
 * @returns {number} Días restantes
 */
export function mockDaysUntil(timestamp) {
  if (!timestamp) return Infinity;
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
}

/**
 * Genera datos mock de producto para pruebas
 * @param {Object} overrides - Campos a sobrescribir
 * @returns {Object} Producto mock
 */
export function mockProduct(overrides = {}) {
  return {
    id: mockId('prod'),
    nombre: 'Producto Mock',
    descripcion: 'Descripción del producto mock',
    categoria_id: 'cat_1',
    ubicacion_id: 'ub_1',
    codigo_barras: '7750182000123',
    id_inventario: 'INV-00001',
    imagen_url: null,
    estado: 'disponible',
    cantidad: 10,
    cantidad_minima: 5,
    fecha_adquisicion: mockTimestamp(),
    fecha_ultimo_mantenimiento: null,
    proximo_mantenimiento: null,
    notas: '',
    created_at: mockTimestamp(),
    updated_at: mockTimestamp(),
    ...overrides,
  };
}

/**
 * Genera datos mock de préstamo para pruebas
 * @param {Object} overrides - Campos a sobrescribir
 * @returns {Object} Préstamo mock
 */
export function mockLoan(overrides = {}) {
  return {
    id: mockId('loan'),
    producto_id: 'prod_1',
    ubicacion_origen: 'ub_1',
    prestado_a: 'Juan Pérez',
    contacto: '999888777',
    fecha_prestamo: mockTimestamp(),
    fecha_devolucion_esperada: mockTimestamp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    fecha_devolucion_real: null,
    estado: 'activo',
    notas: 'Préstamo para evento',
    created_by: 'user1',
    created_at: mockTimestamp(),
    ...overrides,
  };
}

/**
 * Genera datos mock de mantenimiento para pruebas
 * @param {Object} overrides - Campos a sobrescribir
 * @returns {Object} Mantenimiento mock
 */
export function mockMaintenance(overrides = {}) {
  return {
    id: mockId('maint'),
    producto_id: 'prod_1',
    tipo: 'preventivo',
    descripcion: 'Mantenimiento preventivo programado',
    estado: 'programado',
    fecha_programada: mockTimestamp(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    fecha_inicio: null,
    fecha_fin: null,
    costo: 0,
    responsable: 'Técnico de mantenimiento',
    notas: '',
    created_at: mockTimestamp(),
    ...overrides,
  };
}

/**
 * Genera datos mock de ubicación para pruebas
 * @param {Object} overrides - Campos a sobrescribir
 * @returns {Object} Ubicación mock
 */
export function mockLocation(overrides = {}) {
  return {
    id: mockId('loc'),
    nombre: 'Ubicación Mock',
    descripcion: 'Descripción de la ubicación',
    capacidad: 100,
    activa: true,
    created_at: mockTimestamp(),
    ...overrides,
  };
}

/**
 * Genera datos mock de categoría para pruebas
 * @param {Object} overrides - Campos a sobrescribir
 * @returns {Object} Categoría mock
 */
export function mockCategory(overrides = {}) {
  return {
    id: mockId('cat'),
    nombre: 'Categoría Mock',
    descripcion: 'Descripción de la categoría',
    created_at: mockTimestamp(),
    ...overrides,
  };
}
