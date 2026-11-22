// ═══════════════════════════════════════════════════════════════════════════
//  Registro de auditoría - LogINV
//  Cada acción relevante (altas, cambios, bajas, préstamos, conteos, stock,
//  sesiones, cuentas) se guarda en la colección `auditoria`. El usuario
//  actual lo fija AuthContext con setAuditUser(); los hooks solo llaman a
//  audit(). Nunca lanza: un fallo de auditoría no debe romper la operación.
// ═══════════════════════════════════════════════════════════════════════════

import { USE_MOCK, getFirestore } from '@/hooks/useFirestoreQuery';
import { setMock, mockId, mockTimestamp, registerMock, DAY } from '@/lib/mockStore';
import { clean } from '@/lib/dataOps';

let currentUser = null;

export function setAuditUser(user) {
    currentUser = user ? { id: user.id, nombre: user.nombre, rol: user.rol } : null;
}

export const AUDIT_ACCIONES = {
    crear: { label: 'Creó', tone: 'emerald' },
    editar: { label: 'Editó', tone: 'blue' },
    eliminar: { label: 'Eliminó', tone: 'rose' },
    stock: { label: 'Movió stock', tone: 'amber' },
    prestar: { label: 'Prestó', tone: 'violet' },
    devolver: { label: 'Recibió devolución', tone: 'emerald' },
    contar: { label: 'Conteo', tone: 'blue' },
    mantenimiento: { label: 'Mantenimiento', tone: 'amber' },
    activar: { label: 'Activó', tone: 'emerald' },
    desactivar: { label: 'Desactivó', tone: 'slate' },
    login: { label: 'Inició sesión', tone: 'slate' },
    logout: { label: 'Cerró sesión', tone: 'slate' },
};

export const AUDIT_ENTIDADES = {
    producto: 'Producto',
    categoria: 'Categoría',
    ubicacion: 'Ubicación',
    prestamo: 'Préstamo',
    mantenimiento: 'Mantenimiento',
    conteo: 'Conteo',
    usuario: 'Usuario',
    sesion: 'Sesión',
};

/**
 * @param {keyof AUDIT_ACCIONES} accion
 * @param {keyof AUDIT_ENTIDADES} entidad
 * @param {string} entidadId
 * @param {string} descripcion  texto legible, p. ej. "Guitarra eléctrica"
 * @param {object} [detalles]
 */
export async function audit(accion, entidad, entidadId, descripcion, detalles = {}) {
    if (!currentUser?.id) return null;
    const entry = clean({
        usuario_id: currentUser.id,
        usuario_nombre: currentUser.nombre || '',
        usuario_rol: currentUser.rol || '',
        accion,
        entidad,
        entidad_id: String(entidadId || ''),
        descripcion: String(descripcion || '').slice(0, 300),
        detalles,
        fecha: new Date().toISOString(),
    });

    try {
        if (USE_MOCK) {
            const id = mockId('aud');
            setMock('auditoria', list => [{ id, ...entry, timestamp: mockTimestamp() }, ...list]);
            return id;
        }
        const { fs, db } = await getFirestore();
        const ref = await fs.addDoc(fs.collection(db, 'auditoria'), { ...entry, timestamp: fs.serverTimestamp() });
        return ref.id;
    } catch (err) {
        console.warn('[LogINV] No se pudo registrar auditoría:', err?.message);
        return null;
    }
}

/**
 * Envuelve una función async: si termina bien, registra la auditoría
 * devuelta por `describe(args, result)` (o nada si devuelve null).
 */
export function audited(fn, describe) {
    return async (...args) => {
        const result = await fn(...args);
        try {
            const e = describe(args, result);
            if (e) audit(e.accion, e.entidad, e.id, e.descripcion, e.detalles);
        } catch (err) {
            console.warn('[LogINV] auditoría:', err?.message);
        }
        return result;
    };
}

// Datos de ejemplo para el modo demo.
registerMock('auditoria', () => {
    const t = (h) => mockTimestamp(new Date(Date.now() - h * 3600 * 1000));
    const base = (h, accion, entidad, entidad_id, descripcion, usuario_nombre = 'Ruth Pando', usuario_rol = 'encargado') => ({
        id: mockId('aud'), usuario_id: 'u2', usuario_nombre, usuario_rol, accion, entidad, entidad_id, descripcion,
        detalles: {}, timestamp: t(h), fecha: new Date(Date.now() - h * 3600 * 1000).toISOString(),
    });
    return [
        base(1, 'stock', 'producto', 'p1', 'Guitarra · salida de 1 (Ensayo de alabanza)'),
        base(3, 'prestar', 'prestamo', 'loan_1', 'Piano Grande → Ministerio de Adoración'),
        base(5, 'editar', 'producto', 'p2', 'Batería electrónica · estado, observaciones'),
        base(26, 'crear', 'ubicacion', 'ALMACEN_B4', 'Almacén B4 (Redes Juveniles)', 'Juan Carlos Cárdenas', 'admin'),
        base(28, 'crear', 'usuario', 'u5', 'Mantenimiento (voluntario)', 'Juan Carlos Cárdenas', 'admin'),
        base(30, 'contar', 'conteo', 'cnt_1', 'Conteo físico finalizado en Templo · 3 diferencias'),
        base(50, 'login', 'sesion', 'u2', 'Inicio de sesión'),
        base(Math.round(DAY / 3600000) * 3, 'eliminar', 'categoria', 'cat_old', 'Categoría "Varios"', 'Juan Carlos Cárdenas', 'admin'),
    ];
});
