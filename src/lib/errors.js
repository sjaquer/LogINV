// ═══════════════════════════════════════════════════════════════════════════
//  Diccionario de errores - LogINV
//  Cada error que la persona puede ver tiene un código corto (ej. RED-01),
//  un título, una explicación en lenguaje sencillo y qué hacer. El código
//  aparece en el aviso flotante para que quien lo vea pueda reportarlo
//  ("me salió RED-01") y se pueda ubicar aquí de inmediato.
//
//  Uso:
//    throw new AppError('INV-01', { vars: { codigo } });   // error propio
//    toast.error(err);                                       // cualquier error
//    reportError(err);                                       // fuera de React
//
//  Para agregar un error: añade una entrada a ERRORS y, si viene de una
//  librería, su traducción en FIREBASE_CODES / ERROR_NAMES / MESSAGE_PATTERNS.
//  La guía de ayuda (/ayuda#errores) se genera a partir de este archivo.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {object} ErrorEntry
 * @property {string} title    Título corto del aviso.
 * @property {string|((vars: object) => string)} message  Qué pasó.
 * @property {string} [hint]   Qué puede hacer la persona.
 * @property {'error'|'warning'} [severity]  'warning' = no es grave / se resuelve solo.
 */

export const ERROR_GROUPS = {
    AUTH: 'Inicio de sesión y cuenta',
    PERM: 'Permisos',
    RED: 'Conexión',
    DATOS: 'Datos y guardado',
    INV: 'Inventario',
    USR: 'Usuarios',
    VAL: 'Formularios',
    CAM: 'Cámara y escáner',
    IMG: 'Fotos',
    DRIVE: 'Google Drive',
    SRV: 'Servidor',
    APP: 'Aplicación',
};

