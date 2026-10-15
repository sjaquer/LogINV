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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const decoded = await adminAuth().verifyIdToken(idToken).catch((err) => {
        throw new HttpError(`Sesión inválida o expirada: ${err.message}`, 401);
    });

    // 1. Buscar primero directamente por uid (en LogINV el id del doc en usuarios es el UID de Auth)
    let usuario = null;
    const docSnap = await adminDb().collection('usuarios').doc(decoded.uid).get();
    if (docSnap.exists) {
        usuario = docSnap.data();
    } else if (decoded.email) {
        // Fallback por email en caso de ids generados previamente
        const snap = await adminDb().collection('usuarios').where('email', '==', decoded.email).limit(1).get();
        if (!snap.empty) {
            usuario = snap.docs[0].data();
        }
    }

    if (!usuario) throw new HttpError('Tu cuenta no está registrada en Usuarios', 403);

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
            try {
                await adminAuth().updateUser(id, authUpdates);
            } catch (err) {
                if (err.code === 'auth/user-not-found') {
                    // Si se intentó asignar una nueva contraseña a un usuario que existía en Firestore
                    // pero aún no en Firebase Auth (ej. seed inicial), crearlo en Auth
                    if (authUpdates.password) {
                        const uDoc = await adminDb().collection('usuarios').doc(id).get();
                        const uData = uDoc.data();
                        if (uData?.email) {
                            await adminAuth().createUser({
                                uid: id,
                                email: uData.email,
                                password: authUpdates.password,
                                displayName: authUpdates.displayName || uData.nombre,
                                disabled: authUpdates.disabled ?? false,
                            });
                        } else {
                            throw new HttpError('No se encontró el correo del usuario para registrar sus credenciales', 400);
                        }
                    } else {
                        console.warn(`[LogINV] Usuario ${id} no encontrado en Firebase Auth, actualizando solo Firestore.`);
                    }
                } else {
                    throw new HttpError(err.message || 'Error al actualizar credenciales en Auth', 400);
                }
            }
        }
        if (Object.keys(docUpdates).length) {
            await adminDb().collection('usuarios').doc(id).set(docUpdates, { merge: true });
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
