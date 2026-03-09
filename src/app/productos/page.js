'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES_FISICAS, UBICACIONES } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState, StockBar } from '@/components/ui/SharedComponents';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { formatDate } from '@/lib/utils';
import {
    Search, X, Plus, Package, Trash2, Pencil,
    PlusCircle, Save, AlertTriangle, FolderPlus,
    Settings2, ScanBarcode, ChevronRight, ArrowUpDown, Download, Copy, MapPin,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
//  ProductFormModal – Full product registration / edit
// ═══════════════════════════════════════════════════════════════════════════
const UNIDADES = ['unidades', 'botellas', 'latas', 'bolsas', 'cajas', 'litros', 'kg', 'gramos', 'packs'];

function ProductFormModal({ producto, categorias, onClose, onSave, userName }) {
    const isEdit = !!producto;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const [form, setForm] = useState({
        nombre: producto?.nombre || '',
        categoria: producto?.categoria || '',
        stock_actual: producto?.stock_actual ?? 0,
        stock_minimo_rop: producto?.stock_minimo_rop ?? 0,
        unidad: producto?.unidad || 'unidades',
        codigo_barras: producto?.codigo_barras || '',
        gramaje: producto?.gramaje || '',
        contenido: producto?.contenido || '',
        marca: producto?.marca || '',
        lote: producto?.lote || '',
        fecha_vencimiento: producto?.fecha_vencimiento
            ? (producto.fecha_vencimiento.toDate
                ? producto.fecha_vencimiento.toDate().toISOString().split('T')[0]
                : new Date(producto.fecha_vencimiento).toISOString().split('T')[0])
            : '',
        proveedor: producto?.proveedor || '',
        descripcion: producto?.descripcion || '',
    });

    function handleChange(key, value) {
        setForm(prev => ({ ...prev, [key]: key === 'stock_actual' || key === 'stock_minimo_rop' ? Number(value) || 0 : value }));
    }

    function handleBarcodeScan(code) {
        setForm(prev => ({ ...prev, codigo_barras: code }));
        setShowScanner(false);
    }

    async function handleSubmit() {
        if (!form.nombre.trim()) { setError('El nombre del producto es obligatorio'); return; }
        if (!form.categoria) { setError('Selecciona una categoría'); return; }
        setSaving(true);
        setError('');
        try {
            await onSave({ ...form, _usuario: userName }, isEdit ? producto.id : null);
            onClose();
        } catch (err) {
            setError(err.message || 'Error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white max-w-lg w-full max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{isEdit ? 'Modifica los datos del producto' : 'Registra un nuevo producto al inventario'}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Producto *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => handleChange('nombre', e.target.value)}
                            placeholder="Ej: Vodka Absolut 750ml"
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            required
                        />
                    </div>

                    {/* Código de barras */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Código de barras</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={form.codigo_barras}
                                onChange={e => handleChange('codigo_barras', e.target.value)}
                                placeholder="Ej: 7750182000123"
                                className="inp text-base py-3 flex-1 bg-white border-slate-200 text-slate-900 font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="btn btn-ghost px-4 py-3 border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all rounded-xl flex items-center gap-2"
                            >
                                <ScanBarcode size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Categoría + Unidad */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Categoría *</label>
                            <select
                                value={form.categoria}
                                onChange={e => handleChange('categoria', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                                required
                            >
                                <option value="">— Selecciona una categoría —</option>
                                {categorias.filter(c => c.activa !== false).map(c => (
                                    <option key={c.id} value={c.nombre}>{c.icono} {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Unidad</label>
                            <select
                                value={form.unidad}
                                onChange={e => handleChange('unidad', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            >
                                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Marca + Contenido/Gramaje */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Marca</label>
                            <input
                                type="text"
                                value={form.marca}
                                onChange={e => handleChange('marca', e.target.value)}
                                placeholder="Ej: Absolut"
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Gramaje</label>
                            <input
                                type="text"
                                value={form.gramaje}
                                onChange={e => handleChange('gramaje', e.target.value)}
                                placeholder="Ej: 750ml, 330ml, 200g"
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Stock actual + Mínimo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Stock actual</label>
                            <input
                                type="number"
                                min="0"
                                value={form.stock_actual}
                                onChange={e => handleChange('stock_actual', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900 text-center font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Stock mínimo</label>
                            <input
                                type="number"
                                min="0"
                                value={form.stock_minimo_rop}
                                onChange={e => handleChange('stock_minimo_rop', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900 text-center font-bold"
                            />
                        </div>
                    </div>

                    {/* Lote + Vencimiento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Lote</label>
                            <input
                                type="text"
                                value={form.lote}
                                onChange={e => handleChange('lote', e.target.value)}
                                placeholder="Ej: VOD-2026-01"
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Vencimiento</label>
                            <input
                                type="date"
                                value={form.fecha_vencimiento}
                                onChange={e => handleChange('fecha_vencimiento', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Proveedor */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Proveedor</label>
                        <input
                            type="text"
                            value={form.proveedor}
                            onChange={e => handleChange('proveedor', e.target.value)}
                            placeholder="Ej: Distribuidora Nacional SAC"
                            className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                        <textarea
                            rows={2}
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            placeholder="Notas adicionales del producto"
                            className="inp resize-none text-base py-3 bg-white border-slate-200 text-slate-900"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    <button type="button" onClick={onClose} className="btn btn-ghost px-6 py-3 text-base font-semibold text-slate-600">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn btn-primary px-6 py-3 text-base font-bold flex items-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <><span className="spinner border-white border-t-transparent w-5 h-5" /> Guardando...</>
                        ) : (
                            <><Save size={18} /> {isEdit ? 'Guardar cambios' : 'Crear producto'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* Inner barcode scanner */}
            {showScanner && (
                <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DeleteConfirmModal
// ═══════════════════════════════════════════════════════════════════════════
function DeleteConfirmModal({ producto, onClose, onConfirm }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    async function handleDelete() {
        setDeleting(true);
        setError('');
        try {
            await onConfirm(producto.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Error');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-6 border border-slate-200 shadow-2xl bg-white max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">Eliminar producto</h3>
                    <p className="text-sm text-slate-500 mt-2">¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
                    <p className="text-base font-bold text-slate-800 mt-2 bg-slate-100 px-4 py-2 rounded-lg">{producto.nombre}</p>
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 w-full text-left">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="btn btn-ghost flex-1 py-3 text-base font-semibold text-slate-600">
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="btn btn-danger flex-1 py-3 text-base font-bold flex items-center justify-center gap-2"
                    >
                        {deleting ? <span className="spinner border-white border-t-transparent w-5 h-5" /> : <Trash2 size={18} />}
                        Eliminar
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
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newIcon, setNewIcon] = useState('📦');
    const [newColor, setNewColor] = useState('#6366f1');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

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

    const ICONS = ['📦', '🥃', '🍺', '🍷', '🥤', '🍋', '🥜', '🧊', '🍸', '🥂'];
    const COLORS = ['#f59e0b', '#10b981', '#f472b6', '#8b5cf6', '#ef4444', '#3b82f6', '#14b8a6', '#f97316'];

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

// ═══════════════════════════════════════════════════════════════════════════
//  SwipeableProductCard – Swipe left = delete, swipe right = edit
// ═══════════════════════════════════════════════════════════════════════════
function SwipeableProductCard({ producto, catIcon, canManage, isGeneral, onEdit, onDelete, onDuplicate }) {
    const cardRef = useRef(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const [offsetX, setOffsetX] = useState(0);
    const [swiping, setSwiping] = useState(false);

    const SWIPE_THRESHOLD = 80;

    const handleTouchStart = useCallback((e) => {
        if (!canManage || isGeneral) return;
        startX.current = e.touches[0].clientX;
        currentX.current = 0;
        setSwiping(true);
    }, [canManage, isGeneral]);

    const handleTouchMove = useCallback((e) => {
        if (!swiping) return;
        const diff = e.touches[0].clientX - startX.current;
        currentX.current = diff;
        setOffsetX(Math.max(-120, Math.min(120, diff)));
    }, [swiping]);

    const handleTouchEnd = useCallback(() => {
        if (!swiping) return;
        setSwiping(false);
        if (currentX.current < -SWIPE_THRESHOLD) {
            onDelete(producto);
        } else if (currentX.current > SWIPE_THRESHOLD) {
            onEdit(producto);
        }
        setOffsetX(0);
    }, [swiping, producto, onDelete, onEdit]);

    const ubicInfo = UBICACIONES.find(u => u.id === producto.ubicacion);

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Background actions */}
            {canManage && !isGeneral && (
                <>
                    <div className={`absolute inset-y-0 left-0 w-24 flex items-center justify-center bg-brand-500 rounded-l-xl transition-opacity ${offsetX > 30 ? 'opacity-100' : 'opacity-0'}`}>
                        <Pencil size={22} className="text-white" />
                    </div>
                    <div className={`absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-red-500 rounded-r-xl transition-opacity ${offsetX < -30 ? 'opacity-100' : 'opacity-0'}`}>
                        <Trash2 size={22} className="text-white" />
                    </div>
                </>
            )}

            {/* Card */}
            <div
                ref={cardRef}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all relative z-10"
                style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? 'none' : 'transform 0.3s ease' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-base truncate">{producto.nombre}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-semibold text-brand-600 uppercase">{catIcon} {producto.categoria}</span>
                            {producto.marca && <span className="text-xs text-slate-400">· {producto.marca}</span>}
                            {producto.gramaje && <span className="text-xs text-slate-400">· {producto.gramaje}</span>}
                        </div>
                        {isGeneral && ubicInfo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1.5">
                                <MapPin size={10} /> {ubicInfo.icono} {ubicInfo.nombre}
                            </span>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="font-bold text-slate-800">{producto.stock_actual} <span className="text-slate-400 font-normal text-xs">{producto.unidad}</span></span>
                            <StockBar actual={producto.stock_actual} minimo={producto.stock_minimo_rop} />
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                            {!isGeneral && (
                                <>
                                    <button
                                        onClick={() => onEdit(producto)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                        aria-label="Editar"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDuplicate(producto)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                        aria-label="Duplicar"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(producto)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCTOS PAGE – Product Registration & Management
// ═══════════════════════════════════════════════════════════════════════════
export default function ProductosPage() {
    const {
        productos, loading,
        crearProducto, actualizarProducto, eliminarProducto,
    } = useProductos();
    const { categorias, crearCategoria, actualizarCategoria, eliminarCategoria } = useCategorias();
    const { user } = useAuth();
    const { ubicacion, ubicacionInfo, isGeneral } = useLocation();
    const { setHideBottomNav } = useSidebar();
    const userName = user?.nombre || 'Usuario';
    const role = user?.rol || 'LOGISTICA';

    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState('Todas');
    const [sortBy, setSortBy] = useState('nombre');
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteProduct, setDeleteProduct] = useState(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // ── Ocultar BottomNav cuando hay un modal abierto ──
    useEffect(() => {
        const open = !!showProductForm || !!deleteProduct || !!showCategoryManager;
        setHideBottomNav(open);
        return () => setHideBottomNav(false);
    }, [showProductForm, deleteProduct, showCategoryManager, setHideBottomNav]);

    // category map: nombre → icono
    const catIconMap = useMemo(() => {
        const m = {};
        categorias.forEach(c => { m[c.nombre] = c.icono || '📦'; });
        return m;
    }, [categorias]);

    // filter products by current location (GENERAL = all)
    const productosUbicacion = useMemo(
        () => isGeneral ? productos : productos.filter(p => p.ubicacion === ubicacion),
        [productos, ubicacion, isGeneral]
    );

    // category counts (for current location)
    const catCounts = useMemo(() => {
        const c = {};
        productosUbicacion.forEach(p => { c[p.categoria] = (c[p.categoria] || 0) + 1; });
        return c;
    }, [productosUbicacion]);

    const catNames = useMemo(() => ['Todas', ...categorias.map(c => c.nombre)], [categorias]);

    const productosFiltrados = useMemo(() => {
        let list = productosUbicacion
            .filter(p => categoria === 'Todas' || p.categoria === categoria)
            .filter(p => {
                const q = busqueda.toLowerCase();
                return p.nombre.toLowerCase().includes(q)
                    || (p.codigo_barras && p.codigo_barras.includes(q))
                    || (p.lote && p.lote.toLowerCase().includes(q));
            });
        // Sort
        list = [...list].sort((a, b) => {
            if (sortBy === 'stock') return a.stock_actual - b.stock_actual;
            if (sortBy === 'categoria') return (a.categoria || '').localeCompare(b.categoria || '');
            if (sortBy === 'ubicacion') return (a.ubicacion || '').localeCompare(b.ubicacion || '');
            return (a.nombre || '').localeCompare(b.nombre || '');
        });
        return list;
    }, [productosUbicacion, categoria, busqueda, sortBy]);

    const handleSaveProduct = useCallback(async (data, id) => {
        if (id) {
            const { _usuario, ...rest } = data;
            await actualizarProducto(id, rest);
        } else {
            await crearProducto({ ...data, ubicacion });
        }
    }, [crearProducto, actualizarProducto, ubicacion]);

    // ── Duplicate product ──
    const handleDuplicate = useCallback((producto) => {
        const duplicated = {
            ...producto,
            id: undefined,
            nombre: `${producto.nombre} (copia)`,
            lote: '',
            fecha_vencimiento: '',
        };
        setEditingProduct(duplicated);
        setShowProductForm(true);
    }, []);

    const handleEdit = useCallback((producto) => {
        setEditingProduct(producto);
        setShowProductForm(true);
    }, []);

    const handleRefresh = useCallback(() => {
        return new Promise(resolve => setTimeout(resolve, 600));
    }, []);

    const canManage = (role === 'ADMIN' || role === 'GERENCIA' || role === 'LOGISTICA') && !isGeneral;

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Productos" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-4">

                {/* GENERAL location banner */}
                {isGeneral && (
                    <div className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700">
                        <MapPin size={18} className="flex-shrink-0" />
                        <span>Vista combinada — mostrando productos de todas las ubicaciones. Selecciona una ubicación específica para gestionar productos.</span>
                    </div>
                )}

                {/* ── Action bar ── */}
                {canManage && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
                            className="btn btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center"
                        >
                            <PlusCircle size={20} /> Nuevo producto
                        </button>
                        <button
                            onClick={() => setShowCategoryManager(true)}
                            className="btn btn-ghost px-4 py-3 text-base font-semibold flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none justify-center"
                        >
                            <Settings2 size={18} /> Categorías
                        </button>
                    </div>
                )}

                {/* ── Search + Filters ── */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar producto, código de barras o lote"
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="inp pl-12 pr-10 py-3.5 text-base h-14 shadow-sm bg-white border-slate-200 text-slate-900 focus:ring-brand-500/10 focus:border-brand-500 w-full"
                        />
                        {busqueda && (
                            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400" aria-label="Limpiar búsqueda">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1">
                        {catNames.map(cat => {
                            const label = cat === 'Todas' ? 'Todas' : cat;
                            const icon = cat !== 'Todas' ? catIconMap[cat] : null;
                            const count = cat === 'Todas' ? productosUbicacion.length : (catCounts[cat] || 0);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategoria(cat)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all shadow-sm whitespace-nowrap flex items-center gap-1.5 ${
                                        categoria === cat
                                            ? 'bg-brand-50 text-brand-700 border-brand-200 ring-1 ring-brand-500/10'
                                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >{icon && <span>{icon}</span>}{label} <span className="text-[10px] opacity-60">({count})</span></button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Product count + Sort ── */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">
                        {productosFiltrados.length} productos
                    </p>
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown size={14} className="text-slate-400" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="text-xs font-medium text-slate-500 bg-transparent border-none focus:ring-0 cursor-pointer pr-6"
                        >
                            <option value="nombre">Producto</option>
                            <option value="stock">Stock</option>
                            <option value="categoria">Categoría</option>
                            {isGeneral && <option value="ubicacion">Ubicación</option>}
                        </select>
                    </div>
                </div>

                {/* ── Product Cards (swipeable) ── */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl h-24 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <EmptyState icon={Package} title="Sin resultados" subtitle="Ajusta tus filtros de búsqueda" />
                ) : (
                    <div className="space-y-3">
                        {productosFiltrados.map(p => (
                            <SwipeableProductCard
                                key={p.id}
                                producto={p}
                                catIcon={catIconMap[p.categoria] || '📦'}
                                canManage={role === 'ADMIN' || role === 'GERENCIA' || role === 'LOGISTICA'}
                                isGeneral={isGeneral}
                                onEdit={handleEdit}
                                onDelete={setDeleteProduct}
                                onDuplicate={handleDuplicate}
                            />
                        ))}
                    </div>
                )}
            </div>
            </PullToRefresh>

            {/* ── Modals ── */}
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