/** @type {Record<string, ErrorEntry>} */
export const ERRORS = {
    // ── Inicio de sesión y cuenta ──────────────────────────────────────────
    'AUTH-01': { title: 'Correo o contraseña incorrectos', message: 'Los datos no coinciden con ninguna cuenta.', hint: 'Revisa que el correo esté bien escrito y que no tengas activadas las mayúsculas.' },
    'AUTH-02': { title: 'Correo no válido', message: 'El correo ingresado no tiene un formato válido.', hint: 'Debe verse como nombre@correo.com.' },
    'AUTH-03': { title: 'Demasiados intentos', message: 'Por seguridad se bloquearon los intentos por unos minutos.', hint: 'Espera un momento y vuelve a intentarlo.', severity: 'warning' },
    'AUTH-04': { title: 'Cuenta deshabilitada', message: 'Esta cuenta fue deshabilitada.', hint: 'Habla con un administrador del inventario.' },
    'AUTH-05': { title: 'Tu sesión expiró', message: 'Por seguridad necesitas volver a iniciar sesión.', hint: 'Cierra sesión e ingresa de nuevo.', severity: 'warning' },
    'AUTH-06': { title: 'Usuario no registrado', message: 'Tu correo no está registrado en el inventario de la iglesia.', hint: 'Pide a un administrador que te dé acceso.' },
    'AUTH-07': { title: 'Cuenta desactivada', message: 'Tu acceso al inventario está desactivado.', hint: 'Habla con un administrador para reactivarlo.' },
    'AUTH-08': { title: 'Correo ya registrado', message: 'Ya existe una cuenta con ese correo.', hint: 'Usa otro correo o edita la cuenta existente.' },
    'AUTH-09': { title: 'Contraseña muy débil', message: 'La contraseña debe tener al menos 6 caracteres.', hint: 'Usa una combinación de letras y números.' },
    'AUTH-10': { title: 'Inicio de sesión no configurado', message: 'La conexión con el servicio de cuentas no está configurada correctamente.', hint: 'Avisa al encargado técnico del sistema.' },

    // ── Permisos ───────────────────────────────────────────────────────────
    'PERM-01': { title: 'Sin permisos', message: 'Tu rol no permite realizar esta acción.', hint: 'Si crees que deberías poder hacerlo, habla con un administrador.' },

    // ── Conexión ───────────────────────────────────────────────────────────
    'RED-01': { title: 'Sin conexión', message: 'No hay conexión a internet o el servidor no responde.', hint: 'Revisa el wifi o los datos móviles y vuelve a intentarlo.', severity: 'warning' },
    'RED-02': { title: 'Tardó demasiado', message: 'El servidor tardó demasiado en responder.', hint: 'Vuelve a intentarlo en unos segundos.', severity: 'warning' },
    'RED-03': { title: 'Servicio saturado', message: 'Se alcanzó el límite de uso por el momento.', hint: 'Espera unos minutos antes de volver a intentar.', severity: 'warning' },

    // ── Datos y guardado ───────────────────────────────────────────────────
    'DATOS-01': { title: 'Ya no existe', message: (v) => `${v.que || 'El registro'} ya no existe; puede que alguien lo haya eliminado.`, hint: 'Actualiza la página para ver los datos más recientes.' },
    'DATOS-02': { title: 'Registro duplicado', message: (v) => (v.codigo ? `Ya existe un registro con el código ${v.codigo}.` : 'Ya existe un registro con esos datos.'), hint: 'Cambia el nombre o el código e inténtalo otra vez.' },
    'DATOS-03': { title: 'Falta un índice', message: 'La base de datos necesita un índice para esta consulta.', hint: 'Avisa al encargado técnico; mientras tanto la lista se muestra sin ordenar.', severity: 'warning' },
    'DATOS-04': { title: 'Cambio simultáneo', message: 'Otra persona modificó este dato al mismo tiempo.', hint: 'Vuelve a intentarlo; se usarán los datos más recientes.', severity: 'warning' },
    'DATOS-05': { title: 'Dato no válido', message: 'Uno de los valores no se puede guardar.', hint: 'Revisa los campos del formulario.' },
    'DATOS-06': { title: 'Operación cancelada', message: 'La operación se canceló antes de terminar.', hint: 'Vuelve a intentarlo.', severity: 'warning' },
    'DATOS-07': { title: 'Registro demasiado grande', message: 'El registro supera el tamaño máximo permitido (suele pasar con fotos muy pesadas).', hint: 'Usa una foto más liviana.' },
    'DATOS-08': { title: 'No se pudieron cargar los datos', message: (v) => `No se pudo cargar ${v.que || 'la información'}.`, hint: 'Revisa tu conexión y recarga la página.' },

    // ── Inventario ─────────────────────────────────────────────────────────
    'INV-01': { title: 'Código ya asignado', message: (v) => (v.codigo ? `El código ${v.codigo} ya pertenece a otro artículo.` : 'Ese código ya pertenece a otro artículo.'), hint: 'Escanea otro código o revisa el artículo que ya lo tiene.' },
    'INV-02': { title: 'Ubicación con artículos', message: (v) => `No se puede eliminar: todavía tiene ${v.cantidad ?? 'varios'} artículos asignados.`, hint: 'Mueve los artículos a otra ubicación antes de eliminarla.' },
    'INV-03': { title: 'Stock insuficiente', message: 'No hay unidades disponibles suficientes para esta operación.', hint: 'Revisa el stock actual del artículo.' },

    // ── Usuarios ───────────────────────────────────────────────────────────
    'USR-01': { title: 'Acción no permitida sobre tu cuenta', message: 'No puedes desactivarte, quitarte el rol de administrador ni eliminar tu propia cuenta.', hint: 'Pide a otro administrador que lo haga.' },
    'USR-02': { title: 'Cuenta sin correo', message: 'Esta persona no tiene un correo registrado.', hint: 'Edita la cuenta y agrega su correo.' },

    // ── Formularios ────────────────────────────────────────────────────────
    'VAL-01': { title: 'Revisa el formulario', message: 'Falta un dato obligatorio o tiene un formato incorrecto.', hint: 'Completa los campos marcados.' },

    // ── Cámara y escáner ───────────────────────────────────────────────────
    'CAM-01': { title: 'Permiso de cámara denegado', message: 'El navegador no tiene permiso para usar la cámara.', hint: 'Toca el candado junto a la dirección web y permite el acceso a la cámara.' },
    'CAM-02': { title: 'No se encontró una cámara', message: 'Este dispositivo no tiene una cámara disponible.', hint: 'Usa un celular o escribe el código a mano.' },
    'CAM-03': { title: 'Cámara ocupada', message: 'Otra aplicación está usando la cámara.', hint: 'Cierra otras apps que usen la cámara y vuelve a intentarlo.' },
    'CAM-04': { title: 'Conexión no segura', message: 'La cámara solo funciona en páginas seguras (https).', hint: 'Abre el inventario desde su dirección oficial.' },

    // ── Fotos ──────────────────────────────────────────────────────────────
    'IMG-01': { title: 'Tipo de archivo no permitido', message: 'Solo se aceptan fotos JPG, PNG, WebP o GIF.', hint: 'Elige otra imagen.' },
    'IMG-02': { title: 'Foto demasiado pesada', message: (v) => `La foto supera el máximo de ${v.max || 5} MB incluso comprimida.`, hint: 'Toma la foto con menor resolución o elige otra.' },
    'IMG-03': { title: 'No se pudo procesar la foto', message: 'La imagen está dañada o en un formato que el navegador no puede leer.', hint: 'Prueba con otra foto.' },

    // ── Google Drive ───────────────────────────────────────────────────────
    'DRIVE-01': { title: 'Google Drive no configurado', message: 'El guardado de fotos en Google Drive no está configurado.', hint: 'La foto se guardará igual dentro del sistema.', severity: 'warning' },
    'DRIVE-02': { title: 'Error al subir a Google Drive', message: 'No se pudo subir la foto a Google Drive.', hint: 'Vuelve a intentarlo más tarde.', severity: 'warning' },
    'DRIVE-03': { title: 'Autorización de Google cancelada', message: 'No se completó el permiso de acceso a Google Drive.', hint: 'Vuelve a intentarlo y acepta el permiso.', severity: 'warning' },

    // ── Servidor ───────────────────────────────────────────────────────────
    'SRV-01': { title: 'Servidor sin configurar', message: 'Las credenciales de administración del servidor no están configuradas.', hint: 'Avisa al encargado técnico del sistema.' },
    'SRV-02': { title: 'Error del servidor', message: 'El servidor tuvo un problema al procesar la solicitud.', hint: 'Vuelve a intentarlo; si se repite, reporta el código.' },
    'SRV-03': { title: 'Servicio no disponible', message: 'El servicio no está disponible en este momento.', hint: 'Vuelve a intentarlo en unos minutos.', severity: 'warning' },

    // ── Aplicación ─────────────────────────────────────────────────────────
    'APP-01': { title: 'Error inesperado', message: 'Ocurrió un error que no esperábamos.', hint: 'Vuelve a intentarlo; si se repite, reporta el código y lo que estabas haciendo.' },
    'APP-02': { title: 'La pantalla falló', message: 'Esta sección no se pudo mostrar.', hint: 'Recarga la página o vuelve al panel.' },
    'APP-03': { title: 'Hay una versión nueva', message: 'Se publicó una actualización del inventario.', hint: 'Recarga la página para usar la versión más reciente.', severity: 'warning' },
};

