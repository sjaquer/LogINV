// ═══════════════════════════════════════════════════════════════════════════
//  FORMATTERS - LogINV v2.0
//  Funciones de formateo para fechas, números, textos, etc.
// ═══════════════════════════════════════════════════════════════════════════

import { format, formatDistanceToNow, isToday, isYesterday, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Formateo de Fechas ──────────────────────────────────────────────────

/**
 * Convierte de forma robusta cualquier valor a un objeto Date válido.
 * Soporta Date, Firestore Timestamps (.toDate()), objetos serializados ({ seconds, _seconds }),
 * números (epoch ms o s), e strings ISO o de fecha.
 * Retorna null si no es una fecha válida.
 * @param {any} value
 * @returns {Date|null}
 */
export function toValidDate(value) {
  if (!value) return null;
  try {
    let date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value?.toDate === 'function') {
      date = value.toDate();
    } else if (typeof value?.seconds === 'number') {
      date = new Date(value.seconds * 1000);
    } else if (typeof value?._seconds === 'number') {
      date = new Date(value._seconds * 1000);
    } else if (typeof value === 'number') {
      date = new Date(value < 10000000000 ? value * 1000 : value);
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      date = parseISO(trimmed);
      if (!isValid(date)) {
        date = new Date(trimmed);
      }
    } else {
      date = new Date(value);
    }
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Formatea una fecha a formato legible
 * @param {Date|string|Object} value - Fecha a formatear
 * @param {string} pattern - Patrón de formato (default: 'dd MMM yyyy')
 * @returns {string} Fecha formateada
 */
export function formatDate(value, pattern = 'dd MMM yyyy') {
  const date = toValidDate(value);
  if (!date) return '—';
  try {
    return format(date, pattern, { locale: es });
  } catch {
    return '—';
  }
}

/**
 * Formatea una fecha con hora
 * @param {Date|string|Object} value - Fecha a formatear
 * @returns {string} Fecha y hora formateada
 */
export function formatDateTime(value) {
  const date = toValidDate(value);
  if (!date) return '—';
  try {
    return format(date, "dd MMM yyyy HH:mm", { locale: es });
  } catch {
    return '—';
  }
}

/**
 * Formatea una fecha de forma relativa (hace 2 horas, hace 3 días, etc.)
 * @param {Date|string|Object} value - Fecha a formatear
 * @returns {string} Fecha relativa
 */
export function formatRelativeDate(value) {
  const date = toValidDate(value);
  if (!date) return '—';
  try {
    if (isToday(date)) {
      return `Hoy ${format(date, 'HH:mm')}`;
    }
    if (isYesterday(date)) {
      return `Ayer ${format(date, 'HH:mm')}`;
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return '—';
  }
}

/**
 * Calcula los días hasta una fecha
 * @param {Date|string|Object} value - Fecha objetivo
 * @returns {number} Días restantes (negativo si ya pasó)
 */
export function daysUntil(value) {
  const date = toValidDate(value);
  if (!date) return Infinity;
  const now = new Date();
  return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene el color del semáforo basado en días restantes
 * @param {number} days - Días restantes
 * @returns {string} Color del semáforo
 */
export function semaforoColor(days) {
  if (days <= 3) return 'red';
  if (days <= 7) return 'yellow';
  return 'green';
}

/**
 * Obtiene las clases CSS del semáforo
 * @param {number} days - Días restantes
 * @returns {string} Clases CSS
 */
export function semaforoBg(days) {
  if (days <= 3) return 'bg-red-500/10 border-red-500/30 text-red-400';
  if (days <= 7) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
}

/**
 * Obtiene las clases CSS de fondo para filas con semáforo
 * @param {number} days - Días restantes
 * @returns {string} Clases CSS
 */
export function semaforoRowBg(days) {
  if (days <= 3) return 'bg-red-50 border-l-2 border-l-red-500';
  if (days <= 7) return 'bg-amber-50 border-l-2 border-l-amber-500';
  return '';
}

// ─── Formateo de Números ─────────────────────────────────────────────────

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: 'PEN')
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount, currency = 'PEN') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('es-PE').format(num);
}

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear (0-100)
 * @returns {string} Porcentaje formateado
 */
export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)}%`;
}

// ─── Formateo de Texto ───────────────────────────────────────────────────

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalize(text) {
  if (!text) return '';
  return text.replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Trunca un texto a cierta longitud
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Genera iniciales de un nombre
 * @param {string} name - Nombre completo
 * @param {number} maxInitials - Máximo de iniciales
 * @returns {string} Iniciales
 */
export function getInitials(name, maxInitials = 2) {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, maxInitials)
    .join('')
    .toUpperCase();
}

// ─── Formateo de Archivos ────────────────────────────────────────────────

/**
 * Formatea el tamaño de un archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Formateo de Códigos ─────────────────────────────────────────────────

/**
 * Formatea un código de barras con espacios para legibilidad
 * @param {string} barcode - Código de barras
 * @returns {string} Código formateado
 */
export function formatBarcode(barcode) {
  if (!barcode) return '';
  // Agrupa de 4 en 4 para legibilidad
  return barcode.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Genera un ID de inventario formateado
 * @param {number} number - Número secuencial
 * @param {string} prefix - Prefijo (default: 'INV')
 * @returns {string} ID formateado
 */
export function formatInventoryId(number, prefix = 'INV') {
  return `${prefix}-${String(number).padStart(5, '0')}`;
}

// ─── Formateo de Estados ─────────────────────────────────────────────────

/**
 * Obtiene las clases CSS para un estado
 * @param {string} status - Estado del elemento
 * @returns {string} Clases CSS
 */
export function getStatusClasses(status) {
  const statusClasses = {
    disponible: 'bg-emerald-100 text-emerald-800',
    prestado: 'bg-blue-100 text-blue-800',
    mantenimiento: 'bg-amber-100 text-amber-800',
    dado_de_baja: 'bg-red-100 text-red-800',
    activo: 'bg-blue-100 text-blue-800',
    devuelto: 'bg-emerald-100 text-emerald-800',
    vencido: 'bg-red-100 text-red-800',
    programado: 'bg-blue-100 text-blue-800',
    en_progreso: 'bg-amber-100 text-amber-800',
    completado: 'bg-emerald-100 text-emerald-800',
  };
  return statusClasses[status] || 'bg-slate-100 text-slate-800';
}

/**
 * Obtiene el label legible de un estado
 * @param {string} status - Estado del elemento
 * @returns {string} Label del estado
 */
export function getStatusLabel(status) {
  const statusLabels = {
    disponible: 'Disponible',
    prestado: 'Prestado',
    mantenimiento: 'En Mantenimiento',
    dado_de_baja: 'Dado de Baja',
    activo: 'Activo',
    devuelto: 'Devuelto',
    vencido: 'Vencido',
    programado: 'Programado',
    en_progreso: 'En Progreso',
    completado: 'Completado',
  };
  return statusLabels[status] || status;
}
