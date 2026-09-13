'use client';
import { useState } from 'react';
import { X, Save, AlertTriangle, Handshake } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { formatDate } from '@/lib/utils';

export default function LoanFormModal({ productos, ubicacion, onClose, onSave }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEscapeKey(onClose);

    const [form, setForm] = useState({
        producto_id: '',
        prestado_a: '',
        contacto: '',
        fecha_devolucion_esperada: '',
        notas: '',
    });

    // Get available products (with stock > 0)
    const productosDisponibles = productos.filter(p => p.stock_actual > 0);

    function handleChange(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleSubmit() {
        if (!form.producto_id) { setError('Selecciona un producto'); return; }
        if (!form.prestado_a.trim()) { setError('El nombre del destinatario es requerido'); return; }
        if (!form.fecha_devolucion_esperada) { setError('La fecha de devolución es requerida'); return; }
        
        setSaving(true);
        setError('');
        try {
            const producto = productos.find(p => p.id === form.producto_id);
            await onSave({
                ...form,
                producto_nombre: producto?.nombre || '',
                ubicacion_origen: ubicacion,
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
                        <h3 className="font-bold text-slate-900 text-lg">Nuevo préstamo</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Registra un préstamo de producto</p>
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
                            {productosDisponibles.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Prestado a *</label>
                        <input
                            type="text"
                            value={form.prestado_a}
                            onChange={e => handleChange('prestado_a', e.target.value)}
                            placeholder="Nombre de quien recibe"
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Contacto</label>
                        <input
                            type="tel"
                            value={form.contacto}
                            onChange={e => handleChange('contacto', e.target.value)}
                            placeholder="Teléfono o email"
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fecha devolución esperada *</label>
                        <input
                            type="date"
                            value={form.fecha_devolucion_esperada}
                            onChange={e => handleChange('fecha_devolucion_esperada', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notas</label>
                        <textarea
                            rows={2}
                            value={form.notas}
                            onChange={e => handleChange('notas', e.target.value)}
                            placeholder="Motivo del préstamo"
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
                            <><Handshake size={18} /> Registrar préstamo</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
