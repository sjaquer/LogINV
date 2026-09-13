// ═══════════════════════════════════════════════════════════════════════════
//  UTILS - LogINV v2.0
//  Funciones de utilidad general
// ═══════════════════════════════════════════════════════════════════════════

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases CSS con soporte para Tailwind
 * Equivalente a la función cn() de shadcn/ui
 * @param {...(string|Object|Array)} inputs - Clases a combinar
 * @returns {string} Clases combinadas
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Re-exportar funciones de formatters ──────────────────────────────────
export {
  formatDate,
  formatDateTime,
  formatRelativeDate,
  daysUntil,
  semaforoColor,
  semaforoBg,
  semaforoRowBg,
  formatCurrency,
  formatNumber,
  formatPercent,
  capitalize,
  truncate,
  getInitials,
  formatFileSize,
  formatBarcode,
  formatInventoryId,
  getStatusClasses,
  getStatusLabel,
} from './formatters';
