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
            <div className="modal-box animate-slide-up p-0 border border-glass shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-glass bg-dark-panel">
                    <div>
                        <h3 className="font-bold text-white text-lg">{t('historialReq')}</h3>
                        <p className="text-sm text-brand-400 font-medium mt-1">{t('solicitadoPor')} {req.solicitante}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Items */}
                <div className="p-6 space-y-3 border-b border-glass bg-black/20">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-4">{t('productosSolicitados')}</p>
                    {(req.items || []).map((item, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-dark-panel border border-glass rounded-xl shadow-sm hover:border-brand-500/30 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow">
                                <Package size={16} className="text-brand-400" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-white tracking-wide">{item.producto_nombre}</p>
                                <p className="text-sm text-slate-400 font-medium">{t('cant')}: <span className="text-brand-400 font-bold">{item.cantidad}</span></p>
                                {item.justificacion && <p className="text-sm text-slate-300 mt-2 bg-white/5 p-2.5 rounded-lg border border-white/5 italic">&ldquo;{item.justificacion}&rdquo;</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Log */}
                <div className="p-6 bg-dark">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-5">{t('lineaTiempo')}</p>
                    <div className="relative space-y-6 ml-2">
                        <div className="absolute left-3.5 top-2 bottom-0 w-0.5 bg-glass" />
                        {(req.logs || []).map((log, i) => (
                            <div key={i} className="flex gap-4 items-start relative">
                                <div className="relative z-10 w-7 h-7 rounded-full bg-brand-gradient shadow-glow flex items-center justify-center flex-shrink-0 border-2 border-dark">
                                    <CheckCircle size={12} className="text-white" />
                                </div>
                                <div className="flex-1 pb-2">
                                    <p className="text-sm font-bold text-slate-200">{log.accion}</p>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{log.usuario} · <span className="text-slate-500">{log.fecha ? new Date(log.fecha).toLocaleString('es-PE') : '—'}</span></p>
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

    if (saving) return <span className="spinner" />;

    if (role === 'ADMIN' && estado === 'PENDIENTE') {
        return (
            <div className="flex gap-2">
                <button onClick={() => handle('APROBADO_ADMIN')} className="btn btn-success btn-sm shadow-glow">✔ {t('aprobar')}</button>
                <button onClick={() => handle('RECHAZADO')} className="btn btn-danger btn-sm shadow-red-500/20 shadow-sm">✘ {t('rechazar')}</button>
            </div>
        );
    }
    if (role === 'GERENCIA' && estado === 'APROBADO_ADMIN') {
        return (
            <div className="flex gap-2">
                <button onClick={() => handle('VALIDADO_GERENCIA')} className="btn btn-success btn-sm shadow-glow">✔ {t('validar')}</button>
                <button onClick={() => handle('RECHAZADO')} className="btn btn-danger btn-sm shadow-red-500/20 shadow-sm">✘ {t('rechazar')}</button>
            </div>
        );
    }
    if (role === 'LOGISTICA' && estado === 'VALIDADO_GERENCIA') {
        return <button onClick={() => handle('COMPRADO')} className="btn btn-primary btn-sm shadow-glow">🛒 {t('marcarComprado')}</button>;
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
        <div className="flex flex-col flex-1">
            <Header title={t('compras')} />
            <div className="flex-1 p-4 sm:p-6 space-y-6 animate-fade-in">

                {/* Tabs */}
                <div className="glass-panel p-1.5 flex gap-1.5 max-w-lg shadow-md border-glass">
                    {TABS.map((tb) => (
                        <button
                            key={tb.id}
                            onClick={() => setTab(tb.id)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === tb.id
                                ? 'bg-brand-gradient text-white shadow-glow'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tb.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab: ROP Sugerencias ── */}
                {tab === 'rop' && (
                    <div className="glass-panel overflow-hidden border-glass shadow-lg">
                        <div className="px-6 py-5 border-b border-glass bg-dark-panel">
                            <h2 className="text-lg font-bold text-white tracking-wide">{t('motorROP')}</h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">{t('stockActualMenorMInimo')}</p>
                        </div>
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : ropProductos.length === 0 ? (
                            <EmptyState title="stockOk" subtitle="noSugerenciasROP" />
                        ) : (
                            <div className="divide-y divide-glass/50">
                                {ropProductos.map((p) => {
                                    const deficit = p.stock_minimo_rop - p.stock_actual;
                                    const pct = Math.round((p.stock_actual / p.stock_minimo_rop) * 100);
                                    return (
                                        <div key={p.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/5 transition-colors group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-lg font-bold text-white tracking-wide group-hover:text-brand-300 transition-colors">{p.nombre}</p>
                                                    <span className="badge-gray px-2 py-0.5">{t(p.categoria.toLowerCase())}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="text-sm font-medium">
                                                        {t('stock')}: <span className="text-red-400 font-bold text-base">{p.stock_actual}</span>
                                                        <span className="text-slate-600 mx-2">/</span>
                                                        <span className="text-slate-400">{t('min')} {p.stock_minimo_rop} {p.unidad}</span>
                                                    </div>
                                                    <div className="flex-1 max-w-[150px] hidden sm:block">
                                                        <StockBar actual={p.stock_actual} minimo={p.stock_minimo_rop} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5 flex-shrink-0 bg-dark-panel p-3 rounded-2xl border border-glass shadow-inner">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('comprarAprox')}</p>
                                                    <p className="text-xl font-bold text-yellow-400 shadow-glow mt-0.5">+{deficit} <span className="text-sm font-medium text-slate-500">{p.unidad}</span></p>
                                                </div>
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base border-2 shadow-inner ${pct < 50 ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-red-500/20' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-yellow-500/20'
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
                    <div className="glass-panel overflow-hidden border-glass shadow-lg">
                        <div className="px-6 py-5 border-b border-glass bg-brand-500/5">
                            <h2 className="text-lg font-bold text-brand-400 tracking-wide">{t('workflowAprobaciones')}</h2>
                            <p className="text-sm text-slate-400 mt-1 font-medium">{t('rolActual')}: <span className="text-brand-300 font-bold bg-brand-500/20 px-2 py-0.5 rounded ml-1 shadow-glow">{role}</span></p>
                        </div>
                        {loading ? (
                            <div className="overflow-x-auto">
                                <table className="data-table"><LoadingSkeleton rows={5} cols={6} /></table>
                            </div>
                        ) : requerimientos.length === 0 ? (
                            <EmptyState title="sinResultados" subtitle="noRequerimientos" />
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('fecha')}</th>
                                                <th>{t('solicitadoPor')}</th>
                                                <th>{t('items')}</th>
                                                <th>{t('estado')}</th>
                                                <th>{t('log')}</th>
                                                <th>{t('accion')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requerimientos.map((req) => (
                                                <tr key={req.id} className="border-b border-glass hover:bg-white/5 transition-colors group">
                                                    <td className="text-sm font-medium text-slate-400">{formatDate(req.fecha_creacion)}</td>
                                                    <td className="font-bold text-slate-200 group-hover:text-white transition-colors">{req.solicitante}</td>
                                                    <td>
                                                        <span className="badge-gray font-medium">{(req.items || []).length} {t('productos').toLowerCase()}</span>
                                                    </td>
                                                    <td><StatusBadge estado={req.estado} /></td>
                                                    <td>
                                                        <button
                                                            onClick={() => setSelectedReq(req)}
                                                            className="btn btn-ghost btn-sm text-brand-400 hover:bg-brand-500/20 font-semibold"
                                                        >
                                                            {t('verLog')} ({(req.logs || []).length})
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <AccionButtons req={req} role={role} userName={userName} cambiarEstado={cambiarEstado} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden divide-y divide-glass/50">
                                    {requerimientos.map((req) => (
                                        <div key={req.id} className="p-5 space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-bold text-white truncate">{req.solicitante}</p>
                                                    <p className="text-xs text-slate-400 font-medium mt-1">{formatDate(req.fecha_creacion)} · {(req.items || []).length} {t('productos')}</p>
                                                </div>
                                                <div className="flex-shrink-0"><StatusBadge estado={req.estado} /></div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap bg-dark-panel p-3 rounded-xl border border-glass">
                                                <AccionButtons req={req} role={role} userName={userName} cambiarEstado={cambiarEstado} />
                                                <button onClick={() => setSelectedReq(req)} className="btn btn-ghost btn-sm font-semibold ml-auto">
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
