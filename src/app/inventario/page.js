'use client';
import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useProductos } from '@/hooks/useFirestore';
import { useRole } from '@/context/RoleContext';
import { useLanguage } from '@/context/LanguageContext';
import { SemaforoBadge, StockBar, LoadingSkeleton, EmptyState } from '@/components/ui/SharedComponents';
import { daysUntil, formatDate } from '@/lib/utils';
import { Search, X, Plus, Minus, Package } from 'lucide-react';

const CATEGORIAS = ['Todas', 'Desayuno', 'Limpieza', 'Frigobar', 'Cocina'];

// ─── Modal de captura rápida ───────────────────────────────────────────────
function StockModal({ producto, onClose, onUpdateStock, onMerma, userName }) {
    const { t } = useLanguage();
    const [modo, setModo] = useState('stock'); // 'stock' | 'merma'
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
            <div className="modal-box animate-slide-up p-0 overflow-hidden border border-glass shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header del modal */}
                <div className="flex items-start justify-between p-6 border-b border-glass bg-dark-panel">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-xl leading-tight truncate">{producto.nombre}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="badge-gray px-2 py-0.5">{t(producto.categoria.toLowerCase())}</span>
                            <SemaforoBadge days={dias} />
                        </div>
                    </div>
                    <button onClick={onClose} className="ml-3 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0">
                        <X size={20} />
                    </button>
                </div>

                {/* Stock actual */}
                <div className="px-6 py-5 bg-black/20 border-b border-glass backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">{t('stockActual')}</p>
                            <p className="text-4xl font-bold text-white mt-1">
                                {producto.stock_actual} <span className="text-lg text-slate-500 font-normal ml-1">{producto.unidad || 'u'}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-semibold">{t('minDef')}</p>
                            <p className="text-lg font-bold text-slate-200 mt-1">{producto.stock_minimo_rop} {producto.unidad || 'u'}</p>
                            <div className="mt-2 scale-110 transform origin-right">
                                <StockBar actual={producto.stock_actual} minimo={producto.stock_minimo_rop} />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        {t('vencimiento')}: <strong className="text-slate-300">{formatDate(producto.fecha_vencimiento)}</strong>
                    </p>
                </div>

                {/* Pestañas */}
                <div className="flex border-b border-glass bg-dark-panel">
                    <button
                        onClick={() => setModo('stock')}
                        className={`flex-1 py-3.5 text-sm font-semibold transition-all ${modo === 'stock' ? 'text-brand-400 border-b-2 border-brand-400 bg-brand-500/10 shadow-glow' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        📦 {t('actualizarStock')}
                    </button>
                    <button
                        onClick={() => setModo('merma')}
                        className={`flex-1 py-3.5 text-sm font-semibold transition-all ${modo === 'merma' ? 'text-red-400 border-b-2 border-red-400 bg-red-500/10' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        🗑️ {t('registrarMerma')}
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-dark">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {modo === 'stock' ? t('cantidadIngresar') : t('cantidadBaja')}
                        </label>
                        {/* Stepper grande para móvil */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setCantidad(Math.max(0, cantidad - 1))}
                                className="w-14 h-14 rounded-2xl bg-dark-panel border border-glass flex items-center justify-center text-slate-300 hover:bg-white/10 active:scale-95 transition-all text-xl shadow-sm"
                            >
                                <Minus size={20} />
                            </button>
                            <input
                                type="number"
                                min="0"
                                value={cantidad}
                                onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value) || 0))}
                                className="inp text-center text-3xl font-bold h-14 flex-1 tracking-wider"
                            />
                            <button
                                type="button"
                                onClick={() => setCantidad(cantidad + 1)}
                                className="w-14 h-14 rounded-2xl bg-dark-panel border border-glass flex items-center justify-center text-slate-300 hover:bg-white/10 active:scale-95 transition-all shadow-sm"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {/* Quick amounts */}
                        <div className="flex gap-2 mt-3">
                            {[1, 5, 10, 25].map((n) => (
                                <button key={n} type="button" onClick={() => setCantidad(n)}
                                    className="flex-1 py-2 text-sm font-medium rounded-xl bg-dark-panel border border-glass text-slate-400 hover:text-white hover:border-slate-500 transition-all active:scale-95"
                                >
                                    +{n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {modo === 'merma' && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t('motivoMerma')}</label>
                            <textarea
                                rows={3}
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder={t('ejMotivoMerma')}
                                className="inp resize-none text-sm placeholder:text-slate-600"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving || cantidad === 0}
                        className={`w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg ${success ? 'bg-emerald-500 text-white shadow-glow' :
                            modo === 'merma' ? 'btn-danger justify-center shadow-red-500/20' : 'btn-primary justify-center shadow-brand-500/20'
                            } ${saving || cantidad === 0 ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                    >
                        {success ? '✅ ' + t('guardando').replace('...', '!') : saving ? t('guardando') : modo === 'merma' ? '🗑️ ' + t('registrarMerma') : '✅ ' + t('actualizarStock')}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function InventarioPage() {
    const { productos, loading, updateStock, registrarMerma } = useProductos();
    const { userName } = useRole();
    const { t } = useLanguage();
    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState('Todas');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const productosFiltrados = useMemo(() => {
        return productos
            .filter((p) => categoria === 'Todas' || p.categoria === categoria)
            .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    }, [productos, categoria, busqueda]);

    return (
        <div className="flex flex-col flex-1">
            <Header title={t('inventario')} />
            <div className="flex-1 p-4 sm:p-6 space-y-6 animate-fade-in">

                {/* ── Filters ── */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t('buscarProducto')}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="inp pl-11 py-3 text-sm h-12 shadow-inner"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        {CATEGORIAS.map((cat) => {
                            const translatedCat = cat === 'Todas' ? t('todas') : t(cat.toLowerCase());
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategoria(cat)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all shadow-sm ${categoria === cat
                                        ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 shadow-glow'
                                        : 'bg-dark-panel border-glass text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                >
                                    {translatedCat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Desktop Table ── */}
                <div className="glass-panel overflow-hidden hidden md:block">
                    <div className="px-6 py-5 border-b border-glass flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white tracking-wide">{t('productos')}</h2>
                            <span className="badge-gray">{productosFiltrados.length}</span>
                        </div>
                        <p className="text-sm font-medium text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20 shadow-glow">
                            👆 {t('tocaProductoActualizar')}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('producto')}</th>
                                    <th>{t('categoria')}</th>
                                    <th>{t('stockActual')}</th>
                                    <th>{t('min')}</th>
                                    <th>{t('nivel')}</th>
                                    <th>{t('vencimiento')}</th>
                                    <th>{t('alerta')}</th>
                                    <th>{t('accion')}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSkeleton rows={8} cols={8} />
                            ) : (
                                <tbody>
                                    {productosFiltrados.length === 0 ? (
                                        <tr><td colSpan={8}><EmptyState icon={Package} title="sinResultados" subtitle="ajustaFiltros" /></td></tr>
                                    ) : (
                                        productosFiltrados.map((p) => {
                                            const dias = daysUntil(p.fecha_vencimiento);
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className={`${dias <= 3 ? 'bg-red-500/5 hover:bg-red-500/10' : dias <= 7 ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-white/5'} border-b border-glass transition-colors cursor-pointer group`}
                                                    onClick={() => setProductoSeleccionado(p)}
                                                >
                                                    <td className="font-semibold text-slate-200 group-hover:text-white transition-colors">{p.nombre}</td>
                                                    <td><span className="badge-gray">{t(p.categoria.toLowerCase())}</span></td>
                                                    <td className="font-bold text-white text-base">{p.stock_actual} <span className="text-slate-500 text-xs font-normal">{p.unidad}</span></td>
                                                    <td className="text-slate-400 font-medium">{p.stock_minimo_rop}</td>
                                                    <td><StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} /></td>
                                                    <td className="text-sm text-slate-400 font-medium">{formatDate(p.fecha_vencimiento)}</td>
                                                    <td><SemaforoBadge days={dias} /></td>
                                                    <td>
                                                        <button className="btn btn-ghost btn-sm text-brand-400 hover:bg-brand-500/20" onClick={(e) => { e.stopPropagation(); setProductoSeleccionado(p); }}>
                                                            {t('editar')}
                                                        </button>
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
                            <div key={i} className="glass-card p-4 h-28 animate-pulse bg-dark-panel border-glass" />
                        ))
                    ) : productosFiltrados.length === 0 ? (
                        <EmptyState icon={Package} title="sinResultados" subtitle="ajustaFiltros" />
                    ) : (
                        productosFiltrados.map((p) => {
                            const dias = daysUntil(p.fecha_vencimiento);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setProductoSeleccionado(p)}
                                    className={`w-full text-left glass-card p-5 active:scale-[0.98] transition-all shadow-md ${dias <= 3 ? 'border-l-red-500 border-l-4 shadow-red-500/10' : dias <= 7 ? 'border-l-yellow-500 border-l-4 shadow-yellow-500/10' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-lg leading-tight truncate">{p.nombre}</p>
                                            <p className="text-xs text-brand-400 font-medium mt-1">{t(p.categoria.toLowerCase())}</p>
                                        </div>
                                        <SemaforoBadge days={dias} />
                                    </div>
                                    <div className="flex items-end gap-4 mt-4 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('stock')}</p>
                                            <p className="font-bold text-white text-xl mt-0.5">{p.stock_actual} <span className="text-slate-500 text-sm font-normal">{p.unidad}</span></p>
                                        </div>
                                        <div className="flex-1 mb-1.5">
                                            <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('minDef')}</p>
                                            <p className="text-sm font-bold text-slate-300 mt-1">{p.stock_minimo_rop}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Modal ── */}
            {productoSeleccionado && (
                <StockModal
                    producto={productoSeleccionado}
                    onClose={() => setProductoSeleccionado(null)}
                    onUpdateStock={updateStock}
                    onMerma={registrarMerma}
                    userName={userName}
                />
            )}
        </div>
    );
}
