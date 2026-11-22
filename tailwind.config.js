/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

// ═══════════════════════════════════════════════════════════════════════════
//  Tema claro/oscuro con tokens de color
//  Algunos tonos se definen como variables CSS (--c-<paleta>-<tono>) que
//  cambian de valor bajo `html.dark`. Así `bg-slate-50`, `text-emerald-700`,
//  `border-amber-200` o `bg-surface/80` se adaptan solos al modo oscuro, sin
//  reglas manuales por clase.
// ═══════════════════════════════════════════════════════════════════════════

const DARK_SURFACE = '#0d0d10';

const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const triplet = (hex) => hexToRgb(hex).join(' ');
// Mezcla `color` sobre `base` con opacidad `t` (tinte sólido para fondos oscuros).
const mix = (color, base, t) => {
    const a = hexToRgb(color);
    const b = hexToRgb(base);
    return a.map((v, i) => Math.round(v * t + b[i] * (1 - t))).join(' ');
};

const brand = {
    50: '#edf7ff', 100: '#d7edff', 200: '#b7dbff', 300: '#89c2ff', 400: '#5ca6ff',
    500: '#3a8bff', 600: '#2974e6', 700: '#1f5cca', 800: '#1b49a3', 900: '#173a82', 950: '#0b1f45',
};

// Neutros invertidos para modo oscuro (negro profundo, tipo zinc).
const SLATE_DARK = {
    50: '#0a0a0c', 100: '#16161a', 200: '#24242a', 300: '#34343b', 400: '#5d5d66',
    500: '#8a8a94', 600: '#a6a6af', 700: '#cfcfd5', 800: '#e7e7eb', 900: '#f5f5f7', 950: '#ffffff',
};

const ACCENTS = ['emerald', 'amber', 'rose', 'red', 'blue', 'violet', 'purple', 'green', 'yellow',
    'orange', 'sky', 'indigo', 'pink', 'cyan', 'teal'];

const lightVars = { '--c-surface': '255 255 255' };
const darkVars = { '--c-surface': triplet(DARK_SURFACE) };
const themedColors = {};

function themePalette(name, palette, darkFor) {
    const out = {};
    for (const [shade, hex] of Object.entries(palette)) {
        const dark = darkFor(shade, palette);
        if (dark) {
            const v = `--c-${name}-${shade}`;
            lightVars[v] = triplet(hex);
            darkVars[v] = dark;
            out[shade] = `rgb(var(${v}) / <alpha-value>)`;
        } else {
            out[shade] = hex;
        }
    }
    themedColors[name] = out;
}

// slate: todos los tonos se invierten.
themePalette('slate', colors.slate, (shade) => triplet(SLATE_DARK[shade]));

// Acentos: tintes (50-200) oscuros para fondos; 700-900 claros para texto.
const accentDark = (shade, p) => ({
    50: mix(p[500], DARK_SURFACE, 0.12),
    100: mix(p[500], DARK_SURFACE, 0.18),
    200: mix(p[500], DARK_SURFACE, 0.32),
    700: triplet(p[300]),
    800: triplet(p[200]),
    900: triplet(p[100]),
}[shade]);
ACCENTS.forEach(name => themePalette(name, colors[name], accentDark));

// brand: solo los tintes; 700+ se mantiene para botones primarios.
themePalette('brand', brand, (shade, p) => ({
    50: mix(p[500], DARK_SURFACE, 0.14),
    100: mix(p[500], DARK_SURFACE, 0.2),
    200: mix(p[500], DARK_SURFACE, 0.34),
}[shade]));

module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/context/**/*.{js,ts,jsx,tsx}',
        './src/hooks/**/*.{js,ts,jsx,tsx}',
        './src/lib/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                ...themedColors,
                // Superficie de tarjetas/paneles: blanco en claro, casi negro en oscuro.
                surface: 'rgb(var(--c-surface) / <alpha-value>)',
                // Tonos oscuros fijos (login, visores, overlays): no cambian con el tema.
                ink: { 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
                accent: {
                    cyan: '#0ea5e9',
                    teal: '#0d9488',
                    amber: '#d97706',
                    rose: '#e11d48',
                },
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #2563eb, #3b82f6)',
            },
            boxShadow: {
                'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glow': '0 0 10px rgba(59, 130, 246, 0.3)',
                'glow-lg': '0 0 20px rgba(59, 130, 246, 0.4)',
                'soft': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
            },
            fontFamily: {
                sans: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [
        plugin(({ addBase }) => {
            addBase({ ':root': lightVars, 'html.dark': darkVars });
        }),
    ],
};
