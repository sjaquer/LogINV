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
import { FeedbackProvider } from '@/components/ui/Feedback';

// Fuentes autoalojadas por Next (sin petición bloqueante a Google Fonts).
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

// URL pública: necesaria para que las vistas previas (WhatsApp, redes)
// encuentren la imagen Open Graph con una dirección absoluta.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || 'http://localhost:3000';

const SITE_TITLE = 'LogINV – Control de Inventario Iglesia CNC';
const SITE_DESCRIPTION = 'Sistema interno de gestión de inventario para la Iglesia CNC. Control de stock, ubicaciones, préstamos, mantenimiento y reportes.';

// La imagen de vista previa vive en src/app/opengraph-image.jpg y
// twitter-image.jpg (convención de archivos de Next: se enlazan solas).
export const metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_TITLE,
        template: '%s · LogINV',
    },
    applicationName: 'LogINV',
    robots: { index: false, follow: false },
    description: SITE_DESCRIPTION,
    openGraph: {
        type: 'website',
        siteName: 'LogINV · Iglesia Alianza CNC',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        url: '/',
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
    },
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
                            <FeedbackProvider>
                            <ErrorBoundary>
                                <div className="flex min-h-[100dvh] min-h-screen bg-slate-50 text-slate-900">
                                    <Sidebar />
                                    <MainContent>{children}</MainContent>
                                    <BottomNav />
                                </div>
                            </ErrorBoundary>
                            </FeedbackProvider>
                        </SidebarProvider>
                    </LocationProvider>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
