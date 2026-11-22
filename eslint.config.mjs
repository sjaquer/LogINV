import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
    ...nextCoreWebVitals,
    {
        ignores: ['.next/**', 'node_modules/**', 'exports/**', 'data/**', 'scripts/**', 'src/lib/mockDataStore.js'],
    },
    {
        rules: {
            // Las fotos vienen de Google Drive/DataURL con fallbacks propios; next/image no aplica.
            '@next/next/no-img-element': 'off',
        },
    },
];

export default config;
