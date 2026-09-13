'use client';
import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { EmptyState } from '@/components/ui/SharedComponents';
import { ROLES } from '@/lib/constants';
import {
    Users, Plus, X, Save, Pencil, Trash2, ShieldCheck, ToggleLeft, ToggleRight,
} from 'lucide-react';

const ROL_OPTIONS = Object.values(ROLES).map(r => ({ id: r.id, label: r.label }));

function UsuarioFormModal({ usuario, onClose, onSave }) {
    const isEdit = !!usuario?.id;
    const [form, setForm] = useState({
        nombre: usuario?.nombre || '',
        email: usuario?.email || '',
        rol: usuario?.rol || 'voluntario',
        telefono: usuario?.telefono || '',
        departamento: usuario?.departamento || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    useEscapeKey(onClose);

    function handleChange(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
        setSaving(true);
        setError('');
        try {
            await onSave(form, isEdit ? usuario.id : null);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg">{isEdit ? 'Editar persona' : 'Nueva persona'}</h3>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                {error && (
                    <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre *</label>
                        <input type="text" value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} className="inp py-3 bg-white border-slate-200 text-slate-900" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Correo</label>
                        <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="inp py-3 bg-white border-slate-200 text-slate-900" placeholder="nombre@iglesia.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Rol</label>
                            <select value={form.rol} onChange={e => handleChange('rol', e.target.value)} className="inp py-3 bg-white border-slate-200 text-slate-900">
                                {ROL_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono</label>
                            <input type="text" value={form.telefono} onChange={e => handleChange('telefono', e.target.value)} className="inp py-3 bg-white border-slate-200 text-slate-900" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Área / Ministerio</label>
                        <input type="text" value={form.departamento} onChange={e => handleChange('departamento', e.target.value)} className="inp py-3 bg-white border-slate-200 text-slate-900" placeholder="Ej: Ministerio de Adoración" />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-ghost px-5 py-2.5 text-sm font-semibold text-slate-600">Cancelar</button>
                        <button type="submit" disabled={saving} className="btn btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2">
                            {saving ? <span className="spinner border-white border-t-transparent w-4 h-4" /> : <Save size={16} />}
                            {isEdit ? 'Guardar cambios' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const { usuarios, loading, crearUsuario, actualizarUsuario, eliminarUsuario, toggleUsuario } = useUsuarios();
    const { user } = useAuth();
    const { setHideBottomNav } = useSidebar();
    const role = user?.rol || 'voluntario';
    const canManage = role === 'admin';

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        setHideBottomNav(!!showForm);
        return () => setHideBottomNav(false);
    }, [showForm, setHideBottomNav]);

    const handleSave = useCallback(async (data, id) => {
        if (id) await actualizarUsuario(id, data);
        else await crearUsuario(data);
    }, [crearUsuario, actualizarUsuario]);

    const handleEdit = useCallback((usuario) => {
        setEditing(usuario);
        setShowForm(true);
    }, []);

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Personal e Iglesia" />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-4xl mx-auto w-full pb-8">

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Users size={18} className="text-brand-500" /> Directorio de personal y ministerios
                    </h3>
                    <p className="text-xs text-slate-500">Personas y ministerios responsables del inventario (préstamos, mantenimiento). No controla el acceso al sistema.</p>
                </div>

                {!canManage && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        <ShieldCheck size={16} className="flex-shrink-0" /> Solo un administrador puede crear o editar personas.
                    </div>
                )}

                {canManage && (
                    <button
                        onClick={() => { setEditing(null); setShowForm(true); }}
                        className="btn btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={20} /> Nueva persona
                    </button>
                )}

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl h-20 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : usuarios.length === 0 ? (
                    <EmptyState icon={Users} title="Sin personas registradas" subtitle="Agrega al personal y ministerios responsables del inventario" />
                ) : (
                    <div className="space-y-3">
                        {usuarios.map(u => (
                            <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 text-brand-600 font-bold">
                                    {u.nombre?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 truncate">{u.nombre}</p>
                                    <p className="text-xs text-slate-500 truncate">{u.departamento || '—'} {u.email ? `· ${u.email}` : ''}</p>
                                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                        {ROLES[u.rol?.toUpperCase()]?.label || u.rol}
                                    </span>
                                </div>
                                {canManage && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => toggleUsuario(u.id, !u.activo)}
                                            className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                            aria-label={u.activo ? 'Desactivar' : 'Activar'}
                                            title={u.activo ? 'Activo' : 'Inactivo'}
                                        >
                                            {u.activo !== false ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                                        </button>
                                        <button onClick={() => handleEdit(u)} className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" aria-label="Editar">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => eliminarUsuario(u.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" aria-label="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <UsuarioFormModal
                    usuario={editing}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