// ── Traducciones desde Firebase (Auth, Firestore y Admin SDK) ──────────────
const FIREBASE_CODES = {
    'invalid-credential': 'AUTH-01', 'invalid-login-credentials': 'AUTH-01', 'wrong-password': 'AUTH-01', 'user-not-found': 'AUTH-01',
    'invalid-email': 'AUTH-02', 'missing-email': 'AUTH-02',
    'too-many-requests': 'AUTH-03',
    'user-disabled': 'AUTH-04',
    'user-token-expired': 'AUTH-05', 'requires-recent-login': 'AUTH-05', 'id-token-expired': 'AUTH-05', 'id-token-revoked': 'AUTH-05', 'unauthenticated': 'AUTH-05',
    'email-already-in-use': 'AUTH-08', 'email-already-exists': 'AUTH-08',
    'weak-password': 'AUTH-09', 'invalid-password': 'AUTH-09', 'missing-password': 'AUTH-09',
    'invalid-api-key': 'AUTH-10', 'operation-not-allowed': 'AUTH-10', 'configuration-not-found': 'AUTH-10', 'app-not-authorized': 'AUTH-10', 'no-app': 'AUTH-10',
    'permission-denied': 'PERM-01', 'insufficient-permission': 'PERM-01',
    'network-request-failed': 'RED-01', 'unavailable': 'RED-01',
    'deadline-exceeded': 'RED-02', 'timeout': 'RED-02',
    'resource-exhausted': 'RED-03', 'quota-exceeded': 'RED-03',
    'not-found': 'DATOS-01',
    'already-exists': 'DATOS-02',
    'aborted': 'DATOS-04', 'failed-precondition': 'DATOS-04',
    'invalid-argument': 'DATOS-05', 'out-of-range': 'DATOS-05',
    'cancelled': 'DATOS-06',
    'internal': 'SRV-02', 'data-loss': 'SRV-02', 'unknown': 'APP-01',
};

