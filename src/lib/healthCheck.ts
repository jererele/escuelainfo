// ─── EscuelaInfo — Appwrite Collection Health Check ──────────────────────────
// Zero-Risk: este módulo es 100% de sólo lectura.
// Nunca crea, modifica ni elimina documentos ni colecciones.
// Ejecutar al iniciar el dashboard en modo desarrollo.

import { databases, APPWRITE_DB_ID } from "./appwrite";

// ─── Lista de colecciones requeridas ──────────────────────────────────────────
const REQUIRED_COLLECTIONS = [
  { id: "ausencias",                    label: "Ausencias Docentes" },
  { id: "usuarios",                     label: "Usuarios del Sistema" },
  { id: "profesores",                   label: "Profesores" },
  { id: "alumnos",                      label: "Alumnos" },
  { id: "horarios",                     label: "Horarios de Clase" },
  { id: "cursos",                       label: "Cursos" },
  { id: "logs",                         label: "Auditoría / Logs" },
  { id: "mesas_examen",                 label: "Mesas de Examen" },
  { id: "asistencias_alumnos_jornada",  label: "Asistencias Jornada (Preceptores)" },
  { id: "asistencias_alumnos_materia",  label: "Asistencias Materia (Profesores)" },
] as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type CollectionHealthStatus = "ok" | "missing" | "no_permission" | "db_error";

export interface HealthCheckResult {
  collectionId: string;
  label: string;
  status: CollectionHealthStatus;
  httpCode?: number;
  error?: string;
}

export interface AppwriteHealthSummary {
  allOk: boolean;
  dbId: string;
  timestamp: string;
  results: HealthCheckResult[];
  missing: HealthCheckResult[];
  noPermission: HealthCheckResult[];
}

// ─── Función principal (read-only, zero risk) ─────────────────────────────────
export async function runAppwriteHealthCheck(): Promise<AppwriteHealthSummary> {
  const results: HealthCheckResult[] = [];

  for (const col of REQUIRED_COLLECTIONS) {
    try {
      // listDocuments con limit implícito mínimo — sólo verifica conectividad
      // NO trae documentos reales para no impactar performance ni cuota de lectura
      await databases.listDocuments(APPWRITE_DB_ID, col.id, []);
      results.push({ collectionId: col.id, label: col.label, status: "ok" });
    } catch (err: any) {
      const code: number = err?.code ?? 0;
      let status: CollectionHealthStatus = "missing";

      if (code === 401 || code === 403) {
        status = "no_permission";
      } else if (code === 500 || code === 503) {
        status = "db_error";
      }

      results.push({
        collectionId: col.id,
        label: col.label,
        status,
        httpCode: code,
        error: err?.message ?? "Unknown Appwrite error",
      });
    }
  }

  const missing      = results.filter(r => r.status === "missing");
  const noPermission = results.filter(r => r.status === "no_permission");

  return {
    allOk: results.every(r => r.status === "ok"),
    dbId: APPWRITE_DB_ID,
    timestamp: new Date().toISOString(),
    results,
    missing,
    noPermission,
  };
}

// ─── Helper: loguear resultado limpiamente en la consola ─────────────────────
export function logHealthCheckSummary(summary: AppwriteHealthSummary): void {
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) return; // Silencioso en producción

  console.groupCollapsed(`[EscuelaInfo/HealthCheck] DB: ${summary.dbId} — ${summary.allOk ? "✓ Todo OK" : "⚠ Hay problemas"}`);
  console.table(summary.results.map(r => ({
    Colección: r.label,
    ID: r.collectionId,
    Estado: r.status,
    "HTTP Code": r.httpCode ?? "-",
  })));

  if (summary.missing.length > 0) {
    console.warn(
      `[EscuelaInfo/HealthCheck] ${summary.missing.length} colección(es) FALTANTES en Appwrite:`,
      summary.missing.map(r => `  → ${r.label} (ID: "${r.collectionId}")`)
    );
    console.info(
      "[EscuelaInfo/HealthCheck] El sistema usa localStorage como fallback hasta que se creen las colecciones."
    );
  }

  if (summary.noPermission.length > 0) {
    console.error(
      `[EscuelaInfo/HealthCheck] ${summary.noPermission.length} colección(es) con ERROR DE PERMISOS (401/403):`,
      summary.noPermission.map(r => `  → ${r.label} — ${r.error}`)
    );
  }

  console.groupEnd();
}
