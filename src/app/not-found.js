export default function NotFound() {
    return (
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
            <div className="text-center">
                <p className="text-5xl sm:text-6xl font-bold text-brand-200">404</p>
                <p className="text-lg sm:text-xl font-semibold text-slate-900 mt-3 sm:mt-4">Página no encontrada</p>
                <p className="text-sm sm:text-base text-slate-500 mt-2">La ruta que buscas no existe en LOG-INV.</p>
                <a href="/" className="btn btn-primary mt-5 sm:mt-6 inline-flex">Volver al Dashboard</a>
            </div>
        </div>
    );
}
