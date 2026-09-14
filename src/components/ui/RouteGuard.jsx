'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/lib/routePermissions';

/**
 * RouteGuard – Envuelve el contenido de una página y muestra una pantalla de
 * "Acceso denegado" cuando el rol del usuario no tiene permiso para esa ruta.
 *
 * Uso en cualquier page.js:
 *   <RouteGuard>{children}</RouteGuard>
 *   // o sin children, wrapping the whole page content:
 *   return <RouteGuard><div>…contenido…</div></RouteGuard>;
 */
export default function RouteGuard({ children }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const role = user?.rol || '';

    const allowed = canAccess(pathname, role);

    // Si el usuario no está autenticado en absoluto, AuthContext ya muestra
    // LoginScreen, así que aquí solo manejamos el caso de rol insuficiente.
    if (!user) return null;

    if (!allowed) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6 shadow-sm">
                    <ShieldOff size={36} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Denegado</h2>
                <p className="text-slate-500 text-sm max-w-xs mb-6">
                    Tu cuenta (<span className="font-semibold text-slate-700">{role}</span>) no tiene
                    permiso para ver esta sección. Contacta a un administrador si crees que esto es
                    un error.
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="btn btn-ghost flex items-center gap-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-xl transition-all"
                >
                    <ArrowLeft size={16} />
                    Volver al Panel
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
