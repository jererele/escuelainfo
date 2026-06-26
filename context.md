El objetivo de un archivo context.md es servir como la fuente de verdad y contexto para que cualquier Inteligencia Artificial entienda el proyecto al instante en futuras sesiones, sin tener que reaprenderlo todo desde cero.

1. **Propósito del proyecto**: Escuela info es una pagina la cual se centra en hacer mas rapido el trabajo de los directivos y preceptores, para marcar ausencias de profesores, para cargar los horarios de los alumnos y para mandar comunicados. El objetivo principal es facilitar el trabajo a los preceptores y directivos el manejo de lo anteriormente dicho. Va dirigido a lo que son las escuelas.

2. **Stack Tecnológico**:
   - **Frontend**: React 19, Next.js 16 (App Router), TypeScript.
   - **Estilos**: Tailwind CSS v4, Shadcn UI, `tw-animate-css` para animaciones, Lucide React para íconos.
   - **Backend / Base de Datos**: Appwrite (BaaS), utilizando `appwrite` (Web SDK) y `node-appwrite` (Server SDK).
   - **Herramientas Adicionales**: `xlsx` para lectura y manejo de planillas de Excel.

3. **Estructura de Archivos**:
   - `/src/app/`: Rutas, páginas y layouts principales de la aplicación (Next.js App Router).
   - `/src/components/`: Componentes reutilizables de React (ej. modales como `NewStudentModal.tsx`, navegación como `TopNavSidebar.tsx`, y elementos de Shadcn UI).
   - `/src/hooks/`: Custom hooks de React para manejar lógica de estado y llamadas a servicios.
   - `/src/lib/`: Funciones de utilidad, configuración de cliente de Appwrite y servicios generales de la app.
   - `/public/`: Activos estáticos como imágenes, logo SVG y fuentes.
   - `/` (Archivos en la raíz): Scripts en Node.js (ej. `setup-new-project.js`, `clear-all-data.js`, `rebuild-database.js`) usados para migraciones, configuración de la base de datos de Appwrite y automatización.
   - `next.config.js`, `package.json`, `tailwind/postcss`: Configuraciones principales de las dependencias y el bundler del proyecto.

4. **Reglas de Desarrollo y Estilo**:
   - **Arquitectura**: Arquitectura basada en componentes y separación limpia de responsabilidades (UI en `components`, lógica en `hooks`, servicios en `lib`).
   - **Next.js 16**: IMPORTANTE: El proyecto usa una versión moderna de Next.js. Las APIs, convenciones y la estructura de archivos difieren de versiones antiguas. Seguir reglas modernas del App Router y hacer caso a los avisos de desuso (deprecation notices).
   - **Rendimiento y Optimización**: 
     - Mantener separación estricta entre las interfaces de PC y móvil usando breakpoints de Tailwind para evitar renders pesados en celulares. 
     - Desactivar animaciones costosas en móviles (ej. `CosmosBackground`).
     - Usar *lazy loading* (imports dinámicos) para modales (`next/dynamic`) y así reducir el tamaño inicial del bundle.
     - Emplear memoización (`useMemo`, `useCallback`) y animaciones aceleradas por hardware (`transform` y `opacity`) para mantener los 60 FPS estables.
   - **Estética y UI/UX**: Diseños "premium", priorizando la excelencia visual. Usar colores vibrantes, glassmorfismo, micro-animaciones fluidas, y paletas de alto contraste para el modo claro y oscuro. Se debe buscar siempre una interfaz que se sienta responsiva y "viva".
   - **Accesibilidad**: Mantener un estándar alto de accesibilidad (WCAG AA), colores contrastantes e inputs claros en formularios administrativos.
   - **Base de Datos y Tiempo Real**: Utilizar la SDK de Appwrite. Los estados en UI deben reflejar la base de datos velozmente, haciendo uso de Realtime si corresponde, y usando diccionarios de mapeo para optimizar el almacenamiento (ej. IDs de módulos en vez de strings largos).

5. **Estado Actual y Próximos Pasos**: El proyecto esta casi terminado, solo faltan agregar algunas correcciones visuales, y capaz se le agregaron cosas nuevas.
