import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Política de Privacidad · LogINV',
    description: 'Política de privacidad del sistema de inventario LogINV — Iglesia CNC.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline mb-6">
                    <ArrowLeft size={16} /> Volver a LogINV
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="text-brand-600" size={28} />
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Política de Privacidad</h1>
                </div>
                <p className="text-sm text-slate-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <div className="prose prose-slate max-w-none space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900">1. ¿Qué es LogINV?</h2>
                        <p>
                            LogINV es un sistema interno de control de inventario desarrollado para la gestión de bienes,
                            equipos e insumos de la Iglesia CNC (IACYM CNC). No es una aplicación pública ni un servicio
                            comercial: su uso está restringido al personal y ministerios autorizados de la organización.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">2. Datos que recopilamos</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <strong>Datos del inventario:</strong> nombre, descripción, categoría, ubicación, estado,
                                cantidades en stock, códigos de barra y observaciones de los artículos registrados.
                            </li>
                            <li>
                                <strong>Datos del personal interno:</strong> nombre, rol y área/ministerio de las personas
                                que administran el inventario. No recopilamos datos de contacto de terceros ni de
                                visitantes de la iglesia.
                            </li>
                            <li>
                                <strong>Fotos de productos:</strong> imágenes que el personal autorizado sube para
                                identificar visualmente cada artículo del inventario.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">3. Uso de Google Drive</h2>
                        <p>
                            LogINV se conecta opcionalmente a Google Drive únicamente para almacenar las fotografías de
                            los productos del inventario. Al autorizar el acceso, la aplicación solicita el permiso
                            <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs">drive.file</code>
                            de Google, el más restrictivo disponible: esto significa que LogINV{' '}
                            <strong>solo puede ver, crear y modificar los archivos que la propia aplicación crea</strong>{' '}
                            (las fotos subidas desde LogINV, guardadas en una carpeta llamada
                            &quot;LogINV_Fotos_Productos&quot;). La aplicación nunca obtiene acceso al resto de archivos,
                            carpetas o información de la cuenta de Google Drive utilizada.
                        </p>
                        <p>
                            Las fotos subidas se marcan como &quot;cualquiera con el enlace puede verlas&quot; para que
                            se muestren correctamente dentro de LogINV a todo el personal autorizado, sin exponer ningún
                            otro contenido de la cuenta de Drive.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">4. Cómo usamos los datos</h2>
                        <p>
                            Los datos se usan exclusivamente para operar el inventario interno: registrar existencias,
                            controlar entradas/salidas, generar reportes para contabilidad y compras, y coordinar
                            préstamos y mantenimiento de bienes. No vendemos, alquilamos ni compartimos esta información
                            con terceros con fines comerciales o publicitarios.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">5. Almacenamiento y seguridad</h2>
                        <p>
                            Los datos del inventario se almacenan en Firebase (Google Cloud) bajo el proyecto de la
                            organización. El acceso a la aplicación está protegido por autenticación interna, y el
                            acceso a Google Drive requiere autorización explícita mediante Google Identity Services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">6. Retención y eliminación</h2>
                        <p>
                            Los registros de inventario se conservan mientras la organización los necesite para su
                            gestión administrativa. Las fotos de productos pueden eliminarse en cualquier momento desde
                            la propia aplicación, lo cual también las elimina de Google Drive.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">7. Contacto</h2>
                        <p>
                            Para consultas sobre esta política o sobre el tratamiento de datos, contacta al
                            administrador del sistema de la Iglesia CNC.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
