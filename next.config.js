/** @type {import('next').NextConfig} */
const { PHASE_PRODUCTION_BUILD } = require('next/constants');

// Cabeceras de seguridad para todas las rutas.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // La cámara se usa en /scan (lector de códigos de barras).
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

module.exports = (phase) => {
  const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  // Los datos de demostración (generados del inventario real) solo se
  // empaquetan en desarrollo o en modo demo, nunca en el build de producción.
  const stripMockData = phase === PHASE_PRODUCTION_BUILD && !USE_MOCK;

  return {
    // Permite builds paralelos (p. ej. la demo de la guía) sin pisar .next.
    distDir: process.env.NEXT_DIST_DIR || '.next',
    reactStrictMode: true,
    poweredByHeader: false,
    serverExternalPackages: ['firebase-admin'],
    turbopack: {
      resolveAlias: stripMockData
        ? { '@/lib/mockDataStore': './src/lib/mockDataStore.empty.js' }
        : {},
    },
    async headers() {
      return [{ source: '/:path*', headers: securityHeaders }];
    },
    async redirects() {
      return [
        { source: '/ubicaciones', destination: '/locations', permanent: true },
        { source: '/prestamos', destination: '/loans', permanent: true },
        { source: '/mantenimiento', destination: '/maintenance', permanent: true },
        { source: '/reportes', destination: '/reports', permanent: true },
        { source: '/usuarios', destination: '/admin/users', permanent: true },
        { source: '/tutorial', destination: '/ayuda', permanent: true },
        { source: '/guia', destination: '/ayuda', permanent: true },
      ];
    },
  };
};
