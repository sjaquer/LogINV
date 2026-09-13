import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import BottomNav from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const metadata = {
    title: 'LogINV – Control de Inventario Iglesia CNC',
    description: 'Sistema interno de gestión de inventario para la Iglesia CNC. Control de stock, ubicaciones, préstamos, mantenimiento y reportes.',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: '/icons/apple-touch-icon.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'LogINV',
    },
    verification: {
        // Google Search Console → verificación de propiedad (mismo código que
        // el registro TXT de DNS; este <meta> cubre el método "Etiqueta HTML").
        google: 'vTcokSxFlEKzzVQF5MdtUUhZ1tLAUa2qH2xr2ggmLJs',
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#2563eb',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <head />
            <body className="font-sans antialiased overscroll-none">
                <AuthProvider>
                    <ThemeProvider>
                    <LocationProvider>
                        <SidebarProvider>
                            <ErrorBoundary>
                                <div className="flex min-h-[100dvh] min-h-screen bg-app-bg text-slate-900">
                                    <Sidebar />
                                    <MainContent>{children}</MainContent>
                                    <BottomNav />
                                </div>
                            </ErrorBoundary>
                        </SidebarProvider>
                    </LocationProvider>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
