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
        <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
            ubicacion.activa ? 'border-slate-200' : 'border-slate-200 opacity-60'
        }`}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            ubicacion.activa ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                            <MapPin size={24} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-lg truncate">{ubicacion.nombre}</h3>
                            {ubicacion.descripcion && (
                                <p className="text-sm text-slate-500 truncate">{ubicacion.descripcion}</p>
                            )}
                        </div>
                    </div>
                    
                    {canManage && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => onEdit(ubicacion)}
                                className="p-2 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
                                aria-label="Editar"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className={`p-2 rounded-lg transition-colors ${
                                    deleting 
                                        ? 'bg-red-50 text-red-600' 
                                        : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                                }`}
                                aria-label={deleting ? 'Confirmar eliminación' : 'Eliminar'}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Users size={14} />
                        <span>Capacidad: <strong className="text-slate-700">{ubicacion.capacidad || '—'}</strong></span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ubicacion.activa 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        {ubicacion.activa ? 'Activa' : 'Inactiva'}
                    </div>
                </div>

                {canManage && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ubicacion.activa !== false}
                                onChange={(e) => onToggle(ubicacion.id, e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Ubicación activa</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
