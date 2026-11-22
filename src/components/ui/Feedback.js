'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  Retroalimentación de la interfaz: avisos (toasts) y confirmaciones
//    const toast = useToast();      toast.success('Guardado');
//    const confirm = useConfirm();  if (await confirm({ title, message, danger: true })) …
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const FeedbackContext = createContext(null);

const TOAST_STYLE = {
    success: { Icon: CheckCircle2, cls: 'text-emerald-600' },
    error: { Icon: XCircle, cls: 'text-rose-600' },
    warning: { Icon: AlertTriangle, cls: 'text-amber-600' },
    info: { Icon: Info, cls: 'text-brand-600' },
};

function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger, onResult }) {
    const confirmRef = useRef(null);
    useEffect(() => {
        confirmRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onResult(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onResult]);

    return (
        <div className="modal-overlay animate-fade-in z-[90]" onClick={() => onResult(false)}>
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                className="modal-box animate-slide-up max-w-sm p-5 sm:p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-3">
                    <span className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600')}>
                        {danger ? <AlertTriangle size={20} /> : <Info size={20} />}
                    </span>
                    <div className="min-w-0">
                        <h2 id="confirm-title" className="text-base font-bold text-slate-900">{title}</h2>
                        {message && <p className="mt-1 text-sm text-slate-500 leading-relaxed">{message}</p>}
                    </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" className="btn-secondary py-2.5 text-sm" onClick={() => onResult(false)}>{cancelLabel}</button>
                    <button
                        ref={confirmRef}
                        type="button"
                        className={cn('btn py-2.5 text-sm border-transparent text-white', danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-brand-600 hover:bg-brand-700')}
                        onClick={() => onResult(true)}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);

    const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

    const push = useCallback((type, message, { duration = type === 'error' ? 6000 : 3500 } = {}) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(t => [...t.slice(-3), { id, type, message }]);
        setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    const toast = useMemo(() => ({
        success: (m, o) => push('success', m, o),
        error: (m, o) => push('error', m, o),
        warning: (m, o) => push('warning', m, o),
        info: (m, o) => push('info', m, o),
    }), [push]);

    const confirm = useCallback((opts) => new Promise((resolve) => {
        setDialog({ ...opts, resolve });
    }), []);

    const handleResult = useCallback((ok) => {
        setDialog(d => {
            d?.resolve(ok);
            return null;
        });
    }, []);

    const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            {/* Avisos: arriba en escritorio, sobre la barra inferior en móvil */}
            <div
                className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[95] flex flex-col items-center gap-2 px-4 lg:bottom-auto lg:top-4 lg:items-end lg:px-6"
                aria-live="polite"
                role="status"
            >
                {toasts.map(({ id, type, message }) => {
                    const { Icon, cls } = TOAST_STYLE[type];
                    return (
                        <div key={id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-surface p-3.5 shadow-lg animate-fade-in">
                            <Icon size={18} className={cn('mt-0.5 flex-shrink-0', cls)} aria-hidden="true" />
                            <p className="flex-1 text-sm text-slate-700">{message}</p>
                            <button type="button" onClick={() => dismiss(id)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar aviso">
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
            {dialog && <ConfirmDialog {...dialog} onResult={handleResult} />}
        </FeedbackContext.Provider>
    );
}

const fallback = {
    toast: { success: () => {}, error: (m) => console.error(m), warning: () => {}, info: () => {} },
    confirm: async () => false,
};

export function useToast() {
    return (useContext(FeedbackContext) || fallback).toast;
}

export function useConfirm() {
    return (useContext(FeedbackContext) || fallback).confirm;
}
