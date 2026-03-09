# 📖 Documentación Técnica — LogINV

> Sistema de Control de Inventario para Bares y Restaurantes  
> Versión: 0.1.0 | Stack: Next.js 14 + React 18 + Firebase/Firestore + Tailwind CSS

---

## 1. Arquitectura General

### 1.1 Diagrama de Capas

```
┌───────────────────────────────────────────────────┐
│                   PRESENTACIÓN                     │
│   Pages (Dashboard, Inventario, Productos)         │
│   Components (Header, Sidebar, BottomNav, Modals)  │
├───────────────────────────────────────────────────┤
│                   ESTADO / LÓGICA                   │
│   Context (Auth, Location, Sidebar)                │
│   Hooks (useFirestore: useProductos, useConteos…)  │
├───────────────────────────────────────────────────┤
│                   DATOS                             │
│   Firebase Firestore (producción)                  │
│   mockDataStore.js (modo demo / desarrollo)        │
└───────────────────────────────────────────────────┘
```

### 1.2 Flujo de Providers

```
<html>
  <body>
    <AuthProvider>          ← Gate de autenticación (login screen)
      <LocationProvider>    ← Ubicación activa (BAR_1, BAR_2, ALMACEN)
        <SidebarProvider>   ← Estado collapsed/expanded
          <ErrorBoundary>   ← Captura errores React
            <Sidebar />     ← Navegación desktop (hidden en mobile)
            <MainContent>   ← Wrapper con padding responsive
              {children}    ← Página actual (Dashboard/Inventario/Productos)
            </MainContent>
            <BottomNav />   ← Navegación mobile (hidden en desktop)
          </ErrorBoundary>
        </SidebarProvider>
      </LocationProvider>
    </AuthProvider>
  </body>
</html>
```

---

## 2. Módulos de la Aplicación

### 2.1 Autenticación (`AuthContext.js`)

**Tipo:** Context Provider con pantalla de login integrada.

**Funcionamiento:**
- Al cargar la app, verifica si hay un usuario guardado en `localStorage` (clave `loginv_user`).
- Si no hay usuario, muestra `LoginScreen` — un formulario con selector desplegable de usuarios y campo de contraseña.
- Los usuarios están definidos en constante `USUARIOS` (hardcoded para demo).
- Al autenticarse exitosamente, guarda `{id, nombre, rol}` en estado y localStorage.
- Expone `user`, `login()`, `logout()`, `isAuthenticated` via `useAuth()`.

**Usuarios configurados:**

| ID | Nombre | Rol | Password |
|---|---|---|---|
| user1 | Carlos Paredes | LOGISTICA | 1234 |
| user2 | Miguel Rodríguez | PLANTA | 5678 |
| user3 | Ana Quispe | ADMIN | admin |
| user4 | Luis Mendoza | GERENCIA | master |

**Pantalla de login:**
- Selector de usuario con dropdown (renderizado vía `createPortal` en `document.body` para evitar problemas de z-index).
- Campo de contraseña con icono Lock.
- Validación: usuario requerido + contraseña debe coincidir.
- Feedback visual de error con ícono AlertCircle.

---

### 2.2 Multi-ubicación (`LocationContext.js`)

**Tipo:** Context Provider con persistencia en localStorage.

**Ubicaciones:**

| ID | Nombre | Icono |
|---|---|---|
| BAR_1 | Bar 1 | 🍸 |
| BAR_2 | Bar 2 | 🍹 |
| ALMACEN | Almacén | 📦 |

**Funcionamiento:**
- Estado inicial: `BAR_1`.
- Al montar, lee `localStorage` (clave `loginv_ubicacion`).
- Cambio de ubicación disponible desde el Header a través de un dropdown.
- Todos los hooks y páginas filtran datos por `ubicacion` activa.
- Expone `ubicacion`, `setUbicacion()`, `ubicacionInfo`, `UBICACIONES` via `useLocation()`.

---

### 2.3 Dashboard (`/` — `page.js`)

**Tipo:** Página principal con KPIs, alertas y accesos rápidos.

**Secciones:**

1. **Hero de bienvenida** — Saludo personalizado con nombre del usuario y ubicación activa.

2. **Resumen multi-ubicación** — Grid de 3 cards mostrando cada ubicación con total de productos y alertas de stock.

