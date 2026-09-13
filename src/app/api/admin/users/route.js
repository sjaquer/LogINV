// ═══════════════════════════════════════════════════════════════════════════
//  /api/admin/users - LogINV
//  Gestión de cuentas de acceso (Firebase Auth + Firestore `usuarios`).
//  Solo un administrador ya autenticado puede crear, activar/desactivar,
//  cambiar contraseña o eliminar cuentas — se verifica su ID token y su rol
//  en cada solicitud. El uid de Firebase Auth se usa como id del documento
//  en `usuarios`, así ambos quedan siempre en sincronía.
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function requireAdmin(request) {
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) throw new HttpError('No autenticado', 401);

    const decoded = await adminAuth().verifyIdToken(idToken).catch(() => {
        throw new HttpError('Sesión inválida o expirada', 401);
    });

    const snap = await adminDb().collection('usuarios').where('email', '==', decoded.email).limit(1).get();
    if (snap.empty) throw new HttpError('Tu cuenta no está registrada en Usuarios', 403);

    const usuario = snap.docs[0].data();
    if (usuario.rol !== 'admin' || usuario.activo === false) {
        throw new HttpError('Requiere rol de administrador', 403);
    }
    return decoded;
}

function handleError(err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error('[LogINV] /api/admin/users error:', err);
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status });
}

// ─── Crear una cuenta de acceso ────────────────────────────────────────────
export async function POST(request) {
    try {
        await requireAdmin(request);
        const { nombre, email, password, rol, telefono, departamento } = await request.json();

        if (!nombre?.trim() || !email?.trim()) {
            throw new HttpError('Nombre y correo son obligatorios', 400);
        }
        if (!password || password.length < 6) {
            throw new HttpError('La contraseña debe tener al menos 6 caracteres', 400);
        }
        if (!['admin', 'encargado', 'voluntario'].includes(rol)) {
            throw new HttpError('Rol inválido', 400);
        }

        const userRecord = await adminAuth().createUser({
            email: email.trim(),
            password,
            displayName: nombre.trim(),
        }).catch((err) => {
            if (err.code === 'auth/email-already-exists') {
                throw new HttpError('Ya existe una cuenta con ese correo', 409);
            }
            throw new HttpError(err.message, 400);
        });

        await adminDb().collection('usuarios').doc(userRecord.uid).set({
            nombre: nombre.trim(),
            email: email.trim(),
            rol,
            activo: true,
            telefono: telefono || '',
            departamento: departamento || '',
            fecha_creacion: new Date().toISOString(),
        });

        return NextResponse.json({ id: userRecord.uid });
    } catch (err) {
        return handleError(err);
    }
}

// ─── Activar/desactivar, cambiar rol o restablecer contraseña ────────────
export async function PATCH(request) {
    try {
        await requireAdmin(request);
        const { id, activo, rol, password, nombre, telefono, departamento } = await request.json();
        if (!id) throw new HttpError('Falta el id de la cuenta', 400);

        const authUpdates = {};
        const docUpdates = {};

        if (typeof activo === 'boolean') {
            authUpdates.disabled = !activo;
            docUpdates.activo = activo;
        }
        if (rol) {
            if (!['admin', 'encargado', 'voluntario'].includes(rol)) {
                throw new HttpError('Rol inválido', 400);
            }
            docUpdates.rol = rol;
        }
        if (password) {
            if (password.length < 6) throw new HttpError('La contraseña debe tener al menos 6 caracteres', 400);
            authUpdates.password = password;
        }
        if (nombre?.trim()) {
            authUpdates.displayName = nombre.trim();
            docUpdates.nombre = nombre.trim();
        }
        if (typeof telefono === 'string') docUpdates.telefono = telefono;
        if (typeof departamento === 'string') docUpdates.departamento = departamento;

        if (Object.keys(authUpdates).length) {
            await adminAuth().updateUser(id, authUpdates).catch((err) => {
                throw new HttpError(err.message, 400);
            });
        }
        if (Object.keys(docUpdates).length) {
            await adminDb().collection('usuarios').doc(id).update(docUpdates);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        return handleError(err);
    }
}

// ─── Eliminar una cuenta de acceso ─────────────────────────────────────────
export async function DELETE(request) {
    try {
        await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new HttpError('Falta el id de la cuenta', 400);

        await adminAuth().deleteUser(id).catch(() => {}); // ya pudo no existir en Auth
        await adminDb().collection('usuarios').doc(id).delete();

        return NextResponse.json({ ok: true });
    } catch (err) {
        return handleError(err);
    }
}
