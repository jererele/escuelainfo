export interface VersionItem {
  version: string;
  date: string;
  notes: string[];
}

export const APP_VERSION = "v2.8.4";
export const APP_BUILD_DATE = "10/09/2026 14:31 hs";

export const APP_RELEASE_NOTES: string[] = [
  "Parche de Seguridad Crítico (QR): Reducción del tiempo de expiración y tolerancia de códigos QR dinámicos a 25 segundos para prevenir la captura de pantalla y su envío remoto para fraude de asistencia.",
  "Limpieza Segura de Sesión: Aseguramiento de limpieza profunda del `sessionStorage` local al momento del cierre de sesión para evitar filtración de caché a otros usuarios en dispositivos compartidos."
];

export const APP_VERSION_HISTORY: VersionItem[] = [
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
