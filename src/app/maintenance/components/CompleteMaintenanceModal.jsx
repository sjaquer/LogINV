'use client';
import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

/** Cierra un mantenimiento registrando su costo y notas del trabajo realizado. */
export default function CompleteMaintenanceModal({ maintenance, onClose, onConfirm }) {
    const [costo, setCosto] = useState(maintenance.costo ? String(maintenance.costo) : '');
    const [notas, setNotas] = useState('');
    const [busy, setBusy] = useState(false);
    useEscapeKey(onClose);

    async function submit(e) {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
            await onConfirm(Number(costo) || 0, notas.trim());
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <form onSubmit={submit} className="modal-box animate-slide-up max-w-sm" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="complete-title">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 id="complete-title" className="flex items-center gap-2 font-bold text-slate-900"><CheckCircle2 size={18} className="text-emerald-600" /> Completar mantenimiento</h2>
                    <button type="button" onClick={onClose} className="icon-btn" aria-label="Cerrar"><X size={18} /></button>
                </div>
                <div className="space-y-4 p-5">
                    <p className="text-sm text-slate-600"><strong className="text-slate-800">{maintenance.producto_nombre}</strong> · {maintenance.descripcion}</p>
                    <div>
                        <label htmlFor="m-costo" className="field-label">Costo (S/)</label>
                        <input id="m-costo" type="number" min="0" step="0.01" inputMode="decimal" value={costo} onChange={e => setCosto(e.target.value)} className="inp" placeholder="0.00" />
                    </div>
                    <div>
                        <label htmlFor="m-notas" className="field-label">¿Qué se hizo?</label>
                        <textarea id="m-notas" rows={3} value={notas} onChange={e => setNotas(e.target.value)} className="inp resize-none" placeholder="Ej: se cambiaron los filtros y se limpió el equipo" />
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">Cancelar</button>
                        <button type="submit" disabled={busy} className="btn py-2.5 text-sm border-transparent bg-emerald-600 text-white hover:bg-emerald-500">
                            {busy ? <span className="spinner h-4 w-4 border-white/40 border-t-white" /> : <CheckCircle2 size={16} />} Marcar como completado
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
