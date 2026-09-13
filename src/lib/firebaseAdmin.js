// ═══════════════════════════════════════════════════════════════════════════
//  Firebase Admin SDK - LogINV (SOLO SERVIDOR)
//  Usado por las rutas de administración (src/app/api/admin/**) para crear,
//  deshabilitar o borrar cuentas de acceso (Firebase Auth) sin afectar la
//  sesión de quien administra. Nunca importar este archivo desde código de
//  cliente ('use client') — usa credenciales privadas (service account).
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
    if (getApps().length) return getApps()[0];

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            'Firebase Admin no está configurado. Define FIREBASE_ADMIN_PROJECT_ID, ' +
            'FIREBASE_ADMIN_CLIENT_EMAIL y FIREBASE_ADMIN_PRIVATE_KEY (service account).'
        );
    }

    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function adminAuth() {
    return getAuth(getAdminApp());
}

export function adminDb() {
    return getFirestore(getAdminApp());
}
