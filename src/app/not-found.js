export default function NotFound() {
    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
                <p className="text-6xl font-bold text-brand-500/40">404</p>
                <p className="text-xl font-semibold text-slate-300 mt-4">Página no encontrada</p>
                <p className="text-slate-500 mt-2">La ruta que buscas no existe en LogINV.</p>
                <a href="/" className="btn btn-primary mt-6 inline-flex">Volver al Dashboard</a>
            </div>
        </div>
    );
}
