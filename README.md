# 🌾 MolinoINV – Sistema de Inventario Agroindustrial

<p align="center">
  <strong>Plataforma web de gestión de inventario para empresas agroindustriales de alimento balanceado</strong><br/>
  Control de stock · Semáforo de vencimientos · Alertas ROP · Workflow de aprobaciones · 4 idiomas
</p>

---

## 📋 Descripción

**MolinoINV** es un sistema de inventario en tiempo real diseñado para empresas agroindustriales, molinos de alimento balanceado y empresas del sector alimentario veterinario. Permite gestionar productos (sacos de alimento, materias primas, insumos veterinarios), controlar stock con punto de reorden (ROP), registrar mermas, aprobar solicitudes de compra mediante un workflow de firmas y monitorear vencimientos con un semáforo visual.

### Características principales

| Módulo | Descripción |
|---|---|
| **Dashboard** | KPIs en tiempo real: alertas ROP, mermas del mes, solicitudes pendientes, total de productos. Semáforo de vencimientos con código de colores (rojo < 3d, amarillo < 7d, verde). |
| **Inventario** | CRUD completo de productos con categorías, lotes, peso unitario, stock mínimo. Actualización rápida de stock y registro de mermas. Tabla desktop + cards móviles. |
| **Abastecimiento** | Motor de sugerencias ROP (punto de reorden). Workflow de aprobación: PENDIENTE → APROBADO_ADMIN → VALIDADO_GERENCIA → COMPRADO. Log completo de cada requerimiento. |
| **Movimientos** | Historial de ingresos, salidas y mermas. Filtros por tipo y búsqueda por producto/usuario/motivo. |

### Roles del sistema

| Rol | Contraseña | Permisos |
|---|---|---|
| **LOGISTICA** | `1234` | Crear productos, actualizar stock, registrar mermas, marcar compras |
| **PLANTA** | `5678` | Visualización + actualización de stock |
| **ADMIN** | `admin` | Todo + aprobar solicitudes como administración |
| **GERENCIA** | `master` | Todo + validar solicitudes como gerencia |

> ⚠️ Las contraseñas son de demostración. En producción se debe implementar autenticación real (Firebase Auth, etc.).

### Idiomas soportados

