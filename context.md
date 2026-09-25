# EscuelaInfo — Documento de Contexto y Fuente de Verdad (context.md)

Este documento sirve como la **fuente de verdad y contexto definitivo** de la arquitectura, reglas de negocio, roles, permisos y estructura de código del proyecto EscuelaInfo. Permite a cualquier desarrollador o IA comprender el sistema de inmediato sin necesidad de inspeccionar toda la base de código.

---

## 1. Propósito y Visión General
**EscuelaInfo** es una plataforma web integral de gestión escolar orientada a instituciones educativas (específicamente la Escuela N° 713 "Juan Abdala Chayep").

### Objetivos principales:
- **Gestión ágil de ausencias de profesores:** Carga inmediata de partes diarios y novedades docentes, determinando qué cursos quedan con horas libres o cambio de turno.
- **Notificaciones automáticas:** Envío de correos automáticos (vía Brevo / Nodemailer) a los alumnos y tutores notificando horas libres y ausencias.
- **Gestión de horarios escolares:** Visualización interactiva y carga modular de grillas de horarios por curso, profesor y turno.
- **Control de asistencias y acreditación QR:** Registro de asistencia por jornada y por materia, incluyendo carnets con código QR dinámico y escáner integrado.
- **Mesas de exámenes:** Publicación, organización por tribunales y visualización de mesas de examen para alumnos y docentes.
- **Gestión de roles y preceptorías:** Asignación de cursos a preceptores específicos y administración granular de permisos institucionales.

---

## 2. Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend Framework** | React 19, Next.js 16 (App Router), TypeScript |
| **Estilos y Componentes** | Tailwind CSS v4, Lucide React (íconos vectoriales obligatorios, cero emojis en UI), Shadcn UI, `tw-animate-css` |
| **Backend & Base de Datos** | Appwrite (BaaS Cloud / Self-hosted): Auth, Databases, Storage, Realtime |
| **Correos Transaccionales** | Next.js API Route (`/api/send-email`) + Nodemailer conectado al relay SMTP de Brevo |
| **Generación y Lectura QR** | `qrcode`, `html5-qrcode` |
| **Planillas y Exportación** | `xlsx` (importación y exportación de alumnos, cursos y horarios) |

---

## 3. Matriz de Roles y Reglas de Permisos

El sistema implementa una jerarquía estricta de autorización, tanto a nivel visual como en servicios y base de datos:

| Rol | Capacidades y Alcance | Restricciones Específicas |
| :--- | :--- | :--- |
| **Administrador** | Control absoluto. Puede reasignar el rol de **cualquier usuario** (incluyendo otros Admins y Directivos). Puede gestionar cursos, profesores, horarios, mesas, ciclo lectivo y auditoría. | Ninguna. |
| **Directivo** | Puede asignar roles de **Preceptor**, **Profesor** y **Alumno**. Gestiona cursos, profesores y la asignación de cursos a cada preceptor en `PreceptoresTab`. Envía avisos generales institucionales y por curso. | No puede degradar ni cambiar el rol de Administradores. |
| **Preceptor (POD/T)** | • Solo puede asignar roles de **Profesor** y **Alumno**.<br>• Solo visualiza y gestiona horarios de los **cursos a los que fue asignado formalmente**.<br>• Vincula materias y horarios a docentes.<br>• Envía avisos exclusivamente a sus **cursos asignados**.<br>• Carga ausencias de profesores y aprueba solicitudes de alumnos de sus cursos. | • **Terminantemente bloqueado** para asignar el rol de Preceptor, Directivo o Admin.<br>• **No puede modificar datos personales** del docente (DNI, teléfono, email); únicamente materias.<br>• No puede enviar avisos institucionales generales (reservado a Directivos/Admins). |
| **Profesor** | Carga asistencias (jornada y materia), solicita sus ausencias, visualiza sus horarios y mesas de examen asignadas. | No puede cambiar roles de ningún usuario. No puede alterar horarios institucionales. |
| **Alumno** | Consulta sus horarios de cursada, ausencias docentes del día, mesas de examen y genera su credencial QR personal para acreditación de asistencia. | No puede editar información institucional ni cambiar roles. |
| **Sin Rol / Pendiente** | El usuario puede registrarse con Google o correo, pero **no puede ingresar al Dashboard**. Es redirigido al login con aviso de cuenta pendiente/rechazada y se destruye su sesión de Appwrite. | Acceso denegado a todas las rutas protegidas. |

---

## 4. Estructura de Directorios (`src/`)

