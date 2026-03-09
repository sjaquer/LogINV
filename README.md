# � LogINV – Sistema de Inventario para Bares

<p align="center">
  <strong>Plataforma web de gestión de inventario para bares y restaurantes</strong><br/>
  Control de stock · Conteos diarios · Semáforo de vencimientos · Multi-ubicación · PWA
</p>

---

## 📋 Descripción

**LogINV** es un sistema de inventario en tiempo real diseñado para bares, restaurantes y establecimientos de servicio de bebidas. Permite gestionar productos (licores, cervezas, vinos, insumos), controlar stock con punto de reorden (ROP), realizar conteos diarios con interfaz tap-to-count optimizada para móvil, escanear códigos de barras y monitorear vencimientos con un semáforo visual.

### Características principales

| Módulo | Descripción |
|---|---|
| **Dashboard** | KPIs en tiempo real: alertas de stock bajo, conteos del día, diferencias detectadas, total de productos. Semáforo de vencimientos (rojo < 3d, amarillo < 7d, verde). Resumen multi-ubicación. Exportar inventario a CSV. Generar reportes PDF de conteos. |
| **Conteo de Inventario** | Sistema de conteo tap-to-count a pantalla completa. Escaneo de código de barras. Filtros por categoría y búsqueda. Barra de progreso visual. Guardado automático en localStorage. Historial de conteos completados. |
| **Productos** | CRUD completo: nombre, categoría, stock actual/mínimo, código de barras, lote, gramaje, marca, proveedor, vencimiento. Gestor de categorías integrado. Filtros, búsqueda y ordenamiento. |
| **Multi-ubicación** | 3 ubicaciones: Bar 1, Bar 2, Almacén. Productos, conteos y alertas se filtran por ubicación seleccionada. Cambio rápido desde el Header. |

### Usuarios del sistema

| Usuario | Rol | Contraseña |
|---|---|---|
| Carlos Paredes | LOGISTICA | `1234` |
| Miguel Rodríguez | PLANTA | `5678` |
| Ana Quispe | ADMIN | `admin` |
| Luis Mendoza | GERENCIA | `master` |

