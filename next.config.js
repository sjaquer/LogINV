/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
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
