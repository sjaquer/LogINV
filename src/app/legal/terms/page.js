import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Condiciones del Servicio · LogINV',
    description: 'Condiciones del servicio del sistema de inventario LogINV — Iglesia CNC.',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline mb-6">
                    <ArrowLeft size={16} /> Volver a LogINV
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <FileText className="text-brand-600" size={28} />
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Condiciones del Servicio</h1>
                </div>
                <p className="text-sm text-slate-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <div className="prose prose-slate max-w-none space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900">1. Aceptación</h2>
                        <p>
                            Al acceder y utilizar LogINV, el personal autorizado de la Iglesia CNC acepta estas
                            condiciones. LogINV es una herramienta interna de uso exclusivo para la administración del
                            inventario de la organización; no está destinada al público general.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">2. Uso permitido</h2>
                        <p>
                            El acceso a LogINV se otorga únicamente a personal, ministerios y colaboradores designados
                            por la Iglesia CNC. Cada usuario es responsable de mantener la confidencialidad de sus
                            credenciales de acceso y de la exactitud de la información que registra en el sistema.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">3. Integración con Google Drive</h2>
                        <p>
                            LogINV ofrece una función opcional para adjuntar fotografías a los artículos del inventario
                            utilizando la cuenta de Google Drive de la organización. Al autorizar esta función, el
                            usuario acepta que las imágenes subidas se almacenarán en dicha cuenta bajo el permiso
                            restringido <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs">drive.file</code>,
                            y podrán ser vistas por cualquier persona con acceso a LogINV mediante un enlace público de
                            solo lectura. El uso de esta función es responsabilidad de quien sube el contenido: no debe
                            subirse ninguna imagen que no corresponda a un artículo del inventario.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">4. Disponibilidad</h2>
                        <p>
                            LogINV se ofrece &quot;tal cual&quot;, sin garantías de disponibilidad continua. La
                            organización puede actualizar, modificar o suspender funciones del sistema en cualquier
                            momento como parte de su mantenimiento y mejora.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">5. Responsabilidad de los datos</h2>
                        <p>
                            La información registrada en LogINV (inventario, movimientos, préstamos, mantenimiento)
                            pertenece a la Iglesia CNC y se utiliza exclusivamente para su gestión administrativa
                            interna, incluyendo el reporte a contabilidad y la planificación de compras.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">6. Cambios en estas condiciones</h2>
                        <p>
                            Estas condiciones pueden actualizarse conforme el sistema evolucione. Los cambios relevantes
                            se reflejarán en esta misma página con su fecha de actualización.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">7. Contacto</h2>
                        <p>
                            Para consultas sobre estas condiciones, contacta al administrador del sistema de la Iglesia
                            CNC.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
