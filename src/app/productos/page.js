'use client';
import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useProductos, useCategorias } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation, UBICACIONES } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState, StockBar } from '@/components/ui/SharedComponents';
import PullToRefresh from '@/components/ui/PullToRefresh';
import ProductThumb from '@/components/ui/ProductThumb';
import { ProductFormModal, DeleteConfirmModal, CategoryManagerModal, ProductCard, ProductDetailModal } from './components';
import { BulkBarcodeLabelsModal } from '@/components/ui/BarcodeLabel';
import { findProductByBarcode, normalizeBarcode } from '@/lib/barcodeUtils';
import {
    Search, X, Plus, Package,
    PlusCircle, Settings2, ChevronRight, ArrowUpDown, MapPin, ListChecks, Printer,
    LayoutGrid, List, Check,
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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // ── Llegada desde /scan: precargar búsqueda y, si no existe, abrir el
    // formulario de creación con el código ya escaneado ──
    useEffect(() => {
        const buscar = searchParams.get('buscar');
        const crear = searchParams.get('crear');
        const ubic = searchParams.get('ubicacion');
        if (ubic && ubic !== ubicacion) {
            setUbicacion(ubic);
        }
        if (!buscar) return;
        setBusqueda(buscar);
        if (crear === '1') {
            const yaExiste = findProductByBarcode(productos, buscar);
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
        const q = busqueda.toLowerCase().trim();
        const normQ = normalizeBarcode(q);

        // Si hay una búsqueda activa y no estamos en General, pero la búsqueda coincide
        // con un producto de otra ubicación, incluimos los productos que coinciden
        let baseList = productosUbicacion;
        if (q && !isGeneral) {
            const hasMatchInLocation = productosUbicacion.some(p =>
                p.nombre.toLowerCase().includes(q) ||
                (p.codigo_barras && (p.codigo_barras.toLowerCase().includes(q) || normalizeBarcode(p.codigo_barras) === normQ))
            );
            if (!hasMatchInLocation) {
                baseList = productos;
            }
        }

        let list = baseList
            .filter(p => categoria === 'Todas' || p.categoria === categoria)
            .filter(p => {
                if (!q) return true;
                return p.nombre.toLowerCase().includes(q)
                    || (p.codigo_barras && (p.codigo_barras.toLowerCase().includes(q) || normalizeBarcode(p.codigo_barras) === normQ))
                    || (p.id && p.id.toLowerCase() === q);
            });
        // Sort
        list = [...list].sort((a, b) => {
            if (sortBy === 'stock') return a.stock_actual - b.stock_actual;
            if (sortBy === 'categoria') return (a.categoria || '').localeCompare(b.categoria || '');
            if (sortBy === 'ubicacion') return (a.ubicacion || '').localeCompare(b.ubicacion || '');
            return (a.nombre || '').localeCompare(b.nombre || '');
        });
        return list;
    }, [productosUbicacion, productos, isGeneral, categoria, busqueda, sortBy]);

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
                            className={`btn px-4 py-3 text-base font-semibold flex items-center gap-2 border rounded-xl flex-1 sm:flex-none justify-center transition-colors ${selectMode ? 'bg-brand-600 text-white border-brand-600' : 'btn-ghost border-slate-200 text-slate-600 hover:bg-slate-50'
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
                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all shadow-sm whitespace-nowrap flex items-center gap-1.5 ${categoria === cat
                                                ? 'bg-brand-50 text-brand-700 border-brand-200 ring-1 ring-brand-500/10'
                                                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >{icon && <span>{icon}</span>}{label} <span className="text-[10px] opacity-60">({count})</span></button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Product count + Sort + View switcher ── */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                            {productosFiltrados.length} productos
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Selector de Vista: Tarjetas vs Lista */}
                            <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/60">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-xs'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                                    }`}
                                    title="Vista en tarjetas"
                                    aria-label="Vista en tarjetas"
                                >
                                    <LayoutGrid size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-xs'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                                    }`}
                                    title="Vista en lista"
                                    aria-label="Vista en lista"
                                >
                                    <List size={15} />
                                </button>
                            </div>

                            {/* Ordenar */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                                <ArrowUpDown size={14} className="text-slate-400" />
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-transparent border-none focus:ring-0 cursor-pointer pr-4"
                                >
                                    <option value="nombre">Producto</option>
                                    <option value="stock">Stock</option>
                                    <option value="categoria">Categoría</option>
                                    {isGeneral && <option value="ubicacion">Ubicación</option>}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Visualización de productos: Tarjetas o Lista ── */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-[#0d0d10] border border-slate-200 dark:border-[#222226] rounded-2xl h-56 animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : productosFiltrados.length === 0 ? (
                        <EmptyState icon={Package} title="Sin resultados" subtitle="Ajusta tus filtros de búsqueda" />
                    ) : viewMode === 'grid' ? (
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
                                    catIcon={catIconMap[p.categoria]}
                                />
                            ))}
                        </div>
                    ) : (
                        /* ── Vista de Lista Compacta ── */
                        <div className="bg-white dark:bg-[#0d0d10] border border-slate-200/90 dark:border-[#222226] rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-zinc-800/80">
                            {productosFiltrados.map(p => {
                                const ubicInfo = UBICACIONES.find(u => u.id === p.ubicacion);
                                const bajoStock = p.stock_actual <= (p.stock_minimo ?? 0);
                                const isSelected = selectedIds.has(p.id);

                                return (
                                    <div
                                        key={p.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => selectMode ? toggleSelect(p) : setViewProduct(p)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                selectMode ? toggleSelect(p) : setViewProduct(p);
                                            }
                                        }}
                                        className={`p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors ${
                                            isSelected ? 'bg-brand-50/70 dark:bg-brand-950/20' : ''
                                        }`}
                                    >
                                        {/* Modo Selección: Checkbox */}
                                        {selectMode && (
                                            <div className="flex-shrink-0">
                                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-zinc-600'
                                                }`}>
                                                    {isSelected && <Check size={11} strokeWidth={3} />}
                                                </span>
                                            </div>
                                        )}

                                        {/* Miniatura cuadrada moderna */}
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
                                            <ProductThumb url={p.imagen_url} size="card" className="w-full h-full object-cover" />
                                        </div>

                                        {/* Información principal */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1">
                                                    {catIconMap[p.categoria] && <span>{catIconMap[p.categoria]}</span>}
                                                    {p.categoria}
                                                </span>
                                                {p.estado && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                                                        {p.estado}
                                                    </span>
                                                )}
                                                {bajoStock && (
                                                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                                                        ⚠ Stock bajo
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-sm sm:text-base leading-snug truncate">
                                                {p.nombre}
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1 truncate">
                                                <MapPin size={12} className="flex-shrink-0 text-brand-500" />
                                                <span className="truncate">{ubicInfo?.icono} {ubicInfo?.nombre || p.ubicacion}</span>
                                            </p>
                                        </div>

                                        {/* Stock y barra */}
                                        <div className="text-right flex-shrink-0 min-w-[70px] sm:min-w-[95px]">
                                            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                                {p.stock_actual}{' '}
                                                <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">
                                                    {p.unidad || 'uds'}
                                                </span>
                                            </div>
                                            <div className="w-16 sm:w-20 ml-auto mt-1">
                                                <StockBar actual={p.stock_actual} minimo={p.stock_minimo} />
                                            </div>
                                        </div>

                                        {/* Indicador de acción */}
                                        <ChevronRight size={18} className="text-slate-300 dark:text-zinc-600 flex-shrink-0 hidden sm:block" />
                                    </div>
                                );
                            })}
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
