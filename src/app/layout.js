import './globals.css';
import { Space_Grotesk, Manrope } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider, themeInitScript } from '@/context/ThemeContext';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import BottomNav from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Fuentes autoalojadas por Next (sin petición bloqueante a Google Fonts).
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
    title: {
        default: 'LogINV – Control de Inventario Iglesia CNC',
        template: '%s · LogINV',
    },
    applicationName: 'LogINV',
    robots: { index: false, follow: false },
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
        // Google Search Console → verificación de propiedad (mismos códigos
        // que los registros TXT de DNS; estos <meta> cubren el método
        // "Etiqueta HTML" para las distintas propiedades/dominios verificados.
        google: [
            'vTcokSxFlEKzzVQF5MdtUUhZ1tLAUa2qH2xr2ggmLJs',
            'XXXcSKs9hnuQpt4nxbfKDzlXRvZMPRmHXZMO2zgQmEc',
        ],
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
        { media: '(prefers-color-scheme: dark)', color: '#000000' },
    ],
};

export default function RootLayout({ children }) {
    return (
        <html lang="es" className={`${spaceGrotesk.variable} ${manrope.variable}`} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
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
