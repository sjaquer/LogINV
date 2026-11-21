# LogINV – Control de Inventario Iglesia CNC

Aplicación web (PWA) para gestionar el inventario de la Iglesia CNC: artículos, stock,
ubicaciones, conteos físicos, préstamos, mantenimiento y reportes.

**Stack:** Next.js 14 (App Router) · React 18 · Firebase (Auth + Firestore) · Tailwind CSS ·
Google Drive (fotos de productos) · ExcelJS (reportes).

## Módulos

| Sección | Ruta | Roles |
|---|---|---|
| Panel de control | `/` | todos |
| Productos (catálogo, fotos, etiquetas con código de barras) | `/productos` | todos (gestión: admin/encargado) |
| Escanear | `/scan` | todos |
| Préstamos | `/loans` | todos |
| Inventario (conteo físico e ingresos/salidas rápidas) | `/inventario` | admin, encargado |
| Ubicaciones | `/locations` | admin, encargado |
| Mantenimiento | `/maintenance` | admin, encargado |
| Reportes | `/reports` | admin, encargado |
| Usuarios | `/admin/users` | admin |

Los permisos de la UI están en `src/lib/routePermissions.js`; los del servidor, en
`firestore.rules` y `src/lib/serverAuth.js`.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa las variables
npm run dev                  # http://localhost:3000
```

Sin credenciales de Firebase puedes usar el **modo demo** con datos de prueba:

```bash
NEXT_PUBLIC_USE_MOCK=true npm run dev
```

Primera cuenta de administrador: `npm run create-admin` (requiere las credenciales
`FIREBASE_ADMIN_*` del service account). El resto de cuentas se crean desde `/admin/users`.

## Seguridad

- El acceso a datos exige una cuenta de Firebase Auth **con perfil activo** en
  `usuarios/{uid}`. Solo un admin puede crear o modificar perfiles.
- Las reglas de Firestore viven en `firestore.rules`; tras cambiarlas hay que publicarlas
  (`firebase deploy --only firestore:rules` o `node scripts/deploy_rules.mjs`).
- Las rutas `/api/*` que escriben datos verifican el ID token de Firebase.
- La vinculación de Google Drive (`/api/auth/google-drive`) está desactivada salvo
  `GOOGLE_DRIVE_OAUTH_SETUP=enabled`.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` / `build` / `start` | Desarrollo, build y servidor de producción |
| `npm run lint` | ESLint |
| `npm run create-admin` | Crea la primera cuenta admin |
| `npm run seed` | Importa el inventario desde Excel |
| `npm run mock:generate` | Regenera `src/lib/mockDataStore.js` |
| `npm run export:db` | Exporta la base completa a `exports/` |

Documentación adicional en `docs/`.

## Licencia

MIT
