<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ⚡ Directivas de Desarrollo y Estándares del Repositorio

## 🎯 Principios de Ejecución
1. **Determinismo y Eficiencia:** Ir directo a la solución. Cero preámbulos, cero saludos y cero texto de relleno innecesario.
2. **Edición Quirúrgica:** En archivos medianos y grandes (>300 líneas), usar modificaciones de bloques específicos (`replace_file_content`) en vez de reescribir archivos completos, para evitar pérdida de código o truncamiento.
3. **Validación Obligatoria:** Validar cambios críticos con `npm run build` para asegurar 0 errores de TypeScript y Turbopack antes de dar por cerrada la tarea.

## 🛠 Stack Tecnológico y Contexto
- **Framework:** Next.js 16 (App Router con Turbopack)
- **React:** React 19 (Server Components y Client Components según corresponda)
- **Estilos:** Tailwind CSS v4 + Variables CSS institucionales (`--verde`, `--bg`, `--border`, etc.) con soporte para modo claro/oscuro.
- **Backend:** Appwrite (Database, Storage, Auth y WebSockets para tiempo real).
- **Control de Versión:** Actualizar `src/lib/version.ts` al introducir features o fixes relevantes.

## 🛡 Reglas de Arquitectura
- **Preservar Lógica Existente:** Nunca eliminar endpoints, props o estados existentes a menos que el usuario lo solicite expresamente.
- **Mobile First & Performance:** Las vistas deben ser responsivas, sin parpadeos de carga (CLS = 0) y respetando las optimizaciones de Core Web Vitals.
