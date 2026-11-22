'use client';
import { useMemo, useState } from 'react';
import {
    ShieldCheck, Package, Tag, MapPin, Handshake, Wrench, ClipboardCheck, User, LogIn,
    Download, Activity, Trash2, Users, CalendarDays, Filter,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import RouteGuard from '@/components/ui/RouteGuard';
import { PageBody, SearchInput, SegmentedTabs } from '@/components/ui/Page';
import { KPICard, EmptyState } from '@/components/ui/SharedComponents';
import { useAuditoria } from '@/hooks/useAuditoria';
import { AUDIT_ACCIONES, AUDIT_ENTIDADES } from '@/lib/auditLog';
import { ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const ENTIDAD_ICON = {
    producto: Package, categoria: Tag, ubicacion: MapPin, prestamo: Handshake,
    mantenimiento: Wrench, conteo: ClipboardCheck, usuario: User, sesion: LogIn,
};

const TONE = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const RANGOS = [
    { id: 'hoy', label: 'Hoy', dias: 0 },
    { id: '7d', label: '7 días', dias: 7 },
    { id: '30d', label: '30 días', dias: 30 },
    { id: 'todo', label: 'Todo', dias: null },
];

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function dayLabel(date) {
    const hoy = startOfDay();
    const d = startOfDay(date);
    const diff = Math.round((hoy - d) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined });
}

function exportCsv(rows) {
    const header = ['Fecha', 'Hora', 'Usuario', 'Rol', 'Acción', 'Entidad', 'Descripción', 'ID'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(r => [
        r._fecha?.toLocaleDateString('es') || '',
        r._fecha?.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) || '',
        r.usuario_nombre, r.usuario_rol,
        AUDIT_ACCIONES[r.accion]?.label || r.accion,
        AUDIT_ENTIDADES[r.entidad] || r.entidad,
        r.descripcion, r.entidad_id,
    ].map(esc).join(','));
    // BOM para que Excel respete los acentos.
    const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `auditoria_loginv_${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
}

function AuditRow({ r }) {
    const accion = AUDIT_ACCIONES[r.accion] || { label: r.accion, tone: 'slate' };
    const Icon = ENTIDAD_ICON[r.entidad] || Activity;
    return (
        <li className="flex gap-3 px-4 sm:px-5 py-3">
            <span className={cn('mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ring-1', TONE[accion.tone])}>
                <Icon size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-900">{r.usuario_nombre || 'Sistema'}</span>{' '}
                    <span className="text-slate-500">{accion.label.toLowerCase()}</span>{' '}
                    {r.entidad !== 'sesion' && <span className="text-slate-500">{(AUDIT_ENTIDADES[r.entidad] || r.entidad).toLowerCase()}</span>}
                </p>
                {r.descripcion && r.entidad !== 'sesion' && (
                    <p className="mt-0.5 text-sm font-medium text-slate-800 break-words">{r.descripcion}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                    <time dateTime={r._fecha?.toISOString()}>{r._fecha?.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) || '—'}</time>
                    {r.usuario_rol && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold uppercase tracking-wider text-slate-500">{ROLES[r.usuario_rol.toUpperCase()]?.label || r.usuario_rol}</span>}
                </div>
            </div>
        </li>
    );
}

export default function AuditoriaPage() {
    const { registros, loading, error, cargarMas, hayMas } = useAuditoria();
    const [q, setQ] = useState('');
    const [rango, setRango] = useState('7d');
    const [entidad, setEntidad] = useState('');
    const [accion, setAccion] = useState('');
    const [usuario, setUsuario] = useState('');

    const usuarios = useMemo(
        () => [...new Set(registros.map(r => r.usuario_nombre).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
        [registros]
    );

    const filtrados = useMemo(() => {
        const r = RANGOS.find(x => x.id === rango);
        const desde = r?.dias == null ? null : new Date(startOfDay().getTime() - r.dias * 86400000);
        const term = q.trim().toLowerCase();
        return registros.filter(x =>
            (!desde || (x._fecha && x._fecha >= desde))
            && (!entidad || x.entidad === entidad)
            && (!accion || x.accion === accion)
            && (!usuario || x.usuario_nombre === usuario)
            && (!term || `${x.descripcion} ${x.usuario_nombre} ${x.entidad_id}`.toLowerCase().includes(term))
        );
    }, [registros, rango, entidad, accion, usuario, q]);

    const stats = useMemo(() => {
        const hoy = startOfDay();
        const semana = new Date(hoy.getTime() - 7 * 86400000);
        const ult7 = registros.filter(r => r._fecha && r._fecha >= semana);
        return {
            hoy: registros.filter(r => r._fecha && r._fecha >= hoy).length,
            semana: ult7.length,
            personas: new Set(ult7.map(r => r.usuario_id)).size,
            eliminaciones: ult7.filter(r => r.accion === 'eliminar').length,
        };
    }, [registros]);

    const porDia = useMemo(() => {
        const groups = [];
        for (const r of filtrados) {
            const key = r._fecha ? startOfDay(r._fecha).getTime() : 0;
            const last = groups[groups.length - 1];
            if (last && last.key === key) last.items.push(r);
            else groups.push({ key, label: r._fecha ? dayLabel(r._fecha) : 'Sin fecha', items: [r] });
        }
        return groups;
    }, [filtrados]);

    const filtrosActivos = [entidad, accion, usuario, q].filter(Boolean).length;

    return (
        <RouteGuard>
            <div className="flex flex-col flex-1">
                <Header title="Auditoría" />
                <PageBody width="max-w-5xl">
                    <p className="text-sm text-slate-500 max-w-2xl">
                        Registro de quién hizo cada cambio y cuándo: altas, ediciones, bajas, movimientos de stock,
                        préstamos, conteos, cuentas e inicios de sesión. El registro no se puede modificar ni borrar.
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <KPICard title="Acciones hoy" value={stats.hoy} icon={Activity} color="brand" loading={loading} />
                        <KPICard title="Últimos 7 días" value={stats.semana} icon={CalendarDays} color="violet" loading={loading} />
                        <KPICard title="Personas activas" value={stats.personas} icon={Users} color="emerald" subtitle="en 7 días" loading={loading} />
                        <KPICard title="Eliminaciones" value={stats.eliminaciones} icon={Trash2} color={stats.eliminaciones ? 'red' : 'emerald'} subtitle="en 7 días" loading={loading} />
                    </div>

                    <div className="glass-panel p-3 sm:p-4 space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <SearchInput value={q} onChange={setQ} placeholder="Buscar por artículo, persona o código…" className="flex-1" />
                            <SegmentedTabs tabs={RANGOS} value={rango} onChange={setRango} className="md:w-auto" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select value={entidad} onChange={e => setEntidad(e.target.value)} className="inp py-2" aria-label="Filtrar por tipo">
                                <option value="">Todo tipo de registro</option>
                                {Object.entries(AUDIT_ENTIDADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <select value={accion} onChange={e => setAccion(e.target.value)} className="inp py-2" aria-label="Filtrar por acción">
                                <option value="">Todas las acciones</option>
                                {Object.entries(AUDIT_ACCIONES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <select value={usuario} onChange={e => setUsuario(e.target.value)} className="inp py-2" aria-label="Filtrar por persona">
                                <option value="">Todas las personas</option>
                                {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Filter size={13} /> {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}
                                {filtrosActivos > 0 && (
                                    <button type="button" className="ml-1 font-semibold text-brand-600 hover:underline" onClick={() => { setEntidad(''); setAccion(''); setUsuario(''); setQ(''); }}>
                                        Quitar filtros
                                    </button>
                                )}
                            </span>
                            <button type="button" className="btn-secondary btn-sm" onClick={() => exportCsv(filtrados)} disabled={!filtrados.length}>
                                <Download size={14} /> Exportar CSV
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                            No se pudo cargar la auditoría: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
                        </div>
                    ) : porDia.length === 0 ? (
                        <EmptyState icon={ShieldCheck} title="Sin registros" subtitle="No hay acciones que coincidan con los filtros seleccionados." />
                    ) : (
                        <div className="space-y-4">
                            {porDia.map(g => (
                                <section key={g.key} className="glass-panel">
                                    <h3 className="border-b border-slate-100 bg-slate-50 px-4 sm:px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {g.label} <span className="ml-1 font-semibold text-slate-400">· {g.items.length}</span>
                                    </h3>
                                    <ul className="divide-y divide-slate-100">
                                        {g.items.map(r => <AuditRow key={r.id} r={r} />)}
                                    </ul>
                                </section>
                            ))}
                            {hayMas && (
                                <button type="button" onClick={cargarMas} className="btn-secondary w-full py-3 text-sm">
                                    Cargar registros más antiguos
                                </button>
                            )}
                        </div>
                    )}
                </PageBody>
            </div>
        </RouteGuard>
    );
}