```text
src/
├── app/                                 # Rutas de Next.js App Router
│   ├── api/
│   │   ├── send-email/route.ts          # Endpoint SMTP/Brevo para envío de notificaciones y avisos
│   │   └── verify-turnstile/route.ts    # Verificación de captcha Cloudflare Turnstile
│   ├── dashboard/page.tsx               # Panel principal con carga de pestañas según rol
│   ├── globals.css                      # Variables CSS y diseño de tokens
│   ├── layout.tsx                       # Layout raíz con proveedores y metadatos
│   └── page.tsx                         # Pantalla de Login, Registro y recuperación de contraseña
│
├── features/                            # Módulos de funcionalidad de negocio
│   ├── attendance/                      # Lógica de asistencias y tablas responsivas
│   ├── exams/
│   │   └── ExamBoardManager.tsx        # Gestión y visualización de mesas de examen
│   └── dashboard/
│       ├── widgets/                     # Widgets del dashboard (FreeHoursWidget, etc.)
│       └── tabs/                        # Vistas principales del Dashboard:
│           ├── AlumnosTab.tsx           # Padrón de alumnos, asignación de cursos y credenciales QR
│           ├── AuditoriaTab.tsx         # Registro de auditoría y eventos del sistema
│           ├── AusenciasTab.tsx         # Gestión de ausencias docentes del día y novedades
│           ├── CalendarioTab.tsx        # Calendario escolar e hitos institucionales
│           ├── CicloLectivoTab.tsx      # Gestión del ciclo lectivo y trimestres
│           ├── ConfiguracionTab.tsx     # Ajustes de cuenta y preferencias institucionales
│           ├── CursosTab.tsx            # Gestión de cursos, divisiones y turnos
│           ├── GeneralTab.tsx           # Resumen general, ausencias activas y comunicados
│           ├── HorariosTab.tsx          # Grilla de horarios (filtrada por cursos asignados para preceptores)
│           ├── MonitorAsistenciaTab.tsx # Monitor en tiempo real de asistencias
│           ├── PreceptoresTab.tsx       # Gestión exclusiva de directivos: asignación de cursos a preceptores
│           ├── ProfesoresTab.tsx        # Padrón docente (preceptores solo editan materias, directivos todo)
│           └── UsuariosTab.tsx          # Gestión de usuarios, solicitudes de rol y aprobación
│
├── components/                          # Componentes reutilizables
│   ├── layout/                          # TopNavSidebar, Sidebar, Footer, CosmosBackground
│   ├── modals/                          # Modales dinámicos (lazy loading vía next/dynamic)
│   │   ├── ApproveStudentRoleModal.tsx  # Aprobación de registros pendientes
│   │   ├── AssignStudentsModal.tsx      # Asignación masiva de alumnos a cursos
│   │   ├── ChangeUserRoleModal.tsx      # Cambio de rol con matriz de jerarquía aplicada
│   │   ├── DynamicQRModal.tsx           # Generador de QR dinámico para alumnos
│   │   ├── NewAbsenceModal.tsx          # Carga de ausencias con cálculo de horas libres y envío de mail
│   │   ├── NewCourseModal.tsx           # Creación de cursos
│   │   ├── NewScheduleModal.tsx         # Asignación de materias/profesores a módulos de horarios
│   │   ├── NewStudentModal.tsx          # Alta de alumnos
│   │   ├── NewTeacherModal.tsx          # Alta de docentes
│   │   ├── SendNoticeModal.tsx          # Envío de comunicados por email (con filtrado por rol de emisor)
│   │   ├── StudentQRScannerModal.tsx    # Lector QR de asistencias
│   │   ├── TermsModal.tsx               # Términos y condiciones
│   │   ├── UserProfileModal.tsx         # Perfil de usuario y foto
│   │   └── VersionModal.tsx             # Modal de historial de versiones y novedades
│   └── ui/                              # Primitivas de diseño
│
├── hooks/                               # Hooks personalizados de React
└── lib/                                 # Servicios centrales
    ├── appwrite.ts                      # Instancia del cliente y SDK de Appwrite
    ├── dataService.ts                   # Capa unificada de acceso a datos, caché y CRUD en Appwrite
    ├── emailService.ts                  # Integración de correos para avisos y ausencias
    ├── notify.ts                        # Disparador de notificaciones y alertas en UI
    └── version.ts                       # Constantes de versión (APP_VERSION, APP_BUILD_DATE, notas)
```

---

## 5. Colecciones en Appwrite (`escuelainfo_db`)

- **`usuarios`**: Almacena el perfil del usuario, correo, nombre, `rol` (`admin`, `directivo`, `preceptor`, `profesor`, `alumno`), estado de aprobación, teléfono, y en el caso de preceptores, los cursos asignados.
- **`cursos`**: Año, división, turno (`Mañana`, `Tarde`, `Vespertino`, `Doble Turno`) y especialidad.
- **`profesores`**: Nombre, apellido, DNI, teléfono, email y listado de materias/cursos a cargo.
- **`horarios`**: Relación de días de la semana, módulos horarios, materia, curso y profesor.
- **`alumnos`**: Datos del estudiante, DNI, curso asignado, datos de contacto del tutor y token QR.
- **`asistencias_alumnos_jornada`**: Registro de entrada/salida institucional por día y alumno.
- **`asistencias_alumnos_materia`**: Registro de presencia por módulo/hora de clase.
- **`mesas_examen`**: Turnos de examen, materia, curso, presidente y vocales de mesa, fecha y horario.
- **`logs`**: Historial de auditoría de acciones administrativas y operativas.

---

## 6. Reglas Críticas del Proyecto (AGENTS.md)

1. **Cero Emojis en Íconos de UI:** Nunca usar caracteres Unicode como íconos (ej: ⚠️, ❌, 💡, 🎓, ⚡). Utilizar **siempre `lucide-react`** (`AlertTriangle`, `X`, `Lightbulb`, `GraduationCap`, `Zap`, etc.).
2. **Registro Obligatorio de Versión:** En cada modificación de código:
   - Incrementar versión en `src/lib/version.ts`.
   - Actualizar fecha y hora en `APP_BUILD_DATE`.
   - Detallar los cambios en `APP_RELEASE_NOTES`.
   - Archivar la versión previa en `APP_VERSION_HISTORY`.
   - Usar `APP_VERSION` en el footer y badges (nunca hardcodear la versión).
3. **Optimización de Rendimiento y Móviles:**
   - Desactivar animaciones costosas como `CosmosBackground.tsx` en pantallas móviles.
   - Usar `next/dynamic` para todos los modales pesados para mantener el bundle inicial liviano.
   - Utilizar `useMemo` y `useCallback` en listas y grillas de horarios.
4. **Seguridad y Navegación:**
   - Prevenir bucles de redirección entre `/` y `/dashboard` cuando una cuenta no tiene rol o fue dada de baja.
   - Borrar sesiones en Appwrite y `sessionStorage` inmediatamente ante errores de autorización.
