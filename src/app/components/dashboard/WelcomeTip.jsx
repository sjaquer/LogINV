'use client';
import Link from 'next/link';
import { LifeBuoy, X } from 'lucide-react';
import { usePersistentState } from '@/hooks/usePersistentState';

/** Tarjeta de bienvenida para cuentas nuevas; se oculta para siempre al cerrarla. */
export default function WelcomeTip({ userId }) {
    const [dismissed, setDismissed] = usePersistentState(`loginv_welcome_${userId || 'anon'}`, '0');
    if (dismissed === '1') return null;
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 animate-fade-in">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"><LifeBuoy size={20} /></span>
            <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">¿Primera vez en LogINV?</p>
                <p className="mt-0.5 text-sm text-slate-600">La guía explica cada pantalla y botón con capturas, paso a paso.</p>
                <Link href="/ayuda" className="btn-primary btn-sm mt-3">Abrir la guía</Link>
            </div>
            <button type="button" onClick={() => setDismissed('1')} className="icon-btn" aria-label="No volver a mostrar"><X size={18} /></button>
        </div>
    );
}
