'use client';
import { useState } from 'react';
import { X, Save, Trash2, Pencil, FolderPlus, AlertTriangle } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const ICONS = ['📦', '🥃', '🍺', '🍷', '🥤', '🍋', '🥜', '🧊', '🍸', '🥂'];
const COLORS = ['#f59e0b', '#10b981', '#f472b6', '#8b5cf6', '#ef4444', '#3b82f6', '#14b8a6', '#f97316'];

export default function CategoryManagerModal({ categorias, onClose, onCrear, onActualizar, onEliminar }) {
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newIcon, setNewIcon] = useState('📦');
    const [newColor, setNewColor] = useState('#6366f1');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEscapeKey(onClose);

    async function handleAdd(e) {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        setError('');
        try {
            await onCrear({ nombre: newName.trim(), descripcion: newDesc.trim(), icono: newIcon, color: newColor });
            setNewName(''); setNewDesc(''); setNewIcon('📦'); setNewColor('#6366f1');
        } catch (err) {
            setError(err.message || 'Error');
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveEdit(id) {
        if (!editName.trim()) return;
        setError('');
        try {
            await onActualizar(id, { nombre: editName.trim() });
            setEditingId(null);
        } catch (err) {
            setError(err.message || 'Error');
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-md w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">Categorías</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Administra las categorías de productos</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {categorias.map((cat) => (
                        <div key={cat.id} className="px-5 py-4 flex items-center gap-3 group hover:bg-slate-50 transition-colors">
                            <span className="text-2xl flex-shrink-0">{cat.icono || '📦'}</span>
                            {editingId === cat.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text" value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="inp text-base flex-1 bg-white border-slate-200 text-slate-900 py-2"
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat.id)}
                                    />
                                    <button onClick={() => handleSaveEdit(cat.id)} className="btn btn-primary btn-sm px-3 py-2"><Save size={16} /></button>
                                    <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm px-2 py-2"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-base">{cat.nombre}</p>
                                        {cat.descripcion && <p className="text-sm text-slate-400 truncate">{cat.descripcion}</p>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => { setEditingId(cat.id); setEditName(cat.nombre); }}
                                            className="p-2 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => onEliminar(cat.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {categorias.length === 0 && (
                        <div className="p-8 text-center text-base text-slate-400">Sin categorías</div>
                    )}
                </div>

                {error && (
                    <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleAdd} className="p-5 border-t border-slate-100 bg-slate-50 space-y-3 flex-shrink-0">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Nueva categoría</p>
                    <input
                        type="text" value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="inp text-base py-3 bg-white border-slate-200 text-slate-900 w-full"
                        required
                    />
                    <input
                        type="text" value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        placeholder="Descripción (opcional)"
                        className="inp text-base py-3 bg-white border-slate-200 text-slate-900 w-full"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                        {ICONS.map(icon => (
                            <button key={icon} type="button" onClick={() => setNewIcon(icon)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-all ${newIcon === icon ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200' : 'border-slate-200 hover:bg-slate-50'}`}
                            >{icon}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {COLORS.map(color => (
                            <button key={color} type="button" onClick={() => setNewColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${newColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <button type="submit" disabled={saving} className="btn btn-primary w-full py-3 text-base font-bold flex items-center justify-center gap-2">
                        {saving ? <span className="spinner border-white border-t-transparent w-5 h-5" /> : <FolderPlus size={18} />}
                        {saving ? 'Guardando...' : 'Agregar categoría'}
                    </button>
                </form>
            </div>
        </div>
    );
}
