'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth';
import { signOut as driveSignOut } from '@/services/googleDrive';
import { USE_MOCK, getFirestore } from '@/hooks/useFirestoreQuery';

// Rutas públicas que deben ser accesibles sin iniciar sesión (requisito de
// verificación de OAuth de Google: Política de Privacidad y Condiciones del
// Servicio deben poder abrirse sin autenticarse).
const PUBLIC_ROUTES = ['/legal/'];

// Usuario de demostración cuando no hay Firebase configurado (NEXT_PUBLIC_USE_MOCK=true).
const MOCK_USER = { id: 'demo-admin', nombre: 'Administrador (demo)', email: 'demo@loginv.local', rol: 'admin' };

// Busca en la colección `usuarios` (Firestore) el perfil de la cuenta que
// acaba de iniciar sesión, para resolver su rol.
// Prioriza la búsqueda por UID (id del documento en LogINV) y luego por email
// insensible a mayúsculas/espacios.
async function findUsuarioProfile(firebaseUser) {
    if (!firebaseUser) return null;
    const { fs, db } = await getFirestore();

    // 1. Buscar directamente por ID de documento = UID de Firebase Auth
    if (firebaseUser.uid) {
        try {
            const docRef = fs.doc(db, 'usuarios', firebaseUser.uid);
            const docSnap = await fs.getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
        } catch (err) {
            console.warn('[LogINV] Error buscando usuario por UID:', err);
        }
    }

    const emailRaw = firebaseUser.email || '';
    const emailNorm = emailRaw.trim().toLowerCase();
    if (!emailNorm) return null;

    // 2. Buscar por email normalizado (minúsculas)
    try {
        const qNorm = fs.query(fs.collection(db, 'usuarios'), fs.where('email', '==', emailNorm));
        const snapNorm = await fs.getDocs(qNorm);
        if (!snapNorm.empty) {
            const doc = snapNorm.docs[0];
            return { id: doc.id, ...doc.data() };
        }
    } catch (err) {
        console.warn('[LogINV] Error buscando usuario por email en minúsculas:', err);
    }

    // 3. Buscar por email original si era diferente
    if (emailRaw !== emailNorm) {
        try {
            const qOrig = fs.query(fs.collection(db, 'usuarios'), fs.where('email', '==', emailRaw));
            const snapOrig = await fs.getDocs(qOrig);
            if (!snapOrig.empty) {
                const doc = snapOrig.docs[0];
                return { id: doc.id, ...doc.data() };
            }
        } catch (err) {
            console.warn('[LogINV] Error buscando usuario por email original:', err);
        }
    }

    // 4. Búsqueda tolerante en todos los documentos de usuarios
    try {
        const allSnap = await fs.getDocs(fs.collection(db, 'usuarios'));
        for (const doc of allSnap.docs) {
            const d = doc.data();
            if ((d.email || '').trim().toLowerCase() === emailNorm) {
                return { id: doc.id, ...d };
            }
        }
    } catch (err) {
        console.warn('[LogINV] Error en escaneo tolerante de usuarios:', err);
    }

    // 5. Auto-reparación para administradores principales autenticados en Firebase Auth
    const ADMIN_EMAILS = ['pandoparedesr@gmail.com', 'sjaquer@outlook.es', 'iglesia@inv.com'];
    if (ADMIN_EMAILS.includes(emailNorm)) {
        console.log('[LogINV] Auto-restaurando perfil de administrador para:', emailNorm);
        const adminProfile = {
            nombre: firebaseUser.displayName || 'Administrador',
            email: emailNorm,
            rol: 'admin',
            activo: true,
            telefono: '',
            departamento: 'Dirección',
            fecha_creacion: new Date().toISOString(),
        };
        try {
            await fs.setDoc(fs.doc(db, 'usuarios', firebaseUser.uid), adminProfile);
            return { id: firebaseUser.uid, ...adminProfile };
        } catch (createErr) {
            console.error('[LogINV] Error auto-creando perfil admin:', createErr);
        }
    }

    return null;
}

