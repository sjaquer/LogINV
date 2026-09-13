// ═══════════════════════════════════════════════════════════════════════════
//  Firebase Auth Service - LogINV v2.0
//  Servicio de autenticación con Firebase
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { ROLES } from '@/lib/constants';

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

// ─── Auth Service ────────────────────────────────────────────────────────
export const authService = {
    /**
     * Iniciar sesión con email y contraseña
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<User>}
     */
    async signIn(email, password) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase not initialized');
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    /**
     * Registrar nuevo usuario
     * @param {string} email 
     * @param {string} password 
     * @param {string} displayName 
     * @returns {Promise<User>}
     */
    async signUp(email, password, displayName) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase not initialized');
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with display name
        await updateProfile(userCredential.user, { displayName });
        
        return userCredential.user;
    },

    /**
     * Cerrar sesión
     */
    async signOut() {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase not initialized');
        
        await firebaseSignOut(auth);
    },

    /**
     * Obtener usuario actual
     * @returns {User|null}
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

    /**
     * Actualizar perfil del usuario
     * @param {Object} profile - { displayName, photoURL }
     */
    async updateProfile(profile) {
        const auth = getFirebaseAuth();
        const user = auth?.currentUser;
        
        if (!user) throw new Error('No user logged in');
        
        await updateProfile(user, profile);
    },

    /**
     * Restablecer contraseña
     * @param {string} email 
     */
    async resetPassword(email) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase not initialized');
        
        // Note: This requires Firebase Auth to be configured
        // await sendPasswordResetEmail(auth, email);
        throw new Error('Not implemented - Configure Firebase Auth');
    }
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

// ─── Mock Auth for Development ───────────────────────────────────────────
export const mockAuthService = {
    currentUser: null,
    listeners: new Set(),

    async signIn(email, password) {
        // Simulate login
        const mockUsers = [
            { uid: 'user1', email: 'admin@iglesia.com', displayName: 'Administrador', role: 'admin' },
            { uid: 'user2', email: 'encargado@iglesia.com', displayName: 'Encargado', role: 'encargado' },
            { uid: 'user3', email: 'voluntario@iglesia.com', displayName: 'Voluntario', role: 'voluntario' },
        ];
        
        const user = mockUsers.find(u => u.email === email);
        if (!user) throw new Error('User not found');
        
        this.currentUser = user;
        this.notifyListeners();
        return user;
    },

    async signOut() {
        this.currentUser = null;
        this.notifyListeners();
    },

    getCurrentUser() {
        return this.currentUser;
    },

    onAuthStateChanged(callback) {
        this.listeners.add(callback);
        callback(this.currentUser);
        return () => this.listeners.delete(callback);
    },

    notifyListeners() {
        this.listeners.forEach(fn => fn(this.currentUser));
    }
};
