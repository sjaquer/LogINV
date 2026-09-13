// ═══════════════════════════════════════════════════════════════════════════
//  VALIDATORS - LogINV v2.0
//  Funciones de validación para formularios y datos
// ═══════════════════════════════════════════════════════════════════════════

// ─── Validación de Email ─────────────────────────────────────────────────
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ─── Validación de Teléfono ──────────────────────────────────────────────
export function isValidPhone(phone) {
  // Permite formatos: +51999999999, 999999999, (01) 999-9999
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone);
}

// ─── Validación de Código de Barras ──────────────────────────────────────
export function isValidBarcode(barcode) {
  if (!barcode) return false;
  // EAN-13, EAN-8, UPC-A, UPC-E, Code 128, etc.
  const barcodeRegex = /^\d{8,14}$/;
  return barcodeRegex.test(barcode);
}

// ─── Validación de ID de Inventario ──────────────────────────────────────
export function isValidInventoryId(id) {
  if (!id) return false;
  // Formato:INV-XXXXX o similar
  const idRegex = /^(INV|INV\-)?\w{4,20}$/i;
  return idRegex.test(id);
}

// ─── Validación de Nombre ────────────────────────────────────────────────
export function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

// ─── Validación de Descripción ───────────────────────────────────────────
export function isValidDescription(desc, maxLength = 500) {
  if (!desc) return true; // Opcional
  return desc.length <= maxLength;
}

// ─── Validación de Cantidad ──────────────────────────────────────────────
export function isValidQuantity(qty) {
  const num = Number(qty);
  return !isNaN(num) && num >= 0 && Number.isInteger(num);
}

// ─── Validación de Precio ────────────────────────────────────────────────
export function isValidPrice(price) {
  const num = Number(price);
  return !isNaN(num) && num >= 0;
}

// ─── Validación de Fecha ─────────────────────────────────────────────────
export function isValidDate(date) {
  if (!date) return false;
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

// ─── Validación de Fecha No Futura ───────────────────────────────────────
export function isDateNotFuture(date) {
  if (!date) return false;
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d <= new Date();
}

// ─── Validación de Fecha No Pasada ───────────────────────────────────────
export function isDateNotPast(date) {
  if (!date) return false;
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d >= new Date();
}

// ─── Validación de Archivo de Imagen ─────────────────────────────────────
export function isValidImageFile(file, maxSizeMB = 5) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) return false;
  if (file.size > maxSizeMB * 1024 * 1024) return false;
  return true;
}

// ─── Validación de Contraseña ────────────────────────────────────────────
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

// ─── Validación de Rol ───────────────────────────────────────────────────
export function isValidRole(role) {
  const validRoles = ['admin', 'encargado', 'voluntario'];
  return validRoles.includes(role);
}

// ─── Validación de Estado ────────────────────────────────────────────────
export function isValidStatus(status, validStatuses) {
  return validStatuses.includes(status);
}

// ─── Validación de Objeto Completo ───────────────────────────────────────
export function validateProduct(product) {
  const errors = {};

  if (!isValidName(product.nombre)) {
    errors.nombre = 'El nombre debe tener entre 2 y 100 caracteres';
  }

  if (product.codigo_barras && !isValidBarcode(product.codigo_barras)) {
    errors.codigo_barras = 'Código de barras inválido';
  }

  if (product.id_inventario && !isValidInventoryId(product.id_inventario)) {
    errors.id_inventario = 'ID de inventario inválido';
  }

  if (!isValidQuantity(product.cantidad)) {
    errors.cantidad = 'La cantidad debe ser un número entero positivo';
  }

  if (product.cantidad_minima !== undefined && !isValidQuantity(product.cantidad_minima)) {
    errors.cantidad_minima = 'La cantidad mínima debe ser un número entero positivo';
  }

  if (product.descripcion && !isValidDescription(product.descripcion)) {
    errors.descripcion = 'La descripción no puede exceder 500 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ─── Validación de Préstamo ──────────────────────────────────────────────
export function validateLoan(loan) {
  const errors = {};

  if (!loan.producto_id) {
    errors.producto_id = 'Selecciona un producto';
  }

  if (!isValidName(loan.prestado_a)) {
    errors.prestado_a = 'El nombre del destinatario es requerido';
  }

  if (loan.contacto && !isValidPhone(loan.contacto)) {
    errors.contacto = 'Teléfono de contacto inválido';
  }

  if (!loan.fecha_prestamo) {
    errors.fecha_prestamo = 'La fecha de préstamo es requerida';
  }

  if (!loan.fecha_devolucion_esperada) {
    errors.fecha_devolucion_esperada = 'La fecha de devolución esperada es requerida';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ─── Validación de Mantenimiento ─────────────────────────────────────────
export function validateMaintenance(maintenance) {
  const errors = {};

  if (!maintenance.producto_id) {
    errors.producto_id = 'Selecciona un producto';
  }

  if (!maintenance.descripcion || maintenance.descripcion.trim().length < 5) {
    errors.descripcion = 'La descripción debe tener al menos 5 caracteres';
  }

  if (!maintenance.fecha_programada) {
    errors.fecha_programada = 'La fecha programada es requerida';
  }

  if (!maintenance.responsable || !isValidName(maintenance.responsable)) {
    errors.responsable = 'El responsable es requerido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ─── Validación de Ubicación ─────────────────────────────────────────────
export function validateLocation(location) {
  const errors = {};

  if (!isValidName(location.nombre)) {
    errors.nombre = 'El nombre debe tener entre 2 y 100 caracteres';
  }

  if (location.capacidad !== undefined && !isValidQuantity(location.capacidad)) {
    errors.capacidad = 'La capacidad debe ser un número entero positivo';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ─── Validación de Categoría ─────────────────────────────────────────────
export function validateCategory(category) {
  const errors = {};

  if (!isValidName(category.nombre)) {
    errors.nombre = 'El nombre debe tener entre 2 y 100 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
