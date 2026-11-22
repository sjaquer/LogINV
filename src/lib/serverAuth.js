// ═══════════════════════════════════════════════════════════════════════════
//  Autenticación de rutas API - LogINV (SOLO SERVIDOR)
//  Verifica el ID token de Firebase enviado como `Authorization: Bearer …`
//  y resuelve el perfil del usuario en `usuarios/{uid}`. Toda ruta /api que
//  modifique datos o use credenciales del servidor debe pasar por aquí.
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

/**
 * Exige un usuario autenticado, registrado en `usuarios` y activo.
 * @param {Request} request
 * @param {{ roles?: string[] }} [opts]  roles permitidos (por defecto, cualquiera)
 * @returns {Promise<{ uid: string, email?: string, usuario: object }>}
 */
export async function requireUser(request, { roles } = {}) {
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) throw new HttpError('No autenticado', 401);

    const auth = await adminAuth(); // errores de configuración/carga se propagan con su mensaje
    let decoded;
    try {
        decoded = await auth.verifyIdToken(idToken);
    } catch {
        throw new HttpError('Sesión inválida o expirada', 401);
    }

    // En LogINV el id del documento en `usuarios` es el UID de Firebase Auth.
    const snap = await (await adminDb()).collection('usuarios').doc(decoded.uid).get();
    if (!snap.exists) throw new HttpError('Tu cuenta no está registrada en Usuarios', 403);

    const usuario = snap.data();
    if (usuario.activo === false) throw new HttpError('Tu cuenta está desactivada', 403);
    if (roles && !roles.includes(usuario.rol)) {
        throw new HttpError('No tienes permisos para esta acción', 403);
    }

    return { uid: decoded.uid, email: decoded.email, usuario };
}

export const requireAdmin = (request) => requireUser(request, { roles: ['admin'] });

/** Convierte un error en una respuesta JSON sin filtrar detalles internos. */
export function handleApiError(err, tag = 'api') {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(`[LogINV] ${tag} error:`, err);
    // Los errores de configuración (credenciales ausentes) sí se muestran: son
    // la causa más común de fallos en el despliegue y no revelan secretos.
    const isConfigError = /Firebase Admin no (está configurad|pudo cargarse)/i.test(err?.message || '');
    const message = status === 500 && !isConfigError ? 'Error interno del servidor' : err.message;
    return NextResponse.json({ error: message }, { status });
}
