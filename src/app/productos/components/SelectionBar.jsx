'use client';
import { Printer } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

/** Barra inferior del modo selección (impresión masiva de etiquetas). */
export default function SelectionBar({ selectedCount, visibleCount, withBarcode, onToggleAll, onCancel, onPrint }) {
    const { collapsed } = useSidebar();
    const all = selectedCount === visibleCount && visibleCount > 0;
    return (
        <div className={cn('fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl animate-slide-up sm:p-4', collapsed ? 'lg:left-[72px]' : 'lg:left-64')}>
            <div className="flex items-center gap-3">
                <div>
                    <p className="text-sm font-bold text-slate-900">{selectedCount} de {visibleCount} seleccionado{selectedCount === 1 ? '' : 's'}</p>
                    <p className="text-[11px] text-slate-500">{withBarcode} con código de barras</p>
                </div>
                <button type="button" onClick={onToggleAll} className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100">
                    {all ? 'Quitar todos' : 'Seleccionar visibles'}
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
                <button type="button" onClick={onPrint} disabled={selectedCount === 0} className="btn-primary px-4 py-2.5 text-sm">
                    <Printer size={16} /> Imprimir etiquetas ({selectedCount})
                </button>
            </div>
        </div>
    );
}
