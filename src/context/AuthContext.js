'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth';
import { signOut as driveSignOut } from '@/services/googleDrive';
import { USE_MOCK, getFirestore } from '@/hooks/useFirestoreQuery';
import { audit, setAuditUser } from '@/lib/auditLog';
import { useIsClient } from '@/hooks/usePersistentState';
import { AppError, describeError } from '@/lib/errors';
import { CHURCH, VERSES } from '@/lib/church';

// Rutas públicas que deben ser accesibles sin iniciar sesión (requisito de
// verificación de OAuth de Google: Política de Privacidad y Condiciones del
// Servicio deben poder abrirse sin autenticarse).
const PUBLIC_ROUTES = ['/legal/'];

// Usuario de demostración cuando no hay Firebase configurado (NEXT_PUBLIC_USE_MOCK=true).
const MOCK_USER = { id: 'demo-admin', nombre: 'Administrador (demo)', email: 'demo@loginv.local', rol: 'admin' };

// Busca en la colección `usuarios` (Firestore) el perfil de la cuenta que
// acaba de iniciar sesión, para resolver su rol.
// Prioriza la búsqueda por UID (id del documento en LogINV) y luego por email
// (perfiles antiguos cuyo id no coincide con el UID).
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

    // Nota de seguridad: no hay auto-creación de perfiles desde el cliente.
    // Un perfil faltante se repara con `npm run create-admin` o desde
    // /admin/users; las reglas de Firestore solo dejan escribir `usuarios`
    // a administradores.
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
    const [error, setError] = useState(null); // descripción del diccionario de errores

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (USE_MOCK) {
                onLogin(MOCK_USER);
                return;
            }

            const firebaseUser = await authService.signIn(email.trim(), password);
            const usuario = await findUsuarioProfile(firebaseUser);

            if (!usuario) {
                await authService.signOut();
                setError(describeError(new AppError('AUTH-06')));
                return;
            }

            if (usuario.activo === false) {
                await authService.signOut();
                setError(describeError(new AppError('AUTH-07')));
                return;
            }

            onLogin({
                id: usuario.id,
                nombre: usuario.nombre || firebaseUser.email,
                email: usuario.email,
                rol: usuario.rol,
            });
        } catch (err) {
            const info = describeError(err);
            console.error(`[LogINV] ${info.code} al iniciar sesión:`, err);
            setError(info);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-ink-950 via-brand-950 to-ink-900 flex items-center justify-center p-4">
            {/* Halos con los colores del logo de la iglesia */}
            <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" aria-hidden="true" />
            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-sky-400/30 to-violet-500/30 blur-2xl" aria-hidden="true" />
                        <img src="/icons/icon-512.png" alt="Iglesia Alianza CNC" width={112} height={112} className="relative w-28 h-28 rounded-full ring-1 ring-white/15 ring-offset-4 ring-offset-transparent shadow-2xl shadow-brand-950/60" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Log<span className="text-blue-300">INV</span></h1>
                    <p className="text-sm text-white/60 font-medium mt-1">{CHURCH.app}</p>
                </div>

                {/* Login Card */}
                <div className="bg-surface rounded-2xl shadow-2xl p-6 space-y-5">
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-slate-900">¡Qué bueno verte!</h2>
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
                                    onChange={e => { setEmail(e.target.value); setError(null); }}
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
                                    onChange={e => { setPassword(e.target.value); setError(null); }}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div role="alert" className="flex items-start gap-2.5 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100 animate-fade-in">
                                <AlertCircle size={17} className="mt-0.5 flex-shrink-0 text-rose-600" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-rose-700">{error.title}</p>
                                    <p className="mt-0.5 text-rose-600">{error.message}</p>
                                    {error.hint && <p className="mt-1 text-xs text-rose-500">{error.hint}</p>}
                                </div>
                                <span className="flex-shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-600" title="Código del error">{error.code}</span>
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

                <figure className="mt-7 text-center max-w-xs mx-auto">
                    <blockquote className="text-sm italic text-white/70 leading-relaxed">“{VERSES[0].text}”</blockquote>
                    <figcaption className="mt-1 text-xs font-semibold text-sky-300/80">{VERSES[0].ref}</figcaption>
                </figure>
                <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mt-5">
                    {CHURCH.name} · {CHURCH.motto}
                </p>
                <p className="text-center text-xs text-white/30 mt-3 flex items-center justify-center gap-3">
                    <Link href="/legal/privacy" className="hover:text-white/60 hover:underline">Privacidad</Link>
                    <span>·</span>
                    <Link href="/legal/terms" className="hover:text-white/60 hover:underline">Condiciones del servicio</Link>
                </p>
                
            </div>
        </div>
    );
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(USE_MOCK ? MOCK_USER : null);
    const [loaded, setLoaded] = useState(USE_MOCK);
    // La app depende de la sesión del navegador: el servidor solo pinta la
    // pantalla de carga (evita desajustes de hidratación con fechas/horas).
    const isClient = useIsClient();

    // La auditoría necesita saber quién actúa: se fija en el mismo render.
    setAuditUser(user);
    const pathname = usePathname();
    const isPublicRoute = PUBLIC_ROUTES.some(p => pathname?.startsWith(p));

    // Restaura la sesión de Firebase (persistida por el SDK) y vuelve a
    // resolver el rol contra `usuarios`.
    useEffect(() => {
        if (USE_MOCK) return undefined;
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

    const login = useCallback((userData) => {
        setAuditUser(userData);
        audit('login', 'sesion', userData.id, 'Inicio de sesión');
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        await audit('logout', 'sesion', user?.id, 'Cierre de sesión');
        setUser(null);
        driveSignOut();
        if (!USE_MOCK) authService.signOut();
    }, [user?.id]);

    // Páginas públicas (legales): accesibles sin sesión, sin chrome de la app.
    if (isPublicRoute) {
        return (
            <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
                {children}
            </AuthContext.Provider>
        );
    }

    if (!loaded || !isClient) {
        return (
            <div className="min-h-screen bg-ink-900 flex items-center justify-center">
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
