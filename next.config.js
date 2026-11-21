/** @type {import('next').NextConfig} */
const path = require('path');

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Cabeceras de seguridad para todas las rutas.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // La cámara se usa en /scan (lector de códigos de barras).
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  webpack: (config, { dev, webpack }) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    // Los datos de demostración solo se empaquetan en desarrollo o en modo mock.
    if (!dev && !USE_MOCK) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]lib[\\/]mockDataStore(\.js)?$/,
          path.resolve(__dirname, 'src/lib/mockDataStore.empty.js'),
        ),
      );
    }
    return config;
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
    ];
  },
};

module.exports = nextConfig;
