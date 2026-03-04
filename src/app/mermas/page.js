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
    MERMA: { cls: 'badge-red bg-red-50 border-red-200 text-red-700', icon: Trash2, tKey: 'merma' },
    INGRESO: { cls: 'badge-green bg-emerald-50 border-emerald-200 text-emerald-700', icon: ArrowDownRight, tKey: 'ingreso' },
    SALIDA: { cls: 'badge-gray bg-slate-50 border-slate-200 text-slate-600', icon: ArrowUpRight, tKey: 'salida' },
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
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title={t('movimientos')} />
            <div className="flex-1 p-4 sm:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto w-full">

                {/* Summary row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: t('mermas'), count: totalMermas.length, cls: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' },
                        { label: t('ingresos'), count: totalIngresos.length, cls: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
                        { label: t('salidas'), count: totalSalidas.length, cls: 'text-slate-600', border: 'border-slate-200', bg: 'bg-white' },
                    ].map((s) => (
                        <div key={s.label} className={`p-5 border rounded-xl shadow-sm ${s.border} ${s.bg}`}>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                            {loading ? <div className="h-8 bg-slate-200 rounded animate-pulse w-16 mt-2" /> : (
                                <p className={`text-3xl font-bold mt-1 ${s.cls}`}>{s.count}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('buscarProducto')} // Resusing translation "Buscar producto"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="inp pl-11 py-3 text-sm h-12 shadow-sm bg-white border-slate-200 text-slate-900 focus:ring-brand-500/10 focus:border-brand-500"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        {TIPOS.map((tipo) => {
                            const label = tipo === 'Todas' ? t('todas') : t(tipo.toLowerCase());
                            return (
                                <button
                                    key={tipo}
                                    onClick={() => setFiltroTipo(tipo)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all shadow-sm ${filtroTipo === tipo
                                        ? 'bg-brand-50 text-brand-700 border-brand-200 shadow-sm ring-1 ring-brand-500/10'
                                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{t('historialMovimientos')}</h2>
                        <span className="badge-gray bg-slate-100 border-slate-200 text-slate-600 font-semibold px-3 py-1">{movimientosFiltrados.length} {t('registros')}</span>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="data-table w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('tipo')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('producto')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('cant')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('solicitadoPor')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('fecha')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('motivoMerma')}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSkeleton rows={8} cols={6} />
                            ) : (
                                <tbody>
                                    {movimientosFiltrados.length === 0 ? (
                                        <tr><td colSpan={6}><div className="p-8"><EmptyState icon={Trash2} title="sinResultados" subtitle="noMovimientos" /></div></td></tr>
                                    ) : (
                                        movimientosFiltrados.map((m) => {
                                            const badge = TIPO_BADGE[m.tipo] || { cls: 'badge-gray', label: m.tipo, icon: null };
                                            const IconBadge = badge.icon;
                                            const isMerma = m.tipo === 'MERMA';
                                            return (
                                                <tr key={m.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors group ${isMerma ? 'bg-red-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <span className={`${badge.cls} flex items-center gap-1.5 w-max font-bold px-2.5 py-1 rounded-md text-xs border uppercase tracking-wide`}>
                                                            {IconBadge && <IconBadge size={14} />} {t(m.tipo.toLowerCase())}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-brand-600 transition-colors text-sm">{m.nombre_producto || m.producto_id}</td>
                                                    <td className={`px-6 py-4 font-bold text-base ${isMerma ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {isMerma ? '-' : '+'}{m.cantidad}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 font-medium text-sm">{m.usuario}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{formatDateTime(m.fecha)}</td>
                                                    <td className="px-6 py-4 text-slate-600 text-sm max-w-[200px] leading-tight">
                                                        {m.motivo_merma ? (
                                                            <span className="text-red-700 bg-red-100 px-2.5 py-1 rounded-md border border-red-200 block text-xs font-medium">{m.motivo_merma}</span>
                                                        ) : (
                                                            <span className="text-slate-400 italic font-normal">—</span>
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
                    <div className="md:hidden divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-5 h-24 animate-pulse bg-slate-50 border border-slate-100 rounded-xl mb-4" />
                            ))
                        ) : movimientosFiltrados.length === 0 ? (
                            <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm"><EmptyState icon={Trash2} title="sinResultados" /></div>
                        ) : (
                            movimientosFiltrados.map((m) => {
                                const badge = TIPO_BADGE[m.tipo] || { cls: 'badge-gray', label: m.tipo, icon: null };
                                const IconBadge = badge.icon;
                                const isMerma = m.tipo === 'MERMA';
                                return (
                                    <div key={m.id} className={`p-5 group bg-white border border-slate-200 rounded-xl shadow-sm mb-4 ${isMerma ? 'bg-red-50/50' : 'bg-white'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className={`${badge.cls} flex items-center gap-1 font-bold px-2 py-0.5 rounded text-xs border`}>
                                                        {IconBadge && <IconBadge size={14} />} {t(m.tipo.toLowerCase())}
                                                    </span>
                                                    <span className={`font-bold text-lg ${isMerma ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {isMerma ? '-' : '+'}{m.cantidad}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-slate-900 text-lg mt-2 truncate">{m.nombre_producto || m.producto_id}</p>
                                                {m.motivo_merma && (
                                                    <p className="text-sm text-red-700 mt-2 bg-red-50 p-2 rounded border border-red-200 font-medium">{m.motivo_merma}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('solicitadoPor')}</p>
                                                <p className="font-medium text-slate-700 mt-0.5">{m.usuario}</p>
                                                <p className="mt-2 text-xs font-medium text-slate-400">{formatDate(m.fecha)}</p>
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
