'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export default function DeleteConfirmModal({ producto, onClose, onConfirm }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEscapeKey(onClose);

    async function handleDelete() {
        setDeleting(true);
        setError('');
        try {
            await onConfirm(producto.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Error');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-6 border border-slate-200 shadow-2xl bg-white max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">Eliminar producto</h3>
                    <p className="text-sm text-slate-500 mt-2">¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
                    <p className="text-base font-bold text-slate-800 mt-2 bg-slate-100 px-4 py-2 rounded-lg">{producto.nombre}</p>
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 w-full text-left">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn btn-ghost flex-1 py-3 text-base font-semibold text-slate-600">
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="btn btn-danger flex-1 py-3 text-base font-bold flex items-center justify-center gap-2"
                    >
                        {deleting ? <span className="spinner border-white border-t-transparent w-5 h-5" /> : <Trash2 size={18} />}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
