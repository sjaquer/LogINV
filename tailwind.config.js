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
                    cyan: '#0ea5e9',
                    teal: '#0d9488',
                    amber: '#d97706',
                    rose: '#e11d48',
                },
                glass: {
                    DEFAULT: 'rgba(255, 255, 255, 0.8)',
                    hover: 'rgba(255, 255, 255, 0.95)',
                    border: 'rgba(226, 232, 240, 0.8)',
                },
                dark: {
                    DEFAULT: '#ffffff',
                    panel: '#f8fafc',
                    accent: '#f1f5f9',
                }
            },
            backgroundImage: {
                'app-bg': 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
                'brand-gradient': 'linear-gradient(135deg, #2563eb, #3b82f6)',
            },
            boxShadow: {
                'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glow': '0 0 10px rgba(59, 130, 246, 0.3)',
                'glow-lg': '0 0 20px rgba(59, 130, 246, 0.4)',
                'soft': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
            },
            fontFamily: {
                sans: ['"Space Grotesk"', '"Manrope"', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