// ── Traducciones por nombre del error (navegador) ──────────────────────────
const ERROR_NAMES = {
    NotAllowedError: 'CAM-01', PermissionDeniedError: 'CAM-01',
    NotFoundError: 'CAM-02', DevicesNotFoundError: 'CAM-02', OverconstrainedError: 'CAM-02',
    NotReadableError: 'CAM-03', TrackStartError: 'CAM-03',
    SecurityError: 'CAM-04',
    AbortError: 'DATOS-06', TimeoutError: 'RED-02',
    ChunkLoadError: 'APP-03',
};

// ── Último recurso: reconocer el mensaje ───────────────────────────────────
const MESSAGE_PATTERNS = [
    [/missing or insufficient permissions/i, 'PERM-01'],
    [/requires an index|index.*(create|required)/i, 'DATOS-03'],
    [/failed to fetch|networkerror|network request failed|load failed|err_internet/i, 'RED-01'],
    [/loading (css )?chunk .* failed|failed to fetch dynamically imported module|importing a module script failed/i, 'APP-03'],
    [/unsupported field value|invalid data|function (setdoc|adddoc|updatedoc)\(\) called with invalid/i, 'DATOS-05'],
    [/exceeds the maximum allowed size|longer than \d+ bytes/i, 'DATOS-07'],
    [/notallowederror|permission denied|permission dismissed/i, 'CAM-01'],
    [/notfounderror|requested device not found|no camera/i, 'CAM-02'],
    [/notreadableerror|could not start video source|trackstarterror/i, 'CAM-03'],
    [/only secure origins|secure context/i, 'CAM-04'],
    [/popup_closed|popup_failed|access_denied/i, 'DRIVE-03'],
    [/firebase admin no (está configurad|pudo cargarse)|credenciales de google drive/i, 'SRV-01'],
    [/firebase no está inicializado/i, 'AUTH-10'],
];

const HTTP_STATUS = {
    400: 'VAL-01', 401: 'AUTH-05', 403: 'PERM-01', 404: 'DATOS-01', 408: 'RED-02', 409: 'DATOS-02',
    413: 'IMG-02', 429: 'RED-03', 500: 'SRV-02', 502: 'SRV-03', 503: 'SRV-03', 504: 'RED-02',
};

/** Error con código del diccionario. `message` (opcional) reemplaza el texto genérico por uno más específico. */
export class AppError extends Error {
    /**
     * @param {string} code  clave de ERRORS (ej. 'INV-01')
     * @param {{ message?: string, vars?: object, cause?: unknown }} [opts]
     */
    constructor(code, { message, vars = {}, cause } = {}) {
        const entry = ERRORS[code] || ERRORS['APP-01'];
        super(message || renderMessage(entry, vars), cause ? { cause } : undefined);
        this.name = 'AppError';
        this.appCode = ERRORS[code] ? code : 'APP-01';
        this.vars = vars;
        this.custom = Boolean(message);
    }
}

