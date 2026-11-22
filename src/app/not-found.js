import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
            <div className="text-center max-w-sm">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Compass size={30} aria-hidden="true" />
                </span>
                <p className="mt-4 font-mono text-sm font-bold tracking-widest text-brand-600">404</p>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Esta página no existe</h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2">
                    Puede que el enlace esté incompleto o que la sección se haya movido. Volvamos al panel.
                </p>
                <Link href="/" className="btn-primary mt-5 sm:mt-6 inline-flex">Volver al panel</Link>
            </div>
        </div>
    );
}
