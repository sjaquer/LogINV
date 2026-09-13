'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES_FISICAS } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { ProductFormModal, DeleteConfirmModal, CategoryManagerModal, SwipeableProductCard } from './components';
import {
    Search, X, Plus, Package,
    PlusCircle, Settings2, ChevronRight, ArrowUpDown, MapPin,
} from 'lucide-react';

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
