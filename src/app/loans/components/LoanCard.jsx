'use client';
import { useState } from 'react';
import { ArrowDownCircle, Clock, CheckCircle, AlertTriangle, User, Phone, Calendar } from 'lucide-react';
import { formatDate, daysUntil } from '@/lib/utils';
import ProductThumb from '@/components/ui/ProductThumb';

export default function LoanCard({ loan, producto, onReturn, onDelete }) {
    const [deleting, setDeleting] = useState(false);

    const isActive = loan.estado === 'activo';
    const isReturned = loan.estado === 'devuelto';
    const isOverdue = isActive && daysUntil(loan.fecha_devolucion_esperada) < 0;

    async function handleDelete() {
        if (deleting) {
            await onDelete(loan.id);
        } else {
            setDeleting(true);
            setTimeout(() => setDeleting(false), 3000);
        }
    }

    return (
        <div className={`bg-white dark:bg-[#0d0d10] border rounded-2xl shadow-xs overflow-hidden transition-all ${
            isOverdue ? 'border-red-300 dark:border-red-900/60' : isActive ? 'border-blue-200 dark:border-blue-900/50' : 'border-slate-200 dark:border-[#222226]'
        }`}>
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {producto?.imagen_url ? (
                            <ProductThumb url={producto.imagen_url} size="sm" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 object-cover border border-slate-200 dark:border-zinc-800" />
                        ) : (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isOverdue ? 'bg-red-50 text-red-600' :
                                isActive ? 'bg-blue-50 text-blue-600' :
                                'bg-emerald-50 text-emerald-600'
                            }`}>
                                {isOverdue ? <AlertTriangle size={24} /> :
                                 isActive ? <Clock size={24} /> :
                                 <CheckCircle size={24} />}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base truncate">{loan.producto_nombre}</h3>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                                isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                                isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}>
                                {isOverdue ? 'Vencido' : isActive ? 'Activo' : 'Devuelto'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span>Prestado a: <strong className="text-slate-800">{loan.prestado_a}</strong></span>
                    </div>
                    {loan.contacto && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            <span>{loan.contacto}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Préstamo: <strong className="text-slate-800">{formatDate(loan.fecha_prestamo)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Devolución: <strong className={isOverdue ? 'text-red-600' : 'text-slate-800'}>{formatDate(loan.fecha_devolucion_esperada)}</strong></span>
                    </div>
                    {isReturned && loan.fecha_devolucion_real && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span>Devuelto: <strong className="text-emerald-600">{formatDate(loan.fecha_devolucion_real)}</strong></span>
                        </div>
                    )}
                </div>

                {loan.notas && (
                    <p className="mt-3 text-sm text-slate-500 italic bg-slate-50 p-2 rounded-lg">&quot;{loan.notas}&quot;</p>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                    {onReturn && (
                        <button
                            onClick={onReturn}
                            className="btn btn-primary px-4 py-2 text-sm font-bold flex items-center gap-2 flex-1 justify-center"
                        >
                            <ArrowDownCircle size={16} /> Registrar devolución
                        </button>
                    )}
                    {isActive && (
                        <button
                            onClick={handleDelete}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                                deleting 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                        >
                            {deleting ? 'Confirmar' : 'Cancelar préstamo'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