3. **Acciones rápidas** — 4 botones: Nuevo conteo, Productos, Escanear código, Exportar CSV.

4. **KPIs** — 4 tarjetas:
   - Stock Bajo: productos bajo stock mínimo.
   - Conteos Hoy: conteos realizados hoy.
   - Diferencias: productos con diferencias en último conteo.
   - Total Productos: SKU activos en la ubicación.

5. **Historial de conteos** — Lista de conteos completados con botón para generar PDF por cada uno.

6. **Stock bajo mínimo** — Lista de productos bajo stock mínimo con déficit a reponer.

7. **Semáforo de vencimientos** — Tabla (desktop) / cards (mobile) de productos próximos a vencer (< 30 días) con código de colores:
   - 🔴 Rojo: < 3 días
   - 🟡 Amarillo: < 7 días
   - 🟢 Verde: ≥ 7 días

**Funciones especiales:**
- `generatePDFReport(conteo)`: Genera HTML profesional y abre `window.print()` en nueva pestaña.
- `exportInventoryCSV(productos, ubicacion)`: Genera CSV con BOM UTF-8 y descarga automática.

---

### 2.4 Conteo de Inventario (`/inventario` — `inventario/page.js`)

**Tipo:** Herramienta de conteo diario tap-to-count.

**Componentes internos:**

#### TapCountModal
- Modal fullscreen (z-50) con fondo oscuro.
- Muestra nombre del producto, stock del sistema, conteo actual.
- Zona de toque grande (botón cuadrado) — cada toque = +1.
- Vibración háptica (30ms) en cada toque.
- Botones: Reset (a 0), -1, Descartar, Confirmar.
- Badge de diferencia entre conteo y stock (rojo negativo, verde positivo).

#### ConteoHistoryCard
- Card clickeable que muestra: estado (En progreso/Completado), usuario, fecha, total ítems, ítems con diferencias.

#### ConteoDetailModal
- Modal con detalle de un conteo completado.
- Sección "Con diferencias" (fondo ámbar) y "Sin diferencias" (fondo verde).
- Stock sistema vs Conteo físico por cada ítem.

#### InventarioPage (componente principal)
**Tabs:** Conteo | Historial

**Tab Conteo:**
1. Si no hay conteo activo → muestra botón "Nuevo conteo".
2. Al crear conteo → se registra en Firestore con estado `EN_PROGRESO`.
3. Muestra barra de acciones: Escanear código, Guardar conteo.
4. Barra de progreso visual (ítems contados / total productos).
5. Resumen: total contados, sin diferencias, con diferencias.
6. Lista de productos filtrable por búsqueda y categoría.
7. Cada producto muestra estado (no contado / contado ok / contado con diferencia).
8. Al tocar un producto → abre TapCountModal.
9. Campo de notas/observaciones.
10. Botón "Finalizar conteo" → cierra conteo, ajusta stock de productos con diferencias.

**Tab Historial:**
- Lista de conteos completados para la ubicación actual, ordenados por fecha descendente.
- Click abre ConteoDetailModal.

**Lógica de persistencia:**
- Conteo items se guardan en `localStorage` (clave `loginv_conteo_backup`) como backup.
- Al cargar, busca conteo EN_PROGRESO **de la ubicación actual** para restaurar.
- Al cambiar de ubicación, el conteo activo se resetea si es de otra ubicación.

**Flujo de finalización:**
```
1. actualizarConteo(id, {items, notas})   → Guarda items finales
2. finalizarConteo(id)                     → Cambia estado a COMPLETADO
3. Para cada item con diferencia:
   updateStock(producto_id, conteo_fisico) → Ajusta stock real
4. Limpia estado local + localStorage
```

---

### 2.5 Productos (`/productos` — `productos/page.js`)

**Tipo:** CRUD completo de productos.

**Componentes internos:**

#### ProductFormModal
- Modal con formulario completo de producto.
- Campos: nombre*, categoría*, código de barras (con escáner), unidad, marca, gramaje, stock actual, stock mínimo, lote, vencimiento, proveedor, descripción.
- Modo crear / modo editar.
- Validación: nombre y categoría requeridos.
- Escáner de código de barras integrado.

#### DeleteConfirmModal
- Confirmación con icono de peligro y nombre del producto.
- Estados: deleting, error.

