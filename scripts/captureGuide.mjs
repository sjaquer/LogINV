#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  Genera las capturas de la guía (/ayuda) en public/ayuda/*.webp
//
//  1. Levanta la app en modo demo (datos de prueba, sin Firebase):
//       NEXT_DIST_DIR=.next-demo NEXT_PUBLIC_USE_MOCK=true npx next build
//       NEXT_DIST_DIR=.next-demo NEXT_PUBLIC_USE_MOCK=true npx next start -p 3123
//  2. En otra terminal:
//       node scripts/captureGuide.mjs [http://localhost:3123]
//
//  Requiere Google Chrome/Chromium instalado (CHROME_BIN para otra ruta).
//  No tiene dependencias: controla Chrome por el protocolo DevTools (CDP).
// ═══════════════════════════════════════════════════════════════════════════

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://localhost:3123';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'ayuda');
const CHROME = process.env.CHROME_BIN || 'google-chrome-stable';
const PORT = 9335;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function launchChrome() {
    const userDir = mkdtempSync(join(tmpdir(), 'loginv-guide-'));
    const proc = spawn(CHROME, [
        '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
        `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`, 'about:blank',
    ], { stdio: 'ignore' });
    let info;
    for (let i = 0; i < 50 && !info; i++) {
        try { info = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); }
    }
    if (!info) throw new Error(`No se pudo iniciar Chrome (${CHROME})`);
    const ws = new WebSocket(info.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data);
        const p = msg.id && pending.get(msg.id);
        if (p) { pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
    });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
        const mid = ++id;
        pending.set(mid, { resolve, reject });
        ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
    });
    const close = async () => {
        try { ws.close(); } catch { /* ya cerrado */ }
        proc.kill();
        await sleep(500);
        try { rmSync(userDir, { recursive: true, force: true }); } catch { /* Chrome aún liberando archivos */ }
    };
    return { send, close };
}

async function newPage(send) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    await s('Page.enable');
    await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await s('Emulation.setTouchEmulationEnabled', { enabled: true });
    await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    const evaluate = async (expression) => {
        const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
        return r.result.value;
    };
    return {
        evaluate,
        goto: async (path, wait = 2500) => { await s('Page.navigate', { url: BASE + path }); await sleep(wait); },
        click: async (target, wait = 800) => {
            const ok = await evaluate(`(() => {
                const t = ${JSON.stringify(target)};
                const el = t.startsWith('css:') ? document.querySelector(t.slice(4))
                    : [...document.querySelectorAll('button, a, [role=button]')].filter(e => e.offsetParent !== null)
                        .find(e => (e.innerText || e.getAttribute('aria-label') || '').trim().toLowerCase().includes(t.toLowerCase()));
                if (!el) return false;
                el.scrollIntoView({ block: 'center' }); el.click(); return true;
            })()`);
            if (!ok) throw new Error(`No encontré "${target}"`);
            await sleep(wait);
        },
        type: async (selector, text) => evaluate(`(() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, ${JSON.stringify(text)});
            el.dispatchEvent(new Event('input', { bubbles: true }));
        })()`),
        storage: async (entries) => evaluate(`(() => { ${Object.entries(entries).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('')} })()`),
        shot: async (name) => {
            await evaluate('window.scrollTo(0, 0)');
            await sleep(300);
            const { data } = await s('Page.captureScreenshot', { format: 'webp', quality: 82 });
            writeFileSync(join(OUT, `${name}.webp`), Buffer.from(data, 'base64'));
        },
        close: () => send('Target.closeTarget', { targetId }),
    };
}

// [nombre, ruta, preparación opcional]. La ubicación TEMPLO se usa para las
// pantallas que requieren una ubicación concreta (conteo, nuevo producto).
const SHOTS = [
    ['menu-mas', '/', async (p) => { await p.click('Más'); }],
    ['panel', '/'],
    ['productos', '/productos'],
    ['producto-detalle', '/productos', async (p) => { await p.click('css:div[role=button].group'); }],
    ['escanear', '/scan'],
    ['escanear-no-encontrado', '/scan', async (p) => { await p.type('#manual-code', 'CNC-0099'); await p.click('Buscar'); }],
    ['conteo', '/inventario', async (p) => {
        await p.click('Nuevo conteo', 1200);
        for (let i = 0; i < 2; i++) {
            await p.evaluate(`[...document.querySelectorAll('main button')].filter(b => b.querySelector('img, svg') && b.innerText.includes('Sistema'))[${i}]?.click()`);
            await sleep(600);
            await p.click('Toca para contar', 200);
            await p.click('Confirmar', 600);
        }
    }, { loginv_ubicacion: 'TEMPLO' }],
    ['conteo-tap', '/inventario', async (p) => {
        await p.click('Nuevo conteo', 1200);
        await p.evaluate(`[...document.querySelectorAll('main button')].find(b => b.innerText.includes('Sistema'))?.click()`);
        await sleep(600);
        await p.click('Toca para contar', 200);
    }, { loginv_ubicacion: 'TEMPLO' }],
    ['rapido', '/inventario?tab=rapido', null, { loginv_ubicacion: 'TEMPLO' }],
    ['prestamos', '/loans'],
    ['prestamo-nuevo', '/loans', async (p) => { await p.click('Nuevo préstamo'); }],
    ['ubicaciones', '/locations'],
    ['mantenimiento', '/maintenance'],
    ['reportes', '/reports'],
    ['usuarios', '/admin/users'],
    ['usuario-nuevo', '/admin/users', async (p) => {
        await p.click('Nueva cuenta');
        await p.type('#u-nombre', 'María Quispe');
        await p.type('#u-email', 'maria@correo.com');
        await p.click('Generar');
    }],
    ['auditoria', '/auditoria'],
    ['login', '/', async (p) => { await p.click('Más'); await p.click('Cerrar sesión', 1200); }],
];

mkdirSync(OUT, { recursive: true });
const chrome = await launchChrome();
let failures = 0;
try {
    for (const [name, path, prepare, storage] of SHOTS) {
        const page = await newPage(chrome.send);
        try {
            await page.goto('/legal/terms', 800); // mismo origen, para preparar localStorage
            await page.storage({ loginv_theme: 'light', loginv_welcome_demo_admin: '0', loginv_ubicacion: 'GENERAL', ...(storage || {}) });
            await page.goto(path);
            if (prepare) await prepare(page);
            await page.shot(name);
            console.log('✓', name);
        } catch (err) {
            failures++;
            console.error('✗', name, '-', err.message);
        } finally {
            await page.close();
        }
    }
} finally {
    await chrome.close();
}
process.exit(failures ? 1 : 0);
