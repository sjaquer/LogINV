'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Rocket, LayoutDashboard, Package, ScanBarcode, ClipboardList, Handshake, MapPin,
    Wrench, FileText, Users, ShieldCheck, LifeBuoy, Lightbulb, Check, Minus, HelpCircle, AlertTriangle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { SearchInput } from '@/components/ui/Page';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { GUIDE, ROLE_MATRIX, FAQ } from './guideContent';
import { errorCatalog } from '@/lib/errors';

const ERROR_CATALOG = errorCatalog();

const ICONS = { Rocket, LayoutDashboard, Package, ScanBarcode, ClipboardList, Handshake, MapPin, Wrench, FileText, Users, ShieldCheck };
const ROLE_ORDER = ['admin', 'encargado', 'voluntario'];
const roleLabel = (r) => ROLES[r.toUpperCase()]?.label || r;

function RoleBadges({ roles }) {
    if (roles.length === 3) return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Todos los roles</span>;
    return (
        <span className="flex flex-wrap gap-1">
            {roles.map(r => (
                <span key={r} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">{roleLabel(r)}</span>
            ))}
        </span>
    );
}

function PhoneShot({ src, caption }) {
    return (
        <figure className="mx-auto w-full max-w-[240px] lg:max-w-[200px]">
            <div className="overflow-hidden rounded-[1.75rem] border-[7px] border-ink-900 bg-ink-900 shadow-xl">
                <img src={src} alt={caption} loading="lazy" className="block h-auto w-full bg-white" width={390} height={844} />
            </div>
            <figcaption className="mt-2 text-center text-xs text-slate-500">{caption}</figcaption>
        </figure>
    );
}