#### CategoryManagerModal
- Lista de categorías existentes con editar/eliminar inline.
- Formulario para nueva categoría: nombre, descripción, icono (emoji picker), color.
- 10 iconos predefinidos, 8 colores.

#### ProductosPage (componente principal)
- Barra de acciones: Nuevo producto, Categorías (según rol).
- Búsqueda por nombre, código de barras o lote.
- Filtro por categoría con conteo de productos.
- Ordenamiento: por nombre, stock, categoría.
- Cards de producto con: nombre, categoría, stock bar visual, lote, vencimiento.
- Acciones por producto: editar, eliminar (según rol).
- Permisos: ADMIN, GERENCIA y LOGISTICA pueden gestionar; PLANTA solo visualiza.

---

## 3. Capa de Datos (`useFirestore.js`)

### 3.1 Modo Dual: Mock / Firebase

El sistema detecta automáticamente el modo:
```javascript
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
    || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
```

- **Mock:** Datos en memoria (arrays JS). Cambios notifican a todos los suscriptores via listener pattern.
- **Firebase:** Firestore con listeners `onSnapshot` para tiempo real.

### 3.2 Hooks Disponibles

#### `useProductos()`
```javascript
{
  productos,        // Array de productos
  loading,          // Boolean
  error,            // String | null
  crearProducto,    // async (data) => id
  actualizarProducto, // async (id, data) => void
  eliminarProducto, // async (id) => void
  updateStock,      // async (id, nuevoStock, usuario) => void
  registrarMerma,   // async (id, cantidad, usuario, motivo) => void
}
```

#### `useCategorias()`
```javascript
{
  categorias,         // Array de categorías
  loading,
  error,
  crearCategoria,     // async (data) => id
  actualizarCategoria, // async (id, data) => void
  eliminarCategoria,  // async (id) => void
}
```

#### `useConteos()`
```javascript
{
  conteos,          // Array de conteos
  loading,
  error,
  crearConteo,      // async (data) => id
  actualizarConteo, // async (id, data) => void
  finalizarConteo,  // async (id) => void
}
```

#### `useMovimientos()`
```javascript
{
  movimientos,  // Array de movimientos (solo lectura)
  loading,
  error,
}
```

#### `useRequerimientos()`
```javascript
{
  requerimientos,
  loading,
  error,
  cambiarEstado,      // async (id, nuevoEstado, usuario) => void
  crearRequerimiento, // async (items, solicitante) => id
}
```

### 3.3 Manejo de Errores Firebase

La función `firebaseError()` traduce códigos de error Firebase:
- `permission-denied` → Mensaje sobre Security Rules.
- `failed-precondition` → Mensaje sobre índices faltantes.
- `unavailable` / `resource-exhausted` → Mensaje de conectividad.
- Fallback: si un query con `orderBy` falla por índice, reintenta sin ordenamiento.

---

## 4. Componentes Compartidos

### 4.1 Layout

| Componente | Ubicación | Descripción |
|---|---|---|
| `Header` | Sticky top | Logo, título de página, selector de ubicación (dropdown), menú de usuario (logout) |
| `Sidebar` | Desktop (lg+) | 3 ítems: Panel, Productos, Inventario. Colapsable con tooltip. |
| `BottomNav` | Mobile (<lg) | 3 ítems: Panel, Productos, Inventario. Fixed bottom con safe-area. |
| `MainContent` | Wrapper | Maneja padding-left (sidebar) y padding-bottom (BottomNav). |

### 4.2 UI Compartidos (`SharedComponents.js`)

| Componente | Props | Descripción |
|---|---|---|
| `KPICard` | title, value, subtitle, icon, color, loading | Card de indicador KPI con color temático. |
| `SemaforoBadge` | days | Badge de semáforo: Vencido / Urgente / Pronto / OK |
| `StockBar` | actual, minimo | Barra de progreso de stock vs mínimo |
| `EmptyState` | icon, title, subtitle | Estado vacío con icono y texto |

### 4.3 BarcodeScanner (`BarcodeScanner.js`)

- Usa `html5-qrcode` para acceso a cámara.
- Fullscreen modal con botón de cerrar.
- Decodifica EAN-13, UPC-A, Code-128, QR.
- Callback `onScan(code)` al detectar código.

---

## 5. Datos Mock (`mockDataStore.js`)

### 5.1 Productos (28 total)

