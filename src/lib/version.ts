export interface VersionItem {
  version: string;
  date: string;
  notes: string[];
}

export const APP_VERSION = "v2.17.1";
export const APP_BUILD_DATE = "23/09/2026 15:05 hs";

export const APP_RELEASE_NOTES: string[] = [
  "Desactivación y Remoción de Solicitud de Cambio de Nombre: Se retiró de forma completa la opción para que los alumnos y usuarios soliciten el cambio de su nombre desde 'Mi Perfil' (UserProfileModal.tsx), asegurando la inmutabilidad de la identidad y datos filiatorios oficiales registrados por la institución.",
  "Limpieza de la Bandeja Directiva de Nombres (ConfiguracionTab.tsx y dashboard/page.tsx): Se removió la sección de 'Solicitudes de Cambio de Nombre' del panel de Configuración y sus flujos asociados de aprobación/rechazo, simplificando la interfaz de gestión institucional y eliminando código en desuso.",
  "Optimización de dataService y Depuración de Endpoints: Se descontinuaron las funciones de solicitud, cancelación, aprobación y rechazo de nombres en dataService.ts, manteniendo la coherencia de datos con Appwrite."
];

export const APP_VERSION_HISTORY: VersionItem[] = [
  {
    version: "v2.17.0",
    date: "17/09/2026 20:20 hs",
    notes: [
      "Selector de Curso Afectado en Registro de Licencias y Ausencias (NewAbsenceModal.tsx): Se incorporó un selector dinámico de 'Curso Afectado' tanto en la vista de escritorio como en la versión móvil optimizada para 120Hz. Permite a docentes y preceptores especificar si la inasistencia aplica a toda su carga horaria ('Todos los cursos') o acotarla con precisión a un curso determinado.",
      "Filtrado Automático de Materias según el Curso Seleccionado: Al elegir un curso específico, el campo 'Materias Afectadas' extrae y precarga de inmediato las materias que dicho profesor dicta en ese curso exacto, agregando la etiqueta identificatoria (ej: 'Asistencia Al Usuario (6to ETP - Doble Turno)').",
      "Agrupación Inteligente en el Menú Desplegable: El selector organiza los cursos en dos grupos claros: 'Cursos con Clases Asignadas al Docente' (ordenados alfabéticamente a partir de sus horarios reales) y 'Todos los Cursos de la Escuela', facilitando una selección inmediata sin perder flexibilidad.",
      "Segmentación Precisa de Horas Libres en el Panel Principal (FreeHoursWidget.tsx): El widget de horas libres ahora reconoce licencias acotadas a un curso puntual, de modo que solo se señalan como libres las horas correspondientes al curso y materias indicadas en la ausencia, preservando el dictado habitual en los demás cursos del docente."
    ]
  },
  {
    version: "v2.16.1",
    date: "17/09/2026 20:00 hs",
    notes: [
      "Restauración del Historial Completo de Inasistencias Docentes (page.tsx y AusenciasTab.tsx): Se corrigió la condición que ocultaba automáticamente las licencias pasadas cuando no había búsqueda activa, lo que impedía a los docentes consultar sus inasistencias anteriores en 'Tu Historial'. Se añadió además una barra de búsqueda dedicada para docentes y se flexibilizó el emparejamiento por ID y nombre.",
      "Horas Libres Filtradas para Alumnos en Pantalla Principal (GeneralTab.tsx y FreeHoursWidget.tsx): Se solucionó el valor fijo `isStudent={false}` en la pestaña general, permitiendo que los alumnos vean exclusivamente las horas libres de su propio curso. Se implementó además normalización de mayúsculas y espacios en el cotejo de profesores y cursos.",
      "Blindaje contra Errores de Propiedades Nulas e Indefinidas (DynamicQRModal, AssignStudentsModal, AlumnosTab, CicloLectivoTab): Se añadieron comprobaciones de nulidad y valores de respaldo en campos sensibles como `dni`, `materias`, `curso` y `email`, evitando caídas de la interfaz al filtrar o buscar registros incompletos.",
      "Normalización en Detección de Conflictos Horarios y Destinatarios de Avisos (NewScheduleModal.tsx y SendNoticeModal.tsx): La validación de solapamiento de horarios y el envío de avisos a cursos específicos ahora ignoran diferencias de espacios y mayúsculas, garantizando un control estricto de superposiciones y entregas efectivas de correos."
    ]
  },
  {
    version: "v2.16.0",
    date: "17/09/2026 19:50 hs",
    notes: [
      "Resolución de Exportación Vacía de Horarios en Excel (HorariosTab.tsx): Se corrigió la condición de filtrado donde la variable de curso asignaba por defecto 'Todos_Cursos', provocando que ninguna materia coincidiera en las celdas del archivo exportado. Ahora el generador evalúa dinámicamente el rol del usuario (docente, alumno, equipo directivo) y exporta con total exactitud todas las materias y horarios registrados.",
      "Modo Personalizado 'Mi Horario' para Docentes: Los profesores ahora disponen de una vista dedicada por defecto ('Mi Horario') que reúne todas sus clases asignadas a través de los diferentes cursos y turnos, con un botón para alternar entre ver sus propias materias o explorar la grilla institucional por curso.",
      "Exportación Inteligente por Rol: Al pulsar 'Descargar Excel', los docentes descargan su grilla personalizada (Mi_Horario_NombreProfesor.xlsx) con materia y curso en cada celda; los alumnos descargan el horario de su curso asignado (Mi_Horario_Curso.xlsx); y el equipo de gestión puede descargar tanto cursos individuales como el cronograma maestro institucional completo sin celdas vacías.",
      "Normalización de Espacios y Módulos Horarios: Se introdujo normalización insensible a espacios en blanco y mayúsculas en días y franjas horarias, asegurando coherencia al 100% entre los módulos de la base de datos y la grilla visual o exportada."
    ]
  },
  {
    version: "v2.15.1",
    date: "17/09/2026 16:30 hs",
    notes: [
      "Corrección y Sincronización de Horarios Históricos en Horas Libres Activas (FreeHoursWidget.tsx): Se identificó y resolvió la causa raíz por la cual clases con horario asignado figuraban como 'Hora a confirmar'. Los registros previos a la migración de esquema en Appwrite poseían el campo `hora: null`; se reconstruyeron y restauraron los módulos exactos (16:30 a 19:20 hs) correlacionando los registros con los logs de auditoría.",
      "Invalidación Reactiva de Caché Stale en getHorarios (dataService.ts): Si la caché en sessionStorage contiene elementos con 'Hora a confirmar', se invalida automáticamente forzando la lectura de los datos reparados desde Appwrite.",
      "Visualización en Alto Contraste con Módulos Reales: Las tarjetas de horas libres ahora presentan con exactitud las horas de inicio y fin de cada clase en una insignia distintiva roja, permitiendo a los cursos y preceptores conocer al instante qué horas tienen libres."
    ]
  },
  {
    version: "v2.15.0",
    date: "17/09/2026 16:25 hs",
    notes: [
      "Diferenciación Estatutaria de Licencias por Rol (Profesores, Preceptores y Directivos): Se investigó a fondo y se modeló la normativa educativa de Chubut (Ley VIII N° 20, Decreto 508/2026, Res. 517/90). Cada rol posee reglas específicas de afectación, límites, anticipación y restricciones institucionales.",
      "Reglas Específicas para Profesores: Afectación por horas cátedra y materias curriculares (generación de horas libres sin suplente). Art. 15 (máx. 2 días/mes), Art. 18 (hasta 3 días por examen), Art. 50 (aviso SAE dentro de los 45 min de inicio del turno).",
      "Reglas Específicas para Preceptores (POD / Auxiliares Docentes): Afectación por cargo continuo de planta institucional (turno completo de 4.5 hs). Art. 15 con restricción de simultaneidad (no más de 1 preceptor ausente por turno para garantizar el cuidado de alumnos). Art. 18 justifica la jornada completa del turno.",
      "Reglas Específicas para Directivos (Equipo de Conducción): Elevación preceptiva y formal a Supervisión Técnica Escolar de Región. Restricción estricta en períodos críticos (Res. 517/90: prohibido en los 20 días previos al cierre o 20 posteriores al inicio de ciclo lectivo). Designación reglamentaria de Vicedirección a cargo.",
      "Selector Interactivo de Rol en NewAbsenceModal.tsx: Segmented control con iconos oficiales de Lucide (GraduationCap, Clock, Building2) que adapta en tiempo real las insignias, la barra de progreso, las alertas de saturación y la tarjeta de cupos restantes.",
      "Tarjeta Enriquecida con Normativa Chubut: Despliegue de notas estatutarias oficiales, unidad de afectación del cargo, alertas preventivas institucionales y validación en vivo de días solicitados."
    ]
  },
  {
    version: "v2.14.0",
    date: "17/09/2026 16:15 hs",
    notes: [
      "Contador Dinámico y Reactivo de Licencias Docentes (NewAbsenceModal.tsx): Se transformó el texto estático de cupos por un contador en tiempo real que calcula con precisión los días utilizados y restantes de cada artículo por docente durante el ciclo lectivo actual.",
      "Tarjeta Interactiva de Cupo y Validación de Fechas en Vivo: Al seleccionar un artículo, se despliega una tarjeta con barra de progreso visual de días consumidos vs. disponibles y cálculo inmediato de la duración solicitada ('Solicitando N días · Quedarán X días restantes' o advertencia destacada en caso de superar el cupo disponible).",
      "Insignias Dinámicas en el Selector de Artículos: Cada artículo muestra en su pastilla el estado exacto de disponibilidad (ej: 'Quedan 4 de 6 d.' en verde, o '0 de 6 d. (Agotado)' en rojo/ámbar) recalculándose instantáneamente según el docente seleccionado.",
      "Panel Rápido de Cupos en Autogestión Docente (AusenciasTab.tsx): Los docentes pueden consultar de un vistazo sus saldos disponibles de los artículos más comunes (Art. 15 Razones Particulares, Art. 14 Familiar Enfermo, Art. 50 Salud) directamente en su pantalla principal.",
      "Cálculo Failsafe de Días y Acceso en dataService.ts: Implementación de calculateAbsenceDays y getAusencias con caché client-side para obtener cupos y duraciones de ausencias con máxima velocidad y sin latencia."
    ]
  },
  {
    version: "v2.13.3",
    date: "17/09/2026 16:03 hs",
    notes: [
      "Erradicación Completa de Emojis por Iconos Vectoriales (lucide-react): Se reemplazaron todos los emojis Unicode planos de la interfaz por iconos oficiales y semánticos de lucide-react (AlertTriangle, Check, X, Clock, PartyPopper, Sparkles, Lightbulb, Paperclip, GraduationCap, Zap, Edit3, ArrowUpRight) garantizando coherencia visual y renderizado perfecto en cualquier dispositivo.",
      "Iconos Reales en Horas Libres Activas (FreeHoursWidget.tsx): Se actualizó el icono de alerta/normalidad de la cabecera reemplazando el emoji ⚠️ por <AlertTriangle /> y ✓ por <Check />, las festividades por <PartyPopper />, y los enlaces de curso por flechas vectoriales <ArrowUpRight />.",
      "Incorporación de Regla Permanente en Contexto (AGENTS.md): Se estableció como norma crítica en las instrucciones del proyecto ('Zero Emojis for UI Icons') el uso exclusivo de la librería de iconos vectoriales lucide-react para botones, badges, alertas y estados, impidiendo el uso futuro de emojis Unicode en la UI."
    ]
  },
  {
    version: "v2.13.2",
    date: "17/09/2026 15:52 hs",
    notes: [
      "Espaciado y Claridad Visual en Avatares de Cursos (CursosTab.tsx): Se erradicó el diseño amontonado en la vista previa de alumnos por curso, reemplazando el solapamiento negativo (-space-x-2) y los halos oscuros gruesos por un diseño aireado con separación limpia (gap-1.5), bordes sutiles con micro-interacción al cursor, indicador flotante para excedentes (+N) y una insignia en pastilla para el total de alumnos."
    ]
  },
  {
    version: "v2.13.1",
    date: "17/09/2026 15:48 hs",
    notes: [
      "Corrección de Insignia 'NULL' en Horas Libres Activas (FreeHoursWidget.tsx): Se erradicó el error donde las tarjetas de horas libres mostraban una insignia roja con el texto 'NULL'. Ahora el valor se evalúa de manera estricta y muestra el horario exacto del módulo o 'Hora a confirmar' con icono de reloj.",
      "Decodificación y Parseo Failsafe de Horarios (dataService.ts): fromDbHora y toDbHora se blindaron para que jamás retornen 'null', 'undefined', '0' o strings vacíos frente a registros antiguos o sin módulo asignado en Appwrite, soportando mapeo flexible de módulos (1..16) y rangos horarios.",
      "Rediseño y Alto Contraste en Tarjetas de Horas Libres: Se sustituyó el fondo descolorido en modo oscuro por tarjetas temáticas pulidas (bg-[var(--bg3)]) con micro-animaciones al hover, datos de profesor legibles con icono y enlaces directos con contraste WCAG AA."
    ]
  },
  {
    version: "v2.13.0",
    date: "17/09/2026 15:40 hs",
    notes: [
      "Selector de Códigos de Área de Sudamérica (PhoneInputWithCountry.tsx): Integración de un selector desplegable interactivo con todos los países de Sudamérica (Argentina +54, Bolivia +591, Brasil +55, Chile +56, Colombia +57, Ecuador +593, Paraguay +595, Perú +51, Uruguay +598, Venezuela +58, Guyana +592, Surinam +597 y Guayana Francesa +594) con banderas oficiales y buscador en tiempo real.",
      "Limitador y Sanitizador Estricto de Dígitos Telefónicos: El campo restringe la entrada exclusivamente a números (0-9) e impone un límite máximo de dígitos ajustado al estándar del país seleccionado (ej: 11 dígitos para Argentina y Brasil, 9 para Chile/Uruguay/Perú/Bolivia), evitando caracteres extra o longitudes incorrectas.",
      "Contador de Dígitos y Validación en Vivo: Indicador visual dinámico que muestra los dígitos ingresados vs. el máximo del país (ej: 10/11), destacando en verde cuando se cumple el rango requerido y alertando en ámbar si no se alcanza el mínimo.",
      "Integración Total en Registro y Perfil Institucional: Disponible tanto en la pantalla de alta de cuenta (page.tsx) como en el panel de edición de Mi Perfil (UserProfileModal.tsx), con autodetección inteligente de prefijos existentes."
    ]
  },
  {
    version: "v2.12.0",
    date: "17/09/2026 15:25 hs",
    notes: [
      "Lector de Asistencia QR Integrado para Alumnos (StudentQRScannerModal.tsx): Ahora los alumnos pueden dar el presente directamente desde su celular o dispositivo con la cámara integrada en la plataforma, sin recurrir a aplicaciones de cámara externas ni salir del panel de la escuela.",
      "Decodificación Ultrarrápida con html5-qrcode: Integración de escáner nativo HTML5 para reconocimiento instantáneo de códigos QR dinámicos generados por preceptores (jornada institucional) y docentes (materia), con soporte para alternar entre cámara trasera y frontal en tiempo real.",
      "Seguridad Criptográfica y Antirretención (25s): Validación estricta de tiempo de vida del código QR en el cliente para impedir la reutilización de capturas de pantalla o fotografías compartidas por mensajería, garantizando la asistencia presencial.",
      "Feedback Háptico y Confirmación Visual Interactiva: Vibración háptica en dispositivos móviles al confirmar el registro, modal con marco animado y mira láser verde, tarjeta con el detalle de la jornada/materia, y actualización instantánea de las estadísticas de inasistencias en el panel del alumno.",
      "Acceso Directo Destacado en Asistencia (StudentAttendanceManager.tsx): Tarjeta de acción prominente en la sección de asistencia del alumno con botón directo para abrir la cámara y escanear en un solo toque."
    ]
  },
  {
    version: "v2.11.9",
    date: "17/09/2026 15:10 hs",
    notes: [
      "Cierre Automático al Deslizar en Sidebar Móvil (TopNavSidebar.tsx): Se corrigió el comportamiento en celulares donde al abrir el menú y deslizar hacia abajo se rompía el filtro de oscuridad por el rebote de scroll del navegador. Ahora, al deslizar hacia abajo en la parte superior del panel, la sidebar se cierra de inmediato en vez de desplazar el fondo.",
      "Bloqueo Antirrotura de Scroll en Fondo Móvil: Mientras el menú retráctil permanece abierto, se bloquea el scroll y rebote del cuerpo (overflow: hidden y overscroll-behavior: none), impidiendo cualquier desgarro visual o desplazamiento no deseado de la pantalla trasera.",
      "Overlay con Altura Dinámica y Cierre Táctil Instantáneo: El filtro oscuro adopta touch-none, overscroll-none y altura 100dvh, respondiendo de inmediato a cualquier toque o arrastre para replegar la barra lateral sin latencia.",
      "Tirador Visual Táctil para Celulares: Se incorporó una guía táctil centrada en la base del panel que indica visualmente que la barra puede replegarse hacia arriba o deslizarse para salir."
    ]
  },
  {
    version: "v2.11.8",
    date: "17/09/2026 15:02 hs",
    notes: [
      "Rediseño Visual de Alta Fidelidad en Cuenta en Verificación: Se transformó la pantalla de espera de aprobación en una experiencia institucional moderna con glassmorphism, isotipo oficial de EscuelaInfo, insignia dorada de estado con aura luminosa, y badge en tiempo real con indicador palpitante.",
      "Ficha de Datos Institucional y Eliminación de Textos Informales: Se erradicó la etiqueta 'Tu Gmail' reemplazándola por 'Correo Registrado' junto a iconos representativos para el Rol Solicitado y el Personal Habilitador correspondiente (Preceptores o Directivos).",
      "Línea de Tiempo (Stepper) con Alineación Matemática Perfecta: Se implementó una grilla simétrica de 3 pasos (Registro Completado, Revisión en Curso y Habilitación de Acceso) eliminando márgenes negativos y garantizando simetría perfecta en celulares y pantallas de cualquier resolución.",
      "Detección y Acceso Automático en Tiempo Real: La pantalla ahora realiza chequeos silenciosos periódicos y al reactivar la pestaña; en el momento exacto en que un directivo o preceptor aprueba al alumno o docente, el sistema lo detecta y lo traslada de inmediato al Dashboard.",
      "Botones de Acción con Jerarquía Visual y Microanimaciones: 'Verificar Estado de mi Cuenta' ahora es un botón primario vibrante en tono esmeralda con feedback de carga, y 'Cerrar Sesión' adopta un acabado sutil y armónico."
    ]
  },
  {
    version: "v2.11.7",
    date: "17/09/2026 14:52 hs",
    notes: [
      "Blindaje Total de Navegación y Buffer Protector en Dashboard: Se implementó una arquitectura de ancla base + buffer navegable en el historial del navegador (replaceState base + pushState activo). Presionar 'Atrás' en la pestaña de Inicio ('general') o hacer el gesto de retroceso en Android/iOS jamás expulsará al usuario fuera del Dashboard ni lo mandará a la pantalla de login.",
      "Protección Absoluta contra Destrucción Accidental de Sesión: Se eliminó el borrado forzado de sesión (deleteSession('current')) en la verificación inicial de page.tsx. Si el usuario tiene una sesión activa válida en Appwrite, el sistema lo conduce directamente al Dashboard sin eliminar sus credenciales ante latencias o verificaciones de perfil asíncronas.",
      "Navegación Fluida de Pestañas en Login y Registro (Login <-> Registro <-> Recuperación): Ahora cambiar entre 'Iniciar Sesión', 'Registrarse' y 'Recuperar Contraseña' sincroniza con el historial del navegador (/?mode=register). Presionar el botón 'Atrás' del celular mientras se visualiza el formulario de registro regresa automáticamente a 'Iniciar Sesión' de forma nativa sin cerrar ni recargar la aplicación.",
      "Aviso Suave de Cierre de Sesión Seguro: Al encontrarse en el Inicio del Dashboard e intentar retroceder, el sistema previene la salida y muestra una notificación orientativa recordando que para salir o cambiar de cuenta se debe utilizar el botón 'Cerrar Sesión' del menú lateral.",
      "Fallback Resiliente de Perfil por Correo Electrónico: Se agregó resolución automática de perfil institucional por correo electrónico en el Dashboard si no se localiza por UID de inmediato, impidiendo redirecciones falsas."
    ]
  },
  {
    version: "v2.11.6",
    date: "17/09/2026 14:38 hs",
    notes: [
      "Solución Definitiva a la Expulsión al Retroceder en Móvil: Se implementó router.replace en el flujo de inicio de sesión y auto-redirección de page.tsx, eliminando la pantalla de login del historial de navegación para que el botón 'Atrás' del navegador o celular jamás vuelva a la pantalla de acceso.",
      "Sincronización de Pestañas con Historial (window.history / popstate): Cambiar de sección en el Dashboard ahora registra la pestaña en la URL y en el historial. Al presionar el botón 'Atrás' o hacer el gesto de retroceso en Android/iOS, el usuario vuelve a la pestaña anterior ('Inicio') de forma suave en vez de abandonar la sesión.",
      "Cierre Automático de Modales y Menú con Botón 'Atrás': Al tener abierta una ventana emergente (Mi Perfil, Nueva Licencia, Mesas de Examen, Diálogos de Confirmación) o el menú superior retráctil, presionar 'Atrás' en el celular ahora cierra la ventana modal o el menú de forma natural sin desloguear ni recargar la página.",
      "Protección Antisalida en Dashboard Base: Se fijó el estado base en general con trampa de retroceso para que usuarios en la vista inicial no sean expulsados de la aplicación por toques accidentales hacia atrás."
    ]
  },
  {
    version: "v2.11.5",
    date: "17/09/2026 13:58 hs",
    notes: [
      "Corrección Crítica de Desbloqueo en Términos y Condiciones (TermsModal.tsx): Se corrigió el cálculo de scroll para pantallas móviles con subpíxeles y rebote inercial (Retina / AMOLED), implementando una tolerancia fiable (<= 15px o >= 95% de lectura) y una barra de progreso interactiva dinámica en tiempo real con botón directo de desplazamiento al final para evitar que los usuarios queden bloqueados sin poder aceptar.",
      "Scroll Seguro en Menú Retráctil Superior (TopNavSidebar.tsx): Se incorporó max-h-[calc(100dvh-3.5rem)] y desplazamiento vertical suave con overflow-y-auto, impidiendo que el perfil de usuario y el botón de 'Salir' queden cortados fuera de la pantalla en dispositivos móviles y vistas apaisadas.",
      "Visibilidad de Títulos de Sección en Dashboard Móvil: Se reemplazó la restricción hidden lg:flex de la cabecera por una barra responsiva integrada, asegurando que en celulares siempre esté visible el nombre de la sección activa (Asistencia, Ausencias, Horarios, Mesas de Examen, etc.).",
      "Tarjetas Táctiles y Accesibilidad Móvil en Alumnos (AlumnosTab.tsx): Las solicitudes de inscripción pendientes y el listado de alumnos ahora se renderizan en tarjetas móviles optimizadas con botones de acción grandes (≥ 44px de altura) para aprobar o rechazar con el pulgar, eliminando el scroll horizontal incómodo de tablas anchas.",
      "Alineación Responsiva en Mesas de Examen y Horarios: Se ajustaron la barra de búsqueda y botones de ExamBoardManager a anchos adaptables (w-full sm:w-64), el modal de mesas ahora utiliza max-h-[92dvh], y se eliminó el scale-105 en el selector de días de HorariosTab para erradicar cualquier jitter o desbordamiento subpixel.",
      "Optimización de Espaciado en Registro y Acceso (page.tsx): Ajuste de márgenes perimetrales para celulares y reorganización de los campos de DNI y teléfono a una columna en pantallas angostas para evitar textos apretados."
    ]
  },
  {
    version: "v2.11.4",
    date: "16/09/2026 23:05 hs",
    notes: [
      "Modal de Confirmación Contextual (Cancelar / Aprobar): Se rediseñó por completo el diálogo de confirmación (`askConfirm` / `confirmDialog`) del dashboard para adaptarse de manera inteligente a la acción solicitada. Al aprobar una licencia, ahora muestra el título 'Aprobar Licencia' y los botones 'Cancelar' y '✓ Aprobar' con fondo verde esmeralda, eliminando el texto genérico o destructivo 'Eliminar'.",
      "Diferenciación Semántica de Acciones: Las acciones de rechazo o revocación despliegan el botón rojo '✕ Rechazar' o 'Eliminar', las adhesiones a paro muestran 'Confirmar Adhesión' en tono ámbar de advertencia, y las aprobaciones destacan en verde con iconos correspondientes (`Check`, `ShieldAlert`, `AlertTriangle`).",
      "Gramática Precisa en Licencias Docentes (`AusenciasTab.tsx`): Se corrigió la redacción al presionar los estados de una licencia, mostrando con exactitud '¿Estás seguro de aprobar esta licencia?' o '¿Estás seguro de rechazar esta licencia?'."
    ]
  },
  {
    version: "v2.11.3",
    date: "16/09/2026 22:50 hs",
    notes: [
      "Corrección Crítica en Verificación OTP de Contraseña en Vercel Serverless: Se solucionó el fallo donde el sistema arrojaba 'No se encontró ningún código solicitado o ya expiró' en escuelainfo.vercel.app a pesar de haber recibido el correo correctamente.",
      "Validación Criptográfica Stateless (HMAC + Cookie): En entornos serverless donde cada petición HTTP puede ejecutarse en lambdas/contenedores aislados sin memoria compartida, el backend ahora genera un token HMAC firmado y una cookie segura HTTP-only que viajan al cliente para validar el código de 6 dígitos de forma atómica y 100% fiable.",
      "Integración Completa en Frontend (Perfil y Login): Se actualizaron 'Mi Perfil' (UserProfileModal.tsx) y 'Recuperar Contraseña' (page.tsx) para preservar y enviar el token de verificación junto al código ingresado, garantizando que el cambio de contraseña con Node-Appwrite se ejecute de manera inmediata y sin errores en producción."
    ]
  },
  {
    version: "v2.11.2",
    date: "16/09/2026 22:00 hs",
    notes: [
      "Avatares 100% Circulares (UserAvatar): Se actualizó el componente base para utilizar rounded-full en lugar de rounded-2xl, eliminando los bordes rectos laterales y logrando que todos los avatares sean círculos matemáticamente perfectos en todo el sistema.",
      "Eliminación de la Insignia de Estrella (✨): Se removió la estrella superpuesta sobre la foto de perfil en el registro para una apariencia limpia y minimalista.",
      "Corrección de Desbordamiento y Recorte en Campos de Nombre: Se rediseñó la disposición de Nombres y Apellidos junto al avatar (min-w-0 y apilamiento lateral), evitando que los campos se compriman o salgan de los bordes de la tarjeta, permitiendo que ambos campos conserven sus extremos redondeados completos sin cortes."
    ]
  },
  {
    version: "v2.11.1",
    date: "16/09/2026 21:55 hs",
    notes: [
      "Avatar Lateral Integrado (Sin Cajas Toscos): Se eliminó el recuadro voluminoso y todo el texto explicativo del avatar en el formulario de registro (`src/app/page.tsx`). El avatar ahora se ubica con elegancia al costado de los campos de Nombres y Apellidos, mutando en tiempo real de forma sutil y directa al tipear.",
      "Información Institucional en Pop-out Inferior: El banner de 'Registro General de la Institución' que ocupaba espacio prominente en la parte superior fue reubicado en la base del formulario como un botón desplegable (pop-out) discreto y no invasivo.",
      "Rediseño en Alta de Docentes (NewTeacherModal): Se aplicó la misma disposición lateral limpia al formulario de creación de profesores, eliminando recuadros innecesarios."
    ]
  },
  {
    version: "v2.11.0",
    date: "16/09/2026 21:45 hs",
    notes: [
      "Solicitud y Aprobación de Cambio de Nombre: Los usuarios pueden solicitar el cambio de su nombre completo desde 'Mi Perfil' con previsualización en vivo de su avatar mutado. La solicitud pasa a estado pendiente y requiere la aprobación previa de Directivos o Administradores desde el panel de Configuración.",
      "Bandeja de Aprobación de Nombres (ConfiguracionTab): Panel exclusivo para Directivos y Administradores que muestra en tiempo real las solicitudes de cambio de nombre, comparativa lado a lado del nombre actual vs. solicitado con sus respectivos avatares y botones de acción rápida ('Aprobar' o 'Rechazar').",
      "Sincronización Automática con Colecciones Vinculadas: Al aprobar un cambio de nombre, el sistema actualiza automáticamente el perfil del usuario y sincroniza su registro correspondiente en las tablas de alumnos o profesores, asegurando integridad de datos en todo el sistema.",
      "Cambio y Recuperación de Contraseña mediante Código OTP de 6 Dígitos: Se implementó un flujo de seguridad con verificación por correo electrónico. El usuario solicita un código numérico temporal enviado a su casilla y lo ingresa junto con su nueva clave.",
      "Integración en 'Mi Perfil' y '¿Olvidaste tu contraseña?': Disponible tanto dentro de la sesión activa del usuario (UserProfileModal) con temporizador de enfriamiento de 60 segundos y límite de intentos, como en la pantalla de bienvenida (src/app/page.tsx).",
      "Endpoints Seguros con Appwrite Server SDK: Se desarrollaron las rutas /api/auth/send-code y /api/auth/verify-code-reset respaldadas por Node-Appwrite (Users.updatePassword), protegiendo las credenciales y garantizando una experiencia sin fricciones ni enlaces externos caídos."
    ]
  },
  {
    version: "v2.10.10",
    date: "16/09/2026 21:25 hs",
    notes: [
      "Avatar Dinámico en Vivo al Crear Cuenta: Al registrarse en la plataforma (`src/app/page.tsx`), se despliega una tarjeta interactiva con vista previa en tiempo real donde el avatar muta, cambia de expresión, colores y formas dinámicamente con cada letra que se escribe en el nombre y apellido.",
      "Semilla Determinista Centrada en el Nombre (`UserAvatar`): Se ajustó el motor de `UserAvatar` para priorizar el nombre completo sobre el email, garantizando que el personaje visual visto en el registro sea idéntico al que acompañará al usuario en la barra superior, perfil y paneles.",
      "Animación Continua de Expresión (`animate=\"always\"`): El avatar en vivo parpadea, respira y cobra vida de forma interactiva mientras se completan los campos de registro.",
      "Avatar en Vivo para Docentes (`NewTeacherModal`): Se extendió la previsualización en vivo al formulario de alta de docentes para que los directivos también disfruten de la mutación del avatar al tipear el nombre del profesor."
    ]
  },
  {
    version: "v2.10.9",
    date: "16/09/2026 20:41 hs",
    notes: [
      "Optimización Integral de Rendimiento y Fluidez (60-120 FPS): Se desactivó el loop de Canvas y partículas en modo claro (0% consumo de CPU/GPU) y se optimizó en modo oscuro a 45 estrellas concéntricas sin `shadowBlur`, erradicando el lag y la sensación de trabado.",
      "TiltCards sin Re-renders de React: El resplandor interactivo de las tarjetas métricas (`TiltCard`) ahora se posiciona directamente vía variables CSS y caché de dimensiones, eliminando decenas de re-renders innecesarios por segundo al mover el cursor.",
      "Orbes Ambientales en GPU (FluidOrb): Se reemplazó el morphing continuo en JavaScript por animación CSS acelerada por hardware (`animate-ambient-float`), eliminando repintados pesados.",
      "Pausa Inteligente de Canvas en Scroll: La animación del fondo se suspende automáticamente durante el desplazamiento para asegurar una tasa de refresco estable y ultrafluida.",
      "Fluidez de Scroll y Memoización: Se eliminaron selectores CSS comodín y atributos `content-visibility` que generaban tirones de desplazamiento, junto con la memoización (`useMemo`) en el widget de horas libres."
    ]
  },
  {
    version: "v2.10.8",
    date: "16/09/2026 20:29 hs",
    notes: [
      "Corrección de Recorte en Modal de Mesas de Examen: Se implementó `createPortal` directo hacia el `document.body`, liberando la ventana modal del contenedor interno del Dashboard que provocaba que se viera cortada como dentro de una caja.",
      "Visualización en Pantalla Completa y Centrado: El formulario para crear o editar mesas de examen ahora flota libremente sobre el 100% de la pantalla con desenfoque de fondo (`backdrop-blur`) y sombras de profundidad.",
      "Scroll Interno Seguro y Accesibilidad: Incorporación de `max-h-[92vh]` con barra de desplazamiento suave para garantizar que todos los campos, tribunales, alumnos y botones de guardado sean completamente visibles y accesibles.",
      "Atajo de Cierre Rápido (Escape): Soporte nativo para cerrar la ventana modal presionando la tecla Escape o haciendo clic en el fondo oscuro."
    ]
  },
  {
    version: "v2.10.7",
    date: "16/09/2026 20:21 hs",
    notes: [
      "Rediseño y Jerarquía Visual en Modo Claro: Se rediseñó la paleta de modo claro (`--bg: #edf2f7`, `--bg2/bg3: #ffffff`, `--border: #d0d7de`), logrando que las tarjetas y tablas contrasten fuertemente con el fondo y terminen con el aspecto plano.",
      "Separación Nítida y Sombras de Elevación: Se aplicaron sombras ambientales multicapa suaves y bordes definidos para todas las tarjetas métricas (`TiltCard`), widget de horas libres, banner y tablas en modo claro.",
      "Estilo Glass Adaptativo: Integración de la clase `.glass` para modo claro con superficies blancas pulidas y bordes nítidos de alta definición.",
      "Contraste de Tablas y Filas: Cabeceras con fondo distintivo (`--bg4`) y líneas divisorias limpias que facilitan la lectura y separación de registros."
    ]
  },
  {
    version: "v2.10.6",
    date: "16/09/2026 20:11 hs",
    notes: [
      "Limpieza Visual de Cabecera y Banner: Se eliminó la insignia 'Panel Institucional Activo' y se retiró la tarjeta repetitiva del perfil en el banner de bienvenida (`GeneralTab`), logrando un diseño despejado y sin duplicidades.",
      "Duración Optimizada de Notificaciones (4 segundos): Se configuró la duración de todas las alertas y avisos de Sileo a 4 segundos para que desaparezcan rápidamente sin obstaculizar la navegación del usuario.",
      "Despacho Rápido en Estados de Acción: Las notificaciones resultantes de promesas (eliminación de ausencias, guardado y actualizaciones) ahora se descartan de forma ágil y automática.",
      "Centralización de Perfil: El acceso al perfil se mantiene limpio e intuitivo desde la barra de navegación superior y el menú lateral."
    ]
  },
  {
    version: "v2.10.5",
    date: "16/09/2026 19:55 hs",
    notes: [
      "Interactividad Completa en Tarjeta y Foto de Perfil: La tarjeta de bienvenida del Dashboard (`GeneralTab`) y la foto en la barra superior ahora son botones activos con `cursor-pointer` que abren el modal 'Mi Perfil' (`UserProfileModal`).",
      "Semántica y Accesibilidad en UserAvatar: Incorporación de la prop `onClick` con accesibilidad (`role=\"button\"`, `tabIndex={0}`) y adaptación dinámica del cursor y animación de escala para evitar falsas apariencias de botones en tablas estáticas.",
      "Acceso Directo al Perfil: Ahora tanto en el panel principal como en la barra superior y drawer móvil se puede pulsar directamente la ficha o foto del usuario para consultar datos o modificar contraseña.",
      "Microinteracción Consistente: Efectos hover sincronizados con el acento verde institucional y feedback háptico `active:scale-95`."
    ]
  },
  {
    version: "v2.10.4",
    date: "16/09/2026 19:38 hs",
    notes: [
      "Apertura Automática del Selector de Fechas (showPicker): Al hacer clic en cualquier campo de fecha (`input[type=\"date\"]`) o en sus etiquetas ('Desde', 'Hasta', etc.), el calendario nativo del navegador se abre de forma inmediata y automática.",
      "Prevención de Selección Accidental de Texto: Se eliminó el comportamiento del navegador que seleccionaba o resaltaba únicamente partes del texto ('dd / mm / aaaa'), facilitando la elección directa de fechas.",
      "Componente Global DatePickerEnhancer: Listener global seguro que detecta clics en campos de fecha y hora para invocar `showPicker()` en toda la plataforma.",
      "Actualización en Módulos y Modales: Integrado en Registro de Ausencias Docentes (`NewAbsenceModal`), Planilla de Asistencia Diaria (`StudentAttendanceManager`), Reportes Docentes (`NewTeacherReportModal`), Mesas de Examen (`ExamBoardManager`) y Calendario Institucional (`CalendarioTab`).",
      "Microinteracción y Accesibilidad: Estilos de cursor táctil e interactivo en todos los selectores e indicadores de fecha en `globals.css`."
    ]
  },
  {
    version: "v2.10.3",
    date: "16/09/2026 18:00 hs",
    notes: [
      "Corrección de Toasts Duplicados: Se eliminó por completo el renderizado doble heredado del sistema anterior donde coexistían un contenedor en la esquina superior derecha y otro en la esquina inferior (`.toast`).",
      "Eliminación de Estilos CSS Obsoletos: Limpieza integral de las reglas `.toast` y `.toast.show` en `globals.css` para centralizar la presentación exclusivamente en el contenedor físico de Sileo.",
      "Desacoplamiento de Modales: Retiro de avisos inline redundantes en modales y eliminación de props residuales `showToast` en `SendNoticeModal`, garantizando que cada evento despache una única alerta fluida.",
      "Reinicio en Limpio de Servidor: Purgado de caché y reinicio en caliente de Next.js Turbopack para sincronizar la UI del navegador."
    ]
  },
  {
    version: "v2.10.2",
    date: "16/09/2026 17:50 hs",
    notes: [
      "Unificación Total de Avatares y Fotos de Perfil (Blobatar): Se eliminaron todos los círculos con letras iniciales aisladas en la barra superior (Top Navigation Bar) y menú lateral móvil, reemplazándolos por el componente reactivo `UserAvatar`.",
      "Integración en Modal de Perfil ('Mi Perfil'): La cabecera del perfil y la pestaña de información ahora muestran el avatar personal del usuario en alta definición con animaciones continuas.",
      "Avatares en Tablas de Configuración y Colaboradores: Inclusión de avatares deterministas para cada solicitante y usuario activo en el módulo de accesos (`ConfiguracionTab`).",
      "Tarjeta de Bienvenida en Dashboard: Inclusión de la ficha de usuario y avatar animado en la cabecera principal (`GeneralTab`) con sincronización en tiempo real."
    ]
  },
  {
    version: "v2.10.1",
    date: "16/09/2026 17:40 hs",
    notes: [
      "Motor de Notificaciones Sileo (Físicas y Animaciones Fluidas): Reemplazo completo del sistema de alertas tradicional por Sileo (`sileo`), brindando notificaciones dinámicas, elásticas y basadas en física en toda la aplicación.",
      "Estados de Carga Reactivos (Sileo Promise): Integración de `notify.promise` en despachos de avisos institucionales por correo (`SendNoticeModal`), registro de licencias docentes (`NewAbsenceModal`), guardado de planillas de asistencia (`StudentAttendanceManager`) y migraciones de base de datos.",
      "Integración Global y Toaster Seguro: Montaje del componente `SileoToaster` en el Layout Raíz con sincronización de tema claro/oscuro y prevención total de errores de hidratación SSR.",
      "Unificación de Avisos y Acciones: Canalización centralizada de retroalimentación en todos los módulos (aprobaciones, matriculaciones, creación de horarios y gestión de colaboradores) a través de la utilidad unificada `notify`."
    ]
  },
  {
    version: "v2.10.0",
    date: "16/09/2026 17:00 hs",
    notes: [
      "Integración de Blobatar: Avatares geométricos deterministas generados dinámicamente a partir del nombre y email de cada alumno, docente y perfil de usuario en toda la plataforma.",
      "Rare UI (Tarjetas 3D Tilt): Efectos de perspectiva tridimensional y resplandor radial interactivo que sigue al cursor en tarjetas de cursos y métricas del Dashboard.",
      "Rare UI (Gravity Text): Título institucional animado con físicas elásticas de resortes que reaccionan al pasar el cursor.",
      "Rare UI (Fluid Orbs): Ambientación con orbes de gradiente líquido fluidos acelerados por hardware en cabeceras destacadas.",
      "Optimización Móvil (Regla 2): Separación condicional del DOM para desactivar efectos pesados en pantallas táctiles y mantener 60-120 FPS estables."
    ]
  },
  {
    version: "v2.9.2",
    date: "15/09/2026 21:10 hs",
    notes: [
      "Envío Automático de Correos en Segundo Plano: Se eliminó la apertura de Gmail Web (`mail.google.com`) tanto en el modal de Avisos Institucionales (`SendNoticeModal`) como en el formulario de consultas de la web (`ContactForm`). Ahora se procesan y envían automáticamente en el servidor a través de `/api/send-email`.",
      "Soporte CCO y Privacidad: El servicio de correo ahora admite destinatarios en Copia Oculta (BCC) y remitentes de respuesta (`replyTo`), garantizando la confidencialidad de los correos de alumnos y docentes.",
      "Feedback Visual y Prevención de Envíos Duplicados: Se agregaron estados de carga y spinners animados durante el despacho de avisos por correo."
    ]
  },
  {
    version: "v2.9.1",
    date: "15/09/2026 20:30 hs",
    notes: [
      "Optimización de Rendimiento Extrema (Memoización): Se previno el re-renderizado masivo de la tabla de asistencia implementando `React.memo` para las tarjetas y filas de alumnos. Ahora la plataforma responde instantáneamente al interactuar o tipear en el buscador.",
      "Automatización UX: La planilla de asistencia diaria ahora se carga y refresca automáticamente al seleccionar el curso o la fecha, eliminando la necesidad del botón manual 'Cargar Planilla'."
    ]
  },
  {
    version: "v2.9.0",
    date: "15/09/2026 19:30 hs",
    notes: [
      "Notificaciones por Email: Se integró nodemailer para enviar correos automáticos a 'skbcraft.info@gmail.com' cuando un docente solicita una licencia.",
      "Calendario Institucional: Nueva pestaña para gestionar Suspensiones Edilicias (ej. falta de agua, desinfección) que bloquean las tomas de asistencia.",
      "Retiro Masivo de Alumnos: Se implementó la selección múltiple en la tabla de asistencia para procesar retiros grupales con un solo clic.",
      "Falta Justificada: Se agregó un nuevo estado (J - Justificado) para los alumnos que no asisten por tener certificado. Este estado tampoco suma faltas.",
      "Confirmaciones de Seguridad: Se agregó un modal de confirmación antes de aprobar o rechazar licencias docentes."
    ]
  },
  {
    version: "v2.8.4",
    date: "10/09/2026 14:31 hs",
    notes: [
      "Parche de Seguridad Crítico (QR): Reducción del tiempo de expiración y tolerancia de códigos QR dinámicos a 25 segundos para prevenir la captura de pantalla y su envío remoto para fraude de asistencia.",
      "Limpieza Segura de Sesión: Aseguramiento de limpieza profunda del `sessionStorage` local al momento del cierre de sesión para evitar filtración de caché a otros usuarios en dispositivos compartidos."
    ]
  },
  {
    version: "v2.8.3",
    date: "10/09/2026 14:16 hs",
    notes: [
      "Restricción de Acceso a Novedades de Versión: Se restringió estrictamente la visualización de la versión del sistema y el modal de versiones (`VersionModal`) para que sea accesible única y exclusivamente por Administradores, ocultándolo por completo a directivos, preceptores, docentes y alumnos.",
      "Seguridad y Privacidad de la Interfaz: Eliminación de insignias interactivas de versión en cabeceras de navegación y menús laterales para roles no autorizados."
    ]
  },
  {
    version: "v2.8.2",
    date: "10/09/2026 14:13 hs",
    notes: [
      "Modularización profunda del panel de control (Dashboard): Se eliminaron más de 1500 líneas de código del archivo principal, delegando la lógica de renderizado a componentes independientes por cada pestaña.",
      "Optimización de estado y renderizado: Las pestañas del Dashboard ahora operan de manera aislada, mejorando el rendimiento de React y previniendo re-renderizados innecesarios del layout general.",
      "Limpieza de código duplicado: Se unificaron funciones de gestión de estado duplicadas para asegurar la integridad de datos y evitar errores en producción."
    ]
  },
  {
    version: "v2.8.1",
    date: "09/09/2026 16:52 hs",
    notes: [
      "Capa de Compatibilidad y Puentes de Enrutamiento: Implementación de archivos puente en `src/components/` para los 23 componentes reestructurados.",
      "Resolución Total de Módulos: Garantía de que cualquier importación existente resuelva de forma inmediata tanto en compilación como en el editor.",
      "Doble Compatibilidad de Rutas: Soporte transparente tanto para rutas modulares profundas como para rutas planas clásicas."
    ]
  },
  {
    version: "v2.8.0",
    date: "09/09/2026 16:15 hs",
    notes: [
      "Refactorización Arquitectónica Profunda: Reestructuración masiva del código fuente separando los archivos monolíticos en directorios específicos (`components/modals`, `components/layout`, `components/shared`, `features`).",
      "Optimización de Importaciones: Actualización automática y segura de cientos de rutas de importación en el sistema para garantizar la estabilidad del proyecto.",
      "Estandarización de Directorios: Nueva carpeta de `features` dedicada a encapsular la lógica de negocio compleja (ej. Manejador de Asistencia y Panel de Exámenes), mejorando significativamente la mantenibilidad a largo plazo.",
      "Desacoplamiento de UI: Separación total de componentes de Layout y Modales en toda la base de código Next.js."
    ]
  },
  {
    version: "v2.7.0",
    date: "09/09/2026 15:50 hs",
    notes: [
      "Unificación del sistema de asistencias: Ahora la pestaña 'Asistencias' incluye tanto el sistema de QR dinámico como la toma manual de asistencia en el aula para alumnos sin celular.",
      "Nuevo diseño del botón de Asistencias: Se reemplazó el icono de QR por el icono de asistencia de alumnos (UserCheck), unificando visualmente ambas modalidades.",
      "Validadores de seguridad estrictos: Verificación en tiempo real de formato de correo electrónico y números de teléfono celular en perfiles y registros.",
      "Refactor integral de Appwrite SDK v24: Adaptación de la API a las últimas convenciones de Appwrite, eliminando advertencias de métodos deprecados.",
      "Compatibilidad y robustez de renderizado: Corrección de advertencias de hidratación provocadas por extensiones del navegador y aislamiento de elementos dinámicos.",
      "Historial de Versiones Anteriores: Nuevo apartado interactivo en la ventana de novedades para consultar todas las actualizaciones históricas del sistema."
    ]
  },
  {
    version: "v2.6.1",
    date: "03/09/2026 17:36 hs",
    notes: [
      "Resolución de error 404 en el escáner QR en GitHub Pages mediante la configuración estricta de rutas estáticas (`trailingSlash: true`).",
      "Corrección del sistema de redirección para celulares: ahora, si escaneas sin estar logueado, serás llevado al Inicio para ingresar y luego devuelto automáticamente a tu asistencia.",
      "Nuevo sistema de Asistencia por QR dinámico: los profesores y preceptores pueden generar un código QR de corta expiración (15s) desde el panel de Cuerpo Docente.",
      "Escaneo directo: los alumnos pueden escanear el QR con sus dispositivos para registrar su presente automáticamente, de forma segura y antifraude.",
      "Navegación interactiva global: haz clic en cualquier profesor en el Inicio, Horarios o Cuerpo Docente para ir directamente a sus ausencias."
    ]
  },
  {
    version: "v2.5.0",
    date: "28/08/2026 11:20 hs",
    notes: [
      "Optimización integral de rendimiento para dispositivos móviles (eliminación de animaciones pesadas y DOM separation).",
      "Carga perezosa (lazy loading) de modales pesados mediante `next/dynamic` para reducir el bundle inicial.",
      "Actualización del sistema de temas claro y oscuro sin parpadeo visual (FOUC)."
    ]
  },
  {
    version: "v2.0.0",
    date: "15/08/2026 14:00 hs",
    notes: [
      "Reescritura del panel general de EscuelaInfo con arquitectura modular Next.js.",
      "Integración completa de base de datos en tiempo real con Appwrite Cloud.",
      "Gestión integral de profesores, alumnos, cursos, horarios y auditoría de eventos."
    ]
  }
];
