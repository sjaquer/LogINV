'use client';
import { useState } from 'react';
import { Minus, Plus, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export default function QuickStockModal({ producto, tipo, onConfirm, onClose }) {
    const [cantidad, setCantidad] = useState(1);
    const [motivo, setMotivo] = useState('');

    useEscapeKey(onClose);

    const isIngreso = tipo === 'INGRESO';

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-6 border border-slate-200 shadow-2xl bg-white max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isIngreso ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                        {isIngreso ? <ArrowDownCircle size={28} className="text-emerald-600" /> : <ArrowUpCircle size={28} className="text-amber-600" />}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{isIngreso ? 'Ingreso rápido' : 'Salida rápida'}</h3>
                    <p className="text-sm text-slate-500 mt-1">{producto.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Stock actual: <strong>{producto.stock_actual}</strong> {producto.unidad}</p>
                </div>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCantidad(c => Math.max(1, c - 1))} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                                <Minus size={18} />
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={cantidad}
                                onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                                className="inp text-center text-2xl font-bold py-3 flex-1 bg-white border-slate-200 text-slate-900"
                            />
                            <button onClick={() => setCantidad(c => c + 1)} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>
                        {!isIngreso && cantidad > producto.stock_actual && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Excede el stock actual</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Motivo (opcional)</label>
                        <input
                            type="text"
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder={isIngreso ? 'Ej: Recepción de pedido' : 'Ej: Consumo diario'}
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900 w-full"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn btn-ghost flex-1 py-3 text-base font-semibold text-slate-600">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(cantidad, motivo)}
                        disabled={!isIngreso && cantidad > producto.stock_actual}
                        className={`btn flex-1 py-3 text-base font-bold flex items-center justify-center gap-2 ${isIngreso ? 'btn-primary' : 'bg-amber-500 hover:bg-amber-600 text-white rounded-xl'} disabled:opacity-50`}
                    >
                        {isIngreso ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
