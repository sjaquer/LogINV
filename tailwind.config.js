/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#edf7ff',
                    100: '#d7edff',
                    200: '#b7dbff',
                    300: '#89c2ff',
                    400: '#5ca6ff',
                    500: '#3a8bff',
                    600: '#2974e6',
                    700: '#1f5cca',
                    800: '#1b49a3',
                    900: '#173a82',
                    950: '#0b1f45',
                },
                accent: {
                    cyan: '#39bfe0',
                    teal: '#00c6ad',
                    amber: '#f6b756',
                    rose: '#f47189',
                },
                glass: {
                    DEFAULT: 'rgba(255, 255, 255, 0.06)',
                    hover: 'rgba(255, 255, 255, 0.15)',
                    border: 'rgba(255, 255, 255, 0.12)',
                },
                dark: {
                    DEFAULT: '#05060c',
                    panel: '#0f1424',
                    accent: '#1c2437',
                }
            },
            backgroundImage: {
                'app-bg': 'radial-gradient(circle at 20% 20%, rgba(57, 191, 224, 0.22), transparent 45%), radial-gradient(circle at 80% 0%, rgba(244, 113, 137, 0.18), transparent 40%), linear-gradient(145deg, #05060c, #090f1d 65%, #111a2f)',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.02))',
                'brand-gradient': 'linear-gradient(110deg, #39bfe0, #3a8bff 45%, #7c5dff)',
            },
            boxShadow: {
                'glass': '0 18px 45px rgba(5, 6, 12, 0.35)',
                'glow': '0 0 25px rgba(58, 139, 255, 0.45)',
                'glow-lg': '0 0 45px rgba(124, 93, 255, 0.55)',
                'soft': '0 20px 60px rgba(0, 0, 0, 0.35)',
            },
            fontFamily: {
                sans: ['"Space Grotesk"', '"Manrope"', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