| Ubicación | Productos | Ejemplos |
|---|---|---|
| BAR_1 | 10 | Vodka Absolut, Ron Havana Club, Whisky JW Black, Cusqueña, Corona, Casillero del Diablo, Coca-Cola, Red Bull, Limones, Maní |
| BAR_2 | 9 | Vodka Absolut, Tequila Cuervo, Pisco Quebranta, Pilsen Callao, Vino Blanco, Chandon, Tónica, Jarabe Goma, Papas Lays |
| ALMACEN | 9 | Vodka (24u), Ron (18u), Whisky (12u), Cusqueña (120u), Corona (72u), Coca-Cola (96u), Red Bull (48u), Hielo, Agua |

### 5.2 Categorías (6)

Licores 🥃 · Cervezas 🍺 · Vinos 🍷 · Bebidas sin alcohol 🥤 · Insumos Bar 🍋 · Snacks 🥜

### 5.3 Conteos Mock (2)

- **cnt1**: BAR_1, EN_PROGRESO, Carlos Paredes, 3 ítems (1 con diferencia: Cusqueña -2).
- **cnt2**: BAR_2, COMPLETADO, Miguel Rodríguez, 3 ítems (2 con diferencias).

### 5.4 Movimientos Mock (6)

Mezcla de CONTEO (ajustes) e INGRESO (reposición) en BAR_1, BAR_2 y ALMACEN.

---

## 6. Estilos y Tema (`globals.css` + `tailwind.config.js`)

### 6.1 Paleta de Colores (brand)

Basada en azul (`#2563eb` como base):
```
brand-50: #eff6ff → brand-600: #2563eb → brand-950: #172554
```

### 6.2 Clases CSS Personalizadas

| Clase | Descripción |
|---|---|
| `.btn` | Botón base con transition y rounded-xl |
| `.btn-primary` | brand-600 background, white text, shadow |
| `.btn-ghost` | Transparent, hover:bg-slate-100 |
| `.btn-danger` | red-600 background |
| `.inp` | Input base con border, focus ring, rounded-xl |
| `.glass-card` | Efecto glass morphism (backdrop-blur + bg/20) |
| `.modal-overlay` | Fixed inset, z-50, backdrop-blur, flex center |
| `.modal-box` | White card, rounded-2xl, max responsive height |
| `.pb-safe` | Padding bottom con env(safe-area-inset-bottom) |
| `.animate-fade-in` | Fade in 200ms |
| `.animate-slide-up` | Slide up 300ms |
| `.spinner` | Circular spinning animation |
| `.no-scrollbar` | Oculta scrollbar manteniendo scroll |
| `.data-table` | Estilos de tabla de datos |

---

## 7. Variables de Entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK` | No | `true` para modo demo sin Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Sí (producción) | ID del proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Sí (producción) | App ID de Firebase |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sí (producción) | API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Sí (producción) | Auth domain |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | Para push notifications |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Para Analytics |

---

## 8. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo (hot reload)
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
```

---

## 9. Notas Técnicas

### 9.1 Renderizado
- Todas las páginas usan `'use client'` (client components) porque dependen de hooks de estado, contexto y efectos.
- El layout raíz define metadata del servidor (title, description, manifest, viewport).

### 9.2 Persistencia Local
- `loginv_user`: Usuario autenticado (JSON).
- `loginv_ubicacion`: Ubicación activa (string).
- `loginv_conteo_backup`: Backup del conteo en progreso (JSON con id, items, notas).

### 9.3 Modo Mock vs Firebase
- En modo mock, los datos se mantienen en arrays en memoria compartida entre todos los hooks via listener pattern (`Set` de callbacks).
- `notify(key)` dispara re-render en todos los componentes que usan ese hook.
- Timestamps mock: `{ toDate: () => Date, seconds: number }` para compatibilidad con la API de Firestore Timestamp.

### 9.4 PWA
- `manifest.json` en `/public`.
- `viewport-fit=cover` para soporte de safe areas.
- `apple-web-app-capable: true` para modo standalone en iOS.
- CSS variables `--safe-top`/`--safe-bottom` para padding dinámico.

### 9.5 Seguridad (consideraciones)
- Las contraseñas están hardcoded (solo para demo). En producción usar Firebase Auth.
- Firestore rules actuales permiten lectura/escritura abierta. En producción implementar reglas por rol.
- No hay sanitización de HTML en la generación de PDF (el contenido es controlado internamente).
