'use client';
import { Check, AlertTriangle } from 'lucide-react';

export default function ScanFeedback({ feedback }) {
    if (!feedback) return null;
    const styles = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        error: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
        <div role="status" className={`flex items-start gap-2 rounded-xl border p-3.5 text-sm sm:text-base font-medium animate-fade-in ${styles[feedback.type]}`}>
            {feedback.type === 'success' ? <Check size={18} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />}
            <span>
                {feedback.type === 'success' && <>Producto identificado: <strong>{feedback.name}</strong></>}
                {feedback.type === 'warning' && <><strong>{feedback.name}</strong> pertenece a <strong>{feedback.icono} {feedback.ubicacion}</strong>. Cambia de ubicación para contarlo.</>}
                {feedback.type === 'error' && <>No se encontró ningún producto con el código <strong>{feedback.code}</strong></>}
            </span>
        </div>
    );
}
