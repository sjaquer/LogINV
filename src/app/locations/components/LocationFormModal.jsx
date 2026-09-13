'use client';
import { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export default function LocationFormModal({ ubicacion, onClose, onSave }) {
    const isEdit = !!ubicacion;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEscapeKey(onClose);

    const [form, setForm] = useState({
        nombre: ubicacion?.nombre || '',
        descripcion: ubicacion?.descripcion || '',
        capacidad: ubicacion?.capacidad || 100,
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
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-md w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">{isEdit ? 'Editar ubicación' : 'Nueva ubicación'}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{isEdit ? 'Modifica los datos de la ubicación' : 'Registra una nueva ubicación'}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => handleChange('nombre', e.target.value)}
                            placeholder="Ej: Iglesia Principal"
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                        <textarea
                            rows={2}
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            placeholder="Descripción de la ubicación"
                            className="inp resize-none text-base py-3 bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Capacidad (personas)</label>
                        <input
                            type="number"
                            min="1"
                            value={form.capacidad}
                            onChange={e => handleChange('capacidad', e.target.value)}
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    <button type="button" onClick={onClose} className="btn btn-ghost px-6 py-3 text-base font-semibold text-slate-600">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn btn-primary px-6 py-3 text-base font-bold flex items-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <><span className="spinner border-white border-t-transparent w-5 h-5" /> Guardando...</>
                        ) : (
                            <><Save size={18} /> {isEdit ? 'Guardar cambios' : 'Crear ubicación'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
