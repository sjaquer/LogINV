'use client';
import { useRole } from '@/context/RoleContext';
import { useLanguage } from '@/context/LanguageContext';
import { User, ChevronDown, Globe, Lock, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const ROLE_COLORS = {
    LOGISTICA: 'text-brand-400',
    CHEF: 'text-orange-400',
    ADMIN: 'text-blue-400',
    GERENCIA: 'text-purple-400',
};

const PASSWORDS = {
    LOGISTICA: '1234',
    CHEF: '5678',
    ADMIN: 'admin',
    GERENCIA: 'master',
};

const LANGUAGES = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' }
];

export default function Header({ title }) {
    const { role, setRole, userName, ROLES, ROLE_USERS } = useRole();
    const { language, setLanguage, t } = useLanguage();

    const [openRoleMenu, setOpenRoleMenu] = useState(false);
    const [openLangMenu, setOpenLangMenu] = useState(false);

    // Password Prompt State
    const [pendingRole, setPendingRole] = useState(null);
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const passInputRef = useRef(null);

    // Focus on password input when prompt opens
    useEffect(() => {
        if (pendingRole && passInputRef.current) {
            passInputRef.current.focus();
        }
    }, [pendingRole]);

    const handleRoleSelect = (r) => {
        if (r === role) {
            setOpenRoleMenu(false);
            return;
        }
        setPendingRole(r);
        setPassword('');
        setErrorMsg('');
        setOpenRoleMenu(false);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === PASSWORDS[pendingRole]) {
            setRole(pendingRole);
            setPendingRole(null);
            setPassword('');
        } else {
            setErrorMsg(t('contrasenaIncorrecta'));
        }
    };

    return (
        <>
            <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-[rgba(5,6,12,0.8)] backdrop-blur-2xl shadow-soft">
                <div className="pl-10 lg:pl-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-500 mb-1">{t('bienvenido')} · {ROLE_USERS[role]}</p>
                    <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Language Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => { setOpenLangMenu(!openLangMenu); setOpenRoleMenu(false); }}
                            className="flex items-center gap-2 btn btn-ghost text-[11px] sm:text-xs px-2 sm:px-3 border-transparent"
                        >
                            <Globe size={16} className="text-slate-400" />
                            <span className="hidden sm:inline font-medium text-slate-300 uppercase">{language}</span>
                        </button>

                        {openLangMenu && (
                            <div className="absolute right-0 top-full mt-2 glass-panel py-1.5 w-32 animate-fade-in z-40">
                                {LANGUAGES.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => { setLanguage(l.code); setOpenLangMenu(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${l.code === language ? 'text-brand-400 font-medium bg-brand-500/10' : 'text-slate-300'}`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Role switcher */}
                    <div className="relative">
                        <button
                            onClick={() => { setOpenRoleMenu(!openRoleMenu); setOpenLangMenu(false); }}
                            className="flex items-center gap-2.5 btn btn-ghost text-xs sm:text-sm shadow-glass bg-dark-panel border-white/10 hover:border-brand-500/60 transition-all"
                        >
                            <div className="w-7 h-7 rounded-full bg-brand-500/20 shadow-glow flex items-center justify-center">
                                <User size={13} className={ROLE_COLORS[role]} />
                            </div>
                            <span className="hidden lg:block text-slate-200 max-w-[140px] truncate font-medium">{userName}</span>
                            <span className={`hidden sm:block font-bold ${ROLE_COLORS[role]}`}>[{role}]</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {openRoleMenu && (
                            <div className="absolute right-0 top-full mt-2 glass-panel py-2 w-64 animate-fade-in shadow-2xl z-40">
                                <p className="px-4 py-2 text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-glass mb-1">
                                    {t('cambiarRol')}
                                </p>
                                {ROLES.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => handleRoleSelect(r)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left hover:bg-white/10 ${r === role ? 'bg-brand-gradient text-white shadow-glow' : 'text-slate-300'}`}
                                    >
                                        {!r.includes(role) && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r === role ? 'bg-white' : 'bg-slate-600'}`} />}
                                        <span className="font-medium">{ROLE_USERS[r]}</span>
                                        <span className={`ml-auto text-xs ${r === role ? 'text-white/80' : ROLE_COLORS[r]}`}>{r}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Password Prompt Modal */}
            {pendingRole && (
                <div className="modal-overlay">
                    <div className="modal-box p-6 relative animate-slide-up max-w-sm border border-glass">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center shadow-glow">
                                <Lock size={24} className="text-brand-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">{t('seguridadAcceso')}</h2>
                            <p className="text-slate-400 text-sm">
                                {t('ingresaContrasena')}
                                <span className={`block font-bold mt-1 text-base ${ROLE_COLORS[pendingRole]}`}>{ROLE_USERS[pendingRole]}</span>
                            </p>

                            <form onSubmit={handlePasswordSubmit} className="w-full mt-2">
                                <input
                                    ref={passInputRef}
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('contrasenaPlaceholder')}
                                    className="inp text-center text-lg tracking-widest placeholder:tracking-normal w-full mb-3"
                                    autoComplete="off"
                                />
                                {errorMsg && (
                                    <div className="flex items-center gap-1.5 text-red-400 text-xs mb-3 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                        <AlertCircle size={14} />
                                        <span>{t('contrasenaIncorrecta')}</span>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPendingRole(null)}
                                        className="btn btn-ghost flex-1 py-2.5"
                                    >
                                        {t('cerrar')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex-1 py-2.5 justify-center"
                                        disabled={!password}
                                    >
                                        {t('acceder')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
