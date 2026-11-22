// ═══════════════════════════════════════════════════════════════════════════
//  Firebase Admin SDK - LogINV (SOLO SERVIDOR)
//  Usado por las rutas /api para verificar sesiones, gestionar cuentas y leer
//  configuración privada. Nunca importar desde código de cliente.
//
//  El SDK se carga de forma diferida: si falla (credenciales ausentes,
//  incompatibilidad del entorno), la ruta sigue respondiendo y el error
//  llega como mensaje claro en vez de un 500 vacío al cargar el módulo.
// ═══════════════════════════════════════════════════════════════════════════

let sdkPromise = null;
let app = null;

function loadSdk() {
    if (!sdkPromise) {
        sdkPromise = Promise.all([
            import('firebase-admin/app'),
            import('firebase-admin/auth'),
            import('firebase-admin/firestore'),
        ]).then(([appMod, authMod, fsMod]) => ({ appMod, authMod, fsMod }))
            .catch((err) => {
                sdkPromise = null;
                throw new Error(`Firebase Admin no pudo cargarse en el servidor: ${err.message}`);
            });
    }
    return sdkPromise;
}

function readCredentials() {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    let privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n').trim();

    const missing = [
        !projectId && 'FIREBASE_ADMIN_PROJECT_ID',
        !clientEmail && 'FIREBASE_ADMIN_CLIENT_EMAIL',
        !privateKey && 'FIREBASE_ADMIN_PRIVATE_KEY',
    ].filter(Boolean);
    if (missing.length) {
        throw new Error(`Firebase Admin no está configurado en el servidor. Faltan: ${missing.join(', ')}.`);
    }
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error('Firebase Admin no está configurado en el servidor: FIREBASE_ADMIN_PRIVATE_KEY no tiene el formato de una clave privada.');
    }
    return { projectId, clientEmail, privateKey };
}

async function getAdminApp() {
    const sdk = await loadSdk();
    if (app) return { sdk, app };
    const existing = sdk.appMod.getApps();
    app = existing.length ? existing[0] : sdk.appMod.initializeApp({ credential: sdk.appMod.cert(readCredentials()) });
    return { sdk, app };
}

/** @returns {Promise<import('firebase-admin/auth').Auth>} */
export async function adminAuth() {
    const { sdk, app: a } = await getAdminApp();
    return sdk.authMod.getAuth(a);
}

/** @returns {Promise<import('firebase-admin/firestore').Firestore>} */
export async function adminDb() {
    const { sdk, app: a } = await getAdminApp();
    return sdk.fsMod.getFirestore(a);
}
