# Documentación técnica — LogINV

> Control de inventario de la Iglesia CNC · v2.0
> Stack: Next.js 16 (App Router, Turbopack) · React 19 · Firebase 13 (Auth + Firestore) · Tailwind CSS 3

## Estructura

```
src/
├── app/                    Páginas (App Router), una carpeta por módulo
│   ├── page.js             Panel de control
│   ├── productos/          Catálogo (components/: tarjetas, formulario, detalle…)
│   ├── inventario/         Conteos, ingreso/salida, historial
│   │   └── useConteoSession.js   Estado del conteo activo (derivado + respaldo local)
│   ├── scan/  loans/  locations/  maintenance/  reports/
│   ├── admin/users/        Cuentas y roles
│   ├── auditoria/          Registro de auditoría
│   ├── ayuda/              Guía de usuario (guideContent.js = textos)
│   └── api/                Rutas de servidor (ver "Seguridad")
├── components/
│   ├── layout/             Sidebar, Header, BottomNav (+ hoja "Más"), MainContent
│   └── ui/                 Page (PageBody, Section, SegmentedTabs, SearchInput),
│                           Feedback (toasts + confirmaciones), SharedComponents…
├── context/                Auth, Location, Theme, Sidebar
├── hooks/                  Datos y utilidades de React
└── lib/                    Lógica sin React (stock, auditoría, navegación, permisos…)
```

## Capa de datos

- `hooks/useCollection.js`: suscripción en tiempo real (`onSnapshot`) a una colección;
  en modo demo lee de `lib/mockStore.js`. Todos los hooks de datos la usan.
- `lib/dataOps.js`: `addDocument / setDocument / updateDocument / deleteDocument`
  (Firestore o demo) con limpieza de valores `undefined`.
- `useProductos().updateStock(id, valor, usuario, { modo: 'set'|'delta', tipo, motivo })`
  actualiza el stock y crea **un** movimiento dentro de una transacción.
- Regla de stock bajo: `lib/stock.js` (`isLowStock`: stock **por debajo** del mínimo).

## Auditoría

`lib/auditLog.js` registra en la colección `auditoria` cada alta, edición, baja, movimiento
de stock, préstamo, conteo, cambio de cuenta e inicio/cierre de sesión. Los hooks envuelven
sus escrituras con `audited(fn, describe)`; el usuario actual lo fija `AuthContext`.
Las reglas solo permiten registrar acciones propias y leerlas a administradores.

## Seguridad

- Acceso a datos: cuenta de Firebase Auth **con perfil activo** en `usuarios/{uid}`
  (`firestore.rules`: `isActiveUser`, `isManager`, `isAdmin`).
- `/api/admin/users` (admin) y `/api/drive-upload` (usuario activo) verifican el ID token
  con `lib/serverAuth.js`.
- `/api/auth/google-drive`: vinculación de Drive, desactivada salvo `GOOGLE_DRIVE_OAUTH_SETUP=enabled`.
- Publicar reglas tras cambiarlas: `firebase deploy --only firestore:rules`.

## Tema y UI

- Modo oscuro por tokens: `tailwind.config.js` define `slate`, `surface` y los tintes de
  cada color como variables CSS que cambian bajo `html.dark`. No hace falta escribir `dark:`
  para esos colores; `bg-surface` = tarjeta/panel, `ink-*` = oscuro fijo.
- Navegación y permisos: `lib/navigation.js` + `lib/routePermissions.js`.
- Avisos: `useToast()`; confirmaciones: `await useConfirm()({ title, message, danger })`.

## Modo demo

`NEXT_PUBLIC_USE_MOCK=true` usa datos de ejemplo sin Firebase. En el build de producción
los datos de demo se sustituyen por `mockDataStore.empty.js` (ver `next.config.js`).

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` / `build` / `start` | Desarrollo / build / producción |
| `npm run lint` | ESLint 9 (flat config) |
| `npm run guide:screenshots` | Regenera las capturas de la guía (app demo en :3123) |
| `npm run create-admin` | Primera cuenta admin |
| `npm run export:db` | Exporta la base completa |
