// ═══════════════════════════════════════════════════════════════════════════
//  Identidad de la iglesia - LogINV
//  Nombre, lema y textos que hacen que la app se sienta propia de la
//  Iglesia Alianza CNC. Cambia aquí y se actualiza en toda la interfaz.
// ═══════════════════════════════════════════════════════════════════════════

export const CHURCH = {
    name: 'Iglesia Alianza CNC',
    short: 'Alianza CNC',
    motto: 'Somos familia',
    app: 'Inventario de la Iglesia Alianza CNC',
};

// Versículos sobre servir, la mayordomía y el orden (Reina-Valera 1960).
export const VERSES = [
    { text: 'Hágase todo decentemente y con orden.', ref: '1 Corintios 14:40' },
    { text: 'Cada uno según el don que ha recibido, minístrelo a los otros, como buenos administradores.', ref: '1 Pedro 4:10' },
    { text: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor.', ref: 'Colosenses 3:23' },
    { text: 'Se requiere de los administradores, que cada uno sea hallado fiel.', ref: '1 Corintios 4:2' },
    { text: 'El que es fiel en lo muy poco, también en lo más es fiel.', ref: 'Lucas 16:10' },
    { text: 'Servid a Jehová con alegría.', ref: 'Salmos 100:2' },
    { text: 'No nos cansemos, pues, de hacer bien.', ref: 'Gálatas 6:9' },
];

/** Versículo del día: cambia cada día y es el mismo para todos ese día. */
export function verseOfTheDay(date = new Date()) {
    const start = new Date(date.getFullYear(), 0, 0);
    const day = Math.floor((date - start) / 86_400_000);
    return VERSES[day % VERSES.length];
}

/** Saludo según la hora del día. */
export function greeting(date = new Date()) {
    const h = date.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
}
