'use client';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Users, Plus, X, Save, Pencil, Trash2, KeyRound, ShieldCheck, ShieldAlert, Wand2,
    Copy, Check, UserCheck, UserX, Eye, EyeOff, LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import RouteGuard from '@/components/ui/RouteGuard';
import { PageBody, SearchInput, SegmentedTabs } from '@/components/ui/Page';
import { EmptyState } from '@/components/ui/SharedComponents';
import { useToast, useConfirm } from '@/components/ui/Feedback';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { authService } from '@/services/auth';
import { USE_MOCK } from '@/hooks/useFirestoreQuery';
import { audit } from '@/lib/auditLog';
import { cn } from '@/lib/utils';
import { AppError } from '@/lib/errors';

const ROLE_INFO = {
    admin: {
        label: 'Administrador',
        tone: 'bg-violet-50 text-violet-700 ring-violet-200',
        desc: 'Acceso total: además de todo lo del encargado, gestiona cuentas de usuario y ve la auditoría.',
    },
    encargado: {
        label: 'Encargado',
        tone: 'bg-brand-50 text-brand-700 ring-brand-200',
        desc: 'Gestiona productos, ubicaciones, inventario, mantenimiento y reportes.',
    },
    voluntario: {
        label: 'Voluntario',
        tone: 'bg-slate-100 text-slate-600 ring-slate-200',
        desc: 'Consulta productos, escanea códigos y registra préstamos.',
    },
};

