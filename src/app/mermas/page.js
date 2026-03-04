'use client';
import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useMovimientos } from '@/hooks/useFirestore';
import { useLanguage } from '@/context/LanguageContext';
import { EmptyState, LoadingSkeleton } from '@/components/ui/SharedComponents';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Trash2, Search, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TIPOS = ['Todas', 'MERMA', 'INGRESO', 'SALIDA'];

const TIPO_BADGE = {
    MERMA: { cls: 'badge-red shadow-sm shadow-red-500/20', icon: Trash2, label: 'Merma' },
    INGRESO: { cls: 'badge-green shadow-sm shadow-emerald-500/20', icon: ArrowDownRight, label: 'Ingreso' },
    SALIDA: { cls: 'badge-gray', icon: ArrowUpRight, label: 'Salida' },
};

export default function MermasPage() {
    const { movimientos, loading } = useMovimientos();
    const { t } = useLanguage();
    const [filtroTipo, setFiltroTipo] = useState('MERMA');
    const [busqueda, setBusqueda] = useState('');

    const movimientosFiltrados = useMemo(() => {
        return movimientos
            .filter((m) => filtroTipo === 'Todas' || m.tipo === filtroTipo)
            .filter((m) => {
                if (!busqueda) return true;
                const b = busqueda.toLowerCase();
                return (
                    (m.nombre_producto || '').toLowerCase().includes(b) ||
                    (m.usuario || '').toLowerCase().includes(b) ||
                    (m.motivo_merma || '').toLowerCase().includes(b)
                );
            });
    }, [movimientos, filtroTipo, busqueda]);

    // Stats for mermas only
    const totalMermas = useMemo(() => movimientos.filter((m) => m.tipo === 'MERMA'), [movimientos]);
    const totalIngresos = useMemo(() => movimientos.filter((m) => m.tipo === 'INGRESO'), [movimientos]);
    const totalSalidas = useMemo(() => movimientos.filter((m) => m.tipo === 'SALIDA'), [movimientos]);

    return (
        <div className="flex flex-col flex-1">
            <Header title={t('movimientos')} />
            <div className="flex-1 p-4 sm:p-6 space-y-6 animate-fade-in">

                {/* Summary row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: t('mermas'), count: totalMermas.length, cls: 'text-red-400 shadow-glow', border: 'border-red-500/30', bg: 'bg-red-500/10' },
                        { label: t('ingresos'), count: totalIngresos.length, cls: 'text-emerald-400 shadow-glow', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
                        { label: t('salidas'), count: totalSalidas.length, cls: 'text-slate-300', border: 'border-glass', bg: 'bg-dark-panel' },
                    ].map((s) => (
                        <div key={s.label} className={`glass-panel p-5 border ${s.border} ${s.bg}`}>
                            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                            {loading ? <div className="h-8 bg-white/10 rounded animate-pulse w-16 mt-2" /> : (
                                <p className={`text-3xl font-bold mt-1 ${s.cls}`}>{s.count}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t('buscarProducto')} // Resusing translation "Buscar producto"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="inp pl-11 py-3 text-sm h-12 shadow-inner"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        {TIPOS.map((tipo) => {
                            const label = tipo === 'Todas' ? t('todas') : tipo;
                            return (
                                <button
                                    key={tipo}
                                    onClick={() => setFiltroTipo(tipo)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all shadow-sm ${filtroTipo === tipo
                                        ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 shadow-glow'
                                        : 'bg-dark-panel border-glass text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table */}
                <div className="glass-panel overflow-hidden border-glass shadow-lg">
                    <div className="px-6 py-5 border-b border-glass flex items-center justify-between bg-dark-panel">
                        <h2 className="text-lg font-bold text-white tracking-wide">{t('historialMovimientos')}</h2>
                        <span className="badge-gray px-3 py-1 font-semibold">{movimientosFiltrados.length} {t('registros')}</span>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('tipo')}</th>
                                    <th>{t('producto')}</th>
                                    <th>{t('cant')}</th>
                                    <th>{t('solicitadoPor')}</th>
                                    <th>{t('fecha')}</th>
                                    <th>{t('motivoMerma')}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSkeleton rows={8} cols={6} />
                            ) : (
                                <tbody>
                                    {movimientosFiltrados.length === 0 ? (
                                        <tr><td colSpan={6}><EmptyState icon={Trash2} title="sinResultados" subtitle="noMovimientos" /></td></tr>
                                    ) : (
                                        movimientosFiltrados.map((m) => {
                                            const badge = TIPO_BADGE[m.tipo] || { cls: 'badge-gray', label: m.tipo, icon: null };
                                            const IconBadge = badge.icon;
                                            const isMerma = m.tipo === 'MERMA';
                                            return (
                                                <tr key={m.id} className={`border-b border-glass hover:bg-white/5 transition-colors group ${isMerma ? 'bg-red-500/5' : ''}`}>
                                                    <td>
                                                        <span className={`${badge.cls} flex items-center gap-1.5 w-max font-bold`}>
                                                            {IconBadge && <IconBadge size={14} />} {t(m.tipo.toLowerCase())}
                                                        </span>
                                                    </td>
                                                    <td className="font-bold text-slate-200 group-hover:text-white transition-colors text-base">{m.nombre_producto || m.producto_id}</td>
                                                    <td className={`font-bold text-lg ${isMerma ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {isMerma ? '-' : '+'}{m.cantidad}
                                                    </td>
                                                    <td className="text-slate-300 font-medium">{m.usuario}</td>
                                                    <td className="text-sm font-medium text-slate-400">{formatDateTime(m.fecha)}</td>
                                                    <td className="text-slate-300 text-sm max-w-[200px] leading-tight">
                                                        {m.motivo_merma ? (
                                                            <span className="text-red-300 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 block">{m.motivo_merma}</span>
                                                        ) : (
                                                            <span className="text-slate-600 italic font-medium">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-glass/50">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-5 h-24 animate-pulse bg-white/5" />
                            ))
                        ) : movimientosFiltrados.length === 0 ? (
                            <EmptyState icon={Trash2} title="sinResultados" />
                        ) : (
                            movimientosFiltrados.map((m) => {
                                const badge = TIPO_BADGE[m.tipo] || { cls: 'badge-gray', label: m.tipo, icon: null };
                                const IconBadge = badge.icon;
                                const isMerma = m.tipo === 'MERMA';
                                return (
                                    <div key={m.id} className={`p-5 group ${isMerma ? 'bg-red-500/5' : 'bg-dark'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className={`${badge.cls} flex items-center gap-1 font-bold`}>
                                                        {IconBadge && <IconBadge size={14} />} {t(m.tipo.toLowerCase())}
                                                    </span>
                                                    <span className={`font-bold text-lg ${isMerma ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {isMerma ? '-' : '+'}{m.cantidad}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-white text-lg mt-2 truncate">{m.nombre_producto || m.producto_id}</p>
                                                {m.motivo_merma && (
                                                    <p className="text-sm text-red-300 mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">{m.motivo_merma}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0 bg-dark-panel p-3 rounded-xl border border-glass">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('solicitadoPor')}</p>
                                                <p className="font-medium text-slate-300 mt-0.5">{m.usuario}</p>
                                                <p className="mt-2 text-xs font-medium text-slate-500">{formatDate(m.fecha)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
