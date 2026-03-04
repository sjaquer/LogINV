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
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                glass: {
                    DEFAULT: 'rgba(255, 255, 255, 0.05)',
                    hover: 'rgba(255, 255, 255, 0.1)',
                    border: 'rgba(255, 255, 255, 0.1)',
                },
                dark: {
                    DEFAULT: '#0f172a', /* slate-900 */
                    panel: '#1e293b', /* slate-800 */
                    accent: '#334155', /* slate-700 */
                }
            },
            backgroundImage: {
                'app-bg': 'radial-gradient(circle at 50% -20%, #1e293b, #0f172a 80%)',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                'brand-gradient': 'linear-gradient(to right, #4f46e5, #3b82f6)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'glow': '0 0 15px rgba(99, 102, 241, 0.5)',
                'glow-lg': '0 0 25px rgba(99, 102, 241, 0.6)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
