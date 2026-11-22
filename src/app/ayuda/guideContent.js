// ═══════════════════════════════════════════════════════════════════════════
//  Contenido de la guía de LogINV (/ayuda)
//  Cada sección: id (ancla), título, roles que pueden usarla, resumen,
//  capturas (public/ayuda/*.webp, generadas con scripts/captureGuide.mjs)
//  y pasos. Para actualizar la guía basta con editar este archivo.
// ═══════════════════════════════════════════════════════════════════════════

export const ALL = ['admin', 'encargado', 'voluntario'];
export const MANAGERS = ['admin', 'encargado'];
export const ADMIN = ['admin'];

export const GUIDE = [
    {
        id: 'primeros-pasos',
        title: 'Primeros pasos',
        icon: 'Rocket',
        roles: ALL,
        summary: 'Cómo entrar, moverte por la app y elegir la ubicación con la que vas a trabajar.',
        shots: [
            { src: '/ayuda/login.webp', caption: 'Pantalla de inicio de sesión' },
            { src: '/ayuda/menu-mas.webp', caption: 'En el celular, "Más" abre todas las secciones' },
        ],
        steps: [
            { title: 'Inicia sesión', text: 'Entra con el correo y la contraseña que te dio un administrador. Si la olvidaste, pídele que la restablezca desde Usuarios.' },
            { title: 'Instala la app en tu celular (opcional)', text: 'En Chrome (Android) toca ⋮ → "Agregar a la pantalla principal". En iPhone (Safari) toca Compartir → "Agregar a inicio". Se abrirá como una app normal.' },
            { title: 'Muévete por las secciones', text: 'En computadora usa el menú de la izquierda. En el celular usa la barra de abajo: Panel, Productos, Escanear, Inventario y "Más" para el resto de secciones, el tema claro/oscuro y cerrar sesión.' },
            { title: 'Elige tu ubicación', text: 'Arriba a la derecha está el selector de ubicación (📍). "Todas las ubicaciones" muestra todo; elige un salón o almacén para ver y gestionar solo lo que hay ahí. La app recuerda tu elección.' },
        ],
        tips: ['Solo verás las secciones que tu rol permite. Si necesitas más acceso, habla con un administrador.'],
    },
    {
        id: 'panel',
        title: 'Panel de control',
        icon: 'LayoutDashboard',
        roles: ALL,
        summary: 'El resumen del día: indicadores, pendientes, alertas de stock y la actividad más reciente.',
        shots: [{ src: '/ayuda/panel.webp', caption: 'Panel de control' }],
        steps: [
            { title: 'Accesos rápidos', text: 'Los botones Escanear, Conteo, Stock y Ubicaciones te llevan directo a las tareas más comunes.' },
            { title: 'Indicadores', text: 'Total de productos, cuántos están bajo su mínimo, conteos de hoy y diferencias del último conteo. Toca un indicador para ir al detalle.' },
            { title: 'Pendientes', text: 'Lista lo que requiere acción: préstamos vencidos, mantenimientos atrasados, conteos sin terminar y artículos bajo el mínimo. Toca cada fila para resolverlo.' },
            { title: 'Reportes', text: '"Exportar a Excel" descarga el inventario de la ubicación actual. "Reporte del último conteo" genera un PDF del último conteo finalizado.' },
        ],
    },
    {
        id: 'productos',
        title: 'Productos',
        icon: 'Package',
        roles: ALL,
        summary: 'El catálogo de todo lo que tiene la iglesia: buscar, ver detalle, crear, editar e imprimir etiquetas.',
        shots: [
            { src: '/ayuda/productos.webp', caption: 'Catálogo de productos' },
            { src: '/ayuda/producto-detalle.webp', caption: 'Detalle de un producto' },
        ],
        steps: [
            { title: 'Busca y filtra', text: 'Escribe el nombre o el código de barras. Usa los chips de categoría o "Bajo mínimo" para filtrar. El botón de cuadrícula/lista cambia la vista.' },
            { title: 'Mira el detalle', text: 'Toca un producto para ver su foto, stock, ubicación, estado, código de barras y fechas.' },
            { title: 'Crea o edita (encargado y admin)', text: 'Elige primero la ubicación y toca "Nuevo producto". Completa nombre, categoría, stock y stock mínimo. Puedes tomar una foto con la cámara. Para editar, abre el detalle y toca "Editar".' },
            { title: 'Imprime etiquetas', text: 'Toca "Imprimir etiquetas", marca los productos y pulsa "Imprimir". Se genera una hoja con los códigos de barras listos para pegar.' },
        ],
        tips: [
            'El "stock mínimo" es la cantidad por debajo de la cual el artículo aparece como "bajo mínimo". Si está exactamente en el mínimo, está bien.',
            'Si buscas algo que no está en tu ubicación, la app lo busca en todas y te lo indica.',
        ],
    },
    {
        id: 'escanear',
        title: 'Escanear códigos',
        icon: 'ScanBarcode',
        roles: ALL,
        summary: 'Encuentra un artículo al instante con la cámara o escribiendo su código.',
        shots: [
            { src: '/ayuda/escanear.webp', caption: 'Escanear con cámara o escribir el código' },
            { src: '/ayuda/escanear-no-encontrado.webp', caption: 'Código sin producto: crearlo o asignarlo' },
        ],
        steps: [
            { title: 'Escanea', text: 'Toca "Escanear con la cámara" y apunta al código de barras. La primera vez el navegador te pedirá permiso para usar la cámara.' },
            { title: 'Sin cámara', text: 'Escribe el código en el campo de abajo o usa un lector de códigos USB y pulsa "Buscar".' },
            { title: 'Si se encuentra', text: 'Verás el producto, su ubicación y su stock. "Ver / gestionar producto" lo abre en el catálogo.' },
            { title: 'Si no se encuentra', text: 'Puedes asignar el código a un producto existente (por ejemplo, uno sin etiqueta) o, si eres encargado, crear un producto nuevo con ese código.' },
        ],
    },
    {
        id: 'inventario',
        title: 'Inventario y conteos',
        icon: 'ClipboardList',
        roles: MANAGERS,
        summary: 'Cuenta lo que hay físicamente, registra entradas y salidas, y revisa el historial.',
        shots: [
            { src: '/ayuda/conteo.webp', caption: 'Conteo en curso' },
            { src: '/ayuda/conteo-tap.webp', caption: 'Registrar la cantidad contada' },
            { src: '/ayuda/rapido.webp', caption: 'Ingreso / salida rápida' },
        ],
        steps: [
            { title: 'Elige la ubicación', text: 'Los conteos se hacen por ubicación: selecciona el salón o almacén en el selector superior.' },
            { title: 'Inicia el conteo', text: 'En la pestaña "Conteo" toca "Nuevo conteo". Verás la lista de artículos de esa ubicación.' },
            { title: 'Cuenta cada artículo', text: 'Toca un artículo (o escanéalo). En la pantalla azul toca el botón grande una vez por cada unidad que veas (− resta uno, ↺ vuelve a cero) y pulsa "Confirmar". En la lista, verde = coincide con el sistema; ámbar = hay diferencia.' },
            { title: 'Guarda y finaliza', text: '"Guardar avance" guarda sin cerrar (puedes seguir otro día). "Finalizar conteo" cierra el conteo y ajusta el stock de los artículos con diferencia. Antes te pide confirmación.' },
            { title: 'Ingresos y salidas', text: 'En "Ingreso / salida" usa las flechas de cada artículo para sumar (verde) o restar (ámbar) unidades, indicando un motivo. También puedes escanear.' },
            { title: 'Historial', text: 'La pestaña "Historial" muestra los conteos finalizados; filtra por fechas y toca uno para ver el detalle.' },
        ],
        tips: ['Si cierras la pestaña a mitad de un conteo, la app guarda una copia en tu dispositivo y la recupera al volver.'],
    },
    {
        id: 'prestamos',
        title: 'Préstamos',
        icon: 'Handshake',
        roles: ALL,
        summary: 'Registra quién se lleva un artículo, hasta cuándo, y su devolución.',
        shots: [
            { src: '/ayuda/prestamos.webp', caption: 'Préstamos activos' },
            { src: '/ayuda/prestamo-nuevo.webp', caption: 'Nuevo préstamo' },
        ],
        steps: [
            { title: 'Nuevo préstamo', text: 'Toca "Nuevo préstamo", elige el artículo, escribe a quién se presta, un teléfono de contacto y la fecha de devolución.' },
            { title: 'Seguimiento', text: 'Las pestañas muestran los activos, los vencidos (pasó la fecha de devolución) y el historial.' },
            { title: 'Devolución', text: 'Cuando devuelvan el artículo, toca "Registrar devolución" y, si quieres, agrega una nota sobre su estado.' },
        ],
    },
    {
        id: 'ubicaciones',
        title: 'Ubicaciones',
        icon: 'MapPin',
        roles: MANAGERS,
        summary: 'Los salones, almacenes y espacios donde se guardan los artículos.',
        shots: [{ src: '/ayuda/ubicaciones.webp', caption: 'Ubicaciones' }],
        steps: [
            { title: 'Crear', text: 'Toca "Nueva ubicación", ponle nombre, piso, un ícono y su capacidad.' },
            { title: 'Activar / desactivar', text: 'Una ubicación inactiva deja de aparecer al crear productos, pero conserva su historial.' },
            { title: 'Eliminar', text: 'Solo se puede eliminar una ubicación sin productos. Mueve antes sus artículos a otra ubicación.' },
        ],
    },
    {
        id: 'mantenimiento',
        title: 'Mantenimiento',
        icon: 'Wrench',
        roles: MANAGERS,
        summary: 'Programa revisiones preventivas y registra reparaciones de equipos.',
        shots: [{ src: '/ayuda/mantenimiento.webp', caption: 'Mantenimientos programados' }],
        steps: [
            { title: 'Programar', text: 'Toca "Nuevo mantenimiento", elige el equipo, el tipo (preventivo, correctivo o emergencia), la fecha y el responsable.' },
            { title: 'Iniciar y completar', text: 'Cuando empiece el trabajo toca "Iniciar". Al terminar, "Completar" y registra el costo si lo hubo.' },
            { title: 'Atrasados', text: 'Si la fecha programada pasa sin iniciarse, aparece como atrasado aquí y en Pendientes del panel.' },
        ],
    },
    {
        id: 'reportes',
        title: 'Reportes',
        icon: 'FileText',
        roles: MANAGERS,
        summary: 'Resumen del inventario por categoría y ubicación, listo para exportar o imprimir.',
        shots: [{ src: '/ayuda/reportes.webp', caption: 'Reporte de inventario' }],
        steps: [
            { title: 'Revisa', text: 'Verás totales, unidades, artículos bajo mínimo y el desglose por categoría y ubicación.' },
            { title: 'Exporta', text: '"Exportar a Excel" descarga un archivo con todos los productos (incluye fotos). "Imprimir" genera una versión para papel o PDF.' },
        ],
    },
    {
        id: 'usuarios',
        title: 'Usuarios y roles',
        icon: 'Users',
        roles: ADMIN,
        summary: 'Crea las cuentas de acceso, asigna roles y gestiona contraseñas.',
        shots: [
            { src: '/ayuda/usuarios.webp', caption: 'Cuentas de acceso' },
            { src: '/ayuda/usuario-nuevo.webp', caption: 'Nueva cuenta con su rol' },
        ],
        steps: [
            { title: 'Crea la cuenta', text: 'Toca "Nueva cuenta", escribe nombre y correo, pulsa "Generar" para una contraseña segura y elige el rol.' },
            { title: 'Entrega el acceso', text: 'Al crearla aparece una tarjeta con los datos. "Copiar mensaje de bienvenida" copia un texto listo para enviar por WhatsApp o correo, con el enlace a esta guía.' },
            { title: 'Restablece una contraseña', text: 'Toca el lápiz de la cuenta → "Restablecer contraseña" y escribe o genera una nueva.' },
            { title: 'Desactiva o elimina', text: 'Desactivar bloquea el acceso sin borrar nada (se puede reactivar). Eliminar quita la cuenta para siempre. No puedes desactivarte ni eliminarte a ti mismo.' },
        ],
        tips: ['Da a cada persona el rol mínimo que necesita. Los voluntarios pueden consultar, escanear y registrar préstamos sin modificar el catálogo.'],
    },
    {
        id: 'auditoria',
        title: 'Auditoría',
        icon: 'ShieldCheck',
        roles: ADMIN,
        summary: 'El registro de quién hizo cada cambio y cuándo. No se puede editar ni borrar.',
        shots: [{ src: '/ayuda/auditoria.webp', caption: 'Registro de auditoría' }],
        steps: [
            { title: 'Consulta', text: 'Las acciones aparecen agrupadas por día, con la persona, lo que hizo y la hora.' },
            { title: 'Filtra', text: 'Busca por artículo o persona, elige el periodo (hoy, 7 días, 30 días, todo) y filtra por tipo de registro, acción o persona.' },
            { title: 'Exporta', text: '"Exportar CSV" descarga los registros filtrados para abrirlos en Excel.' },
        ],
    },
];

