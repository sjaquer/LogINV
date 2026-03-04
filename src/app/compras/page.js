'use client';
import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useProductos, useRequerimientos } from '@/hooks/useFirestore';
import { useRole } from '@/context/RoleContext';
import { useLanguage } from '@/context/LanguageContext';
import { StatusBadge, StockBar, LoadingSkeleton, EmptyState } from '@/components/ui/SharedComponents';
import { formatDate } from '@/lib/utils';
import { X, CheckCircle, Package } from 'lucide-react';

// ─── Log del requerimiento ────────────────────────────────────────────────
function LogModal({ req, onClose }) {
    const { t } = useLanguage();
    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-box animate-slide-up p-0 border border-slate-200 shadow-2xl bg-white max-w-md w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">{t('historialReq')}</h3>
                        <p className="text-xs sm:text-sm text-brand-600 font-medium mt-1 truncate">{t('solicitadoPor')} {req.solicitante}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Items */}
                <div className="p-4 sm:p-6 space-y-3 border-b border-slate-100 bg-slate-50 flex-1 overflow-y-auto">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3 sm:mb-4">{t('productosSolicitados')}</p>
                    {(req.items || []).map((item, i) => (
                        <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-200 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-brand-600">
                                <Package size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">{item.producto_nombre}</p>
                                <p className="text-sm text-slate-500 font-medium">{t('cant')}: <span className="text-brand-600 font-bold">{item.cantidad}</span></p>
                                {item.justificacion && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">&ldquo;{item.justificacion}&rdquo;</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Log */}
                <div className="p-4 sm:p-6 bg-white flex-shrink-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-4 sm:mb-5">{t('lineaTiempo')}</p>
                    <div className="relative space-y-6 ml-2">
                        <div className="absolute left-3.5 top-2 bottom-0 w-0.5 bg-slate-200" />
                        {(req.logs || []).map((log, i) => (
                            <div key={i} className="flex gap-4 items-start relative">
                                <div className="relative z-10 w-7 h-7 rounded-full bg-brand-600 shadow-sm flex items-center justify-center flex-shrink-0 border-2 border-white">
                                    <CheckCircle size={12} className="text-white" />
                                </div>
                                <div className="flex-1 pb-2">
                                    <p className="text-sm font-bold text-slate-800">{log.accion}</p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{log.usuario} · <span className="text-slate-400">{log.fecha ? new Date(log.fecha).toLocaleString('es-PE') : '—'}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Botones de acción según rol y estado ─────────────────────────────────
function AccionButtons({ req, role, userName, cambiarEstado }) {
    const { estado } = req;
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);

    async function handle(nuevoEstado) {
        setSaving(true);
        await cambiarEstado(req.id, nuevoEstado, userName);
        setSaving(false);
    }

    if (saving) return <span className="spinner border-slate-300 border-t-brand-600" />;

    if (role === 'ADMIN' && estado === 'PENDIENTE') {
        return (
            <div className="flex gap-2">
                <button onClick={() => handle('APROBADO_ADMIN')} className="btn btn-success btn-sm bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">✔ {t('aprobar')}</button>
                <button onClick={() => handle('RECHAZADO')} className="btn btn-danger btn-sm bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100">✘ {t('rechazar')}</button>
            </div>
        );
    }
    if (role === 'GERENCIA' && estado === 'APROBADO_ADMIN') {
        return (
            <div className="flex gap-2">
                <button onClick={() => handle('VALIDADO_GERENCIA')} className="btn btn-success btn-sm bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">✔ {t('validar')}</button>
                <button onClick={() => handle('RECHAZADO')} className="btn btn-danger btn-sm bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100">✘ {t('rechazar')}</button>
            </div>
        );
    }
    if (role === 'LOGISTICA' && estado === 'VALIDADO_GERENCIA') {
        return <button onClick={() => handle('COMPRADO')} className="btn btn-primary btn-sm bg-brand-600 text-white hover:bg-brand-700 shadow-sm">🛒 {t('marcarComprado')}</button>;
    }
    return <span className="text-xs text-slate-500 italic font-medium">{t('sinAccion', 'Sin acción')}</span>;
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function ComprasPage() {
    const { productos, loading: pLoading } = useProductos();
    const { requerimientos, loading: rLoading, cambiarEstado } = useRequerimientos();
    const { role, userName } = useRole();
    const { t } = useLanguage();
    const [tab, setTab] = useState('rop'); // 'rop' | 'requerimientos'
    const [selectedReq, setSelectedReq] = useState(null);

    const loading = pLoading || rLoading;

    // Productos bajo ROP
    const ropProductos = useMemo(
        () => productos.filter((p) => p.stock_actual <= p.stock_minimo_rop).sort((a, b) => (a.stock_actual / a.stock_minimo_rop) - (b.stock_actual / b.stock_minimo_rop)),
        [productos]
    );

    const TABS = [
        { id: 'rop', label: `${t('sugerenciasROP')} (${ropProductos.length})` },
        { id: 'requerimientos', label: `${t('requerimientos')} (${requerimientos.length})` },
    ];

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title={t('compras')} />
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 animate-fade-in max-w-7xl mx-auto w-full">

                {/* Tabs */}
                <div className="bg-white border border-slate-200 p-1.5 flex gap-1.5 max-w-full sm:max-w-lg shadow-sm rounded-xl overflow-x-auto no-scrollbar">
                    {TABS.map((tb) => (
                        <button
                            key={tb.id}
                            onClick={() => setTab(tb.id)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap px-3 ${tab === tb.id
                                ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            {tb.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab: ROP Sugerencias ── */}
                {tab === 'rop' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-white">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{t('motorROP')}</h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{t('stockActualMenorMInimo')}</p>
                        </div>
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : ropProductos.length === 0 ? (
                            <EmptyState title="stockOk" subtitle="noSugerenciasROP" />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {ropProductos.map((p) => {
                                    const deficit = p.stock_minimo_rop - p.stock_actual;
                                    const pct = Math.round((p.stock_actual / p.stock_minimo_rop) * 100);
                                    return (
                                        <div key={p.id} className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                    <p className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-brand-600 transition-colors truncate">{p.nombre}</p>
                                                    <span className="badge-gray px-2 py-0.5 bg-slate-100 border-slate-200 text-slate-600">{t(p.categoria.toLowerCase())}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="text-sm font-medium">
                                                        {t('stock')}: <span className="text-rose-600 font-bold text-base">{p.stock_actual}</span>
                                                        <span className="text-slate-300 mx-2">/</span>
                                                        <span className="text-slate-500">{t('min')} {p.stock_minimo_rop} {p.unidad}</span>
                                                    </div>
                                                    <div className="flex-1 max-w-[150px] hidden sm:block">
                                                        <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm">
                                                <div className="text-right min-w-0">
                                                    <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('comprarAprox')}</p>
                                                    <p className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">+{deficit} <span className="text-xs sm:text-sm font-medium text-slate-400">{p.unidad}</span></p>
                                                </div>
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2 shadow-sm flex-shrink-0 ${pct < 50 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-600'
                                                    }`}>
                                                    {pct}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: Requerimientos ── */}
                {tab === 'requerimientos' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-brand-50">
                            <h2 className="text-base sm:text-lg font-bold text-brand-700 tracking-tight">{t('workflowAprobaciones')}</h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">{t('rolActual')}: <span className="text-brand-700 font-bold bg-white border border-brand-200 px-2 py-0.5 rounded ml-1 text-xs">{role}</span></p>
                        </div>
                        {loading ? (
                            <div className="overflow-x-auto">
                                <table className="data-table w-full"><LoadingSkeleton rows={5} cols={6} /></table>
                            </div>
                        ) : requerimientos.length === 0 ? (
                            <div className="p-8"><EmptyState title="sinResultados" subtitle="noRequerimientos" /></div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="data-table w-full">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('fecha')}</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('solicitadoPor')}</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('items')}</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('estado')}</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('log')}</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('accion')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requerimientos.map((req) => (
                                                <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{formatDate(req.fecha_creacion)}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{req.solicitante}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="badge-gray bg-white border-slate-200 font-medium">{(req.items || []).length} {t('productos').toLowerCase()}</span>
                                                    </td>
                                                    <td className="px-6 py-4"><StatusBadge estado={req.estado} /></td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setSelectedReq(req)}
                                                            className="btn btn-ghost btn-sm text-brand-600 hover:bg-brand-50 border-transparent font-semibold"
                                                        >
                                                            {t('verLog')} ({(req.logs || []).length})
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <AccionButtons req={req} role={role} userName={userName} cambiarEstado={cambiarEstado} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden divide-y divide-slate-100">
                                    {requerimientos.map((req) => (
                                        <div key={req.id} className="p-5 space-y-4 bg-white">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-bold text-slate-900 truncate">{req.solicitante}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">{formatDate(req.fecha_creacion)} · {(req.items || []).length} {t('productos')}</p>
                                                </div>
                                                <div className="flex-shrink-0"><StatusBadge estado={req.estado} /></div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <AccionButtons req={req} role={role} userName={userName} cambiarEstado={cambiarEstado} />
                                                <button onClick={() => setSelectedReq(req)} className="btn btn-ghost btn-sm font-semibold ml-auto text-slate-600">
                                                    {t('verLog')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Log */}
            {selectedReq && <LogModal req={selectedReq} onClose={() => setSelectedReq(null)} />}
        </div>
    );
}
