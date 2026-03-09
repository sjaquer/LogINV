'use client';
import { Component } from 'react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center mb-6">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Algo salió mal</h2>
                    <p className="text-sm text-slate-500 max-w-sm mb-6">
                        Ocurrió un error inesperado. Intenta recargar la página.
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="btn btn-primary px-6 py-3 text-base font-bold"
                    >
                        Recargar página
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
