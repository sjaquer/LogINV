'use client';
import { useState } from 'react';
import { X, Save, AlertTriangle, ScanBarcode, Tag } from 'lucide-react';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import BarcodeLabelModal, { BarcodeLabelPreview } from '@/components/ui/BarcodeLabel';
import ProductImageUploader from './ProductImageUploader';
import { UBICACIONES_FISICAS } from '@/context/LocationContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const UNIDADES = ['pieza', 'unidades', 'cajas', 'bolsas', 'pares', 'metros', 'kg', 'litros', 'packs'];

const ESTADOS = [
    { value: 'OPTIMO', label: 'Óptimo' },
    { value: 'DESGASTADO', label: 'Desgastado' },
    { value: 'NECESITA_MANTENIMIENTO', label: 'Necesita mantenimiento' },
];

export default function ProductFormModal({ producto, categorias, onClose, onSave, userName }) {
    const isEdit = !!producto?.id;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [showLabel, setShowLabel] = useState(false);

    useEscapeKey(onClose);

    const [form, setForm] = useState({
        nombre: producto?.nombre || '',
        categoria: producto?.categoria || '',
        ubicacion: producto?.ubicacion || UBICACIONES_FISICAS[0]?.id || '',
        stock_actual: producto?.stock_actual ?? 0,
        stock_minimo: producto?.stock_minimo ?? 0,
        unidad: producto?.unidad || 'pieza',
        codigo_barras: producto?.codigo_barras || '',
        estado: producto?.estado || 'OPTIMO',
        responsabilidad: producto?.responsabilidad || '',
        piso: producto?.piso || '',
        observaciones: producto?.observaciones || '',
        descripcion: producto?.descripcion || '',
        imagen_url: producto?.imagen_url || '',
        imagen_drive_id: producto?.imagen_drive_id || '',
    });

    function handleChange(key, value) {
        setForm(prev => ({ ...prev, [key]: key === 'stock_actual' || key === 'stock_minimo' ? Number(value) || 0 : value }));
    }

    function handleImageChange({ imagen_url, imagen_drive_id }) {
        setForm(prev => ({ ...prev, imagen_url, imagen_drive_id }));
    }

    function handleBarcodeScan(code) {
        setForm(prev => ({ ...prev, codigo_barras: code }));
        setShowScanner(false);
    }

    // Genera un código único a partir de la categoría (prefijo) + un sufijo
    // corto, siguiendo la misma idea de los códigos ya usados en el
    // inventario físico (ej: INSTB1, MOBIL1, HECOM1).
    function handleGenerateCode() {
        const prefix = (form.categoria || form.nombre || 'ITEM')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^A-Za-z]/g, '')
            .toUpperCase()
            .slice(0, 4) || 'ITEM';
        const suffix = Date.now().toString(36).toUpperCase().slice(-5);
        setForm(prev => ({ ...prev, codigo_barras: `${prefix}${suffix}` }));
    }

    async function handleSubmit() {
        if (!form.nombre.trim()) { setError('El nombre del producto es obligatorio'); return; }
        if (!form.categoria) { setError('Selecciona una categoría'); return; }
        if (!form.ubicacion) { setError('Selecciona una ubicación'); return; }
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
                    {/* Foto */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Foto</label>
                        <ProductImageUploader
                            imagenUrl={form.imagen_url}
                            imagenId={form.imagen_drive_id}
                            onChange={handleImageChange}
                        />
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Producto *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => handleChange('nombre', e.target.value)}
                            placeholder="Ej: Micrófono inalámbrico"
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
                                placeholder="Ej: INSTB1 o 7750182000123"
                                className="inp text-base py-3 flex-1 bg-white border-slate-200 text-slate-900 font-mono"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateCode}
                                title="Generar código nuevo"
                                className="btn btn-ghost px-4 py-3 border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all rounded-xl flex items-center gap-2"
                            >
                                <Tag size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                title="Escanear código"
                                className="btn btn-ghost px-4 py-3 border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all rounded-xl flex items-center gap-2"
                            >
                                <ScanBarcode size={20} />
                            </button>
                        </div>
                        {form.codigo_barras && (
                            <div className="mt-3">
                                <BarcodeLabelPreview value={form.codigo_barras} />
                                <button
                                    type="button"
                                    onClick={() => setShowLabel(true)}
                                    className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 mx-auto"
                                >
                                    <Tag size={14} /> Ver / imprimir etiqueta
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Categoría + Ubicación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Categoría *</label>
                            <select
                                value={form.categoria}
                                onChange={e => handleChange('categoria', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                                required
                            >
                                <option value="">— Selecciona —</option>
                                {categorias.filter(c => c.activa !== false).map(c => (
                                    <option key={c.id} value={c.nombre}>{c.icono} {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ubicación *</label>
                            <select
                                value={form.ubicacion}
                                onChange={e => handleChange('ubicacion', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                                required
                            >
                                {UBICACIONES_FISICAS.map(u => (
                                    <option key={u.id} value={u.id}>{u.icono} {u.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stock actual + Mínimo + Unidad */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Stock</label>
                            <input
                                type="number"
                                min="0"
                                value={form.stock_actual}
                                onChange={e => handleChange('stock_actual', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900 text-center font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mínimo</label>
                            <input
                                type="number"
                                min="0"
                                value={form.stock_minimo}
                                onChange={e => handleChange('stock_minimo', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900 text-center font-bold"
                            />
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

                    {/* Estado + Responsabilidad */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
                            <select
                                value={form.estado}
                                onChange={e => handleChange('estado', e.target.value)}
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            >
                                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Responsable / Ministerio</label>
                            <input
                                type="text"
                                value={form.responsabilidad}
                                onChange={e => handleChange('responsabilidad', e.target.value)}
                                placeholder="Ej: Ministerio de Adoración"
                                className="inp text-base py-3 bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Piso */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Piso / referencia exacta</label>
                        <input
                            type="text"
                            value={form.piso}
                            onChange={e => handleChange('piso', e.target.value)}
                            placeholder="Ej: Primer piso, puerta izquierda"
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
                            placeholder="Marca, modelo, color, características..."
                            className="inp resize-none text-base py-3 bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones</label>
                        <textarea
                            rows={2}
                            value={form.observaciones}
                            onChange={e => handleChange('observaciones', e.target.value)}
                            placeholder="Notas de mantenimiento, etiquetado, etc."
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

            {/* Etiqueta imprimible */}
            {showLabel && (
                <BarcodeLabelModal
                    producto={{ nombre: form.nombre || 'Producto', codigo_barras: form.codigo_barras }}
                    onClose={() => setShowLabel(false)}
                />
            )}
        </div>
    );
}
