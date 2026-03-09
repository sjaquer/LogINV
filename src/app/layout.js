import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SidebarProvider } from '@/context/SidebarContext';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';

export const metadata = {
    title: 'LOG-INV – Sistema de Gestión de Inventario',
    description: 'Sistema de gestión de inventario, abastecimiento, mermas y alertas en tiempo real.',
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
                        <SidebarProvider>
                            <div className="flex min-h-[100dvh] min-h-screen bg-app-bg text-slate-900">
                                <Sidebar />
                                <MainContent>{children}</MainContent>
                            </div>
                        </SidebarProvider>
                    </RoleProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
