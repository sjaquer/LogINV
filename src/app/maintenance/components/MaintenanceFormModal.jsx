'use client';
import { useState } from 'react';
import { X, Save, AlertTriangle, Wrench } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const TIPOS = [
    { id: 'preventivo', label: 'Preventivo', color: 'blue' },
    { id: 'correctivo', label: 'Correctivo', color: 'red' },
];

export default function MaintenanceFormModal({ productos, onClose, onSave }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEscapeKey(onClose);

    const [form, setForm] = useState({
        producto_id: '',
        tipo: 'preventivo',
        descripcion: '',
        fecha_programada: '',
        responsable: '',
        costo: 0,
        notas: '',
    });

    function handleChange(key, value) {
        setForm(prev => ({ ...prev, [key]: key === 'costo' ? Number(value) || 0 : value }));
    }

    async function handleSubmit() {
        if (!form.producto_id) { setError('Selecciona un producto'); return; }
        if (!form.descripcion.trim()) { setError('La descripción es requerida'); return; }
        if (!form.fecha_programada) { setError('La fecha programada es requerida'); return; }
        if (!form.responsable.trim()) { setError('El responsable es requerido'); return; }
        
        setSaving(true);
        setError('');
        try {
            const producto = productos.find(p => p.id === form.producto_id);
            await onSave({
                ...form,
                producto_nombre: producto?.nombre || '',
            });
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
                        <h3 className="font-bold text-slate-900 text-lg">Nuevo mantenimiento</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Programa un mantenimiento para un producto</p>
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">Producto *</label>
                        <select
                            value={form.producto_id}
                            onChange={e => handleChange('producto_id', e.target.value)}
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        >
                            <option value="">— Selecciona un producto —</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipo *</label>
                        <div className="flex gap-2">
                            {TIPOS.map(tipo => (
                                <button
                                    key={tipo.id}
                                    type="button"
                                    onClick={() => handleChange('tipo', tipo.id)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                                        form.tipo === tipo.id
                                            ? tipo.color === 'blue' 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10'
                                                : 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/10'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {tipo.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción *</label>
                        <textarea
                            rows={2}
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            placeholder="Describe el mantenimiento a realizar"
                            className="inp resize-none text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fecha programada *</label>
                        <input
                            type="date"
                            value={form.fecha_programada}
                            onChange={e => handleChange('fecha_programada', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Responsable *</label>
                        <input
                            type="text"
                            value={form.responsable}
                            onChange={e => handleChange('responsable', e.target.value)}
                            placeholder="Nombre del técnico responsable"
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Costo estimado</label>
                        <input
                            type="number"
                            min="0"
                            value={form.costo}
                            onChange={e => handleChange('costo', e.target.value)}
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notas</label>
                        <textarea
                            rows={2}
                            value={form.notas}
                            onChange={e => handleChange('notas', e.target.value)}
                            placeholder="Notas adicionales"
                            className="inp resize-none text-base py-3 bg-white border-slate-200 text-slate-900"
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
                            <><Wrench size={18} /> Programar mantenimiento</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
