'use client';
import { useState } from 'react';
import { Pencil, Trash2, MapPin, Users } from 'lucide-react';

export default function LocationCard({ ubicacion, canManage, onEdit, onToggle, onDelete }) {
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (deleting) {
            await onDelete(ubicacion.id);
        } else {
            setDeleting(true);
            setTimeout(() => setDeleting(false), 3000);
        }
    }

    return (
        <div className={`border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
            ubicacion.activa 
                ? 'bg-white border-slate-200 dark:bg-[#0d0d10] dark:border-white/10' 
                : 'bg-white/80 border-slate-200 opacity-60 dark:bg-[#0d0d10]/60 dark:border-white/5'
        }`}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${
                            ubicacion.activa 
                                ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300' 
                                : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
                        }`}>
                            {ubicacion.icono ? (
                                <span className="select-none leading-none">{ubicacion.icono}</span>
                            ) : (
                                <MapPin size={24} />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{ubicacion.nombre}</h3>
                            </div>
                            {ubicacion.descripcion && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{ubicacion.descripcion}</p>
                            )}
                        </div>
                    </div>
                    
                    {canManage && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => onEdit(ubicacion)}
                                className="p-2 rounded-lg hover:bg-violet-50 dark:hover:bg-white/10 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                aria-label="Editar"
                                title="Editar ubicación"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className={`p-2 rounded-lg transition-colors ${
                                    deleting 
                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400' 
                                        : 'hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400'
                                }`}
                                aria-label={deleting ? 'Confirmar eliminación' : 'Eliminar'}
                                title={deleting ? 'Click para confirmar eliminación' : 'Eliminar ubicación'}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Users size={14} />
                        <span>Capacidad: <strong className="text-slate-700 dark:text-slate-200">{ubicacion.capacidad || '—'}</strong></span>
                    </div>

                    {ubicacion.piso && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {ubicacion.piso}
                        </span>
                    )}

                    <div className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        ubicacion.activa 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-500'
                    }`}>
                        {ubicacion.activa ? 'Activa' : 'Inactiva'}
                    </div>
                </div>

                {canManage && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={ubicacion.activa !== false}
                                onChange={(e) => onToggle(ubicacion.id, e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-violet-600 focus:ring-violet-500 dark:bg-black/50"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ubicación activa en inventario</span>
                        </label>
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase">
                            {ubicacion.codigo || ubicacion.id}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
