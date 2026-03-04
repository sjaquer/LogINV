# 📖 Guía de Usuario – MolinoINV

## Sistema de Inventario para Empresa Agroindustrial de Alimento Balanceado

---

## 🏠 Índice

1. [Primeros pasos](#1-primeros-pasos)
2. [Navegación general](#2-navegación-general)
3. [Dashboard – Panel de control](#3-dashboard--panel-de-control)
4. [Inventario – Gestión de productos](#4-inventario--gestión-de-productos)
5. [Abastecimiento – Compras y sugerencias](#5-abastecimiento--compras-y-sugerencias)
6. [Movimientos – Historial de operaciones](#6-movimientos--historial-de-operaciones)
7. [Cambio de rol](#7-cambio-de-rol)
8. [Cambio de idioma](#8-cambio-de-idioma)
9. [Uso en celular](#9-uso-en-celular)
10. [Preguntas frecuentes](#10-preguntas-frecuentes)

---

## 1. Primeros pasos

### ¿Qué es MolinoINV?

MolinoINV es un sistema web para controlar el inventario del almacén de tu empresa agroindustrial. Te permite:

- **Saber cuánto stock tienes** de cada producto en tiempo real
- **Recibir alertas** cuando un producto está por debajo del mínimo de seguridad
- **Ver productos próximos a vencer** con un semáforo visual
- **Registrar entradas y salidas** de mercancía
- **Registrar mermas** (pérdidas por humedad, rotura, vencimiento, roedores, etc.)
- **Gestionar solicitudes de compra** con aprobaciones por rol

### Acceso al sistema

1. Abre tu navegador web (Chrome, Safari, Firefox, Edge)
2. Ingresa la URL del sistema proporcionada por tu administrador
3. No necesitas crear cuenta – el sistema funciona con **roles predefinidos**
4. Al entrar, estarás con el rol de **LOGÍSTICA** por defecto

---

## 2. Navegación general

### Barra lateral (Sidebar)

La barra lateral te permite navegar entre las secciones principales:

| Icono | Sección | Descripción |
|---|---|---|
| 📊 | **Dashboard** | Resumen general con indicadores clave |
| 📦 | **Inventario** | Lista de productos, stock, crear/editar productos |
| 🛒 | **Abastecimiento** | Sugerencias de compra y workflow de aprobaciones |
| 📋 | **Movimientos** | Historial de ingresos, salidas y mermas |

**En celular**: La barra lateral está oculta. Toca el botón ☰ (tres líneas) en la esquina superior izquierda para abrirla. Toca fuera del menú o selecciona una opción para cerrarla.

**En computadora**: La barra lateral está fija a la izquierda y siempre visible.

### Cabecera (Header)

En la parte superior de cada página encontrarás:

- **Título** de la sección actual
- **Selector de rol** (esquina derecha) → para cambiar entre roles
- **Selector de idioma** (banderita) → Español, English, 中文, 日本語

---

## 3. Dashboard – Panel de control

El Dashboard es tu página principal. Muestra un resumen rápido del estado del almacén.

### Tarjetas KPI (indicadores clave)

Las 4 tarjetas superiores muestran:

| Tarjeta | Qué indica |
|---|---|
| 🟡 **Alertas de Reposición** | Cantidad de productos que están por debajo del stock mínimo |
| 🔴 **Mermas del mes** | Cantidad de registros de pérdida en el mes actual |
| 🔵 **Solicitudes pendientes** | Requerimientos de compra esperando aprobación |
| 🟢 **Total productos** | Cantidad total de SKU (productos) en el catálogo |

### Semáforo de vencimientos

La tabla/lista de semáforo muestra los productos ordenados por urgencia de vencimiento:

| Color | Significado |
|---|---|
| 🔴 Rojo | Vence en **menos de 3 días** – acción inmediata requerida |
| 🟡 Amarillo | Vence en **menos de 7 días** – planificar uso o despacho |
| 🟢 Verde | Vencimiento **OK** – sin urgencia |

**¿Qué hacer?**
- Productos en 🔴: Despachar primero, verificar si aún están en condiciones
- Productos en 🟡: Programar su uso prioritario
- Productos en 🟢: Sin acción inmediata necesaria

### Alertas de compra (ROP)

El panel derecho muestra productos cuyo stock actual está **por debajo del mínimo de seguridad** (punto de reorden). Indica cuántas unidades necesitas reponer.

---

## 4. Inventario – Gestión de productos

### Ver el inventario

1. Click en **"Inventario"** en la barra lateral
2. Verás la lista completa de productos
3. Usa la **barra de búsqueda** para encontrar un producto por nombre o lote
4. Usa los **botones de categoría** para filtrar (Todas, Aves, Ganado, Porcinos, etc.)

### Crear un nuevo producto

> Requiere rol: LOGISTICA, ADMIN o GERENCIA

1. Click en el botón **"+ Nuevo Producto"** (parte superior)
2. Se abre un formulario con los siguientes campos:

| Campo | Obligatorio | Descripción |
|---|---|---|
| Producto | ✅ Sí | Nombre completo (ej: "Saco Alimento Pollo Engorde x40kg") |
| Categoría | ✅ Sí | Seleccionar de la lista |
| Unidad | No | Unidad de medida (sacos, kg, litros, etc.) |
| Stock actual | No | Cantidad inicial en almacén |
| Mínimo (ROP) | No | Punto de reorden – cuándo se debe reabastecer |
| Peso por unidad | No | Peso en kg de cada unidad |
| Lote | No | Código de lote (ej: L-2026-0301) |
| Vencimiento | No | Fecha de vencimiento del lote |
| Proveedor | No | Nombre del proveedor |
| Descripción | No | Notas adicionales |

3. Click en **"Crear Producto"**
4. El producto aparecerá en la lista y en Firebase inmediatamente

### Editar un producto

> Requiere rol: LOGISTICA, ADMIN o GERENCIA

- **En computadora**: Click en el ícono ✏️ (lápiz) en la fila del producto
- **En celular**: En la card del producto, toca **"Editar"**
- Se abre el mismo formulario con los datos actuales precargados
- Modifica lo necesario y click en **"Guardar Cambios"**

### Eliminar un producto

> Requiere rol: LOGISTICA, ADMIN o GERENCIA

- Click en el ícono 🗑️ (papelera) del producto
- Confirma la eliminación en el diálogo de confirmación
- **⚠️ Esta acción es irreversible**

### Actualizar stock (entrada de mercancía)

1. Click en un producto (fila de la tabla o card del producto)
2. Se abre el modal de **Stock**
3. Verás el stock actual, mínimo y nivel de stock
4. En la pestaña **"📦 Actualizar Stock"**:
   - Usa los botones **+** y **−** para ajustar la cantidad
   - O escribe directamente el número
   - Usa los botones rápidos (+1, +5, +10, +25, +50)
5. Click en **"✅ Actualizar Stock"**
6. Se registra automáticamente un movimiento de tipo INGRESO

### Registrar una merma (pérdida)

1. Click en un producto para abrir el modal de Stock
2. Selecciona la pestaña **"🗑️ Registrar Merma"**
3. Ingresa la **cantidad** de pérdida
4. Escribe el **motivo** (obligatorio): humedad, rotura de saco, producto vencido, roedores, etc.
5. Click en **"🗑️ Registrar Merma"**
6. El stock se reduce automáticamente y se registra un movimiento de tipo MERMA

### Gestionar categorías

> Requiere rol: LOGISTICA, ADMIN o GERENCIA

1. Click en **"⚙️ Gestión Categorías"** (parte superior del inventario)
2. Puedes:
   - **Ver** las categorías existentes
   - **Editar** el nombre de una categoría (ícono ✏️)
   - **Eliminar** una categoría (ícono 🗑️)
   - **Agregar** una nueva categoría con nombre, descripción, ícono y color

---

## 5. Abastecimiento – Compras y sugerencias

### Pestaña: Sugerencias por ROP

El **Motor de Reposición** analiza automáticamente qué productos necesitan ser comprados:

- Muestra todos los productos cuyo **stock actual ≤ stock mínimo (ROP)**
- Para cada producto indica:
  - **Stock actual** vs **mínimo definido**
  - **Cantidad a comprar** (déficit)
  - **Porcentaje** de nivel de stock (representado en un círculo)
- Los productos se ordenan por urgencia (menor porcentaje primero)

**¿Qué hacer?** Usar esta lista como referencia para generar órdenes de compra a proveedores.

### Pestaña: Requerimientos y firmas

El sistema incluye un **workflow de aprobación** de 4 pasos para las solicitudes de compra:

```
PENDIENTE → APROBADO (Admin) → VALIDADO (Gerencia) → COMPRADO (Logística)
```

**Según tu rol puedes:**

| Rol | Acción disponible |
|---|---|
| ADMIN | Aprobar ✔ o Rechazar ✘ solicitudes pendientes |
| GERENCIA | Validar ✔ o Rechazar ✘ solicitudes aprobadas por Admin |
| LOGISTICA | Marcar como comprado 🛒 las solicitudes validadas por Gerencia |

**Para ver el historial** de una solicitud, click en **"Ver Log"** para ver la línea de tiempo completa con quién hizo cada acción y cuándo.

---

## 6. Movimientos – Historial de operaciones

### ¿Qué muestra esta sección?

El registro completo de todas las operaciones que afectaron el stock:

| Tipo | Descripción | Color |
|---|---|---|
| **INGRESO** | Entrada de mercancía al almacén | 🟢 Verde |
| **SALIDA** | Despacho o salida de mercancía | ⚪ Gris |
| **MERMA** | Pérdida registrada (humedad, rotura, etc.) | 🔴 Rojo |

### Resumen superior

Las 3 tarjetas muestran el total de cada tipo de movimiento:
- **Mermas**: Total de registros de pérdida
- **Entradas**: Total de ingresos
- **Salidas/Despachos**: Total de salidas

### Filtrar movimientos

1. Usa la **barra de búsqueda** para buscar por producto, usuario o motivo
2. Usa los **botones de tipo** para filtrar: Todas, MERMA, INGRESO, SALIDA
3. Por defecto se muestran las **MERMAS** filtradas

### Información de cada movimiento

- **Tipo**: Badge de color indicando INGRESO, SALIDA o MERMA
- **Producto**: Nombre del producto afectado
- **Cantidad**: Con signo + o − según el tipo
- **Usuario**: Quién realizó la operación
- **Fecha**: Cuándo se realizó
- **Motivo**: Solo para mermas – descripción del motivo de pérdida

---

## 7. Cambio de rol

El sistema permite simular diferentes roles para ver los permisos de cada uno:

1. Click en el **botón de usuario** (esquina superior derecha del header)
2. Se despliega la lista de roles disponibles
3. Selecciona el rol al que deseas cambiar
4. Ingresa la **contraseña** del rol:

| Rol | Contraseña |
|---|---|
| Jefe Logística Paredes | `1234` |
| Jefe de Planta Rodríguez | `5678` |
| Administrador Quispe | `admin` |
| Gerente General Mendoza | `master` |

5. Si la contraseña es correcta, el rol cambia inmediatamente
6. El nombre del usuario y los permisos se actualizan en toda la app

> 💡 Cada rol tiene diferentes botones de acción disponibles según la sección.

---

## 8. Cambio de idioma

1. Click en el botón **🌐** (globo) en la esquina superior derecha
2. Selecciona uno de los 4 idiomas disponibles:
   - 🇪🇸 **Español** (predeterminado)
   - 🇺🇸 **English**
   - 🇨🇳 **中文** (Chino simplificado)
   - 🇯🇵 **日本語** (Japonés)
3. Toda la interfaz se traduce inmediatamente

---

## 9. Uso en celular

MolinoINV está completamente optimizado para celulares y tablets:

### Navegación

- El **menú lateral** se oculta automáticamente en pantallas pequeñas
- Toca el botón **☰** (arriba a la izquierda) para ver el menú
- Toca fuera del menú o selecciona una opción para cerrarlo

### Tablas → Cards

- En computadora verás **tablas** completas con todas las columnas
- En celular, las tablas se convierten en **tarjetas (cards)** con la información esencial
- Cada card muestra: nombre, categoría, stock, semáforo y acciones

### Formularios y Modales

- Los formularios aparecen como **hojas desde abajo** (bottom sheet) en celular
- Se pueden cerrar arrastrando o tocando fuera
- Los campos están optimizados para teclados móviles

### Filtros

- Los botones de filtro (categorías, tipos) se pueden **deslizar horizontalmente** si no caben en pantalla

### Consejos para celular

- Usa el celular en **posición vertical** para mejor experiencia
- Los textos largos se recortan automáticamente (toca para ver completo)
- Los botones de acción en las cards tienen tamaño adecuado para tocar con el dedo

---

## 10. Preguntas frecuentes

### ❓ ¿Los datos se guardan?

**Sí.** Todo se guarda en Firebase (nube de Google) en tiempo real. Si cierras el navegador y vuelves a entrar, tus datos estarán ahí.

### ❓ ¿Puedo usar la app sin internet?

**No.** Se necesita conexión a internet para comunicarse con Firebase. Si quedas sin conexión, los cambios se sincronizarán automáticamente cuando vuelvas a tener internet (Firestore tiene caché offline por defecto).

### ❓ ¿Qué pasa si elimino un producto por error?

La eliminación es permanente. No hay papelera de reciclaje. Los movimientos asociados al producto permanecen en el historial.

### ❓ ¿Cómo sé si un producto necesita ser comprado?

Revisa:
1. Las **Alertas ROP** en el Dashboard (tarjeta amarilla)
2. La sección **Abastecimiento → Sugerencias por ROP**
3. La **barra de nivel** en el inventario (roja = crítico, amarilla = bajo, verde = OK)

### ❓ ¿Varias personas pueden usar la app al mismo tiempo?

**Sí.** Firebase sincroniza los datos en tiempo real. Si alguien actualiza el stock, todos los demás usuarios ven el cambio inmediatamente sin recargar la página.

### ❓ ¿Las contraseñas de los roles son seguras?

**No.** Las contraseñas actuales (1234, 5678, admin, master) son de demostración. Para un entorno de producción, se debe implementar Firebase Authentication con credenciales reales.

### ❓ ¿Cómo agrego una nueva categoría?

1. Ve a **Inventario**
2. Click en **"⚙️ Gestión Categorías"**
3. En la parte inferior del modal, escribe el nombre
4. Selecciona un ícono y color
5. Click en **"Agregar Categoría"**

### ❓ ¿Qué significa ROP?

**ROP = Reorder Point** (Punto de Reorden). Es la cantidad mínima de stock a partir de la cual se debe generar una orden de compra para evitar desabastecimiento. Cada producto tiene su propio ROP configurado.

### ❓ ¿Puedo exportar los datos?

Actualmente no hay función de exportación integrada. Los datos están en Firebase/Firestore y pueden ser exportados directamente desde Firebase Console o mediante scripts personalizados.

---

<p align="center">
  <strong>¿Necesitas ayuda adicional?</strong><br/>
  Contacta al administrador del sistema o consulta el archivo README.md para información técnica.
</p>
