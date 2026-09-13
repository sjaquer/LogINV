// ═══════════════════════════════════════════════════════════════════════════
//  Firebase Auth Service - LogINV
//  Login de la app: correo y contraseña (Firebase Auth). El inicio de sesión
//  con Google es un flujo SEPARADO (ver src/services/googleDrive.js) que solo
//  se usa para autorizar la subida de fotos de productos a Google Drive — no
//  reemplaza ni se mezcla con el login de la app.
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { ROLES, GOOGLE_DRIVE } from '@/lib/constants';

// ─── Firebase Config ─────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── Initialize Firebase ─────────────────────────────────────────────────
let app = null;
let auth = null;

function getFirebaseAuth() {
    if (typeof window === 'undefined') return null;

    if (!app) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    }
    if (!auth) {
        auth = getAuth(app);
    }
    return auth;
}

// ─── Auth Service (login de la app) ──────────────────────────────────────
export const authService = {
    /**
     * Iniciar sesión con correo y contraseña
     * @param {string} email
     * @param {string} password
     * @returns {Promise<import('firebase/auth').User>}
     */
    async signIn(email, password) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase no está inicializado');

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    /**
     * Enviar correo para restablecer la contraseña
     * @param {string} email
     */
    async resetPassword(email) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase no está inicializado');
        await sendPasswordResetEmail(auth, email);
    },

    /**
     * Inicio de sesión con Google — SOLO para autorizar Google Drive (fotos
     * de productos). No se usa para el login de la app.
     * @returns {Promise<{ user: import('firebase/auth').User, accessToken: string|null }>}
     */
    async signInWithGoogleForDrive() {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase no está inicializado');

        const provider = new GoogleAuthProvider();
        provider.addScope(GOOGLE_DRIVE.SCOPE);
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        return { user: result.user, accessToken: credential?.accessToken || null };
    },

    /**
     * Obtener el ID token de Firebase del usuario actual (para llamar a las
     * rutas de administración protegidas, ej. crear usuarios).
     * @returns {Promise<string|null>}
     */
    async getIdToken() {
        const auth = getFirebaseAuth();
        const user = auth?.currentUser;
        if (!user) return null;
        return user.getIdToken();
    },

    /**
     * Cerrar sesión
     */
    async signOut() {
        const auth = getFirebaseAuth();
        if (!auth) return;
        await firebaseSignOut(auth);
    },

    /**
     * Obtener usuario actual
     * @returns {import('firebase/auth').User|null}
     */
    getCurrentUser() {
        const auth = getFirebaseAuth();
        return auth?.currentUser || null;
    },

    /**
     * Escuchar cambios en el estado de autenticación
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChanged(callback) {
        const auth = getFirebaseAuth();
        if (!auth) {
            callback(null);
            return () => {};
        }
        return onAuthStateChanged(auth, callback);
    },
};

// ─── User Roles Management ───────────────────────────────────────────────
export const roleService = {
    /**
     * Obtener permisos de un rol
     * @param {string} role
     * @returns {Array}
     */
    getPermissions(role) {
        const roleData = Object.values(ROLES).find(r => r.id === role);
        return roleData?.permisos || [];
    },

    /**
     * Verificar si un usuario tiene un permiso específico
     * @param {string} userRole
     * @param {string} permission
     * @returns {boolean}
     */
    hasPermission(userRole, permission) {
        const permissions = this.getPermissions(userRole);
        return permissions.includes(permission);
    },

    /**
     * Verificar si un usuario puede acceder a un módulo
     * @param {string} userRole
     * @param {string} module
     * @returns {boolean}
     */
    canAccessModule(userRole, module) {
        return this.hasPermission(userRole, module);
    },

    /**
     * Obtener label de un rol
     * @param {string} role
     * @returns {string}
     */
    getRoleLabel(role) {
        const roleData = Object.values(ROLES).find(r => r.id === role);
        return roleData?.label || role;
    },

    /**
     * Obtener todos los roles disponibles
     * @returns {Array}
     */
    getAllRoles() {
        return Object.values(ROLES);
    }
};
