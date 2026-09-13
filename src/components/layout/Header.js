'use client';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { User, MapPin, LogOut, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const LOCATION_COLORS = {
    GENERAL: 'text-violet-600 bg-violet-50 border-violet-200',
    TEMPLO: 'text-brand-600 bg-brand-50 border-brand-200',
    ALMACEN_B1: 'text-amber-600 bg-amber-50 border-amber-200',
    ALMACEN_B2: 'text-amber-600 bg-amber-50 border-amber-200',
    ALMACEN_B3: 'text-amber-600 bg-amber-50 border-amber-200',
    ALMACEN_B4: 'text-amber-600 bg-amber-50 border-amber-200',
    ALMACEN_DISCOVERY: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const LANGUAGES = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' }
];

const THEME_ICONS = { light: Sun, dark: Moon, auto: Monitor };
const THEME_LABELS = { light: 'Claro', dark: 'Oscuro', auto: 'Auto' };

export default function Header({ title }) {
    const { user, logout } = useAuth();
    const { ubicacion, setUbicacion, ubicacionInfo } = useLocation();
    const { mode, toggleTheme, resolved } = useTheme();
    const [openLocMenu, setOpenLocMenu] = useState(false);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const locRef = useRef(null);
    const userRef = useRef(null);
    const ThemeIcon = THEME_ICONS[mode];

    // Close menus on outside click
    useEffect(() => {
        function handleClick(e) {
            if (locRef.current && !locRef.current.contains(e.target)) setOpenLocMenu(false);
            if (userRef.current && !userRef.current.contains(e.target)) setOpenUserMenu(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300 min-w-0">
            <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-0.5 flex items-center gap-1.5 truncate">
                    <span className="hidden sm:inline">Bienvenido</span> <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 flex-shrink-0"></span> <span className="truncate">{user?.nombre}</span>
                </p>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Location Switcher */}
                <div className="relative" ref={locRef}>
                    <button
                        onClick={() => { setOpenLocMenu(!openLocMenu); setOpenUserMenu(false); }}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-xl border transition-all font-bold ${LOCATION_COLORS[ubicacion] || 'text-slate-600 bg-white border-slate-200'}`}
                    >
                        <MapPin size={15} />
                        <span className="hidden sm:inline">{ubicacionInfo.nombre}</span>
                        <span className="sm:hidden">{ubicacionInfo.icono}</span>
                        <ChevronDown size={14} />
                    </button>

                    {openLocMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg ring-1 ring-slate-900/5 py-1 z-40 animate-fade-in origin-top-right overflow-hidden">
                            <p className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 mb-1">
                                Ubicación
                            </p>
                            {UBICACIONES.map(loc => (
                                <button
                                    key={loc.id}
                                    onClick={() => { setUbicacion(loc.id); setOpenLocMenu(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 flex items-center justify-between ${loc.id === ubicacion ? 'text-brand-600 font-medium bg-brand-50' : 'text-slate-600'}`}
                                >
                                    <span className="flex items-center gap-2">{loc.icono} {loc.nombre}</span>
                                    {loc.id === ubicacion && <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-brand-400 transition-all text-slate-500 hover:text-brand-600"
                    title={`Tema: ${THEME_LABELS[mode]}`}
                >
                    <ThemeIcon size={16} />
                </button>

                {/* User menu */}
                <div className="relative" ref={userRef}>
                    <button
                        onClick={() => { setOpenUserMenu(!openUserMenu); setOpenLocMenu(false); }}
                        className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm bg-white border border-slate-200 shadow-sm hover:border-brand-400 transition-all py-1.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3 rounded-xl"
                    >
                        <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                            <User size={14} />
                        </div>
                        <div className="hidden sm:flex flex-col items-start leading-none gap-0.5 min-w-0">
                            <span className="hidden lg:block text-slate-700 max-w-[120px] truncate font-semibold text-xs">{user?.nombre}</span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-400">{user?.rol}</span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                    </button>

                    {openUserMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl ring-1 ring-slate-900/5 py-2 w-56 animate-fade-in z-40 origin-top-right max-w-[calc(100vw-2rem)]">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-semibold text-slate-800">{user?.nombre}</p>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-0.5">{user?.rol}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                                <LogOut size={16} />
                                <span className="font-medium">Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
