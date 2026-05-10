'use client';
import { Component } from 'react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, showDetails } = this.state;
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-center mb-6">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Algo salió mal</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                        Ocurrió un error inesperado. Puedes intentar recargar o volver al inicio.
                    </p>
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null, errorInfo: null });
                                window.location.href = '/';
                            }}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Volver al inicio
                        </button>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null, errorInfo: null });
                                window.location.reload();
                            }}
                            className="btn btn-primary px-5 py-2.5 text-sm font-bold"
                        >
                            Recargar página
                        </button>
                    </div>
                    {error && (
                        <button
                            onClick={() => this.setState({ showDetails: !showDetails })}
                            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showDetails ? 'Ocultar detalles' : 'Ver detalles del error'}
                        </button>
                    )}
                    {showDetails && (
                        <pre className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-left text-red-600 dark:text-red-400 max-w-lg max-h-40 overflow-auto w-full">
                            {error?.toString()}
                            {errorInfo?.componentStack && `\n${errorInfo.componentStack}`}
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
