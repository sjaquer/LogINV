'use client';
import { useRole } from '@/context/RoleContext';
import { useLanguage } from '@/context/LanguageContext';
import { User, ChevronDown, Globe, Lock, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const ROLE_COLORS = {
    LOGISTICA: 'text-brand-400',
    PLANTA: 'text-orange-400',
    ADMIN: 'text-blue-400',
    GERENCIA: 'text-purple-400',
};

const PASSWORDS = {
    LOGISTICA: process.env.NEXT_PUBLIC_PASS_LOGISTICA || '1234',
    PLANTA: process.env.NEXT_PUBLIC_PASS_PLANTA || '5678',
    ADMIN: process.env.NEXT_PUBLIC_PASS_ADMIN || 'admin',
    GERENCIA: process.env.NEXT_PUBLIC_PASS_GERENCIA || 'master',
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
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300 min-w-0">
                <div className="pl-11 lg:pl-0 min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-0.5 flex items-center gap-1.5 truncate">
                        <span className="hidden sm:inline">{t('bienvenido')}</span> <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 flex-shrink-0"></span> <span className="truncate">{ROLE_USERS[role]}</span>
                    </p>
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight truncate">{title}</h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Language Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => { setOpenLangMenu(!openLangMenu); setOpenRoleMenu(false); }}
                            className="flex items-center gap-1.5 btn btn-ghost text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all font-medium text-slate-600"
                        >
                            <Globe size={15} className="text-slate-400" />
                            <span className="hidden sm:inline uppercase text-[11px]">{language}</span>
                        </button>

                        {openLangMenu && (
                            <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg ring-1 ring-slate-900/5 py-1 z-40 animate-fade-in-up origin-top-right overflow-hidden">
                                {LANGUAGES.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => { setLanguage(l.code); setOpenLangMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 flex items-center justify-between ${l.code === language ? 'text-brand-600 font-medium bg-brand-50' : 'text-slate-600'}`}
                                    >
                                        {l.label}
                                        {l.code === language && <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Role switcher */}
                    <div className="relative">
                        <button
                            onClick={() => { setOpenRoleMenu(!openRoleMenu); setOpenLangMenu(false); }}
                            className="flex items-center gap-1.5 sm:gap-2.5 btn btn-ghost text-xs sm:text-sm bg-white border border-slate-200 shadow-sm hover:border-brand-400 transition-all py-1.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3 rounded-xl"
                        >
                            <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                                <User size={14} />
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-none gap-0.5 min-w-0">
                                <span className="hidden lg:block text-slate-700 max-w-[120px] truncate font-semibold text-xs">{userName}</span>
                                <span className={`text-[10px] uppercase tracking-wider font-bold ${ROLE_COLORS[role]}`}>{role}</span>
                            </div>
                            <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                        </button>

                        {openRoleMenu && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl ring-1 ring-slate-900/5 py-2 w-64 animate-fade-in z-40 origin-top-right max-w-[calc(100vw-2rem)]">
                                <p className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 mb-1">
                                    {t('cambiarRol')}
                                </p>
                                {Object.keys(ROLE_USERS).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => handleRoleSelect(r)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left hover:bg-slate-50 ${r === role ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600'}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r === role ? 'bg-brand-500' : 'bg-slate-300'}`} />
                                        <span className="font-medium truncate flex-1 min-w-0">{ROLE_USERS[r]}</span>
                                        <span className={`ml-auto text-[10px] uppercase tracking-wider flex-shrink-0 ${r === role ? 'text-brand-600' : 'text-slate-400'}`}>{r}</span>
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
                    <div className="modal-box p-6 relative animate-slide-up max-w-sm border-0 shadow-2xl bg-white">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                                <Lock size={24} className="text-brand-600" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold text-slate-900">{t('seguridadAcceso')}</h2>
                                <p className="text-slate-500 text-sm">
                                    {t('ingresaContrasena')}
                                    <span className={`block font-bold mt-1 text-sm ${ROLE_COLORS[pendingRole]}`}>{ROLE_USERS[pendingRole]}</span>
                                </p>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="w-full mt-2">
                                <div className="relative mb-4">
                                    <input
                                        ref={passInputRef}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="inp text-center text-lg tracking-[0.5em] placeholder:tracking-normal w-full font-bold text-slate-800"
                                        autoComplete="off"
                                    />
                                </div>
                                {errorMsg && (
                                    <div className="flex items-center gap-2 justify-center text-rose-600 text-xs mb-4 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                        <AlertCircle size={14} />
                                        <span>{t('contrasenaIncorrecta')}</span>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPendingRole(null)}
                                        className="btn btn-ghost flex-1 py-2.5 border border-slate-200"
                                    >
                                        {t('cerrar')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex-1 py-2.5 justify-center shadow-lg shadow-brand-500/30"
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
