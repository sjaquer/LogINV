'use client';
import { useState } from 'react';
import { Clock, Play, CheckCircle, Trash2, Calendar, User, DollarSign } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MaintenanceCard({ maintenance, onStart, onComplete, onDelete }) {
    const [deleting, setDeleting] = useState(false);

    const isScheduled = maintenance.estado === 'programado';
    const isInProgress = maintenance.estado === 'en_progreso';
    const isCompleted = maintenance.estado === 'completado';

    async function handleDelete() {
        if (deleting) {
            await onDelete(maintenance.id);
        } else {
            setDeleting(true);
            setTimeout(() => setDeleting(false), 3000);
        }
    }

    return (
        <div className={`bg-white border rounded-xl shadow-sm overflow-hidden ${
            isScheduled ? 'border-blue-200' :
            isInProgress ? 'border-amber-200' :
            'border-slate-200'
        }`}>
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isScheduled ? 'bg-blue-50 text-blue-600' :
                            isInProgress ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600'
                        }`}>
                            {isScheduled ? <Clock size={24} /> :
                             isInProgress ? <Play size={24} /> :
                             <CheckCircle size={24} />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-base truncate">{maintenance.producto_nombre}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    isScheduled ? 'bg-blue-100 text-blue-700' :
                                    isInProgress ? 'bg-amber-100 text-amber-700' :
                                    'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {isScheduled ? 'Programado' : isInProgress ? 'En Progreso' : 'Completado'}
                                </span>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    maintenance.tipo === 'preventivo' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                }`}>
                                    {maintenance.tipo === 'preventivo' ? 'Preventivo' : 'Correctivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-3 text-sm text-slate-600">{maintenance.descripcion}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Fecha: <strong className="text-slate-800">{formatDate(maintenance.fecha_programada)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span>Responsable: <strong className="text-slate-800">{maintenance.responsable}</strong></span>
                    </div>
                    {isCompleted && maintenance.costo > 0 && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <DollarSign size={14} className="text-slate-400" />
                            <span>Costo: <strong className="text-slate-800">${maintenance.costo}</strong></span>
                        </div>
                    )}
                    {isCompleted && maintenance.fecha_fin && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span>Completado: <strong className="text-emerald-600">{formatDate(maintenance.fecha_fin)}</strong></span>
                        </div>
                    )}
                </div>

                {maintenance.notas && (
                    <p className="mt-3 text-sm text-slate-500 italic bg-slate-50 p-2 rounded-lg">&quot;{maintenance.notas}&quot;</p>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                    {onStart && (
                        <button
                            onClick={onStart}
                            className="btn px-4 py-2 text-sm font-bold flex items-center gap-2 flex-1 justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                        >
                            <Play size={16} /> Iniciar
                        </button>
                    )}
                    {onComplete && (
                        <button
                            onClick={onComplete}
                            className="btn btn-primary px-4 py-2 text-sm font-bold flex items-center gap-2 flex-1 justify-center"
                        >
                            <CheckCircle size={16} /> Completar
                        </button>
                    )}
                    {(isScheduled || isInProgress) && (
                        <button
                            onClick={handleDelete}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                                deleting 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                        >
                            {deleting ? 'Confirmar' : <Trash2 size={16} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
