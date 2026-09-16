export interface VersionItem {
  version: string;
  date: string;
  notes: string[];
}

export const APP_VERSION = "v2.10.4";
export const APP_BUILD_DATE = "16/09/2026 19:38 hs";

export const APP_RELEASE_NOTES: string[] = [
  "Apertura Automática del Selector de Fechas (showPicker): Al hacer clic en cualquier campo de fecha (`input[type=\"date\"]`) o en sus etiquetas ('Desde', 'Hasta', etc.), el calendario nativo del navegador se abre de forma inmediata y automática.",
  "Prevención de Selección Accidental de Texto: Se eliminó el comportamiento del navegador que seleccionaba o resaltaba únicamente partes del texto ('dd / mm / aaaa'), facilitando la elección directa de fechas.",
  "Componente Global DatePickerEnhancer: Listener global seguro que detecta clics en campos de fecha y hora para invocar `showPicker()` en toda la plataforma.",
  "Actualización en Módulos y Modales: Integrado en Registro de Ausencias Docentes (`NewAbsenceModal`), Planilla de Asistencia Diaria (`StudentAttendanceManager`), Reportes Docentes (`NewTeacherReportModal`), Mesas de Examen (`ExamBoardManager`) y Calendario Institucional (`CalendarioTab`).",
  "Microinteracción y Accesibilidad: Estilos de cursor táctil e interactivo en todos los selectores e indicadores de fecha en `globals.css`."
];

export const APP_VERSION_HISTORY: VersionItem[] = [
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
