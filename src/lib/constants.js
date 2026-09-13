// ═══════════════════════════════════════════════════════════════════════════
//  CONSTANTS - LogINV v2.0
//  Constantes centralizadas para todo el sistema
// ═══════════════════════════════════════════════════════════════════════════

// ─── Roles de Usuario ────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: {
    id: 'admin',
    label: 'Administrador',
    permisos: ['inventario', 'prestamos', 'mantenimiento', 'reportes', 'administracion'],
  },
  ENCARGADO: {
    id: 'encargado',
    label: 'Encargado',
    permisos: ['inventario', 'prestamos', 'mantenimiento', 'reportes'],
  },
  VOLUNTARIO: {
    id: 'voluntario',
    label: 'Voluntario',
    permisos: ['inventario', 'prestamos'],
  },
};

// ─── Estados de Productos ────────────────────────────────────────────────
export const ESTADOS_PRODUCTO = {
  DISPONIBLE: { id: 'disponible', label: 'Disponible', color: 'emerald' },
  PRESTADO: { id: 'prestado', label: 'Prestado', color: 'blue' },
  MANTENIMIENTO: { id: 'mantenimiento', label: 'En Mantenimiento', color: 'amber' },
  DADO_DE_BAJA: { id: 'dado_de_baja', label: 'Dado de Baja', color: 'red' },
};

// ─── Estados de Préstamos ────────────────────────────────────────────────
export const ESTADOS_PRESTAMO = {
  ACTIVO: { id: 'activo', label: 'Activo', color: 'blue' },
  DEVUELTO: { id: 'devuelto', label: 'Devuelto', color: 'emerald' },
  VENCIDO: { id: 'vencido', label: 'Vencido', color: 'red' },
};

// ─── Estados de Mantenimiento ────────────────────────────────────────────
export const ESTADOS_MANTENIMIENTO = {
  PROGRAMADO: { id: 'programado', label: 'Programado', color: 'blue' },
  EN_PROGRESO: { id: 'en_progreso', label: 'En Progreso', color: 'amber' },
  COMPLETADO: { id: 'completado', label: 'Completado', color: 'emerald' },
};

// ─── Tipos de Mantenimiento ──────────────────────────────────────────────
export const TIPOS_MANTENIMIENTO = {
  PREVENTIVO: { id: 'preventivo', label: 'Preventivo', color: 'blue' },
  CORRECTIVO: { id: 'correctivo', label: 'Correctivo', color: 'red' },
};

// ─── Tipos de Movimiento ─────────────────────────────────────────────────
export const TIPOS_MOVIMIENTO = {
  INGRESO: { id: 'ingreso', label: 'Ingreso', color: 'emerald' },
  SALIDA: { id: 'salida', label: 'Salida', color: 'red' },
  AJUSTE: { id: 'ajuste', label: 'Ajuste', color: 'amber' },
  PRESTAMO: { id: 'prestamo', label: 'Préstamo', color: 'blue' },
  DEVOLUCION: { id: 'devolucion', label: 'Devolución', color: 'violet' },
};

// ─── Acciones de Auditoría ───────────────────────────────────────────────
export const ACCIONES_AUDITORIA = {
  CREAR: 'crear',
  EDITAR: 'editar',
  ELIMINAR: 'eliminar',
  PRESTAR: 'prestar',
  DEVOLVER: 'devolver',
  CONTAR: 'contar',
  MANTENIMIENTO: 'mantenimiento',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

// ─── Entidades del Sistema ───────────────────────────────────────────────
export const ENTIDADES = {
  PRODUCTO: 'producto',
  CATEGORIA: 'categoria',
  UBICACION: 'ubicacion',
  PRESTAMO: 'prestamo',
  MANTENIMIENTO: 'mantenimiento',
  CONTEO: 'conteo',
  USUARIO: 'usuario',
};

// ─── Nombres de Colecciones Firestore ────────────────────────────────────
export const COLLECTIONS = {
  PRODUCTOS: 'productos',
  CATEGORIAS: 'categorias',
  UBICACIONES: 'ubicaciones',
  PRESTAMOS: 'prestamos',
  MANTENIMIENTOS: 'mantenimientos',
  MOVIMIENTOS: 'movimientos',
  CONTEOS: 'conteos',
  USUARIOS: 'usuarios',
  AUDITORIA: 'auditoria',
};

// ─── Configuración de Google Drive ───────────────────────────────────────
export const GOOGLE_DRIVE = {
  API_KEY: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY,
  CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID,
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPE: 'https://www.googleapis.com/auth/drive.file',
  FOLDER_NAME: 'LogINV_Imagenes',
};

// ─── Configuración de la Aplicación ──────────────────────────────────────
export const APP_CONFIG = {
  NAME: 'LogINV',
  VERSION: '2.0.0',
  DESCRIPTION: 'Sistema de Inventario para Iglesia',
  ITEMS_PER_PAGE: 20,
  LOW_STOCK_THRESHOLD: 5,
  EXPIRATION_WARNING_DAYS: 30,
  MAX_UPLOAD_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

// ─── Colores de Tailwind para Estados ────────────────────────────────────
export const STATUS_COLORS = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-800',
  },
  slate: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-800',
  },
};

// ─── Rutas de Navegación (deben existir realmente en src/app) ────────────
export const ROUTES = {
  HOME: '/',
  PRODUCTOS: '/productos',
  INVENTARIO: '/inventario',
  SCAN: '/scan',
  LOCATIONS: '/locations',
  LOANS: '/loans',
  MAINTENANCE: '/maintenance',
  REPORTS: '/reports',
  ADMIN_USERS: '/admin/users',
};

// ─── Mensajes de Error ───────────────────────────────────────────────────
export const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'Permisos denegados. Contacta al administrador.',
  NOT_FOUND: 'Elemento no encontrado.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  VALIDATION_ERROR: 'Datos inválidos. Revisa el formulario.',
  DUPLICATE_ERROR: 'Ya existe un elemento con esos datos.',
  FIRESTORE_INDEX: 'Firestore requiere un índice. Revisa la consola.',
  GOOGLE_DRIVE_ERROR: 'Error al subir imagen a Google Drive.',
  MAX_FILE_SIZE: 'El archivo excede el tamaño máximo permitido.',
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido.',
};

// ─── Mensajes de Éxito ───────────────────────────────────────────────────
export const SUCCESS_MESSAGES = {
  CREATED: 'Elemento creado exitosamente.',
  UPDATED: 'Elemento actualizado exitosamente.',
  DELETED: 'Elemento eliminado exitosamente.',
  IMAGE_UPLOADED: 'Imagen subida exitosamente.',
  LOAN_CREATED: 'Préstamo registrado exitosamente.',
  LOAN_RETURNED: 'Devolución registrada exitosamente.',
  MAINTENANCE_SCHEDULED: 'Mantenimiento programado exitosamente.',
  MAINTENANCE_COMPLETED: 'Mantenimiento completado exitosamente.',
};
