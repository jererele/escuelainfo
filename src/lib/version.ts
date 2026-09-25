export interface VersionItem {
  version: string;
  date: string;
  notes: string[];
}

export const APP_VERSION = "v2.24.3";
export const APP_BUILD_DATE = "24/09/2026 21:30 hs";

export const APP_RELEASE_NOTES: string[] = [
  "Solución a Pantalla con Código HTML/RSC en Error de Autenticación (page.tsx, dashboard/page.tsx y next.config.js): Se identificó y resolvió el bucle de redirección cíclico que ocurría cuando un usuario ingresaba datos erróneos o una cuenta dada de baja/no registrada. Al detectar parámetros de error en la URL, el portal de inicio (page.tsx) ahora cancela de inmediato cualquier auto-redirección hacia el Dashboard y purga la sesión activa. Adicionalmente, se restringió la propiedad 'trailingSlash: true' exclusivamente para la exportación estática de GitHub Pages, evitando redirecciones 308 en modo servidor que provocaban la impresión del código fuente HTML de hidratación en el navegador."
];

export const APP_VERSION_HISTORY: VersionItem[] = [
  {
    version: "v2.24.2",
    date: "24/09/2026 21:25 hs",
    notes: [
      "Blindaje de Jerarquía: Inhabilitación Estricta de Asignación del Rol de Preceptor para Preceptores (ApproveStudentRoleModal.tsx, ChangeUserRoleModal.tsx, UsuariosTab.tsx, NewUserModal.tsx, dataService.ts y page.tsx): Se bloquearon todos los puntos del sistema donde un usuario con rol de Preceptor pudiera otorgar o promover a otro usuario como Preceptor. En el modal de aprobación de solicitudes y en el modal de cambio de roles, la opción de rol 'Preceptor' queda terminantemente excluida y bloqueada con salvaguardas tanto en cliente como en servidor. Asimismo, los preceptores no pueden aprobar solicitudes dirigidas a preceptoría (las cuales quedan reservadas exclusivamente con la insignia 'Requiere Directivo' para Directivos y Administradores), ni autorizar colaboradores como preceptores en NewUserModal."
    ]
  },
  {
    version: "v2.24.1",
    date: "24/09/2026 21:15 hs",
    notes: [
      "Integración de Correo Oficial en el Footer y Remoción de Formulario de Consultas (GeneralTab.tsx y Footer.tsx): Se retiró el formulario de 'Email de Consultas' del pie del panel de inicio (GeneralTab.tsx) para limpiar la interfaz del dashboard. Se incorporó el correo oficial de contacto institucional ('skbcraft.info@gmail.com') directamente en el pie de página global (Footer.tsx) con enlace interactivo mailto, icono vectorial de Lucide y estilizado dinámico, además de integrar la constante APP_VERSION en el tagline oficial del pie de página."
    ]
  },
  {
    version: "v2.24.0",
    date: "24/09/2026 19:50 hs",
    notes: [
      "Nueva Pestaña y Módulo de Preceptores para Directivos y Administradores (PreceptoresTab.tsx, TopNavSidebar.tsx, Sidebar.tsx y page.tsx): Se desarrolló una sección exclusiva y reservada únicamente para los roles Directivo y Administrador orientada al control integral del cuerpo de preceptoría. Permite visualizar información completa de cada preceptor (nombre, correo institucional, divisiones a cargo), métricas de cobertura escolar (total de preceptores, cursos cubiertos, cursos sin preceptor y porcentaje de cobertura institucional), una matriz interactiva con todas las divisiones escolares y un modal de asignación rápida que permite vincular o desvincular múltiples cursos a cada preceptor con persistencia inmediata y registro en auditoría.",
      "Gobernanza Estricta de Comunicados Institucionales (SendNoticeModal.tsx y page.tsx): Se blindó el sistema de envío de avisos y notificaciones por correo. Los Preceptores ahora tienen habilitado el despacho de comunicados única y exclusivamente a las divisiones que tienen asignadas a su cargo (con opción individual por curso o masiva a todos sus cursos asignados), quedando estrictamente inhabilitados para emitir avisos globales a toda la escuela. La emisión de comunicados generales a toda la comunidad educativa (Toda la Escuela, Todos los Alumnos, Todos los Profesores y Usuarios Registrados) queda reservada de forma exclusiva para el Equipo Directivo y Administradores."
    ]
  },
  {
    version: "v2.23.3",
    date: "24/09/2026 19:42 hs",
    notes: [
      "Corrección de Notificación Duplicada en Solicitudes de Registro (TopNavSidebar.tsx, Sidebar.tsx y page.tsx): Se eliminó el indicador de notificación (badge rojo) redundante que aparecía erróneamente sobre la pestaña 'Alumnos' cuando una persona enviaba su solicitud de registro. Dado que la gestión completa de solicitudes de acceso está centralizada en la pestaña 'Usuarios' (dentro del sub-panel 'Solicitudes de Acceso'), la alerta visual ahora se activa exclusiva y precisamente sobre el módulo de Usuarios y en el botón del menú superior, suprimiendo la confusión de alertas en el padrón estudiantil."
    ]
  },
  {
    version: "v2.23.2",
    date: "24/09/2026 19:35 hs",
    notes: [
      "Restricción de Edición Docente y Gestión Exclusiva de Materias para Preceptores (ProfesoresTab.tsx, NewTeacherModal.tsx y page.tsx): Se blindó la información personal de los profesores (nombre completo, DNI, correo electrónico institucional, alta y baja de docentes) restringiéndola de manera exclusiva a los Administradores y Directivos del establecimiento. Los usuarios con rol de Preceptor tienen estrictamente deshabilitada la modificación de datos personales y la eliminación de docentes, pudiendo únicamente asignar y modificar las materias que dicta cada profesor a través del panel interactivo de materias (AssignTeacherSubjectsModal). La interfaz incorpora para preceptores el botón directo 'Materias' en cada tarjeta docente, acceso a configuración de docentes sin materias asignadas y un banner de estado informativo.",
      "Protección en Formulario Docente (NewTeacherModal.tsx): Si se accede a la edición de un docente con rol de preceptor, los campos de nombre, DNI y email quedan bloqueados en modo solo lectura con aviso explicativo, permitiendo únicamente el guardado de las materias que dicta."
    ]
  },
  {
    version: "v2.23.1",
    date: "24/09/2026 19:25 hs",
    notes: [
      "Visualización Exclusiva y Filtrado de Horarios para Preceptores (HorariosTab.tsx y FreeHoursWidget.tsx): Los usuarios con rol de Preceptor ahora visualizan de forma prioritaria y filtrada el cronograma y los horarios de clase de las divisiones y cursos escolares a los cuales fueron asignados. La interfaz incorpora selector inteligente acotado a sus divisiones, selector de 1 toque mediante botones táctiles rápidos (chips) para alternar entre sus cursos asignados, botón de alternancia 'Mis Cursos Asignados' / 'Ver Todos los Cursos' y exportación personalizada a Excel (Horario_Preceptoria_Curso.xlsx). Además, el panel de Horas Libres detecta y exhibe exclusivamente las inasistencias docentes que impactan a sus cursos a cargo.",
      "Asignación y Gestión Multicurso de Preceptorías (ChangeUserRoleModal.tsx, ApproveStudentRoleModal.tsx, UsuariosTab.tsx, StudentAttendanceManager.tsx y dataService.ts): Administradores y directivos ahora pueden asignar una o múltiples divisiones escolares a los preceptores tanto al aprobar nuevas solicitudes como al modificar o actualizar roles en el centro de control de Usuarios. Se añadió almacenamiento de cursos asignados en la base de datos de Appwrite, visualización de insignias de cursos a cargo en el directorio de usuarios (escritorio y móviles), y agrupación prioritaria 'Mis Cursos Asignados' en la planilla de toma de asistencia diaria."
    ]
  },
  {
    version: "v2.23.0",
    date: "24/09/2026 18:00 hs",
    notes: [
      "Matriz Jerárquica de Asignación y Gestión de Roles Institucionales (ChangeUserRoleModal.tsx, ApproveStudentRoleModal.tsx, UsuariosTab.tsx y page.tsx): Implementación de la gobernanza de roles según la jerarquía del operador. Los Administradores pueden asignar cualquier rol; los Directivos pueden asignar los roles de Preceptor, Profesor y Alumno (con protección estricta sobre cuentas de Administradores y otros Directivos); los Preceptores pueden asignar los roles de Profesor y Alumno (sin posibilidad de alterar Preceptores, Directivos ni Administradores); y los Profesores y Alumnos no cuentan con permisos para modificar ningún rol ni acceder a la gestión de usuarios.",
      "Blindaje Total para Cuentas sin Rol Definido (page.tsx, dashboard/page.tsx y dataService.ts): Se reforzó la verificación de acceso con el detector unificado isAuthorizedRole. Cualquier cuenta sin rol oficial definido, en estado pendiente o con datos incompletos queda estrictamente impedida de acceder al contenido interno o cargar datos escolares, siendo retenida en la pantalla institucional de 'Cuenta en Verificación'."
    ]
  },
  {
    version: "v2.22.5",
    date: "24/09/2026 17:40 hs",
    notes: [
      "Automatización de Interfaz y Eliminación de Desplazamiento en Cambio de Rol (ChangeUserRoleModal.tsx, ApproveStudentRoleModal.tsx y UsuariosTab.tsx): Reestructuración arquitectónica de los modales de asignación y cambio de roles con cabecera fija, cuerpo desplazable y barra de acciones inferior fija (sticky footer). La botonera de confirmación ('Guardar Nuevo Rol' / 'Aprobar y Asignar') permanece siempre visible en pantalla sin necesidad de desplazar la página ni la ventana modal. Además, se reorganizó el selector de roles en una cuadrícula compacta y se implementó deslizamiento suave automatizado (smooth auto-scroll) y foco inmediato sobre el selector de cursos al seleccionar el rol de 'Alumno', o sobre la advertencia de permisos al seleccionar 'Administrador'.",
      "Acceso Directo Ágil a Modificación de Roles (UsuariosTab.tsx): Se habilitó la interacción directa sobre las insignias de rol institucional en la tabla y tarjetas del directorio de usuarios, permitiendo abrir el modal de cambio de jerarquía con un solo clic sobre el rol del usuario sin necesidad de desplazarse horizontalmente por la tabla hasta la columna de acciones."
    ]
  },
  {
    version: "v2.22.4",
    date: "24/09/2026 17:20 hs",
    notes: [
      "Notificación Automática por Correo de Días Libres e Inasistencias Docentes a Alumnos (emailService.ts, page.tsx, NewTeacherReportModal.tsx, NewAbsenceModal.tsx): Implementación del sistema integral de aviso automático a estudiantes. Al aprobarse una licencia docente, declararse un día libre o registrarse un paro docente, el sistema detecta de forma autónoma los cursos y divisiones afectadas a partir de la materia o los horarios escolares del profesor, recopila los correos electrónicos de los alumnos matriculados y despacha un comunicado institucional formal por email con fecha, materias impactadas y detalles de la jornada libre.",
      "Garantía de Entregabilidad SMTP y Prevención de Filtros Anti-Spam (/api/send-email, SendNoticeModal.tsx, dataService.ts): Reestructuración de cabeceras de correo para envíos masivos e individuales. En envíos con destinatario único se asigna entrega directa en el campo TO para asegurar entrada directa al buzón principal, y en envíos grupales a cursos se asigna un destinatario institucional visible en TO con copia oculta (BCC), eliminando el descarte o filtrado de mensajes por parte de Gmail y Outlook. Se incorporó el código de auditoría 'AV_HL' para trazabilidad completa de los comunicados despachados."
    ]
  },
  {
    version: "v2.22.3",
    date: "24/09/2026 16:50 hs",
    notes: [
      "Blindaje Total de Acceso y Verificación de Solicitudes Pendientes (page.tsx y dashboard/page.tsx): Corrección crítica del control de acceso donde usuarios con solicitudes de registro sin aprobar o con rol neutro 'pendiente' lograban saltar al panel general al recargar la página. Se implementó el detector unificado isPendingRole, asegurando que cualquier cuenta no autorizada visualice estrictamente la pantalla institucional de 'Cuenta en Verificación' con actualización en tiempo real y desconexión segura, bloqueando la carga de datos escolares y cerrando automáticamente sesiones huérfanas de cuentas dadas de baja.",
      "Endpoint Seguro de Servidor para Rechazo y Depuración en Cascada (/api/admin/reject-user): Resolución definitiva del error 'Error Al Rechazar Alumno' provocado por restricciones de permisos en el SDK cliente de Appwrite. La acción de rechazo ahora opera mediante una ruta de API de servidor con credenciales administrativas, eliminando de forma atómica y en cascada el documento de usuarios, la ficha de alumnos/profesores y la cuenta de Appwrite Auth con registro en auditoría."
    ]
  },
  {
    version: "v2.22.2",
    date: "24/09/2026 14:45 hs",
    notes: [
      "Aislamiento Estricto de Solicitudes en Padrón de Alumnos (AlumnosTab.tsx): Se blindó el listado de Alumnos para excluir cualquier registro en estado 'pendiente' o sin división asignada. Los usuarios que se registran ya no aparecen prematuramente en el padrón estudiantil hasta que la administración o preceptoría apruebe oficialmente su matrícula y les asigne su curso.",
      "Eliminación de Rango Preconcebido en Nuevas Solicitudes (page.tsx y UsuariosTab.tsx): Al registrarse, los nuevos usuarios quedan registrados con rol neutro 'pendiente' (Sin Rango Asignado) en lugar de asumir el rol de alumno de forma anticipada. En el centro de control de Usuarios, las solicitudes se identifican claramente como 'Sin Rango Asignado' y con curso 'A definir al aprobar', garantizando que las autoridades determinen el rol institucional correspondiente al momento de la aprobación."
    ]
  },
  {
    version: "v2.22.1",
    date: "24/09/2026 14:35 hs",
    notes: [
      "Simplificación del Mensaje de Registro (page.tsx): Al completar el formulario de registro de usuario, el modal ahora indica de forma concisa y neutra 'Tu solicitud fue enviada.' y 'Esperá a ser aprobado por la administración para poder ingresar a la plataforma.', removiendo referencias rígidas a roles específicos en la pantalla de espera.",
      "Notificación Automática por Correo al Aprobar Usuarios (emailService.ts y page.tsx): Al aprobar una solicitud de acceso desde el panel de control (tanto de alumnos como de colaboradores), el sistema despacha automáticamente un correo electrónico institucional al usuario informándole que su cuenta fue aceptada, detallando su rol oficial asignado, división/curso correspondiente (en caso de alumnos) y el enlace directo para iniciar sesión en la plataforma."
    ]
  },
  {
    version: "v2.22.0",
    date: "24/09/2026 14:30 hs",
    notes: [
      "Cambio y Reasignación de Roles Institucionales para Administradores (ChangeUserRoleModal.tsx, UsuariosTab.tsx y page.tsx): Se habilitó la capacidad exclusiva para Administradores de cambiar el rol de cualquier usuario activo de la escuela entre todas las jerarquías disponibles: Administrador, Directivo, Preceptor, Profesor y Alumno. El sistema despliega un modal interactivo con detalles del usuario, descripción de permisos por rol, alertas de confirmación al otorgar privilegios de administrador y asignación directa de división/curso cuando se selecciona el rol de Alumno. Además, sincroniza automáticamente las tablas auxiliares (crea la ficha docente al asignar rol de Profesor o desvincula del padrón estudiantil al promover a roles institucionales) y registra cada cambio en la auditoría con el código compacto 'C_ROL'.",
      "Seguridad de Cuenta y Prevención de Bloqueo de Administradores: Se introdujo una salvaguarda automática que impide que un administrador en sesión activa se degrade o retire sus propios permisos de administrador por accidente, señalizando visualmente su cuenta con la insignia '(Tu Cuenta)'.",
      "Adaptabilidad Móvil Completa en Directorio de Usuarios Activos (UsuariosTab.tsx): Se implementó la vista separada para dispositivos móviles (< md) con tarjetas táctiles para todos los usuarios activos, facilitando la consulta de emails, roles, cursos asignados y el acceso al botón de cambio de rol desde cualquier teléfono celular."
    ]
  },
  {
    version: "v2.21.0",
    date: "23/09/2026 17:45 hs",
    notes: [
      "Nuevo Módulo y Pestaña Dedicada de Usuarios (UsuariosTab.tsx, Sidebar.tsx y TopNavSidebar.tsx): Se creó la pestaña principal 'Usuarios' en la navegación institucional (accesible para Administradores, Directivos y Preceptores). En esta vista centralizada se gestionan todas las solicitudes de personas que quieren ingresar a la plataforma, integrando el flujo de aprobación con selector interactivo de rol (Alumno, Profesor, Preceptor) y asignación simultánea de división/curso, buscador predictivo por nombre, email, DNI y curso solicitado, y tarjetas táctiles para celulares. Además, incluye un directorio navegable de usuarios activos con insignias temáticas por rol institucional.",
      "Desacoplamiento y Limpieza en Alumnos (AlumnosTab.tsx): La pestaña de Alumnos ahora se enfoca con exclusividad en el padrón oficial de estudiantes matriculados por curso, habiendo trasladado las solicitudes de registro pendientes al nuevo centro de control de Usuarios."
    ]
  },
  {
    version: "v2.20.7",
    date: "23/09/2026 17:35 hs",
    notes: [
      "Depuración de 'Inscribir Alumno' y Función de Desinscripción de Cursos (AlumnosTab.tsx y NewStudentModal.tsx): Se retiró el botón '+ Inscribir Alumno' de la cabecera del listado de alumnos, dado que la matriculación y asignación oficial ahora se gestiona de forma centralizada al aprobar las solicitudes de registro con su rol y curso correspondientes. Asimismo, el modal de asignación de cursos pasó a llamarse 'Asignar Curso' y sumó la opción 'Sin curso (Desinscribir / Pendiente)', permitiendo a directivos y administradores quitar a un alumno de su curso actual y dejarlo en estado pendiente con registro de auditoría, sin necesidad de eliminar su cuenta de usuario."
    ]
  },
  {
    version: "v2.20.6",
    date: "23/09/2026 17:25 hs",
    notes: [
      "Reactivación de Letras Cinéticas Interactivas en 'Escuela 713' (GravityText.tsx y globals.css): Se revitalizó la tipografía interactiva del banner principal en Inicio. Cada letra de 'Escuela 713' ahora reacciona de forma inmediata y elástica cada vez que el usuario pasa el cursor por encima (hover / sweep) o desliza el dedo en pantallas táctiles y móviles, elevándose 16px con rotación angular dinámica, escalado suave (1.24x) y un destello de resplandor verde esmeralda. Se implementó una animación física de rebote elástico (rubber-band bounce) que se reinicia limpiamente en cada interacción sin pausas ni bloqueos de hidratación, acompañada de una entrada en cascada escalonada al cargar el panel institucional."
    ]
  },
  {
    version: "v2.20.5",
    date: "23/09/2026 17:15 hs",
    notes: [
      "Privacidad y Aislamiento de Novedades Docentes (GeneralTab.tsx y page.tsx): Se blindó la sección 'Novedades Recientes' del panel de Inicio para que los profesores con sesión activa visualicen única y exclusivamente sus propias licencias, justificaciones y novedades ('Mis Novedades Recientes'), impidiendo la exposición de los motivos, estados o registros de otros colegas de la institución. Las métricas y tarjetas estadísticas en el inicio docente ahora se computan de forma personalizada según el historial individual del profesor, mientras que los equipos directivos y de preceptoría conservan el panorama general e institucional."
    ]
  },
  {
    version: "v2.20.4",
    date: "23/09/2026 17:05 hs",
    notes: [
      "Optimización Total de Notificaciones en Celulares (SileoToaster.tsx y globals.css): Se corrigió la posición, z-index y adaptabilidad de las notificaciones toast en dispositivos móviles. En pantallas táctiles (< 640px) ahora se ubican centradas en la parte superior ('top-center') con margen seguro debajo de la barra de navegación (safe-area + 68px), eliminando el desborde horizontal que las cortaba fuera de pantalla y evitando colisiones con el notch/isla dinámica de los teléfonos. Se elevó su z-index a 999999 para que nunca queden ocultas detrás de modales, hojas inferiores o paneles de menú, y se sincronizó el tema automáticamente con el modo claro/oscuro de la aplicación.",
      "Adaptabilidad Móvil en Envío de Avisos y Notificaciones (SendNoticeModal.tsx y TopNavSidebar.tsx): Se ajustaron los tamaños tipográficos de inputs a 16px para evitar el auto-zoom de iOS Safari al escribir, se perfeccionó la cuadrícula táctil de grupos de destinatarios y los botones de acción para pantallas compactas. Además, el botón de menú hamburguesa ahora incluye un punto indicador pulsante en tiempo real que alerta a los directivos cuando existen solicitudes de acceso o alumnos pendientes de revisión."
    ]
  },
  {
    version: "v2.20.3",
    date: "23/09/2026 16:55 hs",
    notes: [
      "Asignación Simultánea de Curso al Aprobar Alumnos (ApproveStudentRoleModal, AlumnosTab y page.tsx): Al aprobar o asignar a un alumno desde las solicitudes de inscripción pendientes, ahora es posible seleccionar simultáneamente el curso oficial al que pertenecerá dentro del mismo modal de confirmación. El selector interactivo despliega todas las divisiones y cursos de la institución, pre-seleccionando el curso solicitado (si existe) o el primer curso disponible, y actualiza de inmediato el registro del alumno en la base de datos de Appwrite junto con la auditoría institucional.",
      "Asignación y Reubicación Ágil desde el Listado de Alumnos (AlumnosTab.tsx y NewStudentModal.tsx): Directivos y preceptores ahora pueden hacer clic directamente en la insignia de curso ('Pendiente' o curso actual) de cualquier estudiante de la tabla para abrir el modal de asignación con el alumno ya seleccionado, agilizando la gestión de matrículas sin pasos intermedios."
    ]
  },
  {
    version: "v2.20.2",
    date: "23/09/2026 16:50 hs",
    notes: [
      "Corrección y Reflejo Inmediato de Mesas de Examen (ExamBoardManager.tsx y dataService.ts): Se resolvió la discrepancia por la cual las nuevas mesas de examen creadas no se visualizaban en el cronograma. Se introdujo actualización optimista instantánea en el estado local de mesas al crear, editar o eliminar registros, asegurando su visualización inmediata sin esperas de WebSocket. En dataService.ts se unificó y blindó la persistencia híbrida (Appwrite + LocalStorage merge con ordenamiento cronológico por fecha y hora) y se aseguraron valores por defecto contra propiedades indefinidas en los filtros y tarjetas."
    ]
  },
  {
    version: "v2.20.1",
    date: "23/09/2026 16:45 hs",
    notes: [
      "Depuración Visual en Pie de Página (Footer.tsx): Se removió la insignia identificadora de versión del pie de página institucional, manteniendo una estética limpia, despejada y minimalista enfocada en la identidad de marca y enlaces legales."
    ]
  },
  {
    version: "v2.20.0",
    date: "23/09/2026 16:40 hs",
    notes: [
      "Selección de Rol Institucional al Aprobar Alumnos (AlumnosTab.tsx y ApproveStudentRoleModal.tsx): Al pulsar 'Aprobar' en una solicitud de inscripción pendiente, ahora se despliega un modal interactivo que permite a directivos y preceptores decidir con precisión el rol a otorgar al usuario: Alumno (matriculación oficial en el curso), Profesor (incorpora al usuario al cuerpo docente con materias y licencias) o Preceptor (gestión de asistencia y cursos). Si se aprueba como Profesor o Preceptor, el sistema limpia automáticamente su registro temporal en la lista de alumnos e inicializa su ficha docente oficial en Appwrite con registro de auditoría."
    ]
  },
  {
    version: "v2.19.0",
    date: "23/09/2026 16:35 hs",
    notes: [
      "Asignación Directa de Materias en Cuerpo Docente (ProfesoresTab.tsx y AssignTeacherSubjectsModal.tsx): Se incorporó un sistema integral para gestionar y asignar materias a los profesores ya registrados. En cada tarjeta docente se visualiza la sección de materias con botones dedicados ('+ Asignar' o 'Modificar') y llamada visual para docentes sin materias asignadas. Se implementó un modal interactivo con chips editables, adición rápida por teclado y sugerencias automáticas de materias existentes en la escuela (extraídas de horarios y currícula). Además, se añadió un panel destacado para docentes registrados en el sistema que aún no tenían asignadas sus materias oficiales, permitiendo configurarlos con 1 clic.",
      "Búsqueda y Optimización Táctil en Cuerpo Docente: Se incorporó un buscador en tiempo real por nombre, materia o email del profesor, y se hicieron accesibles los controles de edición y eliminación en pantallas táctiles y móviles sin depender de eventos hover."
    ]
  },
  {
    version: "v2.18.1",
    date: "23/09/2026 16:30 hs",
    notes: [
      "Limpieza Visual en Banner de Inicio (GeneralTab.tsx): Se removieron los efectos ambientales animados de fondo (orbes fluidos FluidOrb) en la tarjeta de cabecera 'Escuela 713 · Sistema de Gestión' en la pestaña Inicio, logrando una presentación sobria, de lectura clara y alto rendimiento visual."
    ]
  },
  {
    version: "v2.18.0",
    date: "23/09/2026 16:25 hs",
    notes: [
      "Easter Egg Modo ARGB GAMER con Nyan Cats y Música Chiptune: Se integró una sorpresa interactiva que se dispara al alternar rápidamente 30 veces seguidas el tema (claro/oscuro) sin pausas prolongadas. Al activarse, la plataforma entra en modo ARGB Gamer con bordes y resplandores cromáticos animados en tiempo real, múltiples Nyan Cats cruzando la pantalla con estelas de arcoíris y estrellas flotantes de 8 bits, junto con la auténtica melodía de Nyan Cat sintetizada vía Web Audio API. Al alternar nuevamente el tema, el modo se cancela de inmediato, la música se detiene y el contador se reinicia."
    ]
  },
  {
    version: "v2.17.7",
    date: "23/09/2026 16:11 hs",
    notes: [
      "Rediseño y Modernización Tipográfica de Código de Seguridad (api/auth/send-code): Se sustituyó la fuente Courier New del código numérico en los correos de verificación por una tipografía moderna, geométrica y de alto impacto ('Outfit' con fallback a fuentes del sistema, font-variant-numeric: tabular-nums y espaciado simétrico), garantizando una visualización nítida y profesional en todos los clientes de correo."
    ]
  },
  {
    version: "v2.17.6",
    date: "23/09/2026 16:02 hs",
    notes: [
      "Traducción Completa y Legible de Acciones en Auditoría (AuditoriaTab.tsx y dataService.ts): Se implementó el diccionario integral ACTION_NAME_MAP y el normalizador formatActionLabel para traducir todos los códigos técnicos y truncados de logs (ej: 'AP_A' -> 'Aprobar Alumno', 'M_EA' -> 'Cambio de Estado', 'AU_C' -> 'Autorizar Colaborador', 'REGIST' -> 'Registrar Docente', 'ENVIAR' -> 'Enviar Notificación') a títulos legibles en español tanto en las tarjetas móviles como en la tabla de escritorio y en el menú de filtrado por acción."
    ]
  },
  {
    version: "v2.17.5",
    date: "23/09/2026 15:50 hs",
    notes: [
      "Separación Responsiva y Visualización Completa en Logs de Auditoría (AuditoriaTab.tsx): Se solucionó el recorte de columnas en dispositivos móviles implementando DOM separation con tarjetas individuales enriquecidas (md:hidden) que exhiben detalles completos sin truncamiento. Para escritorio (hidden md:block), se incorporó un contenedor con scroll horizontal (overflow-x-auto) y ancho mínimo garantizado, junto a un buscador dinámico y filtro por tipo de acción."
    ]
  },
  {
    version: "v2.17.4",
    date: "23/09/2026 15:43 hs",
    notes: [
      "Unificación y Centrado de Insignias de Curso (CicloLectivoTab.tsx y AlumnosTab.tsx): Se rediseñaron las insignias de curso (como 'Curso Anterior') transformándolas en contenedores rectangulares continuos (inline-block text-center) con bordes suaves (rounded-xl) y borde temático, asegurando que ante cursos de nombres compuestos o saltos de línea el texto se mantenga perfectamente centrado en una sola caja sin fragmentación de fondos."
    ]
  },
  {
    version: "v2.17.3",
    date: "23/09/2026 15:38 hs",
    notes: [
      "Rediseño y Centrado de Insignias de Estado de Ingreso (ConfiguracionTab.tsx): Se transformó la insignia 'Registrado y Activo' en un contenedor rectangular unificado con bordes suavizados (rounded-xl) y borde temático, alineando vertical y horizontalmente 'Registrado' e 'y Activo' en dos líneas centradas para evitar solapamientos o fragmentaciones de fondo."
    ]
  },
  {
    version: "v2.17.2",
    date: "23/09/2026 15:26 hs",
    notes: [
      "Depuración Visual de Insignia de Hora Libre (HorariosTab.tsx): Se removió el icono de estrella (Sparkles) de la etiqueta 'Hora Libre' en las tarjetas de clases y vista de grilla de horarios, manteniendo una estética limpia, sobria y de alto contraste."
    ]
  },
  {
    version: "v2.17.1",
    date: "23/09/2026 15:05 hs",
    notes: [
      "Desactivación y Remoción de Solicitud de Cambio de Nombre: Se retiró de forma completa la opción para que los alumnos y usuarios soliciten el cambio de su nombre desde 'Mi Perfil' (UserProfileModal.tsx), asegurando la inmutabilidad de la identidad y datos filiatorios oficiales registrados por la institución.",
      "Limpieza de la Bandeja Directiva de Nombres (ConfiguracionTab.tsx y dashboard/page.tsx): Se removió la sección de 'Solicitudes de Cambio de Nombre' del panel de Configuración y sus flujos asociados de aprobación/rechazo, simplificando la interfaz de gestión institucional y eliminando código en desuso.",
      "Optimización de dataService y Depuración de Endpoints: Se descontinuaron las funciones de solicitud, cancelación, aprobación y rechazo de nombres en dataService.ts, manteniendo la coherencia de datos con Appwrite."
    ]
  },
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
