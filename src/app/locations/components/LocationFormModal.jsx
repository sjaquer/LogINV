'use client';
import { useState } from 'react';
import { X, Save, AlertTriangle, Hash, Palette, Check } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const POPULAR_ICONS = ['⛪', '🧰', '🪜', '🎙️', '🎬', '💼', '🚪', '🎵', '👶', '☀️', '📦', '📡', '🧸', '🚻', '🌿', '📍'];
const PISOS = ['Piso 1', 'Piso 2', 'Piso 3', 'Exterior / Otro'];
const COLOR_OPTIONS = [
    { id: 'violet', label: 'Violeta', bg: 'bg-violet-500' },
    { id: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
    { id: 'emerald', label: 'Verde', bg: 'bg-emerald-500' },
    { id: 'blue', label: 'Azul', bg: 'bg-blue-500' },
    { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' },
    { id: 'cyan', label: 'Cian', bg: 'bg-cyan-500' },
    { id: 'pink', label: 'Rosa', bg: 'bg-pink-500' },
    { id: 'brand', label: 'Coral', bg: 'bg-rose-500' },
    { id: 'slate', label: 'Gris', bg: 'bg-slate-500' },
];

export default function LocationFormModal({ ubicacion, onClose, onSave }) {
    const isEdit = !!ubicacion;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEscapeKey(onClose);

    const [form, setForm] = useState({
        nombre: ubicacion?.nombre || '',
        codigo: ubicacion?.codigo || ubicacion?.id || '',
        descripcion: ubicacion?.descripcion || '',
        capacidad: ubicacion?.capacidad || 100,
        icono: ubicacion?.icono || '📍',
        piso: ubicacion?.piso || 'Piso 1',
        color: ubicacion?.color || 'violet',
        activa: ubicacion?.activa !== false,
    });

    function handleChange(key, value) {
        setForm(prev => ({ 
            ...prev, 
            [key]: key === 'capacidad' ? Number(value) || 0 : value 
        }));
    }

    async function handleSubmit() {
        if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
        if (form.nombre.trim().length > 100) { setError('El nombre no puede superar 100 caracteres'); return; }
        if (form.descripcion.trim().length > 300) { setError('La descripción no puede superar 300 caracteres'); return; }
        setSaving(true);
        setError('');
        try {
            await onSave(form, isEdit ? ubicacion.id : null);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar la ubicación');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#0d0d10] max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#0d0d10] flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 flex items-center justify-center text-xl flex-shrink-0">
                            {form.icono || '📍'}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{isEdit ? 'Editar ubicación' : 'Nueva ubicación'}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{isEdit ? 'Modifica los datos del espacio físico' : 'Registra un espacio persistente en la iglesia'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Database Code Identifier (Readonly if edit, optional if new) */}
                    {isEdit ? (
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                <Hash size={14} /> Código permanente en BD:
                            </span>
                            <span className="font-mono font-bold text-violet-600 dark:text-violet-400 uppercase">
                                {ubicacion.codigo || ubicacion.id}
                            </span>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                                <Hash size={12} /> Código de referencia (opcional)
                            </label>
                            <input
                                type="text"
                                value={form.codigo}
                                onChange={e => handleChange('codigo', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                                placeholder="Ej: SALON_310 (Se autogenera si se deja vacío)"
                                className="inp text-xs py-2 bg-white dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono"
                            />
                        </div>
                    )}

                    {/* Icon Picker */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Ícono / Símbolo</label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl">
                            {POPULAR_ICONS.map(ic => (
                                <button
                                    key={ic}
                                    type="button"
                                    onClick={() => handleChange('icono', ic)}
                                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                                        form.icono === ic
                                            ? 'bg-violet-600 text-white shadow-sm scale-110'
                                            : 'hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    {ic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color palette */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                            <Palette size={13} /> Color identificativo
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleChange('color', c.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                        form.color === c.id
                                            ? 'border-slate-800 dark:border-white bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <span className={`w-3 h-3 rounded-full ${c.bg} flex-shrink-0 flex items-center justify-center`}>
                                        {form.color === c.id && <Check size={8} className="text-white" />}
                                    </span>
                                    <span>{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Nombre de la ubicación *</label>
                        <input
                            type="text"
                            maxLength={100}
                            value={form.nombre}
                            onChange={e => handleChange('nombre', e.target.value)}
                            placeholder="Ej: Salón 310 (Música y Ensayo)"
                            className="inp text-sm py-2.5 bg-white dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Piso / Nivel</label>
                            <select
                                value={form.piso}
                                onChange={e => handleChange('piso', e.target.value)}
                                className="inp text-sm py-2.5 bg-white dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                            >
                                {PISOS.map(p => (
                                    <option key={p} value={p} className="dark:bg-[#0d0d10]">{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Capacidad aprox. (pers.)</label>
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                value={form.capacidad}
                                onChange={e => handleChange('capacidad', e.target.value)}
                                className="inp text-sm py-2.5 bg-white dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Descripción y detalles</label>
                        <textarea
                            rows={3}
                            maxLength={300}
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            placeholder="Ej: Salón en el segundo piso utilizado para clases y ensayos..."
                            className="inp resize-none text-sm py-2.5 bg-white dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={form.activa}
                                onChange={e => handleChange('activa', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-violet-600 focus:ring-violet-500 dark:bg-black/50"
                            />
                            <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ubicación activa en inventario</span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Si se desmarca, no aparecerá en el selector principal del header para nuevos productos.</p>
                            </div>
                        </label>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-black/40 flex-shrink-0">
                    <button type="button" onClick={onClose} className="btn btn-ghost px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <><span className="spinner border-white border-t-transparent w-4 h-4" /> Guardando...</>
                        ) : (
                            <><Save size={16} /> {isEdit ? 'Guardar cambios' : 'Crear ubicación'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
