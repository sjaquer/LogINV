'use client';
// ═══════════════════════════════════════════════════════════════════════════
//  Retroalimentación de la interfaz: avisos flotantes (toasts) y confirmaciones
//    const toast = useToast();
//    toast.success('Guardado');
//    toast.error(err);                 // acepta un Error: muestra título, explicación y código
//    const confirm = useConfirm();  if (await confirm({ title, message, danger: true })) …
//
//  Los errores se traducen con el diccionario de src/lib/errors.js. También
//  se muestran aquí los errores reportados con reportError() desde fuera de
//  React y las promesas rechazadas que nadie atrapó.
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { describeError, errorReport, ERROR_EVENT } from '@/lib/errors';

const FeedbackContext = createContext(null);

const TOAST_STYLE = {
    success: { Icon: CheckCircle2, icon: 'text-emerald-600 bg-emerald-50', bar: 'bg-emerald-500' },
    error: { Icon: XCircle, icon: 'text-rose-600 bg-rose-50', bar: 'bg-rose-500' },
    warning: { Icon: AlertTriangle, icon: 'text-amber-600 bg-amber-50', bar: 'bg-amber-500' },
    info: { Icon: Info, icon: 'text-brand-600 bg-brand-50', bar: 'bg-brand-500' },
};

const DURATION = { success: 3500, info: 4500, warning: 7000, error: 8000 };
const MAX_TOASTS = 4;
const DEDUPE_MS = 4000;

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

/** Un aviso: se cierra solo tras `duration` ms; pasar el mouse o tocarlo lo pausa. */
function Toast({ toast, onDismiss }) {
    const { id, type, title, message, hint, code, report, duration } = toast;
    const { Icon, icon, bar } = TOAST_STYLE[type];
    const [paused, setPaused] = useState(false);
    const [copied, setCopied] = useState(false);
    const remaining = useRef(duration);
    const startedAt = useRef(0);

    useEffect(() => {
        if (paused) return undefined;
        startedAt.current = Date.now();
        const t = setTimeout(() => onDismiss(id), remaining.current);
        return () => {
            clearTimeout(t);
            remaining.current -= Date.now() - startedAt.current;
        };
    }, [paused, id, onDismiss]);

    async function copy() {
        try {
            await navigator.clipboard.writeText(report);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch { /* portapapeles no disponible */ }
    }

    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-xl shadow-slate-900/10 animate-toast-in"
        >
            <div className="flex items-start gap-3 p-3.5 pr-2.5">
                <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full', icon)}>
                    <Icon size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    {title && <p className="text-sm font-bold text-slate-900 leading-snug">{title}</p>}
                    {message && <p className={cn('text-sm leading-snug', title ? 'mt-0.5 text-slate-600' : 'text-slate-700')}>{message}</p>}
                    {hint && <p className="mt-1 text-xs leading-snug text-slate-500">{hint}</p>}
                    {code && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wide text-slate-600" title="Código del error: menciónalo al reportarlo">
                                {code}
                            </span>
                            <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800">
                                {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar para reportar</>}
                            </button>
                        </div>
                    )}
                </div>
                <button type="button" onClick={() => onDismiss(id)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar aviso">
                    <X size={16} />
                </button>
            </div>
            <span
                className={cn('toast-progress absolute inset-x-0 bottom-0 h-[3px] opacity-60 motion-reduce:hidden', bar)}
                style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                aria-hidden="true"
            />
        </div>
    );
}

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const recent = useRef(new Map()); // clave → última vez mostrado (evita avisos repetidos)

    const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

    const push = useCallback((toast) => {
        const key = `${toast.type}|${toast.code || ''}|${toast.title || ''}|${toast.message || ''}`;
        const now = Date.now();
        if (now - (recent.current.get(key) || 0) < DEDUPE_MS) return null;
        recent.current.set(key, now);
        const id = `${now}-${Math.random()}`;
        setToasts(t => [...t.slice(-(MAX_TOASTS - 1)), { duration: DURATION[toast.type], ...toast, id }]);
        return id;
    }, []);

    /** Acepta texto o un Error/objeto; los errores se describen con el diccionario. */
    const pushError = useCallback((err, opts = {}) => {
        const info = describeError(err);
        return push({
            type: opts.type || info.severity,
            title: opts.title || info.title,
            message: info.message,
            hint: info.hint,
            code: info.code,
            report: errorReport(info),
            ...(opts.duration && { duration: opts.duration }),
        });
    }, [push]);

    const toast = useMemo(() => {
        const simple = (type) => (message, { title, duration } = {}) => push({ type, message, title, ...(duration && { duration }) });
        return {
            success: simple('success'),
            info: simple('info'),
            warning: simple('warning'),
            error: (err, opts) => (typeof err === 'string' && !opts?.code
                ? push({ type: 'error', message: err, title: opts?.title, ...(opts?.duration && { duration: opts.duration }) })
                : pushError(err, opts)),
        };
    }, [push, pushError]);

    // Errores reportados desde fuera de React y promesas sin atrapar.
    useEffect(() => {
        const onReported = (e) => pushError(e.detail?.error);
        const onUnhandled = (e) => {
            const reason = e.reason;
            if (!reason || reason?.name === 'CanceledError') return;
            console.error('[LogINV] Error sin atrapar:', reason);
            pushError(reason);
        };
        window.addEventListener(ERROR_EVENT, onReported);
        window.addEventListener('unhandledrejection', onUnhandled);
        return () => {
            window.removeEventListener(ERROR_EVENT, onReported);
            window.removeEventListener('unhandledrejection', onUnhandled);
        };
    }, [pushError]);

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
            {/* Avisos: en el costado derecho en escritorio, sobre la barra inferior en móvil */}
            <div
                className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[95] flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-4 lg:w-[400px] lg:items-end lg:px-6"
                aria-live="polite"
            >
                {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={dismiss} />)}
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
