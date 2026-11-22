'use client';
import { useMemo, useState } from 'react';
import { Calendar, History } from 'lucide-react';
import { EmptyState } from '@/components/ui/SharedComponents';
import { getLocationInfo } from '@/context/LocationContext';
import { toValidDate } from '@/lib/utils';
import ConteoHistoryCard from './ConteoHistoryCard';

export default function HistorialTab({ conteos, isGeneral, ubicacion, loading, onSelect }) {
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const lista = useMemo(() => {
        const d = desde ? new Date(`${desde}T00:00:00`) : null;
        const h = hasta ? new Date(`${hasta}T23:59:59.999`) : null;
        return conteos
            .filter(c => c.estado === 'COMPLETADO' && (isGeneral || c.ubicacion === ubicacion))
            .map(c => ({ c, f: toValidDate(c.fecha) }))
            .filter(({ f }) => (!d || (f && f >= d)) && (!h || (f && f <= h)))
            .sort((a, b) => (b.f?.getTime() || 0) - (a.f?.getTime() || 0))
            .map(({ c }) => c);
    }, [conteos, isGeneral, ubicacion, desde, hasta]);

    return (
        <div className="space-y-3">
            <div className="glass-panel p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">Filtrar por fecha</span>
                    {(desde || hasta) && (
                        <button type="button" onClick={() => { setDesde(''); setHasta(''); }} className="ml-auto text-xs font-semibold text-brand-600 hover:underline">Limpiar</button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-medium text-slate-500">Desde
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="inp mt-1 py-2.5 text-sm" />
                    </label>
                    <label className="text-xs font-medium text-slate-500">Hasta
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="inp mt-1 py-2.5 text-sm" />
                    </label>
                </div>
            </div>

            {loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)
            ) : lista.length === 0 ? (
                <EmptyState icon={History} title="No hay conteos finalizados" subtitle="Cuando finalices un conteo aparecerá aquí." />
            ) : (
                lista.map(c => {
                    const loc = isGeneral ? getLocationInfo(c.ubicacion) : null;
                    return (
                        <div key={c.id}>
                            {loc && <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{loc.icono} {loc.nombre}</span>}
                            <ConteoHistoryCard conteo={c} onSelect={onSelect} />
                        </div>
                    );
                })
            )}
        </div>
    );
}
