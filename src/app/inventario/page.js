'use client';
import { useState, useMemo, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias } from '@/hooks/useFirestore';
import { useRole } from '@/context/RoleContext';
import { useLanguage } from '@/context/LanguageContext';
import { SemaforoBadge, StockBar, LoadingSkeleton, EmptyState } from '@/components/ui/SharedComponents';
import { daysUntil, formatDate } from '@/lib/utils';
import {
    Search, X, Plus, Minus, Package, Trash2, Pencil,
    PlusCircle, Save, AlertTriangle, FolderPlus, Settings2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
//  ProductFormModal – Create / Edit a product
// ═══════════════════════════════════════════════════════════════════════════
function ProductFormModal({ producto, categorias, onClose, onSave, userName }) {
    const { t } = useLanguage();
    const isEdit = !!producto;

    const toDateStr = (v) => {
        if (!v) return '';
        const d = v?.toDate ? v.toDate() : new Date(v);
        return d.toISOString().split('T')[0];
    };

    const [form, setForm] = useState({
        nombre: producto?.nombre || '',
        categoria: producto?.categoria || (categorias[0]?.nombre || ''),
        stock_actual: producto?.stock_actual ?? 0,
        stock_minimo_rop: producto?.stock_minimo_rop ?? 10,
        unidad: producto?.unidad || 'sacos',
        fecha_vencimiento: toDateStr(producto?.fecha_vencimiento),
        lote: producto?.lote || '',
        peso_unitario: producto?.peso_unitario ?? '',
        descripcion: producto?.descripcion || '',
        proveedor: producto?.proveedor || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    function handleChange(field, val) {
        setForm(prev => ({ ...prev, [field]: val }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.nombre.trim()) { setError(t('campoObligatorio')); return; }
        if (!form.categoria) { setError(t('seleccionaCategoria')); return; }
        setSaving(true);
        setError('');
        try {
            const data = {
                ...form,
                stock_actual: Number(form.stock_actual) || 0,
                stock_minimo_rop: Number(form.stock_minimo_rop) || 0,
                peso_unitario: form.peso_unitario ? Number(form.peso_unitario) : null,
                _usuario: userName,
            };
            await onSave(data, producto?.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Error');
        } finally {
            setSaving(false);
        }
    }

    const UNIDADES = ['sacos', 'frascos', 'bloques', 'kg', 'litros', 'cajas', 'unidades'];

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div
                className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-lg w-full max-h-[90vh] sm:max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-lg sm:text-xl truncate">{isEdit ? t('editarProducto') : t('nuevoProducto')}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{isEdit ? t('editarProductoDesc') : t('nuevoProductoDesc')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('producto')} *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => handleChange('nombre', e.target.value)}
                            placeholder="Ej: Saco Alimento Pollo Engorde x40kg"
                            className="inp text-sm bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    {/* Categoría + Unidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('categoria')} *</label>
                            <select
                                value={form.categoria}
                                onChange={(e) => handleChange('categoria', e.target.value)}
                                className="inp text-sm bg-white border-slate-200 text-slate-900"
                                required
                            >
                                <option value="">—</option>
                                {categorias.filter(c => c.activa !== false).map(c => (
                                    <option key={c.id} value={c.nombre}>{c.icono} {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('unidad')}</label>
                            <select
                                value={form.unidad}
                                onChange={(e) => handleChange('unidad', e.target.value)}
                                className="inp text-sm bg-white border-slate-200 text-slate-900"
                            >
                                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Stock + Mínimo */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('stockActual')}</label>
                            <input
                                type="number"
                                min="0"
                                value={form.stock_actual}
                                onChange={(e) => handleChange('stock_actual', e.target.value)}
                                className="inp text-sm bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('minDef')} (ROP)</label>
                            <input
                                type="number"
                                min="0"
                                value={form.stock_minimo_rop}
                                onChange={(e) => handleChange('stock_minimo_rop', e.target.value)}
                                className="inp text-sm bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Peso + Lote */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('peso')} ({t('kg')}/u)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.peso_unitario}
                                onChange={(e) => handleChange('peso_unitario', e.target.value)}
                                placeholder="Ej: 40"
                                className="inp text-sm bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('lote')}</label>
                            <input
                                type="text"
                                value={form.lote}
                                onChange={(e) => handleChange('lote', e.target.value)}
                                placeholder="Ej: L-2026-0301"
                                className="inp text-sm bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Fecha vencimiento */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('vencimiento')}</label>
                        <input
                            type="date"
                            value={form.fecha_vencimiento}
                            onChange={(e) => handleChange('fecha_vencimiento', e.target.value)}
                            className="inp text-sm bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    {/* Proveedor */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('proveedor')}</label>
                        <input
                            type="text"
                            value={form.proveedor}
                            onChange={(e) => handleChange('proveedor', e.target.value)}
                            placeholder="Ej: Molinos del Centro SAC"
                            className="inp text-sm bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('descripcionProducto')}</label>
                        <textarea
                            rows={2}
                            value={form.descripcion}
                            onChange={(e) => handleChange('descripcion', e.target.value)}
                            placeholder={t('descripcionPlaceholder')}
                            className="inp resize-none text-sm bg-white border-slate-200 text-slate-900"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    <button type="button" onClick={onClose} className="btn btn-ghost px-4 sm:px-5 py-2.5 text-sm font-semibold text-slate-600">
                        {t('cancelar')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn btn-primary px-4 sm:px-6 py-2.5 text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <><span className="spinner border-white border-t-transparent w-4 h-4" /> {t('guardando')}</>
                        ) : (
                            <><Save size={16} /> {isEdit ? t('guardarCambios') : t('crearProducto')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DeleteConfirmModal
// ═══════════════════════════════════════════════════════════════════════════
function DeleteConfirmModal({ producto, onClose, onConfirm }) {
    const { t } = useLanguage();
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        setDeleting(true);
        await onConfirm(producto.id);
        setDeleting(false);
        onClose();
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-6 border border-slate-200 shadow-2xl bg-white max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                        <Trash2 size={24} className="text-red-500" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{t('eliminarProducto')}</h3>
                    <p className="text-sm text-slate-500 mt-2">{t('confirmarEliminar')}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1 bg-slate-100 px-3 py-1 rounded-lg">{producto.nombre}</p>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn btn-ghost flex-1 py-2.5 text-sm font-semibold text-slate-600">
                        {t('cancelar')}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="btn btn-danger flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                    >
                        {deleting ? <span className="spinner border-white border-t-transparent w-4 h-4" /> : <Trash2 size={16} />}
                        {t('eliminar')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CategoryManagerModal
// ═══════════════════════════════════════════════════════════════════════════
function CategoryManagerModal({ categorias, onClose, onCrear, onActualizar, onEliminar }) {
    const { t } = useLanguage();
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newIcon, setNewIcon] = useState('📦');
    const [newColor, setNewColor] = useState('#6366f1');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    async function handleAdd(e) {
        e.preventDefault();
        if (!newName.trim()) return;
        await onCrear({ nombre: newName.trim(), descripcion: newDesc.trim(), icono: newIcon, color: newColor });
        setNewName(''); setNewDesc(''); setNewIcon('📦'); setNewColor('#6366f1');
    }

    async function handleSaveEdit(id) {
        if (!editName.trim()) return;
        await onActualizar(id, { nombre: editName.trim() });
        setEditingId(null);
    }

    const ICONS = ['📦', '🐔', '🐄', '🐷', '🌾', '💊', '🧪', '🏭', '🛢️', '⚗️'];
    const COLORS = ['#f59e0b', '#10b981', '#f472b6', '#8b5cf6', '#ef4444', '#3b82f6', '#14b8a6', '#f97316'];

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-md w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">{t('gestionCategorias')}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{t('gestionCategoriasDesc')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Existing categories */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {categorias.map((cat) => (
                        <div key={cat.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 group hover:bg-slate-50 transition-colors">
                            <span className="text-xl flex-shrink-0">{cat.icono || '📦'}</span>
                            {editingId === cat.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="inp text-sm flex-1 bg-white border-slate-200 text-slate-900"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(cat.id)}
                                    />
                                    <button onClick={() => handleSaveEdit(cat.id)} className="btn btn-primary btn-sm text-xs px-3">
                                        <Save size={14} />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm text-xs px-2">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm">{cat.nombre}</p>
                                        {cat.descripcion && <p className="text-xs text-slate-400 truncate">{cat.descripcion}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingId(cat.id); setEditName(cat.nombre); }}
                                            className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => onEliminar(cat.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {categorias.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-400">{t('sinCategorias')}</div>
                    )}
                </div>

                {/* Add new */}
                <form onSubmit={handleAdd} className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 space-y-3 flex-shrink-0">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">{t('nuevaCategoria')}</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('nombreCategoria')}
                            className="inp text-sm flex-1 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>
                    <input
                        type="text"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder={t('descripcionCategoria')}
                        className="inp text-sm bg-white border-slate-200 text-slate-900"
                    />
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 flex-wrap">
                            {ICONS.map(icon => (
                                <button key={icon} type="button" onClick={() => setNewIcon(icon)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all ${newIcon === icon ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200' : 'border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {COLORS.map(color => (
                            <button key={color} type="button" onClick={() => setNewColor(color)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <button type="submit" className="btn btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2">
                        <FolderPlus size={16} /> {t('agregarCategoria')}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  StockModal (quick stock update / loss registration)
// ═══════════════════════════════════════════════════════════════════════════
function StockModal({ producto, onClose, onUpdateStock, onMerma, userName }) {
    const { t } = useLanguage();
    const [modo, setModo] = useState('stock');
    const [cantidad, setCantidad] = useState(0);
    const [motivo, setMotivo] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const dias = daysUntil(producto.fecha_vencimiento);

    async function handleSubmit(e) {
        e.preventDefault();
        if (cantidad <= 0) return;
        setSaving(true);
        try {
            if (modo === 'merma') {
                await onMerma(producto.id, cantidad, userName, motivo);
            } else {
                const nuevoStock = producto.stock_actual + cantidad;
                await onUpdateStock(producto.id, nuevoStock, userName);
            }
            setSuccess(true);
            setTimeout(() => { setSuccess(false); setCantidad(0); setMotivo(''); }, 1500);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 bg-white">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-xl leading-tight truncate">{producto.nombre}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="badge-gray px-2 py-0.5 bg-slate-100 border-slate-200 text-slate-600">{t(producto.categoria?.toLowerCase())}</span>
                            <SemaforoBadge days={dias} />
                        </div>
                    </div>
                    <button onClick={onClose} className="ml-3 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                        <X size={20} />
                    </button>
                </div>

                {/* Stock display */}
                <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-brand-600 font-bold uppercase tracking-wider">{t('stockActual')}</p>
                            <p className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">
                                {producto.stock_actual} <span className="text-base sm:text-lg text-slate-400 font-normal ml-1">{producto.unidad || 'u'}</span>
                            </p>
                            {producto.peso_unitario && (
                                <p className="text-sm text-slate-500 mt-1 font-medium">
                                    {t('pesoTotal')}: <strong className="text-slate-700">{(producto.stock_actual * producto.peso_unitario).toLocaleString()} {t('kg')}</strong>
                                    <span className="text-slate-400 ml-1">({producto.peso_unitario} {t('kg')}/u)</span>
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-semibold">{t('minDef')}</p>
                            <p className="text-lg font-bold text-slate-700 mt-1">{producto.stock_minimo_rop} {producto.unidad || 'u'}</p>
                            <div className="mt-2 scale-110 transform origin-right">
                                <StockBar actual={producto.stock_actual} minimo={producto.stock_minimo_rop} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 flex-wrap">
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {t('vencimiento')}: <strong className="text-slate-700">{formatDate(producto.fecha_vencimiento)}</strong>
                        </p>
                        {producto.lote && (
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                {t('lote')}: <strong className="text-slate-700 font-mono">{producto.lote}</strong>
                            </p>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-white">
                    <button onClick={() => setModo('stock')} className={`flex-1 py-3.5 text-sm font-semibold transition-all ${modo === 'stock' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                        📦 {t('actualizarStock')}
                    </button>
                    <button onClick={() => setModo('merma')} className={`flex-1 py-3.5 text-sm font-semibold transition-all ${modo === 'merma' ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                        🗑️ {t('registrarMerma')}
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            {modo === 'stock' ? t('cantidadIngresar') : t('cantidadBaja')}
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button type="button" onClick={() => setCantidad(Math.max(0, cantidad - 1))} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all shadow-sm">
                                <Minus size={20} />
                            </button>
                            <input type="number" min="0" value={cantidad} onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value) || 0))} className="inp text-center text-2xl sm:text-3xl font-bold h-12 sm:h-14 flex-1 tracking-wider text-slate-900 bg-slate-50 border-slate-200" />
                            <button type="button" onClick={() => setCantidad(cantidad + 1)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all shadow-sm">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex gap-2 mt-3">
                            {[1, 5, 10, 25, 50].map((n) => (
                                <button key={n} type="button" onClick={() => setCantidad(n)}
                                    className="flex-1 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 transition-all active:scale-95 shadow-sm"
                                >+{n}</button>
                            ))}
                        </div>
                    </div>

                    {modo === 'merma' && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-slate-600 mb-2">{t('motivoMerma')}</label>
                            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={t('ejMotivoMerma')} className="inp resize-none text-sm placeholder:text-slate-400 bg-slate-50 border-slate-200 text-slate-900" required />
                        </div>
                    )}

                    <button type="submit" disabled={saving || cantidad === 0}
                        className={`w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg ${success ? 'bg-emerald-500 text-white' : modo === 'merma' ? 'btn-danger justify-center' : 'btn-primary justify-center'} ${saving || cantidad === 0 ? 'opacity-50 cursor-not-allowed transform-none shadow-none' : ''}`}
                    >
                        {success ? '✅ ' + t('stockActualizado') : saving ? t('guardando') : modo === 'merma' ? '🗑️ ' + t('registrarMerma') : '✅ ' + t('actualizarStock')}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  INVENTORY PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function InventarioPage() {
    const {
        productos, loading,
        crearProducto, actualizarProducto, eliminarProducto,
        updateStock, registrarMerma,
    } = useProductos();
    const { categorias, crearCategoria, actualizarCategoria, eliminarCategoria } = useCategorias();
    const { role, userName } = useRole();
    const { t } = useLanguage();

    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState('Todas');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteProduct, setDeleteProduct] = useState(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    const catNames = useMemo(() => ['Todas', ...categorias.map(c => c.nombre)], [categorias]);

    const productosFiltrados = useMemo(() => {
        return productos
            .filter((p) => categoria === 'Todas' || p.categoria === categoria)
            .filter((p) => {
                const q = busqueda.toLowerCase();
                return p.nombre.toLowerCase().includes(q) || (p.lote && p.lote.toLowerCase().includes(q));
            });
    }, [productos, categoria, busqueda]);

    const handleSaveProduct = useCallback(async (data, id) => {
        if (id) {
            const { _usuario, ...rest } = data;
            await actualizarProducto(id, rest);
        } else {
            await crearProducto(data);
        }
    }, [crearProducto, actualizarProducto]);

    const canManage = role === 'ADMIN' || role === 'GERENCIA' || role === 'LOGISTICA';

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title={t('inventario')} />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-7xl mx-auto w-full">

                {/* ── Action bar ── */}
                {canManage && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
                            className="btn btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-sm"
                        >
                            <PlusCircle size={18} /> {t('nuevoProducto')}
                        </button>
                        <button
                            onClick={() => setShowCategoryManager(true)}
                            className="btn btn-ghost px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <Settings2 size={16} /> {t('gestionCategorias')}
                        </button>
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 md:max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('buscarProducto')}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="inp pl-11 py-3 text-sm h-12 shadow-sm bg-white border-slate-200 text-slate-900 focus:ring-brand-500/10 focus:border-brand-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1">
                        {catNames.map((cat) => {
                            const translatedCat = cat === 'Todas' ? t('todas') : cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategoria(cat)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all shadow-sm whitespace-nowrap ${categoria === cat
                                        ? 'bg-brand-50 text-brand-700 border-brand-200 shadow-sm ring-1 ring-brand-500/10'
                                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {translatedCat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Desktop Table ── */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hidden md:block">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{t('productos')}</h2>
                            <span className="badge-gray bg-slate-100 border-slate-200 text-slate-600">{productosFiltrados.length}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('producto')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('lote')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('categoria')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('stockActual')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('peso')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('min')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('nivel')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('vencimiento')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('alerta')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('accion')}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSkeleton rows={8} cols={10} />
                            ) : (
                                <tbody>
                                    {productosFiltrados.length === 0 ? (
                                        <tr><td colSpan={10}><div className="p-8"><EmptyState icon={Package} title="sinResultados" subtitle="ajustaFiltros" /></div></td></tr>
                                    ) : (
                                        productosFiltrados.map((p) => {
                                            const dias = daysUntil(p.fecha_vencimiento);
                                            const pesoTotal = p.peso_unitario ? (p.stock_actual * p.peso_unitario) : null;
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className={`${dias <= 3 ? 'bg-red-50 hover:bg-red-100/50' : dias <= 7 ? 'bg-amber-50 hover:bg-amber-100/50' : 'hover:bg-slate-50'} border-b border-slate-100 transition-colors cursor-pointer group`}
                                                    onClick={() => setProductoSeleccionado(p)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{p.nombre}</p>
                                                        {p.proveedor && <p className="text-xs text-slate-400 mt-0.5">{p.proveedor}</p>}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.lote || '—'}</td>
                                                    <td className="px-6 py-4"><span className="badge-gray bg-white border-slate-200">{p.categoria}</span></td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 text-base">{p.stock_actual} <span className="text-slate-400 text-xs font-normal">{p.unidad}</span></td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{pesoTotal != null ? `${pesoTotal.toLocaleString()} ${t('kg')}` : '—'}</td>
                                                    <td className="px-6 py-4 text-slate-500 font-medium">{p.stock_minimo_rop}</td>
                                                    <td className="px-6 py-4 w-32"><StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} /></td>
                                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{formatDate(p.fecha_vencimiento)}</td>
                                                    <td className="px-6 py-4"><SemaforoBadge days={dias} /></td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <button className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors" title={t('actualizarStock')} onClick={(e) => { e.stopPropagation(); setProductoSeleccionado(p); }}>
                                                                <Package size={16} />
                                                            </button>
                                                            {canManage && (
                                                                <>
                                                                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title={t('editarProducto')} onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setShowProductForm(true); }}>
                                                                        <Pencil size={16} />
                                                                    </button>
                                                                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title={t('eliminarProducto')} onClick={(e) => { e.stopPropagation(); setDeleteProduct(p); }}>
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>

                {/* ── Mobile Card Grid ── */}
                <div className="md:hidden space-y-4">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 p-4 h-28 rounded-xl animate-pulse shadow-sm" />
                        ))
                    ) : productosFiltrados.length === 0 ? (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm"><EmptyState icon={Package} title="sinResultados" subtitle="ajustaFiltros" /></div>
                    ) : (
                        productosFiltrados.map((p) => {
                            const dias = daysUntil(p.fecha_vencimiento);
                            const pesoTotal = p.peso_unitario ? (p.stock_actual * p.peso_unitario) : null;
                            return (
                                <div
                                    key={p.id}
                                    className={`w-full text-left bg-white border border-slate-200 p-5 rounded-xl transition-all shadow-sm hover:shadow-md ${dias <= 3 ? 'border-l-red-500 border-l-4 bg-red-50/50' : dias <= 7 ? 'border-l-amber-500 border-l-4 bg-amber-50/50' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0" onClick={() => setProductoSeleccionado(p)}>
                                            <p className="font-bold text-slate-900 text-lg leading-tight truncate">{p.nombre}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-brand-600 font-medium uppercase tracking-wide">{p.categoria}</p>
                                                {p.lote && <span className="text-xs text-slate-400 font-mono">· {p.lote}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <SemaforoBadge days={dias} />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-4 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100" onClick={() => setProductoSeleccionado(p)}>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('stock')}</p>
                                            <p className="font-bold text-slate-900 text-xl mt-0.5">{p.stock_actual} <span className="text-slate-400 text-sm font-normal">{p.unidad}</span></p>
                                            {pesoTotal != null && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{pesoTotal.toLocaleString()} {t('kg')}</p>}
                                        </div>
                                        <div className="flex-1 mb-1.5">
                                            <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('minDef')}</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1">{p.stock_minimo_rop}</p>
                                        </div>
                                    </div>
                                    {/* Mobile action buttons */}
                                    {canManage && (
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                            <button onClick={() => setProductoSeleccionado(p)} className="btn btn-ghost btn-sm text-xs flex-1 text-brand-600 font-semibold">
                                                📦 {t('stock')}
                                            </button>
                                            <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="btn btn-ghost btn-sm text-xs flex-1 text-slate-600 font-semibold">
                                                <Pencil size={14} className="mr-1" /> {t('editar')}
                                            </button>
                                            <button onClick={() => setDeleteProduct(p)} className="btn btn-ghost btn-sm text-xs text-red-500 font-semibold px-3">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            {productoSeleccionado && (
                <StockModal
                    producto={productoSeleccionado}
                    onClose={() => setProductoSeleccionado(null)}
                    onUpdateStock={updateStock}
                    onMerma={registrarMerma}
                    userName={userName}
                />
            )}

            {showProductForm && (
                <ProductFormModal
                    producto={editingProduct}
                    categorias={categorias}
                    onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
                    onSave={handleSaveProduct}
                    userName={userName}
                />
            )}

            {deleteProduct && (
                <DeleteConfirmModal
                    producto={deleteProduct}
                    onClose={() => setDeleteProduct(null)}
                    onConfirm={eliminarProducto}
                />
            )}

            {showCategoryManager && (
                <CategoryManagerModal
                    categorias={categorias}
                    onClose={() => setShowCategoryManager(false)}
                    onCrear={crearCategoria}
                    onActualizar={actualizarCategoria}
                    onEliminar={eliminarCategoria}
                />
            )}
        </div>
    );
}
