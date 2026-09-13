// ═══════════════════════════════════════════════════════════════════════════
//  Audit Service - LogINV v2.0
//  Servicio de auditoría para registrar acciones del sistema
// ═══════════════════════════════════════════════════════════════════════════

import { USE_MOCK, getFirestore, firebaseError } from '@/hooks/useFirestoreQuery';
import { ACCIONES_AUDITORIA, ENTIDADES, COLLECTIONS } from '@/lib/constants';

// ─── Mock Audit Logs ─────────────────────────────────────────────────────
let mockAuditoria = [];

// ─── Create Audit Log ────────────────────────────────────────────────────
export async function createAuditLog({
    usuarioId,
    usuarioNombre,
    accion,
    entidad,
    entidadId,
    detalles = {}
}) {
    const auditLog = {
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre,
        accion,
        entidad,
        entidad_id: entidadId,
        detalles,
        timestamp: new Date().toISOString(),
    };

    if (USE_MOCK) {
        const id = 'audit_' + Date.now();
        mockAuditoria = [{ id, ...auditLog }, ...mockAuditoria];
        console.log('[LogINV] Audit:', accion, entidad, entidadId);
        return id;
    }

    try {
        const { fs, db } = await getFirestore();
        const docRef = await fs.addDoc(fs.collection(db, COLLECTIONS.AUDITORIA), {
            ...auditLog,
            timestamp: fs.serverTimestamp(),
        });
        return docRef.id;
    } catch (err) {
        console.error('[LogINV] Error creating audit log:', err);
        // Don't throw - audit logs shouldn't break the app
        return null;
    }
}

// ─── Get Audit Logs ──────────────────────────────────────────────────────
export async function getAuditLogs({
    entidad = null,
    entidadId = null,
    usuarioId = null,
    fechaDesde = null,
    fechaHasta = null,
    limit = 100
} = {}) {
    if (USE_MOCK) {
        let logs = [...mockAuditoria];

        if (entidad) logs = logs.filter(l => l.entidad === entidad);
        if (entidadId) logs = logs.filter(l => l.entidad_id === entidadId);
        if (usuarioId) logs = logs.filter(l => l.usuario_id === usuarioId);

        return logs.slice(0, limit);
    }

    try {
        const { fs, db } = await getFirestore();
        let q = fs.collection(db, COLLECTIONS.AUDITORIA);

        // Apply filters
        if (entidad) q = fs.query(q, fs.where('entidad', '==', entidad));
        if (entidadId) q = fs.query(q, fs.where('entidad_id', '==', entidadId));
        if (usuarioId) q = fs.query(q, fs.where('usuario_id', '==', usuarioId));

        // Order by timestamp descending
        q = fs.query(q, fs.orderBy('timestamp', 'desc'), fs.limit(limit));

        const snapshot = await fs.getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (err) {
        console.error('[LogINV] Error getting audit logs:', err);
        return [];
    }
}

// ─── Helper Functions for Common Audit Actions ───────────────────────────
export const auditActions = {
    // Product actions
    async crearProducto(usuario, producto) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES.PRODUCTO,
            entidadId: producto.id,
            detalles: { nombre: producto.nombre }
        });
    },

    async editarProducto(usuario, producto, cambios) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.EDITAR,
            entidad: ENTIDADES.PRODUCTO,
            entidadId: producto.id,
            detalles: { nombre: producto.nombre, cambios }
        });
    },

    async eliminarProducto(usuario, producto) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.ELIMINAR,
            entidad: ENTIDADES.PRODUCTO,
            entidadId: producto.id,
            detalles: { nombre: producto.nombre }
        });
    },

    // Loan actions
    async crearPrestamo(usuario, prestamo) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES.PRESTAMO,
            entidadId: prestamo.id,
            detalles: { producto: prestamo.producto_nombre, prestado_a: prestamo.prestado_a }
        });
    },

    async devolverPrestamo(usuario, prestamo) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.DEVOLVER,
            entidad: ENTIDADES.PRESTAMO,
            entidadId: prestamo.id,
            detalles: { producto: prestamo.producto_nombre, prestado_a: prestamo.prestado_a }
        });
    },

    // Inventory count actions
    async crearConteo(usuario, conteo) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES.CONTEO,
            entidadId: conteo.id,
            detalles: { ubicacion: conteo.ubicacion }
        });
    },

    async completarConteo(usuario, conteo, diferencias) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.CONTAR,
            entidad: ENTIDADES.CONTEO,
            entidadId: conteo.id,
            detalles: { ubicacion: conteo.ubicacion, diferencias }
        });
    },

    // Maintenance actions
    async crearMantenimiento(usuario, mantenimiento) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.CREAR,
            entidad: ENTIDADES.MANTENIMIENTO,
            entidadId: mantenimiento.id,
            detalles: { producto: mantenimiento.producto_nombre, tipo: mantenimiento.tipo }
        });
    },

    async completarMantenimiento(usuario, mantenimiento) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.MANTENIMIENTO,
            entidad: ENTIDADES.MANTENIMIENTO,
            entidadId: mantenimiento.id,
            detalles: { producto: mantenimiento.producto_nombre, costo: mantenimiento.costo }
        });
    },

    // Auth actions
    async login(usuario) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.LOGIN,
            entidad: ENTIDADES.USUARIO,
            entidadId: usuario.id,
            detalles: { email: usuario.email }
        });
    },

    async logout(usuario) {
        return createAuditLog({
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            accion: ACCIONES_AUDITORIA.LOGOUT,
            entidad: ENTIDADES.USUARIO,
            entidadId: usuario.id,
            detalles: {}
        });
    }
};

// ─── Hook for React Components ───────────────────────────────────────────
export function useAudit() {
    const getLogs = async (filters) => {
        return getAuditLogs(filters);
    };

    const log = async (data) => {
        return createAuditLog(data);
    };

    return {
        getLogs,
        log,
        actions: auditActions
    };
}
