'use client';
import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { ProductFormModal, DeleteConfirmModal, CategoryManagerModal, ProductCard, ProductDetailModal } from './components';
import { BulkBarcodeLabelsModal } from '@/components/ui/BarcodeLabel';
import {
    Search, X, Plus, Package,
    PlusCircle, Settings2, ChevronRight, ArrowUpDown, MapPin, ListChecks, Printer,
} from 'lucide-react';

export default function ProductosPage() {
    return (
        <Suspense fallback={null}>
            <ProductosPageInner />
        </Suspense>
    );
}

function ProductosPageInner() {
    const {
        productos, loading,
        crearProducto, actualizarProducto, eliminarProducto,
    } = useProductos();
    const { categorias, crearCategoria, actualizarCategoria, eliminarCategoria } = useCategorias();
    const { user } = useAuth();
    const { ubicacion, ubicacionInfo, isGeneral } = useLocation();
    const { setHideBottomNav } = useSidebar();
    const searchParams = useSearchParams();
    const userName = user?.nombre || 'Usuario';
    const role = user?.rol || 'voluntario';

    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState('Todas');
    const [sortBy, setSortBy] = useState('nombre');
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteProduct, setDeleteProduct] = useState(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [viewProduct, setViewProduct] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [showBulkPrint, setShowBulkPrint] = useState(false);

    // ── Llegada desde /scan: precargar búsqueda y, si no existe, abrir el
    // formulario de creación con el código ya escaneado ──
    useEffect(() => {
        const buscar = searchParams.get('buscar');
        const crear = searchParams.get('crear');
        if (!buscar) return;
        setBusqueda(buscar);
        if (crear === '1') {
            const yaExiste = productos.some(p => p.codigo_barras === buscar);
            if (!yaExiste) {
                setEditingProduct({ codigo_barras: buscar });
                setShowProductForm(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // ── Ocultar BottomNav cuando hay un modal abierto (o modo selección) ──
    useEffect(() => {
        const open = !!showProductForm || !!deleteProduct || !!showCategoryManager || !!viewProduct || !!showBulkPrint || selectMode;
        setHideBottomNav(open);
        return () => setHideBottomNav(false);
    }, [showProductForm, deleteProduct, showCategoryManager, viewProduct, showBulkPrint, selectMode, setHideBottomNav]);

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
                    || (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q));
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
        const productData = { ...data, _usuario: data._usuario || userName };
        if (id) {
            await actualizarProducto(id, productData);
        } else {
            await crearProducto(productData);
        }
    }, [actualizarProducto, crearProducto, userName]);

    // ── Duplicate product ──
    const handleDuplicate = useCallback((producto) => {
        const duplicated = {
            ...producto,
            id: undefined,
            nombre: `${producto.nombre} (copia)`,
        };
        setViewProduct(null);
        setEditingProduct(duplicated);
        setShowProductForm(true);
    }, []);

    const handleEdit = useCallback((producto) => {
        setViewProduct(null);
        setEditingProduct(producto);
        setShowProductForm(true);
    }, []);

    const handleDeleteRequest = useCallback((producto) => {
        setViewProduct(null);
        setDeleteProduct(producto);
    }, []);

    const handleRefresh = useCallback(() => {
        return new Promise(resolve => setTimeout(resolve, 600));
    }, []);

    // ── Selección múltiple → impresión masiva de códigos de barras ──
    const toggleSelectMode = useCallback(() => {
        setSelectMode(prev => !prev);
        setSelectedIds(new Set());
    }, []);

    const toggleSelect = useCallback((producto) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(producto.id)) next.delete(producto.id);
            else next.add(producto.id);
            return next;
        });
    }, []);

    const selectedProductos = useMemo(
        () => productosFiltrados
            .filter(p => selectedIds.has(p.id))
            .map(p => ({ ...p, ubicacion_nombre: isGeneral ? UBICACIONES.find(u => u.id === p.ubicacion)?.nombre : undefined })),
        [productosFiltrados, selectedIds, isGeneral]
    );

    const handleBulkPrint = useCallback(() => {
        if (selectedProductos.length === 0) return;
        setShowBulkPrint(true);
    }, [selectedProductos]);

    const canManage = role === 'admin' || role === 'encargado';

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Productos" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-7xl mx-auto w-full pb-4">

                {/* GENERAL location banner */}
                {isGeneral && (
                    <div className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700">
                        <MapPin size={18} className="flex-shrink-0" />
                        <span>Vista combinada — mostrando productos de todas las ubicaciones. Selecciona una ubicación específica para gestionar productos.</span>
                    </div>
                )}

                {/* ── Action bar ── */}
                <div className="flex flex-wrap items-center gap-3">
                    {canManage && (
                        <>
                            <button
                                onClick={() => { setEditingProduct(isGeneral ? null : { ubicacion }); setShowProductForm(true); }}
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
                        </>
                    )}
                    <button
                        onClick={toggleSelectMode}
                        className={`btn px-4 py-3 text-base font-semibold flex items-center gap-2 border rounded-xl flex-1 sm:flex-none justify-center transition-colors ${
                            selectMode ? 'bg-brand-600 text-white border-brand-600' : 'btn-ghost border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <ListChecks size={18} /> {selectMode ? 'Cancelar selección' : 'Seleccionar'}
                    </button>
                </div>

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

                {/* ── Bento grid de productos ── */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl h-48 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <EmptyState icon={Package} title="Sin resultados" subtitle="Ajusta tus filtros de búsqueda" />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 items-stretch">
                        {productosFiltrados.map(p => (
                            <ProductCard
                                key={p.id}
                                producto={p}
                                isGeneral={isGeneral}
                                onView={setViewProduct}
                                selectMode={selectMode}
                                selected={selectedIds.has(p.id)}
                                onToggleSelect={toggleSelect}
                            />
                        ))}
                    </div>
                )}
            </div>
            </PullToRefresh>

            {/* ── Barra flotante de selección múltiple ── */}
            {selectMode && (
                <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-white border-t border-slate-200 shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slide-up">
                    <p className="text-sm font-semibold text-slate-700">
                        {selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleSelectMode} className="btn btn-ghost px-4 py-2.5 text-sm font-semibold text-slate-600">
                            Cancelar
                        </button>
                        <button
                            onClick={handleBulkPrint}
                            disabled={selectedIds.size === 0}
                            className="btn btn-primary px-4 py-2.5 text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer size={16} /> Imprimir códigos
                        </button>
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            {viewProduct && (
                <ProductDetailModal
                    producto={viewProduct}
                    canManage={role === 'admin' || role === 'encargado'}
                    isGeneral={isGeneral}
                    onClose={() => setViewProduct(null)}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onDuplicate={handleDuplicate}
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
            {showBulkPrint && (
                <BulkBarcodeLabelsModal
                    productos={selectedProductos}
                    onClose={() => setShowBulkPrint(false)}
                />
            )}
        </div>
    );
}
