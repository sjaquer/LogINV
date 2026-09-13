'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wine, Lock, User, AlertCircle, ChevronDown } from 'lucide-react';

// Roles en minúsculas para calzar con src/lib/constants.js (ROLES) y con
// los permisos usados en cada página (canManage). Contraseñas por defecto:
// admin → "cnc2026", encargado → "inv2026" — cámbialas antes de producción.
const USUARIOS = [
    { id: 'user1', nombre: 'Juan Carlos Cárdenas', rol: 'admin', hash: 'af26881f93599213b354164ec4feeaa148e82c6ae47f2393ee333967ef62ad7f' },
    { id: 'user2', nombre: 'Ruth Pando', rol: 'encargado', hash: 'b2d55395b4e27448061ac2e298a44bff8337367af9eaba61f1df1c359f9c34de' },
];

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const AuthContext = createContext({
    user: null,
    login: () => {},
    logout: () => {},
    isAuthenticated: false,
});

function LoginScreen({ onLogin }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const selectorRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    useEffect(() => {
        function updatePosition() {
            if (!selectorRef.current) return;
            const rect = selectorRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width,
                zIndex: 9999,
            });
        }

        if (showDropdown) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [showDropdown]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedUser) {
            setError('Selecciona un usuario');
            return;
        }
        const user = USUARIOS.find(u => u.id === selectedUser.id);
        if (!user) { setError('Usuario no encontrado'); return; }
        const inputHash = await hashPassword(password);
        if (inputHash === user.hash) {
            onLogin(user);
        } else {
            setError('Contraseña incorrecta');
            setPassword('');
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-4">
                        <Wine size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">LOG-INV</h1>
                    <p className="text-sm text-white/50 font-medium mt-1">Control de Inventario</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-slate-900">Iniciar sesión</h2>
                        <p className="text-sm text-slate-500 mt-1">Selecciona tu usuario e ingresa tu contraseña</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* User selector */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Usuario</label>
                            <div className="relative">
                                <button
                                    ref={selectorRef}
                                    type="button"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 border border-slate-200 rounded-xl text-left hover:border-brand-300 transition-colors bg-white"
                                >
                                    {selectedUser ? (
                                        <>
                                            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                                                <User size={18} className="text-brand-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.nombre}</p>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{selectedUser.rol}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <User size={18} className="text-slate-400" />
                                            </div>
                                            <span className="text-sm text-slate-400">Selecciona un usuario</span>
                                        </>
                                    )}
                                    <ChevronDown size={18} className="text-slate-400 ml-auto flex-shrink-0" />
                                </button>

                                {/* dropdown will be rendered in a portal below */}
                            </div>
                        </div>

                        {showDropdown && selectorRef.current && createPortal(
                            <div
                                style={dropdownStyle}
                                className="bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-fade-in"
                            >
                                {USUARIOS.map(u => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => { setSelectedUser(u); setShowDropdown(false); setError(''); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${selectedUser?.id === u.id ? 'bg-brand-50' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                                            <User size={16} className="text-brand-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">{u.nombre}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{u.rol}</p>
                                        </div>
                                        {selectedUser?.id === u.id && (
                                            <div className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>,
                            document.body
                        )}

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all tracking-[0.3em]"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!selectedUser || !password}
                            className="w-full py-3.5 bg-brand-600 text-white font-bold text-base rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-white/30 mt-6">LogINV v1.0 · Control de Inventario</p>
            </div>
        </div>
    );
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('loginv_user');
            if (stored) {
                const parsed = JSON.parse(stored);
                const valid = USUARIOS.find(u => u.id === parsed.id);
                if (valid) setUser({ id: valid.id, nombre: valid.nombre, rol: valid.rol });
            }
        } catch (_) {}
        setLoaded(true);
    }, []);

    function login(u) {
        const userData = { id: u.id, nombre: u.nombre, rol: u.rol };
        setUser(userData);
        try { localStorage.setItem('loginv_user', JSON.stringify(userData)); } catch (_) {}
    }

    function logout() {
        setUser(null);
        try { localStorage.removeItem('loginv_user'); } catch (_) {}
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
