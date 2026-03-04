import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = {
    title: 'MolinoINV – Sistema de Inventario Agroindustrial',
    description: 'ERP agroindustrial de inventario, abastecimiento, mermas y alertas en tiempo real.',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body className="font-sans antialiased overscroll-none">
                <LanguageProvider>
                    <RoleProvider>
                        <div className="flex min-h-[100dvh] min-h-screen bg-app-bg text-slate-900">
                            <Sidebar />
                            <main className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 min-w-0 bg-slate-50/50 w-full overflow-x-hidden">
                                {children}
                            </main>
                        </div>
                    </RoleProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