function GuideSection({ section, index }) {
    const Icon = ICONS[section.icon] || HelpCircle;
    return (
        <section id={section.id} className="glass-panel scroll-mt-24">
            <header className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon size={20} aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sección {index + 1}</p>
                        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{section.title}</h2>
                    </div>
                </div>
                <RoleBadges roles={section.roles} />
            </header>

            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0 space-y-5">
                    <p className="text-sm text-slate-600 sm:text-base">{section.summary}</p>
                    <ol className="space-y-4">
                        {section.steps.map((step, i) => (
                            <li key={step.title} className="flex gap-3">
                                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-slate-800">{step.title}</h3>
                                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    {section.tips?.map(tip => (
                        <p key={tip} className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            <Lightbulb size={17} className="mt-0.5 flex-shrink-0" /> {tip}
                        </p>
                    ))}
                </div>
                {section.shots?.length > 0 && (
                    <div className={cn('grid content-start gap-4', section.shots.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                        {section.shots.map(s => <PhoneShot key={s.src} {...s} />)}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function AyudaPage() {
    const { user } = useAuth();
    const [q, setQ] = useState('');
    const [soloMiRol, setSoloMiRol] = useState(true);
    const rol = user?.rol;

    const secciones = useMemo(() => {
        const term = q.trim().toLowerCase();
        return GUIDE.filter(s => (!soloMiRol || !rol || s.roles.includes(rol)))
            .filter(s => !term || [s.title, s.summary, ...s.steps.flatMap(st => [st.title, st.text]), ...(s.tips || [])]
                .join(' ').toLowerCase().includes(term));
    }, [q, soloMiRol, rol]);

    const faqs = useMemo(() => {
        const term = q.trim().toLowerCase();
        return FAQ.filter(f => !term || `${f.q} ${f.a}`.toLowerCase().includes(term));
    }, [q]);

    // Códigos de error: se busca por código ("RED-01") o por palabras.
    const errores = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return ERROR_CATALOG;
        return ERROR_CATALOG
            .map(g => ({ ...g, items: g.items.filter(e => `${e.code} ${e.title} ${e.message} ${e.hint || ''}`.toLowerCase().includes(term)) }))
            .filter(g => g.items.length);
    }, [q]);

    return (
        <div className="flex flex-col flex-1">
            <Header title="Ayuda y guía" />
            <div className="mx-auto w-full max-w-6xl flex-1 p-3 pb-8 sm:p-6 lg:p-8">
                {/* Portada */}
                <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-brand-600 to-violet-700 p-5 text-white shadow-lg sm:p-8">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                    <div className="relative max-w-2xl">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70"><LifeBuoy size={14} /> Guía de LogINV</p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Aprende a usar la app paso a paso</h2>
                        <p className="mt-2 text-sm text-white/80 sm:text-base">
                            Qué hace cada pantalla y cada botón, con capturas. Si es tu primera vez, empieza por
                            {' '}<a href="#primeros-pasos" className="font-semibold underline underline-offset-2">Primeros pasos</a>.
                        </p>
                        {rol && (
                            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                                Tu rol: {roleLabel(rol)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
                    {/* Índice */}
                    <aside className="mb-5 min-w-0 lg:mb-0">
                        <div className="space-y-3 lg:sticky lg:top-24">
                            <SearchInput value={q} onChange={setQ} placeholder="Buscar en la guía…" />
                            {rol && (
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" checked={soloMiRol} onChange={e => setSoloMiRol(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                                    Solo lo que puedo usar
                                </label>
                            )}
                            <nav aria-label="Contenido de la guía" className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible">
                                {secciones.map(s => {
                                    const Icon = ICONS[s.icon] || HelpCircle;
                                    return (
                                        <a key={s.id} href={`#${s.id}`} className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2.5 lg:py-2 lg:hover:bg-slate-100">
                                            <Icon size={15} className="flex-shrink-0" aria-hidden="true" /> <span className="lg:truncate">{s.title}</span>
                                        </a>
                                    );
                                })}
                                <a href="#roles" className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2.5 lg:py-2 lg:hover:bg-slate-100">
                                    <ShieldCheck size={15} /> Roles y permisos
                                </a>
                                <a href="#faq" className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2.5 lg:py-2 lg:hover:bg-slate-100">
                                    <HelpCircle size={15} /> Preguntas frecuentes
                                </a>
                                <a href="#errores" className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2.5 lg:py-2 lg:hover:bg-slate-100">
                                    <AlertTriangle size={15} /> Códigos de error
                                </a>
                            </nav>
                        </div>
                    </aside>

                    {/* Contenido */}
                    <div className="min-w-0 space-y-6">
                        {secciones.length === 0 && faqs.length === 0 && errores.length === 0 && (
                            <p className="rounded-xl border border-slate-200 bg-surface p-6 text-center text-sm text-slate-500">
                                No hay resultados para “{q}”.
                            </p>
                        )}

                        {secciones.map((s) => <GuideSection key={s.id} section={s} index={GUIDE.indexOf(s)} />)}

                        <section id="roles" className="glass-panel scroll-mt-24">
                            <header className="panel-header"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShieldCheck size={20} className="text-brand-500" /> Roles y permisos</h2></header>
                            <div className="overflow-x-auto">
                                <table className="data-table min-w-[520px]">
                                    <thead>
                                        <tr>
                                            <th>Acción</th>
                                            {ROLE_ORDER.map(r => <th key={r} className={cn('text-center', r === rol && 'text-brand-600')}>{roleLabel(r)}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ROLE_MATRIX.map(row => (
                                            <tr key={row.label}>
                                                <td>{row.label}</td>
                                                {ROLE_ORDER.map(r => (
                                                    <td key={r} className="text-center">
                                                        {row.roles.includes(r)
                                                            ? <Check size={18} className="mx-auto text-emerald-600" aria-label="Sí" />
                                                            : <Minus size={18} className="mx-auto text-slate-300" aria-label="No" />}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {faqs.length > 0 && (
                            <section id="faq" className="glass-panel scroll-mt-24">
                                <header className="panel-header"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><HelpCircle size={20} className="text-brand-500" /> Preguntas frecuentes</h2></header>
                                <div className="divide-y divide-slate-100">
                                    {faqs.map(f => (
                                        <details key={f.q} className="group px-4 py-3 sm:px-6">
                                            <summary className="cursor-pointer list-none font-semibold text-slate-800 marker:hidden">
                                                <span className="mr-2 text-brand-500 group-open:hidden">+</span>
                                                <span className="mr-2 hidden text-brand-500 group-open:inline">−</span>
                                                {f.q}
                                            </summary>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
                                        </details>
                                    ))}
                                </div>
                            </section>
                        )}

                        {errores.length > 0 && (
                            <section id="errores" className="glass-panel scroll-mt-24">
                                <header className="panel-header flex-col items-start gap-1">
                                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><AlertTriangle size={20} className="text-amber-500" /> Códigos de error</h2>
                                    <p className="text-sm text-slate-500">
                                        Cuando algo falla aparece un aviso al costado con un código (por ejemplo <span className="font-mono font-bold">RED-01</span>).
                                        Búscalo aquí para saber qué pasó, o toca “Copiar para reportar” y envíaselo a un administrador.
                                    </p>
                                </header>
                                <div className="divide-y divide-slate-100">
                                    {errores.map(g => (
                                        <div key={g.group} className="px-4 py-4 sm:px-6">
                                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{g.label}</h3>
                                            <dl className="space-y-2.5">
                                                {g.items.map(e => (
                                                    <div key={e.code} id={`error-${e.code}`} className="flex gap-3 scroll-mt-24">
                                                        <dt className="w-[74px] flex-shrink-0 pt-0.5">
                                                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wide text-slate-600">{e.code}</span>
                                                        </dt>
                                                        <dd className="min-w-0 text-sm">
                                                            <p className="font-semibold text-slate-800">{e.title}</p>
                                                            <p className="text-slate-600">{e.message}</p>
                                                            {e.hint && <p className="mt-0.5 text-xs text-slate-500">Qué hacer: {e.hint}</p>}
                                                        </dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <p className="text-center text-sm text-slate-500">
                            ¿Algo no está claro? Escríbele a un administrador. <Link href="/" className="font-semibold text-brand-600 hover:underline">Volver al panel</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
