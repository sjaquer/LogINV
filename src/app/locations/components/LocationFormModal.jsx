'use client';
import { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const POPULAR_ICONS = ['⛪', '🧰', '🪜', '🎙️', '🎬', '💼', '🚪', '🎵', '👶', '☀️', '📦', '📡', '🧸', '🚻', '🌿'];
const PISOS = ['Piso 1', 'Piso 2', 'Piso 3', 'Exterior / Otro'];

export default function LocationFormModal({ ubicacion, onClose, onSave }) {
    const isEdit = !!ubicacion;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEscapeKey(onClose);

    const [form, setForm] = useState({
        nombre: ubicacion?.nombre || '',
        descripcion: ubicacion?.descripcion || '',
        capacidad: ubicacion?.capacidad || 100,
        icono: ubicacion?.icono || '📍',
        piso: ubicacion?.piso || 'Piso 1',
    });

    function handleChange(key, value) {
        setForm(prev => ({ ...prev, [key]: key === 'capacidad' ? Number(value) || 0 : value }));
    }

    async function handleSubmit() {
        if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
        setSaving(true);
        setError('');
        try {
            await onSave(form, isEdit ? ubicacion.id : null);
            onClose();
        } catch (err) {
            setError(err.message || 'Error');
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
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{isEdit ? 'Modifica los datos en la base de datos' : 'Registra un espacio persistente en la iglesia'}</p>
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

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Nombre *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => handleChange('nombre', e.target.value)}
                            placeholder="Ej: Salón de Música"
                            className="inp text-sm py-2.5 bg-white dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
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
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Capacidad (personas)</label>
                            <input
                                type="number"
                                min="1"
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
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            placeholder="Ej: Salón en el segundo piso utilizado para clases y ensayos..."
                            className="inp resize-none text-sm py-2.5 bg-white dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                        />
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
