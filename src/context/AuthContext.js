'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { Wine, Lock, User, AlertCircle, ChevronDown } from 'lucide-react';

const USUARIOS = [
    { id: 'user1', nombre: 'Carlos Paredes', rol: 'LOGISTICA', password: '1234' },
    { id: 'user2', nombre: 'Miguel Rodríguez', rol: 'PLANTA', password: '5678' },
    { id: 'user3', nombre: 'Ana Quispe', rol: 'ADMIN', password: 'admin' },
    { id: 'user4', nombre: 'Luis Mendoza', rol: 'GERENCIA', password: 'master' },
];

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

    function handleSubmit(e) {
        e.preventDefault();
        if (!selectedUser) {
            setError('Selecciona un usuario');
            return;
        }
        const user = USUARIOS.find(u => u.id === selectedUser.id);
        if (user && password === user.password) {
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
                            <div className="relative z-20">
                                <button
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

                                {showDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 animate-fade-in">
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
                                    </div>
                                )}
                            </div>
                        </div>

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