// ─── API de administración (/api/admin/users, protegida por el ID token) ───
async function callAdminApi(method, body, query = '') {
    const idToken = await authService.getIdToken();
    if (!idToken) throw new AppError('AUTH-05');
    const res = await fetch(`/api/admin/users${query}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* respuesta no JSON */ }
    if (!res.ok) {
        const err = new Error(data?.error || `Error del servidor (${res.status})`);
        err.status = res.status;
        err.appCode = data?.code;                       // código del diccionario (src/lib/errors.js)
        err.serverMessage = res.status < 500 && !!data?.error; // mensaje específico y seguro para mostrar
        throw err;
    }
    return data;
}

// Respaldo si el servidor no tiene credenciales de administración: crea la
// cuenta con una instancia secundaria de Firebase Auth (sin cerrar la sesión
// del administrador) y escribe su perfil con la sesión del admin.
async function crearCuentaDesdeNavegador(form) {
    const { initializeApp, deleteApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } = await import('firebase/auth');
    const { firebaseConfig } = await import('@/lib/firebaseConfig');
    const { setDocument } = await import('@/lib/dataOps');

    const secondaryApp = initializeApp(firebaseConfig, `UserCreator_${Date.now()}`);
    try {
        const secondaryAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.nombre }).catch(() => {});
        await signOut(secondaryAuth);
        await setDocument('usuarios', cred.user.uid, {
            nombre: form.nombre,
            email: form.email,
            rol: form.rol,
            activo: true,
            telefono: form.telefono || '',
            departamento: form.departamento || '',
            fecha_creacion: new Date().toISOString(),
        });
        return cred.user.uid;
    } finally {
        await deleteApp(secondaryApp).catch(() => {});
    }
}

function generarPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const arr = new Uint32Array(10);
    crypto.getRandomValues(arr);
    return Array.from(arr, n => chars[n % chars.length]).join('');
}

function useServerStatus() {
    const [state, setState] = useState({ status: USE_MOCK ? 'demo' : 'checking', detail: '' });
    useEffect(() => {
        if (USE_MOCK) return undefined;
        let alive = true;
        callAdminApi('GET')
            .then(() => alive && setState({ status: 'ok', detail: '' }))
            .catch(err => alive && setState(
                err.status === 401 || err.status === 403
                    ? { status: 'ok', detail: '' }
                    : { status: 'unavailable', detail: err.message },
            ));
        return () => { alive = false; };
    }, []);
    return state;
}

// ─── Formulario ────────────────────────────────────────────────────────────
function UsuarioFormModal({ usuario, isSelf, onClose, onSave }) {
    const isEdit = !!usuario?.id;
    const [cambiarPassword, setCambiarPassword] = useState(!isEdit);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({
        nombre: usuario?.nombre || '',
        email: usuario?.email || '',
        password: '',
        rol: usuario?.rol || 'voluntario',
        telefono: usuario?.telefono || '',
        departamento: usuario?.departamento || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();
    useEscapeKey(onClose);

    const set = (key, value) => { setForm(prev => ({ ...prev, [key]: value })); setError(''); };

    async function handleSubmit(e) {
        e.preventDefault();
        const nombre = form.nombre.trim();
        const email = form.email.trim().toLowerCase();
        if (!nombre) return setError('El nombre es obligatorio.');
        if (!isEdit && !/^\S+@\S+\.\S+$/.test(email)) return setError('Ingresa un correo válido.');
        if (cambiarPassword && form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

        setSaving(true);
        try {
            await onSave({ ...form, nombre, email, password: cambiarPassword ? form.password : '' }, usuario);
            onClose();
        } catch (err) {
            toast.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up max-w-lg" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="user-form-title">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-surface px-5 py-4">
                    <h2 id="user-form-title" className="text-lg font-bold text-slate-900">{isEdit ? 'Editar cuenta' : 'Nueva cuenta de acceso'}</h2>
                    <button type="button" onClick={onClose} className="icon-btn" aria-label="Cerrar"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</div>}

                    <div>
                        <label className="field-label" htmlFor="u-nombre">Nombre completo *</label>
                        <input id="u-nombre" type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} className="inp py-3" autoComplete="off" required />
                    </div>

                    <div>
                        <label className="field-label" htmlFor="u-email">Correo {isEdit ? '' : '*'}</label>
                        <input
                            id="u-email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                            className="inp py-3" placeholder="nombre@correo.com" disabled={isEdit} required={!isEdit} autoComplete="off"
                        />
                        {isEdit && <p className="mt-1 text-xs text-slate-400">El correo no se puede cambiar. Si es necesario, crea una cuenta nueva.</p>}
                    </div>

                    {isEdit && !cambiarPassword ? (
                        <button type="button" onClick={() => setCambiarPassword(true)} className="btn-secondary btn-sm">
                            <KeyRound size={14} /> Restablecer contraseña
                        </button>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="field-label" htmlFor="u-pass">{isEdit ? 'Nueva contraseña' : 'Contraseña inicial *'}</label>
                                {isEdit && (
                                    <button type="button" className="text-xs text-slate-400 hover:text-slate-600" onClick={() => { setCambiarPassword(false); set('password', ''); }}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        id="u-pass" type={showPass ? 'text' : 'password'} value={form.password}
                                        onChange={e => set('password', e.target.value)} className="inp py-3 pr-10"
                                        placeholder="Mínimo 6 caracteres" autoComplete="new-password" required
                                    />
                                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600" aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <button type="button" className="btn-secondary px-3" onClick={() => { set('password', generarPassword()); setShowPass(true); }} title="Generar contraseña segura" aria-label="Generar contraseña segura">
                                    <Wand2 size={16} /> <span className="hidden sm:inline">Generar</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <fieldset>
                        <legend className="field-label">Rol</legend>
                        {isSelf && <p className="mb-2 text-xs text-amber-700">No puedes cambiar tu propio rol.</p>}
                        <div className="grid gap-2">
                            {Object.entries(ROLE_INFO).map(([id, info]) => (
                                <label
                                    key={id}
                                    className={cn(
                                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                                        form.rol === id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-slate-300',
                                        isSelf && 'cursor-not-allowed opacity-60',
                                    )}
                                >
                                    <input type="radio" name="rol" value={id} checked={form.rol === id} disabled={isSelf} onChange={() => set('rol', id)} className="mt-1 accent-brand-600" />
                                    <span>
                                        <span className="block text-sm font-semibold text-slate-800">{info.label}</span>
                                        <span className="block text-xs text-slate-500">{info.desc}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="field-label" htmlFor="u-tel">Teléfono</label>
                            <input id="u-tel" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} className="inp py-3" />
                        </div>
                        <div>
                            <label className="field-label" htmlFor="u-dep">Área / Ministerio</label>
                            <input id="u-dep" type="text" value={form.departamento} onChange={e => set('departamento', e.target.value)} className="inp py-3" placeholder="Ej: Adoración" />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">Cancelar</button>
                        <button type="submit" disabled={saving} className="btn-primary py-2.5 text-sm">
                            {saving ? <span className="spinner h-4 w-4 border-white/40 border-t-white" /> : <Save size={16} />}
                            {isEdit ? 'Guardar cambios' : 'Crear cuenta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Tarjeta con datos de acceso para entregar al nuevo usuario ───────────
function CredencialesCard({ cred, onClose }) {
    const [copied, setCopied] = useState(false);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const texto = `Hola ${cred.nombre}, ya tienes acceso a LogINV (inventario de la iglesia).\n\nEntra en: ${origin}\nCorreo: ${cred.email}\nContraseña: ${cred.password}\n\nAl ingresar, abre "Ayuda y guía" desde el menú para aprender a usar la app.`;
    async function copiar() {
        try {
            await navigator.clipboard.writeText(texto);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* sin permiso de portapapeles */ }
    }
    return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 font-bold text-emerald-800"><UserCheck size={18} /> Cuenta creada para {cred.nombre}</h3>
                    <p className="mt-1 text-sm text-emerald-700">Entrega estos datos a la persona. La contraseña no se volverá a mostrar.</p>
                </div>
                <button type="button" onClick={onClose} className="icon-btn" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <dl className="mt-3 grid gap-2 rounded-xl bg-surface p-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-slate-400">Correo</dt><dd className="font-semibold text-slate-800 break-all">{cred.email}</dd></div>
                <div><dt className="text-xs text-slate-400">Contraseña</dt><dd className="font-mono font-semibold text-slate-800">{cred.password}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={copiar} className="btn-primary btn-sm">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar mensaje de bienvenida'}
                </button>
                <Link href="/ayuda#primeros-pasos" className="btn-secondary btn-sm"><LifeBuoy size={14} /> Ver guía para nuevos</Link>
            </div>
        </div>
    );
}

// ─── Página ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const { usuarios, loading, error, crearUsuario, actualizarUsuario, eliminarUsuario, toggleUsuario } = useUsuarios();
    const { user } = useAuth();
    const { setHideBottomNav } = useSidebar();
    const toast = useToast();
    const confirm = useConfirm();
    const { status: serverStatus, detail: serverDetail } = useServerStatus();

    const [modal, setModal] = useState(null); // { usuario } — usuario null = nueva cuenta
    const [busyId, setBusyId] = useState(null);
    const [credenciales, setCredenciales] = useState(null);
    const [q, setQ] = useState('');
    const [filtroRol, setFiltroRol] = useState('todos');

    useEffect(() => {
        setHideBottomNav(!!modal);
        return () => setHideBottomNav(false);
    }, [modal, setHideBottomNav]);

    const stats = useMemo(() => ({
        total: usuarios.length,
        activos: usuarios.filter(u => u.activo !== false).length,
        porRol: Object.fromEntries(Object.keys(ROLE_INFO).map(r => [r, usuarios.filter(u => u.rol === r).length])),
    }), [usuarios]);

    const lista = useMemo(() => {
        const term = q.trim().toLowerCase();
        return usuarios
            .filter(u => filtroRol === 'todos' || (filtroRol === 'inactivos' ? u.activo === false : u.rol === filtroRol))
            .filter(u => !term || `${u.nombre} ${u.email} ${u.departamento}`.toLowerCase().includes(term))
            .sort((a, b) => (a.id === user?.id ? -1 : b.id === user?.id ? 1 : (a.nombre || '').localeCompare(b.nombre || '', 'es')));
    }, [usuarios, q, filtroRol, user?.id]);

    const handleSave = useCallback(async (form, existing) => {
        const perfil = { nombre: form.nombre, rol: form.rol, telefono: form.telefono, departamento: form.departamento };

        if (existing) {
            if (USE_MOCK) {
                await actualizarUsuario(existing.id, perfil);
            } else {
                try {
                    await callAdminApi('PATCH', { id: existing.id, ...perfil, ...(form.password ? { password: form.password } : {}) });
                } catch (apiErr) {
                    if (apiErr.status && apiErr.status < 500) throw apiErr; // error de validación real
                    await actualizarUsuario(existing.id, perfil);
                    if (form.password) {
                        await authService.resetPassword(existing.email);
                        toast.warning(`El servidor no pudo cambiar la contraseña. Se envió a ${existing.email} un correo para que la restablezca.`, { duration: 9000 });
                    }
                }
            }
            audit('editar', 'usuario', existing.id, `${form.nombre}${existing.rol !== form.rol ? ` · rol ${existing.rol} → ${form.rol}` : ''}${form.password ? ' · contraseña restablecida' : ''}`);
            toast.success('Cuenta actualizada');
            return;
        }

        let id;
        if (USE_MOCK) {
            id = await crearUsuario({ ...perfil, email: form.email });
        } else {
            try {
                ({ id } = await callAdminApi('POST', { ...perfil, email: form.email, password: form.password }));
            } catch (apiErr) {
                if (apiErr.status && apiErr.status < 500) throw apiErr;
                console.warn('[LogINV] API de usuarios no disponible, creando desde el navegador:', apiErr.message);
                id = await crearCuentaDesdeNavegador({ ...perfil, email: form.email, password: form.password });
            }
        }
        audit('crear', 'usuario', id, `${form.nombre} (${ROLE_INFO[form.rol]?.label || form.rol})`);
        setCredenciales({ nombre: form.nombre, email: form.email, password: form.password });
        toast.success('Cuenta creada');
    }, [actualizarUsuario, crearUsuario, toast]);

    const handleToggle = useCallback(async (u) => {
        const activar = u.activo === false;
        if (!activar && !(await confirm({
            title: `¿Desactivar a ${u.nombre}?`,
            message: 'No podrá iniciar sesión hasta que reactives su cuenta. Sus registros se conservan.',
            confirmLabel: 'Desactivar',
            danger: true,
        }))) return;

        setBusyId(u.id);
        try {
            if (USE_MOCK) await toggleUsuario(u.id, activar);
            else {
                try {
                    await callAdminApi('PATCH', { id: u.id, activo: activar });
                } catch (apiErr) {
                    if (apiErr.status && apiErr.status < 500) throw apiErr;
                    await toggleUsuario(u.id, activar);
                }
            }
            audit(activar ? 'activar' : 'desactivar', 'usuario', u.id, u.nombre);
            toast.success(activar ? `${u.nombre} puede volver a ingresar` : `${u.nombre} fue desactivado`);
        } catch (err) {
            toast.error(err);
        } finally {
            setBusyId(null);
        }
    }, [confirm, toggleUsuario, toast]);

    const handleDelete = useCallback(async (u) => {
        if (!(await confirm({
            title: `¿Eliminar la cuenta de ${u.nombre}?`,
            message: 'Perderá el acceso de forma permanente. Si solo quieres bloquearla por un tiempo, desactívala.',
            confirmLabel: 'Eliminar cuenta',
            danger: true,
        }))) return;

        setBusyId(u.id);
        try {
            if (USE_MOCK) await eliminarUsuario(u.id);
            else {
                try {
                    await callAdminApi('DELETE', null, `?id=${encodeURIComponent(u.id)}`);
                } catch (apiErr) {
                    if (apiErr.status && apiErr.status < 500) throw apiErr;
                    await eliminarUsuario(u.id);
                    toast.warning('Se eliminó el perfil, pero el servidor no pudo borrar las credenciales. La persona ya no tiene acceso a ningún dato.', { duration: 9000 });
                }
            }
            audit('eliminar', 'usuario', u.id, `${u.nombre} (${u.email})`);
            toast.success('Cuenta eliminada');
        } catch (err) {
            toast.error(err);
        } finally {
            setBusyId(null);
        }
    }, [confirm, eliminarUsuario, toast]);

    const tabs = [
        { id: 'todos', label: 'Todos', count: stats.total },
        { id: 'admin', label: 'Admins', count: stats.porRol.admin },
        { id: 'encargado', label: 'Encargados', count: stats.porRol.encargado },
        { id: 'voluntario', label: 'Voluntarios', count: stats.porRol.voluntario },
        { id: 'inactivos', label: 'Inactivos', count: stats.total - stats.activos },
    ];

    return (
        <RouteGuard>
            <div className="flex flex-col flex-1">
                <Header title="Usuarios y roles" />
                <PageBody width="max-w-4xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-500 max-w-xl">
                                Crea las cuentas con las que cada persona entra a LogINV y define qué puede hacer.
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{stats.activos} activas de {stats.total}</p>
                        </div>
                        <button type="button" onClick={() => setModal({ usuario: null })} className="btn-primary py-2.5 text-sm">
                            <Plus size={18} /> Nueva cuenta
                        </button>
                    </div>

                    {serverStatus === 'unavailable' && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                            <ShieldAlert size={18} className="mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                                <p>
                                    La administración de cuentas del servidor no está disponible. Puedes crear y editar cuentas,
                                    pero cambiar contraseñas enviará un correo de restablecimiento y eliminar una cuenta no
                                    borrará sus credenciales.
                                </p>
                                {serverDetail && <p className="font-mono text-xs opacity-80">Detalle: {serverDetail}</p>}
                            </div>
                        </div>
                    )}

                    {credenciales && <CredencialesCard cred={credenciales} onClose={() => setCredenciales(null)} />}

                    <div className="space-y-3">
                        <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, correo o área…" />
                        <SegmentedTabs tabs={tabs} value={filtroRol} onChange={setFiltroRol} />
                    </div>

                    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

                    {loading ? (
                        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[76px] rounded-xl bg-slate-100 animate-pulse" />)}</div>
                    ) : lista.length === 0 ? (
                        <EmptyState icon={Users} title="Sin resultados" subtitle={usuarios.length ? 'Prueba con otra búsqueda o filtro.' : 'Crea la primera cuenta de acceso.'} />
                    ) : (
                        <ul className="glass-panel divide-y divide-slate-100">
                            {lista.map(u => {
                                const isSelf = u.id === user?.id;
                                const inactive = u.activo === false;
                                const info = ROLE_INFO[u.rol] || { label: u.rol, tone: ROLE_INFO.voluntario.tone };
                                return (
                                    <li key={u.id} className={cn('flex items-center gap-3 px-4 py-3.5 sm:px-5', inactive && 'opacity-60')}>
                                        <span className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold', inactive ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white')}>
                                            {(u.nombre || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-2 font-semibold text-slate-900">
                                                <span className="truncate">{u.nombre}</span>
                                                {isSelf && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">Tú</span>}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">{u.email}{u.departamento ? ` · ${u.departamento}` : ''}</p>
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1', info.tone)}>{info.label}</span>
                                                {inactive && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200">Desactivada</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-shrink-0 items-center gap-0.5">
                                            {busyId === u.id ? (
                                                <span className="spinner mx-3 h-5 w-5" />
                                            ) : (
                                                <>
                                                    <button
                                                        type="button" onClick={() => handleToggle(u)} disabled={isSelf}
                                                        className={cn('icon-btn', inactive ? 'hover:text-emerald-600' : 'hover:text-amber-600')}
                                                        aria-label={inactive ? `Activar a ${u.nombre}` : `Desactivar a ${u.nombre}`}
                                                        title={isSelf ? 'No puedes desactivar tu propia cuenta' : inactive ? 'Activar cuenta' : 'Desactivar cuenta'}
                                                    >
                                                        {inactive ? <UserCheck size={18} /> : <UserX size={18} />}
                                                    </button>
                                                    <button type="button" onClick={() => setModal({ usuario: u })} className="icon-btn hover:text-brand-600" aria-label={`Editar a ${u.nombre}`} title="Editar o restablecer contraseña">
                                                        <Pencil size={17} />
                                                    </button>
                                                    <button
                                                        type="button" onClick={() => handleDelete(u)} disabled={isSelf}
                                                        className="icon-btn hover:text-rose-600" aria-label={`Eliminar a ${u.nombre}`}
                                                        title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar cuenta'}
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <details className="glass-panel">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 sm:px-5">
                            <ShieldCheck size={16} className="text-brand-500" /> ¿Qué puede hacer cada rol?
                        </summary>
                        <dl className="space-y-3 border-t border-slate-100 px-4 py-3 text-sm sm:px-5">
                            {Object.values(ROLE_INFO).map(r => (
                                <div key={r.label}>
                                    <dt className="font-semibold text-slate-800">{r.label}</dt>
                                    <dd className="text-slate-500">{r.desc}</dd>
                                </div>
                            ))}
                        </dl>
                    </details>
                </PageBody>

                {modal && (
                    <UsuarioFormModal
                        usuario={modal.usuario}
                        isSelf={modal.usuario?.id === user?.id}
                        onClose={() => setModal(null)}
                        onSave={handleSave}
                    />
                )}
            </div>
        </RouteGuard>
    );
}
