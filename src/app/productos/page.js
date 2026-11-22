'use client';
import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Settings2, ListChecks, MapPin, LayoutGrid, List, ArrowUpDown, Package, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { PageBody, SearchInput } from '@/components/ui/Page';
import { EmptyState } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Feedback';
import { BulkBarcodeLabelsModal } from '@/components/ui/BarcodeLabel';
import { useProductos, useCategorias } from '@/hooks/useFirestore';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useAuth } from '@/context/AuthContext';
import { useLocation, getLocationInfo } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { normalizeBarcode } from '@/lib/barcodeUtils';
import { isLowStock } from '@/lib/stock';
import { cn } from '@/lib/utils';
import {
    ProductFormModal, DeleteConfirmModal, CategoryManagerModal, ProductCard, ProductDetailModal,
    ProductListRow, SelectionBar,
} from './components';

export default function ProductosPage() {
    return (
        <Suspense fallback={null}>
            <ProductosPageInner />
        </Suspense>
    );
}

const SORTS = {
    nombre: (a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'),
    stock: (a, b) => (Number(a.stock_actual) || 0) - (Number(b.stock_actual) || 0),
    categoria: (a, b) => (a.categoria || '').localeCompare(b.categoria || '', 'es'),
    ubicacion: (a, b) => (a.ubicacion || '').localeCompare(b.ubicacion || '', 'es'),
};

const matches = (p, q, normQ) =>
    p.nombre?.toLowerCase().includes(q)
    || (p.codigo_barras && (String(p.codigo_barras).toLowerCase().includes(q) || normalizeBarcode(p.codigo_barras) === normQ))
    || p.id?.toLowerCase() === q;

function ProductosPageInner() {
    const { productos, loading, crearProducto, actualizarProducto, eliminarProducto } = useProductos();
    const { categorias, crearCategoria, actualizarCategoria, eliminarCategoria } = useCategorias();
    const { user } = useAuth();
    const { ubicacion, setUbicacion, isGeneral } = useLocation();
    const { setHideBottomNav } = useSidebar();
    const searchParams = useSearchParams();
    const toast = useToast();
    const userName = user?.nombre || 'Usuario';
    const canManage = user?.rol === 'admin' || user?.rol === 'encargado';

    // Al llegar desde /scan (?buscar=…&crear=1) se precarga la búsqueda y,
    // si el código no existe, se abre el formulario con el código escaneado.
    const buscarParam = searchParams.get('buscar') || '';
    const crearParam = searchParams.get('crear') === '1';
    const [busqueda, setBusqueda] = useState(buscarParam);
    const [categoria, setCategoria] = useState('Todas');
    const [soloBajos, setSoloBajos] = useState(false);
    const [sortBy, setSortBy] = useState('nombre');
    const [viewMode, setViewMode] = usePersistentState('loginv_productos_vista', 'grid');
    const [form, setForm] = useState(crearParam && buscarParam && canManage ? { codigo_barras: buscarParam } : null); // null | producto parcial
    const [deleteProduct, setDeleteProduct] = useState(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [viewProduct, setViewProduct] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [showBulkPrint, setShowBulkPrint] = useState(false);

    // Ubicación indicada por /scan (el selector es un store externo, no estado local).
    const ubicParam = searchParams.get('ubicacion');
    useEffect(() => {
        if (ubicParam) setUbicacion(ubicParam);
    }, [ubicParam, setUbicacion]);

    useEffect(() => {
        setHideBottomNav(!!(form || deleteProduct || showCategoryManager || viewProduct || showBulkPrint || selectMode));
        return () => setHideBottomNav(false);
    }, [form, deleteProduct, showCategoryManager, viewProduct, showBulkPrint, selectMode, setHideBottomNav]);

    const catIconMap = useMemo(() => Object.fromEntries(categorias.map(c => [c.nombre, c.icono || '📦'])), [categorias]);

    const productosUbicacion = useMemo(
        () => (isGeneral ? productos : productos.filter(p => p.ubicacion === ubicacion)),
        [productos, ubicacion, isGeneral]
    );

    const catCounts = useMemo(() => {
        const c = {};
        productosUbicacion.forEach(p => { c[p.categoria] = (c[p.categoria] || 0) + 1; });
        return c;
    }, [productosUbicacion]);

    const bajosCount = useMemo(() => productosUbicacion.filter(isLowStock).length, [productosUbicacion]);

    // Si la búsqueda no encuentra nada en la ubicación actual, se busca en todas.
    const { productosFiltrados, buscandoEnTodas } = useMemo(() => {
        const q = busqueda.toLowerCase().trim();
        const normQ = normalizeBarcode(q);
        let base = productosUbicacion;
        let enTodas = false;
        if (q && !isGeneral && !productosUbicacion.some(p => matches(p, q, normQ))) {
            base = productos;
            enTodas = true;
        }
        const list = base
            .filter(p => categoria === 'Todas' || p.categoria === categoria)
            .filter(p => !soloBajos || isLowStock(p))
            .filter(p => !q || matches(p, q, normQ))
            .sort(SORTS[sortBy] || SORTS.nombre);
        return { productosFiltrados: list, buscandoEnTodas: enTodas };
    }, [productosUbicacion, productos, isGeneral, categoria, soloBajos, busqueda, sortBy]);

    const handleSaveProduct = useCallback(async (data, id) => {
        const productData = { ...data, _usuario: data._usuario || userName };
        if (id) await actualizarProducto(id, productData);
        else await crearProducto(productData);
        toast.success(id ? 'Producto actualizado' : 'Producto creado');
    }, [actualizarProducto, crearProducto, userName, toast]);

    const handleDelete = useCallback(async (id) => {
        await eliminarProducto(id);
        toast.success('Producto eliminado');
    }, [eliminarProducto, toast]);

    const openForm = useCallback((producto) => {
        setViewProduct(null);
        setForm(producto || {});
    }, []);

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
            .map(p => ({ ...p, ubicacion_nombre: isGeneral ? getLocationInfo(p.ubicacion)?.nombre : undefined })),
        [productosFiltrados, selectedIds, isGeneral]
    );

    const activate = useCallback((p) => (selectMode ? toggleSelect(p) : setViewProduct(p)), [selectMode, toggleSelect]);
    const catNames = ['Todas', ...categorias.map(c => c.nombre)];

    return (
        <div className="flex flex-col flex-1">
            <Header title="Productos" />
            <PageBody width="max-w-7xl" className={selectMode ? 'pb-28' : undefined}>
                {isGeneral && (
                    <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3.5 text-sm text-violet-700">
                        <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                        <span>Estás viendo <strong>todas las ubicaciones</strong>. Para crear productos en un lugar concreto, elige la ubicación en el selector superior.</span>
                    </div>
                )}

                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {canManage && (
                        <>
                            <button type="button" onClick={() => openForm(isGeneral ? null : { ubicacion })} className="btn-primary flex-1 sm:flex-none px-5 py-2.5 text-sm">
                                <PlusCircle size={18} /> Nuevo producto
                            </button>
                            <button type="button" onClick={() => setShowCategoryManager(true)} className="btn-secondary flex-1 sm:flex-none px-4 py-2.5 text-sm">
                                <Settings2 size={17} /> Categorías
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={toggleSelectMode}
                        className={cn('flex-1 sm:flex-none px-4 py-2.5 text-sm', selectMode ? 'btn-primary' : 'btn-secondary')}
                    >
                        <ListChecks size={17} /> {selectMode ? 'Terminar selección' : 'Imprimir etiquetas'}
                    </button>
                </div>

                {/* Búsqueda y filtros */}
                <div className="space-y-3">
                    <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o código de barras" />
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" role="group" aria-label="Filtrar por categoría">
                        {bajosCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setSoloBajos(v => !v)}
                                aria-pressed={soloBajos}
                                className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                                    soloBajos ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-amber-200 bg-amber-50 text-amber-700')}
                            >
                                <AlertTriangle size={14} /> Bajo mínimo <span className="text-[11px] opacity-70">{bajosCount}</span>
                            </button>
                        )}
                        {catNames.map(cat => {
                            const count = cat === 'Todas' ? productosUbicacion.length : (catCounts[cat] || 0);
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoria(cat)}
                                    aria-pressed={categoria === cat}
                                    className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                                        categoria === cat ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-surface text-slate-500 hover:text-slate-700')}
                                >
                                    {cat !== 'Todas' && <span>{catIconMap[cat]}</span>}
                                    {cat} <span className="text-[11px] opacity-60">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Conteo + orden + vista */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-500">
                        {productosFiltrados.length} producto{productosFiltrados.length === 1 ? '' : 's'}
                        {buscandoEnTodas && <span className="ml-1 text-violet-600">· encontrados en otras ubicaciones</span>}
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Tipo de vista">
                            {[['grid', LayoutGrid, 'Tarjetas'], ['list', List, 'Lista']].map(([id, Icon, label]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setViewMode(id)}
                                    aria-pressed={viewMode === id}
                                    aria-label={`Vista en ${label.toLowerCase()}`}
                                    title={label}
                                    className={cn('rounded-md p-1.5 transition', viewMode === id ? 'bg-surface text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                                >
                                    <Icon size={16} />
                                </button>
                            ))}
                        </div>
                        <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-2.5 py-1.5">
                            <ArrowUpDown size={14} className="text-slate-400" />
                            <span className="sr-only">Ordenar por</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="cursor-pointer border-none bg-transparent pr-1 text-xs font-semibold text-slate-600 focus:ring-0">
                                <option value="nombre">Nombre</option>
                                <option value="stock">Stock</option>
                                <option value="categoria">Categoría</option>
                                {isGeneral && <option value="ubicacion">Ubicación</option>}
                            </select>
                        </label>
                    </div>
                </div>

                {/* Listado */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />)}
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <EmptyState icon={Package} title="Sin resultados" subtitle={productos.length ? 'Ajusta la búsqueda o los filtros.' : 'Todavía no hay productos registrados.'} />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
                    <div className="glass-panel divide-y divide-slate-100">
                        {productosFiltrados.map(p => (
                            <ProductListRow
                                key={p.id}
                                producto={p}
                                catIcon={catIconMap[p.categoria]}
                                selectMode={selectMode}
                                selected={selectedIds.has(p.id)}
                                onActivate={activate}
                            />
                        ))}
                    </div>
                )}
            </PageBody>

            {selectMode && (
                <SelectionBar
                    selectedCount={selectedIds.size}
                    visibleCount={productosFiltrados.length}
                    withBarcode={selectedProductos.filter(p => p.codigo_barras).length}
                    onToggleAll={() => setSelectedIds(selectedIds.size === productosFiltrados.length ? new Set() : new Set(productosFiltrados.map(p => p.id)))}
                    onCancel={toggleSelectMode}
                    onPrint={() => selectedProductos.length && setShowBulkPrint(true)}
                />
            )}

            {viewProduct && (
                <ProductDetailModal
                    producto={viewProduct}
                    canManage={canManage}
                    isGeneral={isGeneral}
                    onClose={() => setViewProduct(null)}
                    onEdit={openForm}
                    onDelete={(p) => { setViewProduct(null); setDeleteProduct(p); }}
                    onDuplicate={(p) => openForm({ ...p, id: undefined, nombre: `${p.nombre} (copia)` })}
                />
            )}
            {form && (
                <ProductFormModal
                    producto={form.id || Object.keys(form).length ? form : null}
                    categorias={categorias}
                    onClose={() => setForm(null)}
                    onSave={handleSaveProduct}
                    userName={userName}
                />
            )}
            {deleteProduct && (
                <DeleteConfirmModal producto={deleteProduct} onClose={() => setDeleteProduct(null)} onConfirm={handleDelete} />
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
            {showBulkPrint && <BulkBarcodeLabelsModal productos={selectedProductos} onClose={() => setShowBulkPrint(false)} />}
        </div>
    );
}
