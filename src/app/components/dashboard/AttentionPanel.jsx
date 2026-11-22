'use client';
import Link from 'next/link';
import { Handshake, Wrench, ClipboardList, AlertTriangle, CheckCircle2, ChevronRight, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * "Pendientes": lo que requiere acción hoy, con enlace directo a resolverlo.
 * @param {{ prestamosVencidos:number, prestamosActivos:number, mantVencidos:number, mantPendientes:number, conteosAbiertos:number, bajoMinimo:number, role:string }} props
 */
export default function AttentionPanel({ prestamosVencidos, prestamosActivos, mantVencidos, mantPendientes, conteosAbiertos, bajoMinimo, role }) {
    const manager = role === 'admin' || role === 'encargado';
    const items = [
        prestamosVencidos > 0 && {
            href: '/loans', icon: Handshake, tone: 'rose',
            title: `${prestamosVencidos} préstamo${prestamosVencidos === 1 ? '' : 's'} vencido${prestamosVencidos === 1 ? '' : 's'}`,
            hint: 'Contacta a quien lo tiene y registra la devolución',
        },
        manager && mantVencidos > 0 && {
            href: '/maintenance', icon: Wrench, tone: 'rose',
            title: `${mantVencidos} mantenimiento${mantVencidos === 1 ? '' : 's'} atrasado${mantVencidos === 1 ? '' : 's'}`,
            hint: 'La fecha programada ya pasó',
        },
        manager && conteosAbiertos > 0 && {
            href: '/inventario', icon: ClipboardList, tone: 'amber',
            title: `${conteosAbiertos} conteo${conteosAbiertos === 1 ? '' : 's'} sin finalizar`,
            hint: 'Termina el conteo para ajustar el stock',
        },
        manager && bajoMinimo > 0 && {
            href: '/productos', icon: AlertTriangle, tone: 'amber',
            title: `${bajoMinimo} artículo${bajoMinimo === 1 ? '' : 's'} bajo el mínimo`,
            hint: 'Revisa si hace falta reponer',
        },
        prestamosActivos > 0 && {
            href: '/loans', icon: Handshake, tone: 'blue',
            title: `${prestamosActivos} préstamo${prestamosActivos === 1 ? '' : 's'} en curso`,
            hint: 'Artículos fuera de su ubicación',
        },
        manager && mantPendientes > 0 && {
            href: '/maintenance', icon: Wrench, tone: 'blue',
            title: `${mantPendientes} mantenimiento${mantPendientes === 1 ? '' : 's'} programado${mantPendientes === 1 ? '' : 's'}`,
            hint: 'Próximas revisiones',
        },
    ].filter(Boolean);

    const tones = {
        rose: 'bg-rose-50 text-rose-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600',
    };

    return (
        <section className="glass-panel">
            <header className="panel-header">
                <h3 className="flex items-center gap-2 font-bold text-slate-800"><ListTodo size={18} className="text-brand-500" /> Pendientes</h3>
                {items.length > 0 && <span className="badge-gray">{items.length}</span>}
            </header>
            {items.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
                    <CheckCircle2 size={20} className="flex-shrink-0 text-emerald-500" /> Todo al día. No hay nada urgente por atender.
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {items.map(it => (
                        <li key={it.title}>
                            <Link href={it.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:px-5">
                                <span className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', tones[it.tone])}>
                                    <it.icon size={18} aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-slate-800">{it.title}</span>
                                    <span className="block truncate text-xs text-slate-500">{it.hint}</span>
                                </span>
                                <ChevronRight size={18} className="flex-shrink-0 text-slate-300" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