> ⚠️ Las contraseñas son de demostración. En producción se debe implementar autenticación real (Firebase Auth, etc.).

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| [Next.js](https://nextjs.org) | 14.2.5 | Framework React (App Router, SSR) |
| [React](https://react.dev) | 18.x | Librería UI con Hooks |
| [Tailwind CSS](https://tailwindcss.com) | 3.4.x | Framework CSS utility-first |
| [Firebase / Firestore](https://firebase.google.com) | 10.12.2 | Base de datos en tiempo real (con modo mock) |
| [Lucide React](https://lucide.dev) | 0.400.0 | Iconografía SVG |
| [html5-qrcode](https://github.com/mebjas/html5-qrcode) | 2.3.8 | Escaneo de código de barras via cámara |

---

## 🚀 Instalación y Ejecución

### Requisitos previos

- **Node.js** 18.x o superior
- **npm** o **yarn**
- Proyecto configurado en **Firebase Console** con Firestore habilitado

### 1. Clonar el repositorio

```bash
git clone https://github.com/sjaquer/LogINV.git
cd LogINV
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y reemplazar con tus credenciales de Firebase:

```bash
cp .env.example .env.local
```

Editar `.env.local` con los valores de tu proyecto Firebase:

```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-project-id"
NEXT_PUBLIC_FIREBASE_APP_ID="tu-app-id"
NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"
NEXT_PUBLIC_USE_MOCK=false
```

> 💡 Para usar datos de demostración sin Firebase, cambiar `NEXT_PUBLIC_USE_MOCK=true`.

### 4. Configurar Firestore

En Firebase Console, crear las siguientes colecciones (se crean automáticamente al insertar el primer documento):

| Colección | Descripción |
|---|---|
| `productos` | Inventario de productos con stock, ubicación, lote, vencimiento |
| `categorias` | Categorías de productos (Licores, Cervezas, Vinos, etc.) |
| `movimientos` | Historial de ingresos, salidas y ajustes por conteo |
| `conteos` | Conteos diarios de inventario con ítems y diferencias |

**Reglas de seguridad recomendadas** (Firestore Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ Solo para desarrollo
    }
  }
}
```

> ⚠️ En producción, implementar reglas de seguridad adecuadas con Firebase Auth.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### 6. Build de producción

```bash
npm run build
npm start
```

---

## 📁 Estructura del Proyecto

```
LogINV/
├── .env.local                # Variables de entorno (no se sube a git)
├── firestore.rules           # Reglas de seguridad Firestore
├── next.config.js            # Configuración de Next.js
├── tailwind.config.js        # Configuración de Tailwind (colores brand, etc.)
├── package.json
│
├── docs/
│   ├── GUIA_USUARIO.md       # Guía de usuario
│   └── DOCUMENTACION.md      # Documentación técnica completa
│
├── scripts/
│   └── mockData.js           # Script de seed para datos de prueba
│
├── src/
│   ├── app/
│   │   ├── globals.css       # Estilos globales + componentes CSS (modal, btn, etc.)
│   │   ├── layout.js         # Layout raíz (AuthProvider → LocationProvider → Sidebar + BottomNav)
│   │   ├── page.js           # Dashboard (KPIs, semáforo, alertas, historial, CSV, PDF)
│   │   ├── not-found.js      # Página 404
│   │   ├── inventario/
│   │   │   └── page.js       # Conteo de inventario (tap-to-count, barcode, historial)
│   │   └── productos/
│   │       └── page.js       # Gestión de productos (CRUD, categorías, filtros)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.js     # Header con cambio de ubicación y menú de usuario
│   │   │   ├── Sidebar.js    # Navegación lateral (desktop)
│   │   │   ├── BottomNav.js  # Navegación inferior (móvil)
│   │   │   └── MainContent.js # Wrapper de contenido con padding responsive
│   │   └── ui/
│   │       ├── SharedComponents.js  # KPICard, StockBar, SemaforoBadge, EmptyState
│   │       ├── BarcodeScanner.js    # Escáner de códigos de barras (cámara)
│   │       └── ErrorBoundary.js     # Boundary de errores React
│   │
│   ├── context/
│   │   ├── AuthContext.js     # Autenticación (login screen, 4 usuarios, localStorage)
│   │   ├── LocationContext.js # Multi-ubicación (BAR_1, BAR_2, ALMACEN)
│   │   └── SidebarContext.js  # Estado collapsed/expanded del sidebar
│   │
│   ├── hooks/
│   │   └── useFirestore.js   # Hooks CRUD (Firebase + mock fallback automático)
│   │
│   └── lib/
│       ├── firebase.js       # Configuración Firebase
│       ├── mockDataStore.js  # 28 productos mock, 6 categorías, 3 ubicaciones
│       └── utils.js          # Utilidades (formatDate, daysUntil, cn, semáforo)
```

---

## 📊 Modelo de Datos (Firestore)

### Colección `productos`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | string | Nombre del producto |
| `categoria` | string | Nombre de la categoría |
| `ubicacion` | string | Ubicación: `BAR_1`, `BAR_2` o `ALMACEN` |
| `stock_actual` | number | Cantidad actual en stock |
| `stock_minimo_rop` | number | Punto de reorden (stock mínimo) |
| `unidad` | string | Unidad de medida (botellas, unidades, bolsas, etc.) |
| `codigo_barras` | string \| null | Código de barras EAN/UPC |
| `fecha_vencimiento` | timestamp | Fecha de vencimiento del lote |
| `lote` | string | Código de lote |
| `gramaje` | string | Contenido/gramaje (750ml, 330ml, 200g) |
| `marca` | string | Marca del producto |
| `proveedor` | string | Nombre del proveedor |
| `descripcion` | string | Descripción del producto |
| `activo` | boolean | Producto activo/inactivo |
| `fecha_creacion` | timestamp | Fecha de creación |
| `ultima_actualizacion` | timestamp | Última modificación |

### Colección `categorias`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | string | Nombre de la categoría |
| `descripcion` | string | Descripción |
| `icono` | string | Emoji del ícono |
| `color` | string | Color hex |
| `orden` | number | Orden de visualización |
| `activa` | boolean | Categoría activa/inactiva |

### Colección `movimientos`

| Campo | Tipo | Descripción |
|---|---|---|
| `producto_id` | string | ID del producto |
| `nombre_producto` | string | Nombre (denormalizado para consultas) |
| `tipo` | string | `INGRESO`, `SALIDA`, `CONTEO` o `MERMA` |
| `cantidad` | number | Cantidad del movimiento |
| `usuario` | string | Quién realizó el movimiento |
| `ubicacion` | string | Ubicación donde ocurrió |
| `fecha` | timestamp | Fecha del movimiento |
| `motivo_merma` | string \| null | Motivo (solo para mermas/ajustes) |

### Colección `conteos`

| Campo | Tipo | Descripción |
|---|---|---|
| `usuario` | string | Quién realizó el conteo |
| `ubicacion` | string | Ubicación del conteo |
| `estado` | string | `EN_PROGRESO` o `COMPLETADO` |
| `items` | array | Lista de ítems contados `[{producto_id, producto_nombre, conteo_fisico, stock_sistema, diferencia}]` |
| `notas` | string | Observaciones del conteo |
| `fecha` | timestamp | Fecha de inicio |
| `fecha_cierre` | timestamp \| null | Fecha de finalización |

### Colección `requerimientos`

| Campo | Tipo | Descripción |
|---|---|---|
| `solicitante` | string | Quién solicita |
| `estado` | string | `PENDIENTE`, `APROBADO_ADMIN`, `VALIDADO_GERENCIA`, `RECHAZADO`, `COMPRADO` |
| `items` | array | Lista de productos solicitados `[{producto_nombre, cantidad, justificacion}]` |
| `logs` | array | Historial de acciones `[{usuario, accion, fecha}]` |
| `fecha_creacion` | timestamp | Fecha de creación |

---

## 🔄 Flujo de Conteo Diario

```
1. Iniciar conteo  →  Se crea registro EN_PROGRESO para la ubicación actual
       │
2. Seleccionar producto  →  Se abre modal tap-to-count a pantalla completa
       │
3. Contar tocando  →  Cada toque = +1, botones para -1 y reset
       │
4. Confirmar o descartar  →  El conteo del producto se guarda en memoria
       │
5. Repetir para más productos  →  Barra de progreso muestra avance
       │
6. Guardar borrador  →  Se guarda en Firestore + localStorage backup
       │
7. Finalizar conteo  →  Estado cambia a COMPLETADO, stock se ajusta automáticamente
```

Al finalizar, los productos con diferencias se ajustan automáticamente (`updateStock`) y se registra un movimiento tipo `CONTEO` por cada diferencia detectada.

---

## 📱 Responsive Design & PWA

La aplicación está completamente optimizada para dispositivos móviles y funciona como PWA:

- **Sidebar**: Desktop (lg+) con sidebar fijo colapsable
- **BottomNav**: Navegación inferior en móvil con safe-area support
- **Modales**: Estilo "bottom sheet" en móvil, centrado en desktop
- **Filtros**: Scroll horizontal en categorías/tipos
- **Inputs**: Tamaño 16px en móvil para evitar zoom en iOS
- **Safe areas**: Soporte para notch/home indicator de iPhone
- **Touch targets**: Botones con mínimo 44px para accesibilidad táctil
- **Tap-to-count**: Zona de toque grande optimizada para conteo rápido
- **PWA**: Manifest, viewport-fit=cover, apple-web-app capable

---

## 🧪 Modo Demo (Mock Data)

Para ejecutar sin Firebase (ideal para presentaciones o desarrollo):

1. En `.env.local`, configurar: `NEXT_PUBLIC_USE_MOCK=true`
2. La app cargará 28 productos de ejemplo en 3 ubicaciones, 6 categorías, conteos y movimientos de prueba
3. Todos los cambios son en memoria (se pierden al recargar)
4. Si no se configura `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, el modo mock se activa automáticamente

---

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m "feat: descripción del cambio"`
4. Push: `git push origin feature/mi-feature`
5. Crear Pull Request

---

## 📄 Licencia

Este proyecto es privado y de uso interno.

---

<p align="center">
  Desarrollado para el sector agroindustrial 🌾<br/>
  <strong>MolinoINV</strong> – Control de inventario inteligente
</p>