🇪🇸 Español · 🇺🇸 English · 🇨🇳 中文 · 🇯🇵 日本語

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| [Next.js](https://nextjs.org) | 14.2.5 | Framework React (App Router) |
| [React](https://react.dev) | 18.x | Librería UI |
| [Tailwind CSS](https://tailwindcss.com) | 3.4.x | Framework CSS utility-first |
| [Firebase / Firestore](https://firebase.google.com) | 10.12.2 | Base de datos en tiempo real |
| [Lucide React](https://lucide.dev) | 0.400.0 | Iconografía SVG |
| [date-fns](https://date-fns.org) | 3.6.0 | Formateo de fechas |
| [Radix UI](https://radix-ui.com) | Varios | Componentes accesibles (Dialog, Tabs, Select, Tooltip) |

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
| `productos` | Inventario de productos con stock, lote, vencimiento |
| `categorias` | Categorías de productos (Aves, Ganado, Porcinos, etc.) |
| `movimientos` | Historial de ingresos, salidas y mermas |
| `requerimientos` | Solicitudes de compra con workflow de aprobación |

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
├── .env.example              # Variables de entorno (plantilla)
├── .env.local                # Variables de entorno (no se sube a git)
├── next.config.js            # Configuración de Next.js
├── tailwind.config.js        # Configuración de Tailwind (colores brand, etc.)
├── package.json
│
├── scripts/
│   └── mockData.js           # Script de seed para datos de prueba
│
├── src/
│   ├── app/
│   │   ├── globals.css       # Estilos globales + componentes CSS (modal, btn, etc.)
│   │   ├── layout.js         # Layout raíz (sidebar + providers)
│   │   ├── page.js           # Dashboard principal (KPIs, semáforo, alertas ROP)
│   │   ├── not-found.js      # Página 404
│   │   ├── inventario/
│   │   │   └── page.js       # Gestión de inventario (CRUD, stock, mermas)
│   │   ├── compras/
│   │   │   └── page.js       # Abastecimiento (ROP, requerimientos, workflow)
│   │   └── mermas/
│   │       └── page.js       # Historial de movimientos
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.js     # Header con cambio de rol/idioma
│   │   │   └── Sidebar.js    # Navegación lateral responsive
│   │   └── ui/
│   │       └── SharedComponents.js  # KPICard, StockBar, SemaforoBadge, etc.
│   │
│   ├── context/
│   │   ├── LanguageContext.js  # i18n (es, en, zh, ja)
│   │   └── RoleContext.js      # Gestión de roles
│   │
│   ├── hooks/
│   │   └── useFirestore.js    # Hooks CRUD (Firebase + mock fallback)
│   │
│   └── lib/
│       ├── firebase.js        # Configuración Firebase
│       ├── mockDataStore.js   # Datos mockup para demo
│       └── utils.js           # Utilidades (formatDate, daysUntil, cn)
```

---

## 📊 Modelo de Datos (Firestore)

### Colección `productos`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | string | Nombre del producto |
| `categoria` | string | Nombre de la categoría |
| `stock_actual` | number | Cantidad actual en almacén |
| `stock_minimo_rop` | number | Punto de reorden (stock mínimo de seguridad) |
| `unidad` | string | Unidad de medida (sacos, kg, litros, bloques, etc.) |
| `fecha_vencimiento` | timestamp | Fecha de vencimiento del lote |
| `lote` | string | Código de lote |
| `peso_unitario` | number \| null | Peso por unidad en kg |
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
| `tipo` | string | `INGRESO`, `SALIDA` o `MERMA` |
| `cantidad` | number | Cantidad del movimiento |
| `usuario` | string | Quién realizó el movimiento |
| `fecha` | timestamp | Fecha del movimiento |
| `motivo_merma` | string \| null | Motivo (solo para mermas) |

### Colección `requerimientos`

| Campo | Tipo | Descripción |
|---|---|---|
| `solicitante` | string | Quién solicita |
| `estado` | string | `PENDIENTE`, `APROBADO_ADMIN`, `VALIDADO_GERENCIA`, `RECHAZADO`, `COMPRADO` |
| `items` | array | Lista de productos solicitados `[{producto_nombre, cantidad, justificacion}]` |
| `logs` | array | Historial de acciones `[{usuario, accion, fecha}]` |
| `fecha_creacion` | timestamp | Fecha de creación |

---

## 🔄 Workflow de Aprobaciones

```
Solicitud creada
       │
       ▼
  ┌─────────┐    ADMIN aprueba    ┌──────────────┐    GERENCIA valida    ┌───────────────────┐    LOGÍSTICA compra    ┌──────────┐
  │PENDIENTE│──────────────────▶ │APROBADO_ADMIN│──────────────────────▶│VALIDADO_GERENCIA │──────────────────────▶│COMPRADO  │
  └─────────┘                    └──────────────┘                       └───────────────────┘                       └──────────┘
       │                              │                                        │
       ▼                              ▼                                        ▼
  RECHAZADO                      RECHAZADO                                RECHAZADO
```

Cada cambio de estado queda registrado en el log con usuario, acción y fecha.

---

## 📱 Responsive Design

La aplicación está completamente optimizada para dispositivos móviles:

- **Sidebar**: Menú hamburguesa colapsable en móvil, fijo en desktop (lg+)
- **Tablas**: Vista desktop con tabla completa, vista móvil con cards
- **Modales**: Estilo "bottom sheet" en móvil, centrado en desktop
- **Filtros**: Scroll horizontal en categorías/tipos
- **Inputs**: Tamaño 16px en móvil para evitar zoom en iOS
- **Safe areas**: Soporte para notch/home indicator de iPhone
- **Touch targets**: Botones con mínimo 44px para accesibilidad táctil

---

## 🧪 Modo Demo (Mock Data)

Para ejecutar sin Firebase (ideal para presentaciones o desarrollo):

1. En `.env.local`, cambiar: `NEXT_PUBLIC_USE_MOCK=true`
2. La app cargará 20 productos de ejemplo, 5 categorías y movimientos de prueba
3. Todos los cambios son en memoria (se pierden al recargar)

Para poblar Firebase con datos iniciales:

```bash
npm run seed
```

> Requiere Firebase Admin SDK configurado en `scripts/mockData.js`.

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
