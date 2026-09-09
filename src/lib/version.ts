export interface VersionItem {
  version: string;
  date: string;
  notes: string[];
}

export const APP_VERSION = "v2.7.0";
export const APP_BUILD_DATE = "09/09/2026 15:50 hs";

export const APP_RELEASE_NOTES: string[] = [
  "Unificación del sistema de asistencias: Ahora la pestaña 'Asistencias' incluye tanto el sistema de QR dinámico como la toma manual de asistencia en el aula para alumnos sin celular.",
  "Nuevo diseño del botón de Asistencias: Se reemplazó el icono de QR por el icono de asistencia de alumnos (UserCheck), unificando visualmente ambas modalidades.",
  "Validadores de seguridad estrictos: Verificación en tiempo real de formato de correo electrónico y números de teléfono celular en perfiles y registros.",
  "Refactor integral de Appwrite SDK v24: Adaptación de la API a las últimas convenciones de Appwrite, eliminando advertencias de métodos deprecados.",
  "Compatibilidad y robustez de renderizado: Corrección de advertencias de hidratación provocadas por extensiones del navegador y aislamiento de elementos dinámicos.",
  "Historial de Versiones Anteriores: Nuevo apartado interactivo en la ventana de novedades para consultar todas las actualizaciones históricas del sistema."
];

export const APP_VERSION_HISTORY: VersionItem[] = [
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
