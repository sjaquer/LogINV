# PLAN DE MODULARIZACIÓN Y REDISEÑO - LogINV v2.0

## 🎯 Objetivo
Transformar el sistema monolítico actual en una arquitectura modular escalable para **inventario de iglesia**, con soporte para múltiples ubicaciones, control de usuarios, préstamos, mantenimiento e imágenes en Google Drive.

## Decisiones del Proyecto

| Aspecto | Decisión |
|---------|----------|
| **Tipos de items** | Mobiliario, equipos electrónicos, artículos litúrgicos (mixto) |
| **Ubicaciones** | Sin predefinidas - el usuario crea todas las ubicaciones desde cero |
| **Funcionalidades** | CRUD + Préstamo + Mantenimiento |
| **Imágenes** | Google Drive |
| **Iconos** | Nuevos iconos diseñados para cada módulo |
| **Autenticación** | Firebase Auth real |
| **Reportes** | Básico (PDF) |
| **Tiempo** | Sin límite - implementación completa |

---

## FASE 1: Preparación

1. Crear estructura de carpetas del proyecto
2. Instalar dependencias faltantes (date-fns, clsx, tailwind-merge)
3. Crear archivos de constantes y helpers

## FASE 2: Modularización Core

4. Extraer hooks de `useFirestore.js` → 6 archivos separados
5. Extraer componentes de `inventario/page.js` → 8 archivos
6. Extraer componentes de `productos/page.js` → 8 archivos
7. Extraer componentes de Dashboard → 6 archivos
8. Crear componentes UI compartidos (Button, Modal, etc.)

## FASE 3: Nuevos Módulos

9. Crear módulo de Ubicaciones (CRUD completo)
10. Crear módulo de Préstamos (CRUD + devoluciones)
11. Crear módulo de Mantenimiento (programación + historial)
12. Integrar Google Drive para imágenes

## FASE 4: Seguridad y Auth

13. Migrar a Firebase Auth real
14. Implementar sistema de roles (admin/encargado/voluntario)
15. Crear sistema de auditoría
16. Actualizar reglas de Firestore

## FASE 5: UI/UX

17. Diseñar e implementar nuevos iconos SVG
18. Actualizar navegación (Sidebar + BottomNav)
19. Crear sistema de reportes PDF
20. Optimizar responsive design

## FASE 6: Testing y Optimización

21. Testing de todos los módulos
22. Optimización de performance
23. Documentación

---

## Estructura Final del Proyecto

```
src/
├── app/
│   ├── layout.js
│   ├── page.js                    # Dashboard
│   ├── globals.css
│   ├── auth/page.js               # Login (Firebase Auth)
│   ├── inventory/
│   │   ├── page.js                # Lista principal
│   │   ├── [id]/page.js           # Detalle de item
│   │   ├── create/page.js         # Crear item
│   │   └── edit/[id]/page.js      # Editar item
│   ├── categories/page.js
│   ├── locations/
│   │   ├── page.js                # Gestión de ubicaciones
│   │   └── [id]/page.js           # Detalle de ubicación
│   ├── loans/
│   │   ├── page.js                # Préstamos activos
│   │   ├── history/page.js
│   │   └── create/page.js
│   ├── maintenance/
│   │   ├── page.js
│   │   ├── history/page.js
│   │   └── schedule/page.js
│   ├── reports/page.js
│   ├── admin/
│   │   ├── users/page.js
│   │   └── settings/page.js
│   └── scan/page.js
├── components/
│   ├── layout/ (Header, Sidebar, BottomNav, MainContent)
│   ├── ui/ (Button, Modal, Input, Select, Table, Card, Badge, Alert, Loading)
│   ├── inventory/ (ItemCard, ItemForm, ItemDetail, BarcodeScanner, ImageUploader)
│   ├── locations/ (LocationCard, LocationForm, LocationSelector)
│   ├── loans/ (LoanCard, LoanForm, ReturnModal)
│   ├── maintenance/ (MaintenanceCard, MaintenanceForm, StatusBadge)
│   ├── reports/ (InventoryReport, MovementsReport, MaintenanceReport)
│   ├── dashboard/ (KPICards, RecentActivity, StockAlerts, QuickActions)
│   └── common/ (PageHeader, EmptyState, ErrorBoundary, ConfirmDialog)
├── hooks/
│   ├── index.js
│   ├── useFirestore.js
│   ├── useCategorias.js
│   ├── useProductos.js
│   ├── useLocations.js
│   ├── useLoans.js
│   ├── useMaintenance.js
│   ├── useUsers.js
│   ├── useAudit.js
│   ├── useGoogleDrive.js
│   ├── useEscapeKey.js
│   └── useFirestoreQuery.js
├── context/
│   ├── AuthContext.js
│   ├── LocationContext.js
│   ├── ThemeContext.js
│   └── SidebarContext.js
├── services/
│   ├── firebase.js
│   ├── auth.js
│   ├── googleDrive.js
│   └── firestore/
│       ├── index.js
│       ├── productos.js
│       ├── categorias.js
│       ├── ubicaciones.js
│       ├── movimientos.js
│       ├── prestamos.js
│       ├── mantenimientos.js
│       ├── conteos.js
│       ├── usuarios.js
│       └── auditoria.js
├── lib/
│   ├── utils.js
│   ├── constants.js
│   ├── validators.js
│   ├── formatters.js
│   └── mockHelpers.js
└── styles/
    └── globals.css
```

---

## Modelo de Datos Firestore

```javascript
productos: {
  id, nombre, descripcion, categoria_id, ubicacion_id,
  codigo_barras, id_inventario, imagen_url,
  estado: 'disponible' | 'prestado' | 'mantenimiento' | 'dado_de_baja',
  cantidad, cantidad_minima,
  fecha_adquisicion, fecha_ultimo_mantenimiento, proximo_mantenimiento,
  notas, created_at, updated_at
}

ubicaciones: {
  id, nombre, descripcion, capacidad, activa, created_at
}

prestamos: {
  id, producto_id, ubicacion_origen, prestado_a, contacto,
  fecha_prestamo, fecha_devolucion_esperada, fecha_devolucion_real,
  estado: 'activo' | 'devuelto' | 'vencido',
  notas, created_by, created_at
}

mantenimientos: {
  id, producto_id, tipo: 'preventivo' | 'correctivo',
  descripcion, estado: 'programado' | 'en_progreso' | 'completado',
  fecha_programada, fecha_inicio, fecha_fin, costo,
  responsable, notas, created_at
}

usuarios: {
  id, nombre, email, rol: 'admin' | 'encargado' | 'voluntario',
  permisos: { inventario, prestamos, mantenimiento, reportes, administracion },
  activo, created_at
}

auditoria: {
  id, usuario_id, accion, entidad, entidad_id,
  detalles, timestamp
}
```

---

## Sistema de Roles

| Rol | Inventario | Préstamos | Mantenimiento | Reportes | Admin |
|-----|------------|-----------|---------------|----------|-------|
| **Admin** | ✅ CRUD completo | ✅ CRUD completo | ✅ CRUD completo | ✅ Ver todos | ✅ Gestión usuarios |
| **Encargado** | ✅ CRUD completo | ✅ CRUD completo | ✅ Ver/Crear | ✅ Ver | ❌ |
| **Voluntario** | ✅ Ver/Buscar | ✅ Crear préstamo | ❌ | ❌ | ❌ |