function renderMessage(entry, vars = {}) {
    return typeof entry.message === 'function' ? entry.message(vars) : entry.message;
}

/** Determina el código del diccionario para cualquier error. */
export function errorCode(err) {
    if (!err) return 'APP-01';
    if (err.appCode && ERRORS[err.appCode]) return err.appCode;
    if (typeof err === 'string') return matchMessage(err) || 'APP-01';

    const fbCode = typeof err.code === 'string' ? err.code.replace(/^(auth|firestore|storage|app)\//, '') : '';
    if (fbCode === 'failed-precondition' && /index/i.test(err.message || '')) return 'DATOS-03';
    if (FIREBASE_CODES[fbCode]) return FIREBASE_CODES[fbCode];
    if (err.name && ERROR_NAMES[err.name]) return ERROR_NAMES[err.name];

    const byMessage = matchMessage(err.message || '');
    if (byMessage) return byMessage;
    if (err.status && HTTP_STATUS[err.status]) return HTTP_STATUS[err.status];
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'RED-01';
    return 'APP-01';
}

function matchMessage(msg) {
    const hit = MESSAGE_PATTERNS.find(([re]) => re.test(msg));
    return hit ? hit[1] : null;
}

/**
 * Convierte cualquier error en un objeto listo para mostrar.
 * @returns {{ code: string, title: string, message: string, hint?: string, severity: 'error'|'warning', detail: string }}
 */
export function describeError(err) {
    const code = errorCode(err);
    const entry = ERRORS[code];
    // Mensajes propios en español (AppError con texto, respuestas de nuestra
    // API) se muestran tal cual; los técnicos quedan solo en `detail`.
    const custom = err?.custom || err?.serverMessage;
    let message = custom ? err.message : renderMessage(entry, err?.vars);
    // Error no reconocido: se adjunta el texto original (recortado) para poder identificarlo.
    const raw = typeof err === 'string' ? err : err?.message;
    if (code === 'APP-01' && raw && !custom) message = `${message} Detalle: ${raw.length > 140 ? `${raw.slice(0, 140)}…` : raw}`;
    return {
        code,
        title: entry.title,
        message,
        hint: entry.hint,
        severity: entry.severity || 'error',
        detail: typeof err === 'string' ? err : [err?.code, err?.message].filter(Boolean).join(' · '),
    };
}

/** Envuelve un error de librería en un AppError (conserva el original en `cause`). */
export function toAppError(err) {
    if (err instanceof AppError) return err;
    const e = new AppError(errorCode(err), { cause: err });
    if (err?.serverMessage) { e.message = err.message; e.custom = true; }
    return e;
}

/** Texto para copiar y enviar a soporte. */
export function errorReport(info) {
    const where = typeof window !== 'undefined' ? window.location.pathname : '';
    return [
        `LogINV · ${info.code} · ${info.title}`,
        info.message,
        info.detail && info.detail !== info.message ? `Detalle: ${info.detail}` : '',
        `Pantalla: ${where} · ${new Date().toLocaleString('es')}`,
    ].filter(Boolean).join('\n');
}

// ── Reporte global (para código fuera de componentes, ej. suscripciones) ──
export const ERROR_EVENT = 'loginv:error';

/** Muestra el error como aviso flotante desde cualquier parte de la app. */
export function reportError(err, { context } = {}) {
    const info = describeError(err);
    console.error(`[LogINV] ${info.code}${context ? ` (${context})` : ''}:`, err);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(ERROR_EVENT, { detail: { error: err } }));
    }
    return info;
}

/** Lista ordenada por grupo, para la guía de ayuda. */
export function errorCatalog() {
    return Object.entries(ERROR_GROUPS).map(([group, label]) => ({
        group,
        label,
        items: Object.entries(ERRORS)
            .filter(([code]) => code.startsWith(`${group}-`))
            .map(([code, e]) => ({ code, title: e.title, message: renderMessage(e, {}), hint: e.hint })),
    })).filter(g => g.items.length);
}
