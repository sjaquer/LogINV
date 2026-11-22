'use client';
import { SearchInput } from '@/components/ui/Page';
import { cn } from '@/lib/utils';

/** Buscador + chips de categoría usados en las pestañas de inventario. */
export default function ProductFilters({ busqueda, onBusqueda, categorias, categoria, onCategoria }) {
    return (
        <div className="space-y-3">
            <SearchInput value={busqueda} onChange={onBusqueda} placeholder="Buscar por nombre o código de barras" />
            {categorias && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="group" aria-label="Filtrar por categoría">
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => onCategoria(cat)}
                            aria-pressed={categoria === cat}
                            className={cn(
                                'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                                categoria === cat ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-surface text-slate-500 hover:text-slate-700',
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
