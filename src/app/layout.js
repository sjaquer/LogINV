import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = {
    title: 'LogINV – Sistema Logístico Hotelero',
    description: 'ERP de logística hotelera: inventario, compras, mermas y alertas en tiempo real.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body className="font-sans antialiased">
                <LanguageProvider>
                    <RoleProvider>
                        <div className="flex min-h-screen bg-app-bg text-slate-100">
                            <Sidebar />
                            <main className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 min-w-0">
                                {children}
                            </main>
                        </div>
                    </RoleProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
