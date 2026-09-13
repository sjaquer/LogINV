'use client';
import { useState, useCallback, useEffect } from 'react';
import { X, Plus, Minus, Check, RotateCcw } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export default function TapCountModal({ producto, currentCount, onConfirm, onDiscard, onClose }) {
    const [count, setCount] = useState(currentCount);
    const [pulse, setPulse] = useState(false);

    useEscapeKey(onClose);

    const handleTap = useCallback(() => {
        setCount(prev => prev + 1);
        setPulse(true);
        if (navigator.vibrate) navigator.vibrate(30);
        setTimeout(() => setPulse(false), 150);
    }, []);

    const handleMinus = useCallback(() => {
        setCount(prev => Math.max(0, prev - 1));
        if (navigator.vibrate) navigator.vibrate(15);
    }, []);

    const handleReset = useCallback(() => {
        setCount(0);
    }, []);

    const diff = count - producto.stock_actual;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col animate-fade-in select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 flex-shrink-0">
                <button onClick={onClose} className="p-3 rounded-2xl bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 transition-all">
                    <X size={24} />
                </button>
                <div className="text-center flex-1 px-4 min-w-0">
                    <p className="text-white font-bold text-lg sm:text-xl truncate">{producto.nombre}</p>
                    <p className="text-white/50 text-sm">{producto.categoria} {producto.piso ? `· ${producto.piso}` : ''}</p>
                </div>
                <div className="w-12" /> {/* spacer */}
            </div>

            {/* Current count display */}
            <div className="flex flex-col items-center justify-center px-6 py-4 flex-shrink-0">
                <p className={`text-8xl sm:text-9xl font-black text-white tabular-nums transition-transform duration-150 ${pulse ? 'scale-110' : 'scale-100'}`}>
                    {count}
                </p>
                <p className="text-white/40 text-sm sm:text-base font-medium mt-2 uppercase tracking-wider">Conteo físico</p>
                <div className="flex items-center gap-4 mt-3">
                    <span className="text-white/40 text-sm">Stock sistema: <strong className="text-white/70">{producto.stock_actual}</strong></span>
                    {diff !== 0 && (
                        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${diff < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                        </span>
                    )}
                </div>
            </div>

            {/* TAP ZONE – big touch area */}
            <div className="flex-1 flex items-center justify-center px-6 py-4">
                <button
                    onClick={handleTap}
                    className={`w-full max-w-sm aspect-square rounded-[2rem] bg-brand-600 hover:bg-brand-700 active:scale-95 active:bg-brand-800 transition-all duration-100 flex flex-col items-center justify-center shadow-2xl shadow-brand-500/30 border-4 border-brand-400/20 ${pulse ? 'scale-95' : 'scale-100'}`}
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                    <Plus size={64} className="text-white/90" strokeWidth={3} />
                    <p className="text-white/80 text-lg sm:text-xl font-bold mt-3">Toca para contar</p>
                </button>
            </div>

            {/* Bottom controls */}
            <div className="flex items-center gap-3 p-4 sm:p-6 flex-shrink-0 pb-safe">
                <button
                    onClick={handleReset}
                    className="p-4 rounded-2xl bg-white/10 text-white/60 hover:bg-white/20 active:scale-95 transition-all"
                    title="Reset"
                >
                    <RotateCcw size={24} />
                </button>
                <button
                    onClick={handleMinus}
                    className="p-4 rounded-2xl bg-white/10 text-white/60 hover:bg-white/20 active:scale-95 transition-all"
                    title="-1"
                >
                    <Minus size={24} />
                </button>
                <button
                    onClick={onDiscard}
                    className="flex-1 py-4 rounded-2xl bg-white/10 text-white/80 font-bold text-base hover:bg-white/20 active:scale-95 transition-all"
                >
                    Descartar
                </button>
                <button
                    onClick={() => onConfirm(count)}
                    className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                    <Check size={22} /> Confirmar
                </button>
            </div>
        </div>
    );
}