export const ROLE_MATRIX = [
    { label: 'Ver productos, escanear y registrar préstamos', roles: ALL },
    { label: 'Asignar un código de barras a un producto', roles: ALL },
    { label: 'Crear, editar y eliminar productos y categorías', roles: MANAGERS },
    { label: 'Conteos físicos e ingresos/salidas de stock', roles: MANAGERS },
    { label: 'Ubicaciones, mantenimiento y reportes', roles: MANAGERS },
    { label: 'Crear cuentas y cambiar roles', roles: ADMIN },
    { label: 'Ver la auditoría', roles: ADMIN },
];

export const FAQ = [
    { q: 'No veo una sección que necesito', a: 'Tu rol no tiene acceso. Pide a un administrador que revise tu rol en Usuarios.' },
    { q: 'La cámara no abre al escanear', a: 'Acepta el permiso de cámara del navegador (ícono del candado junto a la dirección). Si sigue sin funcionar, escribe el código a mano en la misma pantalla.' },
    { q: '¿Por qué un producto aparece "bajo mínimo"?', a: 'Su stock actual es menor que el stock mínimo definido para él. Edita el producto si el mínimo no es correcto.' },
    { q: 'Me equivoqué en una salida de stock', a: 'Registra un ingreso por la misma cantidad con el motivo "Corrección". Ambos movimientos quedan en el historial.' },
    { q: 'Olvidé mi contraseña', a: 'Un administrador puede asignarte una nueva desde Usuarios → editar tu cuenta → "Restablecer contraseña".' },
    { q: '¿Funciona sin internet?', a: 'Necesitas conexión para guardar cambios. Si se corta durante un conteo, tu avance queda guardado en el dispositivo hasta que vuelvas.' },
];
