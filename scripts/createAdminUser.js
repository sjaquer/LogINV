// ═══════════════════════════════════════════════════════════════════════════
//  Crear la primera cuenta de administrador - LogINV
//  Usalo UNA sola vez para dar de alta a la cuenta principal (ej. Ruth).
//  Después de esto, esa cuenta ya puede crear/gestionar a las demás desde
//  /admin/users en la app (no hace falta volver a correr este script).
//
//  Uso:
//    node scripts/createAdminUser.js "Ruth Pando" ruth@correo.com "contraseñaSegura123"
//
//  Requiere en .env.local las credenciales de Firebase Admin (Service Account):
//    FIREBASE_ADMIN_PROJECT_ID
//    FIREBASE_ADMIN_CLIENT_EMAIL
//    FIREBASE_ADMIN_PRIVATE_KEY
//  (Firebase Console → Configuración del proyecto → Cuentas de servicio →
//   Generar nueva clave privada)
// ═══════════════════════════════════════════════════════════════════════════

require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
    const [nombre, email, password] = process.argv.slice(2);
    if (!nombre || !email || !password) {
        console.error('Uso: node scripts/createAdminUser.js "Nombre Completo" correo@ejemplo.com "contraseña"');
        process.exit(1);
    }
    if (password.length < 6) {
        console.error('La contraseña debe tener al menos 6 caracteres.');
        process.exit(1);
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
        console.error(
            'Faltan credenciales de Firebase Admin en .env.local: FIREBASE_ADMIN_PROJECT_ID, ' +
            'FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.'
        );
        process.exit(1);
    }

    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    const auth = getAuth();
    const db = getFirestore();

    console.log(`\n👤 Creando cuenta de administrador para ${nombre} <${email}>...`);

    const existing = await auth.getUserByEmail(email).catch(() => null);
    const userRecord = existing || await auth.createUser({ email, password, displayName: nombre });
    if (existing) {
        console.log('   Ya existía una cuenta con ese correo — actualizando contraseña y datos.');
        await auth.updateUser(userRecord.uid, { password, displayName: nombre });
    }

    await db.collection('usuarios').doc(userRecord.uid).set({
        nombre,
        email,
        rol: 'admin',
        activo: true,
        telefono: '',
        departamento: 'Dirección',
        fecha_creacion: new Date().toISOString(),
    }, { merge: true });

    console.log(`\n✅ Listo. ${nombre} ya puede iniciar sesión en LogINV con ese correo y contraseña,`);
    console.log('   y gestionar el resto de cuentas desde Admin → Usuarios y Roles.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
});
