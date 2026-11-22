'use client';
import { Plus, Save, Check, ClipboardList, ScanBarcode, ChevronRight, MapPin, Package } from 'lucide-react';
import { EmptyState } from '@/components/ui/SharedComponents';
import ProductThumb from '@/components/ui/ProductThumb';
import { getLocationInfo } from '@/context/LocationContext';
import ProductFilters from './ProductFilters';
import ScanFeedback from './ScanFeedback';
import { cn } from '@/lib/utils';

function ProductCountRow({ producto: p, item, onTap, showLocation }) {
    const counted = !!item;
    const diff = item?.diferencia || 0;
    const loc = showLocation ? getLocationInfo(p.ubicacion) : null;
    return (
        <button
            type="button"
            onClick={() => onTap(p)}
            className={cn(
                'flex w-full items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 text-left shadow-sm transition active:scale-[0.99]',
                counted ? (diff !== 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50') : 'border-slate-200 bg-surface hover:border-slate-300 hover:shadow-md',
            )}
        >
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <ProductThumb url={p.imagen_url} size="card" className="h-full w-full object-cover" />
                {counted && (
                    <span className={cn('absolute inset-0 flex items-center justify-center text-lg font-black text-white', diff !== 0 ? 'bg-amber-500/85' : 'bg-emerald-500/85')}>
                        {item.conteo_fisico}
                    </span>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm sm:text-base font-bold text-slate-900">{p.nombre}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                    <span className="font-semibold uppercase text-brand-600">{p.categoria}</span>
                    {loc && <> · {loc.icono} {loc.nombre}</>}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-500">Sistema: <strong className="text-slate-700">{p.stock_actual}</strong> {p.unidad}</p>
            </div>
            <div className="flex-shrink-0">
                {counted ? (
                    diff !== 0 ? (
                        <span className={cn('rounded-full px-2.5 py-1 text-sm font-bold tabular-nums', diff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')}>
                            {diff > 0 ? '+' : ''}{diff}
                        </span>
                    ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100"><Check size={18} className="text-emerald-600" /></span>
                    )
                ) : (
                    <ChevronRight size={20} className="text-slate-300" />
                )}
            </div>
        </button>
    );
}

export default function ConteoTab({
    isGeneral, ubicacionInfo, loading, session, productosUbicacion, productosFiltrados,
    filters, feedback, saving, onNuevo, onScan, onSave, onFinalizar, onTap,
}) {
    const { conteoActivo, items, notas, setNotas, summary } = session;

    if (isGeneral && !conteoActivo) {
        return (
            <div className="flex flex-col items-center py-14 sm:py-20 text-center">
                <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-100 bg-violet-50">
                    <MapPin size={38} className="text-violet-500" />
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Elige una ubicación</h2>
                <p className="mt-2 max-w-sm text-sm sm:text-base text-slate-500">
                    Los conteos se hacen por ubicación. Usa el selector de ubicación (arriba a la derecha) y vuelve aquí.
                </p>
            </div>
        );
    }

    if (!conteoActivo) {
        return (
            <div className="flex flex-col items-center py-14 sm:py-20 text-center">
                <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand-100 bg-brand-50">
                    <ClipboardList size={38} className="text-brand-600" />
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Conteo físico</h2>
                <p className="mt-2 max-w-sm text-sm sm:text-base text-slate-500">
                    Cuenta lo que hay realmente en {ubicacionInfo.icono} <strong>{ubicacionInfo.nombre}</strong> y compáralo con el sistema.
                </p>
                <button type="button" onClick={onNuevo} className="btn-primary mt-7 rounded-2xl px-7 py-3.5 text-base font-bold shadow-lg">
                    <Plus size={22} /> Nuevo conteo
                </button>
            </div>
        );
    }

    const pct = productosUbicacion.length ? Math.round((items.length / productosUbicacion.length) * 100) : 0;
    const counted = new Map(items.map(i => [i.producto_id, i]));

    return (
        <div className="space-y-4">
            <ScanFeedback feedback={feedback} />

            <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={onScan} className="btn-primary flex-1 sm:flex-none px-5 py-3 text-sm sm:text-base font-bold">
                    <ScanBarcode size={20} /> Escanear código
                </button>
                <button type="button" onClick={onSave} disabled={saving || items.length === 0} className="btn-secondary px-4 py-3 text-sm sm:text-base sm:ml-auto">
                    <Save size={18} /> Guardar avance
                </button>
            </div>

            <div className="glass-panel p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-700">Progreso</span>
                    <span className="text-brand-600 tabular-nums">{items.length} / {productosUbicacion.length} · {pct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                {items.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-slate-50 p-2.5"><p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.total}</p><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Contados</p></div>
                        <div className="rounded-lg bg-emerald-50 p-2.5"><p className="text-2xl font-bold text-emerald-700 tabular-nums">{summary.sinDiff}</p><p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Coinciden</p></div>
                        <div className="rounded-lg bg-amber-50 p-2.5"><p className="text-2xl font-bold text-amber-700 tabular-nums">{summary.conDiff}</p><p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Diferencias</p></div>
                    </div>
                )}
            </div>

            <ProductFilters {...filters} />

            <div className="space-y-2">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)
                ) : productosFiltrados.length === 0 ? (
                    <EmptyState icon={Package} title="Sin resultados" subtitle="Ajusta la búsqueda o la categoría." />
                ) : (
                    productosFiltrados.map(p => (
                        <ProductCountRow key={p.id} producto={p} item={counted.get(p.id)} onTap={onTap} showLocation={isGeneral} />
                    ))
                )}
            </div>

            <div className="glass-panel p-4">
                <label htmlFor="conteo-notas" className="field-label">Notas del conteo</label>
                <textarea id="conteo-notas" rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones (opcional)" className="inp resize-none" />
            </div>

            {items.length > 0 && (
                <button type="button" onClick={onFinalizar} disabled={saving} className="btn-primary w-full rounded-2xl py-4 text-base sm:text-lg font-bold shadow-lg">
                    {saving ? <><span className="spinner h-5 w-5 border-white/40 border-t-white" /> Guardando…</> : <><Check size={22} /> Finalizar conteo</>}
                </button>
            )}
        </div>
    );
}
