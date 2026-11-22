'use client';
// Muestra una pantalla amable cuando una sección se rompe, con el código del
// diccionario de errores (APP-02, o APP-03 si hay una versión nueva publicada).
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { describeError, errorReport } from '@/lib/errors';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, showDetails: false, copied: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    info() {
        const described = describeError(this.state.error);
        // Fuera de "versión nueva", cualquier fallo de renderizado es APP-02.
        if (described.code === 'APP-03') return described;
        const base = describeError({ appCode: 'APP-02' });
        return { ...base, detail: described.detail };
    }

    async copy(info) {
        try {
            await navigator.clipboard.writeText(errorReport(info));
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 1800);
        } catch { /* portapapeles no disponible */ }
    }

    render() {
        if (!this.state.hasError) return this.props.children;
        const { error, errorInfo, showDetails, copied } = this.state;
        const info = this.info();
        const reset = (to) => {
            this.setState({ hasError: false, error: null, errorInfo: null });
            if (to) window.location.assign(to); else window.location.reload();
        };

        return (
            <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-5">
                    {info.code === 'APP-03' ? <RefreshCw size={28} /> : <AlertTriangle size={28} />}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mb-1.5">{info.title}</h2>
                <p className="text-sm text-slate-600 max-w-sm">{info.message}</p>
                <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{info.hint}</p>
                <div className="mb-6 flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-slate-600">{info.code}</span>
                    <button type="button" onClick={() => this.copy(info)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                        {copied ? 'Copiado' : 'Copiar para reportar'}
                    </button>
                </div>
                <div className="flex gap-3 mb-4">
                    <button type="button" onClick={() => reset(window.location.origin)} className="btn-secondary px-5 py-2.5 text-sm">
                        Volver al panel
                    </button>
                    <button type="button" onClick={() => reset()} className="btn btn-primary px-5 py-2.5 text-sm font-bold">
                        Recargar página
                    </button>
                </div>
                {error && (
                    <button
                        type="button"
                        onClick={() => this.setState({ showDetails: !showDetails })}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
                    </button>
                )}
                {showDetails && (
                    <pre className="mt-3 p-3 bg-slate-100 rounded-lg text-xs text-left text-rose-600 max-w-lg max-h-40 overflow-auto w-full">
                        {error?.toString()}
                        {errorInfo?.componentStack && `\n${errorInfo.componentStack}`}
                    </pre>
                )}
            </div>
        );
    }
}
