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
import { HttpError, requireAdmin, handleApiError } from '@/lib/serverAuth';

const handleError = (err) => handleApiError(err, '/api/admin/users');

// Errores de Firebase Admin Auth → mensaje en español + código del diccionario.
const AUTH_ADMIN_ERRORS = {
    'auth/email-already-exists': ['Ya existe una cuenta con ese correo', 409, 'AUTH-08'],
    'auth/invalid-password': ['La contraseña debe tener al menos 6 caracteres', 400, 'AUTH-09'],
    'auth/invalid-email': ['El correo no tiene un formato válido', 400, 'AUTH-02'],
    'auth/invalid-display-name': ['El nombre no es válido', 400, 'VAL-01'],
    'auth/user-not-found': ['La cuenta ya no existe en el sistema de acceso', 404, 'DATOS-01'],
};
function authAdminError(err) {
    const known = AUTH_ADMIN_ERRORS[err?.code];
    if (known) return new HttpError(...known);
    console.error('[LogINV] Firebase Admin Auth:', err?.code, err?.message);
    return new HttpError('No se pudieron guardar las credenciales de la cuenta', 400, 'VAL-01');
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── Estado / Healthcheck de Firebase Admin en el servidor ─────────────────
export async function GET(request) {
    try {
        await requireAdmin(request);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return handleError(err);
    }
}

// ─── Crear una cuenta de acceso ────────────────────────────────────────────
export async function POST(request) {
    try {
        await requireAdmin(request);
        const { nombre, email, password, rol, telefono, departamento } = await request.json();

        if (!nombre?.trim() || !email?.trim()) {
            throw new HttpError('Nombre y correo son obligatorios', 400, 'VAL-01');
        }
        if (!password || password.length < 6) {
            throw new HttpError('La contraseña debe tener al menos 6 caracteres', 400, 'AUTH-09');
        }
        if (!['admin', 'encargado', 'voluntario'].includes(rol)) {
            throw new HttpError('Rol inválido', 400, 'VAL-01');
        }

        const userRecord = await (await adminAuth()).createUser({
            email: email.trim(),
            password,
            displayName: nombre.trim(),
        }).catch((err) => {
            if (err.code === 'auth/email-already-exists') {
                throw new HttpError('Ya existe una cuenta con ese correo', 409, 'AUTH-08');
            }
            throw authAdminError(err);
        });

        await (await adminDb()).collection('usuarios').doc(userRecord.uid).set({
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
        const me = await requireAdmin(request);
        const { id, activo, rol, password, nombre, telefono, departamento } = await request.json();
        if (!id) throw new HttpError('Falta el id de la cuenta', 400, 'VAL-01');
        if (id === me.uid && (activo === false || (rol && rol !== 'admin'))) {
            throw new HttpError('No puedes desactivar ni quitarte el rol de administrador a ti mismo', 400, 'USR-01');
        }

        const authUpdates = {};
        const docUpdates = {};

        if (typeof activo === 'boolean') {
            authUpdates.disabled = !activo;
            docUpdates.activo = activo;
        }
        if (rol) {
            if (!['admin', 'encargado', 'voluntario'].includes(rol)) {
                throw new HttpError('Rol inválido', 400, 'VAL-01');
            }
            docUpdates.rol = rol;
        }
        if (password) {
            if (password.length < 6) throw new HttpError('La contraseña debe tener al menos 6 caracteres', 400, 'AUTH-09');
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
                await (await adminAuth()).updateUser(id, authUpdates);
            } catch (err) {
                if (err.code === 'auth/user-not-found') {
                    // Si se intentó asignar una nueva contraseña a un usuario que existía en Firestore
                    // pero aún no en Firebase Auth (ej. seed inicial), crearlo en Auth
                    if (authUpdates.password) {
                        const uDoc = await (await adminDb()).collection('usuarios').doc(id).get();
                        const uData = uDoc.data();
                        if (uData?.email) {
                            await (await adminAuth()).createUser({
                                uid: id,
                                email: uData.email,
                                password: authUpdates.password,
                                displayName: authUpdates.displayName || uData.nombre,
                                disabled: authUpdates.disabled ?? false,
                            });
                        } else {
                            throw new HttpError('No se encontró el correo del usuario para registrar sus credenciales', 400, 'USR-02');
                        }
                    } else {
                        console.warn(`[LogINV] Usuario ${id} no encontrado en Firebase Auth, actualizando solo Firestore.`);
                    }
                } else {
                    throw authAdminError(err);
                }
            }
        }
        if (Object.keys(docUpdates).length) {
            await (await adminDb()).collection('usuarios').doc(id).set(docUpdates, { merge: true });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        return handleError(err);
    }
}

// ─── Eliminar una cuenta de acceso ─────────────────────────────────────────
export async function DELETE(request) {
    try {
        const me = await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new HttpError('Falta el id de la cuenta', 400, 'VAL-01');
        if (id === me.uid) throw new HttpError('No puedes eliminar tu propia cuenta', 400, 'USR-01');

        await (await adminAuth()).deleteUser(id).catch(() => {}); // ya pudo no existir en Auth
        await (await adminDb()).collection('usuarios').doc(id).delete();

        return NextResponse.json({ ok: true });
    } catch (err) {
        return handleError(err);
    }
}