const AuthContext = createContext({
    user: null,
    login: () => {},
    logout: () => {},
    isAuthenticated: false,
});

function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (USE_MOCK) {
                onLogin(MOCK_USER);
                return;
            }

            const firebaseUser = await authService.signIn(email.trim(), password);
            const usuario = await findUsuarioProfile(firebaseUser);

            if (!usuario) {
                await authService.signOut();
                setError('Tu usuario no está registrado en el sistema. Contacta a un administrador.');
                return;
            }

            if (usuario.activo === false) {
                await authService.signOut();
                setError('Tu cuenta está desactivada. Contacta a un administrador.');
                return;
            }

            onLogin({
                id: usuario.id,
                nombre: usuario.nombre || firebaseUser.email,
                email: usuario.email,
                rol: usuario.rol,
            });
        } catch (err) {
            const map = {
                'auth/invalid-credential': 'Correo o contraseña incorrectos.',
                'auth/invalid-email': 'Correo inválido.',
                'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
                'auth/user-disabled': 'Esta cuenta fue deshabilitada en el sistema.',
            };
            setError(map[err.code] || err.message || 'No se pudo iniciar sesión');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/30 mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/icon-512.png" alt="Iglesia Alianza CNC" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">LOG-INV</h1>
                    <p className="text-sm text-white/50 font-medium mt-1">Control de Inventario</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-slate-900">Iniciar sesión</h2>
                        <p className="text-sm text-slate-500 mt-1">Ingresa con tu correo y contraseña</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Correo</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    placeholder="tu@correo.com"
                                    className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full py-3.5 bg-brand-600 text-white font-bold text-base rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading && <span className="spinner border-white/60 border-t-transparent w-4 h-4" />}
                            {loading ? 'Ingresando…' : 'Ingresar'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-white/50 mt-6 max-w-xs mx-auto leading-relaxed">
                    Sistema interno de control de inventario para la Iglesia CNC: gestión de bienes, ubicaciones,
                    préstamos y mantenimiento.
                </p>
                <p className="text-center text-xs text-white/30 mt-3 flex items-center justify-center gap-3">
                    <Link href="/legal/privacy" className="hover:text-white/60 hover:underline">Privacidad</Link>
                    <span>·</span>
                    <Link href="/legal/terms" className="hover:text-white/60 hover:underline">Condiciones del servicio</Link>
                </p>
                <p className="text-center text-xs text-white/30 mt-3">LogINV · Control de Inventario</p>
            </div>
        </div>
    );
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const pathname = usePathname();
    const isPublicRoute = PUBLIC_ROUTES.some(p => pathname?.startsWith(p));

    // Restaura la sesión de Firebase (persistida por el SDK) y vuelve a
    // resolver el rol contra `usuarios`.
    useEffect(() => {
        if (USE_MOCK) {
            setLoaded(true);
            return;
        }
        const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setLoaded(true);
                return;
            }
            try {
                const usuario = await findUsuarioProfile(firebaseUser);
                if (!usuario || usuario.activo === false) {
                    await authService.signOut();
                    setUser(null);
                } else {
                    setUser({
                        id: usuario.id,
                        nombre: usuario.nombre || firebaseUser.email,
                        email: usuario.email,
                        rol: usuario.rol,
                    });
                }
            } catch (authErr) {
                console.warn('[LogINV] Error sincronizando perfil en onAuthStateChanged:', authErr);
                setUser(null);
            } finally {
                setLoaded(true);
            }
        });
        return unsubscribe;
    }, []);

    const login = useCallback((userData) => setUser(userData), []);

    const logout = useCallback(() => {
        setUser(null);
        driveSignOut();
        if (!USE_MOCK) authService.signOut();
    }, []);

    // Páginas públicas (legales): accesibles sin sesión, sin chrome de la app.
    if (isPublicRoute) {
        return (
            <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
                {children}
            </AuthContext.Provider>
        );
    }

    if (!loaded) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLogin={login} />;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: true }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
