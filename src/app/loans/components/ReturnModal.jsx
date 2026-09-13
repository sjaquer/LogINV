'use client';
import { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export default function ReturnModal({ loan, onClose, onConfirm }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notas, setNotas] = useState('');

    useEscapeKey(onClose);

    async function handleConfirm() {
        setSaving(true);
        setError('');
        try {
            await onConfirm(notas);
        } catch (err) {
            setError(err.message || 'Error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-6 border border-slate-200 shadow-2xl bg-white max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                        <CheckCircle size={28} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">Registrar devolución</h3>
                    <p className="text-sm text-slate-500 mt-2">¿Confirmas la devolución de este producto?</p>
                    <p className="text-base font-bold text-slate-800 mt-2 bg-slate-100 px-4 py-2 rounded-lg">{loan.producto_nombre}</p>
                    <p className="text-sm text-slate-500 mt-1">Prestado a: <strong>{loan.prestado_a}</strong></p>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Notas (opcional)</label>
                    <textarea
                        rows={2}
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        placeholder="Estado del producto, observaciones..."
                        className="inp resize-none text-sm py-2 bg-white border-slate-200 text-slate-900 w-full"
                    />
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn btn-ghost flex-1 py-3 text-base font-semibold text-slate-600">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="btn btn-primary flex-1 py-3 text-base font-bold flex items-center justify-center gap-2"
                    >
                        {saving ? <span className="spinner border-white border-t-transparent w-5 h-5" /> : <CheckCircle size={18} />}
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
