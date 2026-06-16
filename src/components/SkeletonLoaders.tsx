"use client";

/**
 * SkeletonLoader — Componente de esqueleto de carga reutilizable.
 * Usa `animate-pulse` de Tailwind con `transform`/`opacity` acelerados por GPU.
 * NO usa cambios de `height` ni `top` para evitar layout thrashing en móvil de gama baja.
 */

// ─── Átomo: una barra de esqueleto genérica ──────────────────────────────────
function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--bg4)] rounded-xl animate-pulse ${className}`}
      style={{ willChange: "opacity" }}
    />
  );
}

// ─── Esqueleto para las tarjetas de estadísticas del Dashboard ───────────────
export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="glass p-3 sm:p-6 rounded-2xl sm:rounded-[28px] border border-[var(--border)] space-y-2 sm:space-y-3"
        >
          <SkeletonBar className="h-7 sm:h-10 w-12 sm:w-16" />
          <SkeletonBar className="h-2.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ─── Esqueleto para una fila de tabla de alumnos/planilla ────────────────────
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-[var(--border)]">
      <SkeletonBar className="h-4 w-16 shrink-0" />
      <SkeletonBar className="h-4 flex-1" />
      <div className="flex gap-2 shrink-0">
        <SkeletonBar className="h-7 w-16 rounded-lg" />
        <SkeletonBar className="h-7 w-16 rounded-lg" />
        <SkeletonBar className="h-7 w-16 rounded-lg hidden sm:block" />
      </div>
    </div>
  );
}

// ─── Esqueleto para la planilla de asistencia completa ───────────────────────
export function SkeletonAttendanceTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3 bg-[var(--bg3)] border-b border-[var(--border)]">
        <SkeletonBar className="h-3 w-10" />
        <SkeletonBar className="h-3 w-36" />
        <SkeletonBar className="h-3 w-40 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
}

// ─── Esqueleto para tarjetas de Mesa de Examen ───────────────────────────────
export function SkeletonExamCard() {
  return (
    <div className="bg-white/50 dark:bg-slate-950/20 border border-[var(--border)] rounded-2xl p-5 space-y-4">
      {/* Badge + título */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1 pr-4">
          <SkeletonBar className="h-5 w-3/4" />
          <SkeletonBar className="h-3 w-1/3" />
        </div>
        <SkeletonBar className="h-5 w-16 rounded-lg shrink-0" />
      </div>
      {/* Fecha y hora */}
      <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-3 w-16" />
      </div>
      {/* Tribunal */}
      <div className="space-y-1.5">
        <SkeletonBar className="h-2.5 w-full" />
        <SkeletonBar className="h-2.5 w-4/5" />
        <SkeletonBar className="h-2.5 w-2/3" />
      </div>
    </div>
  );
}

// ─── Grilla de esqueletos para mesas de examen ───────────────────────────────
export function SkeletonExamGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonExamCard key={i} />
      ))}
    </div>
  );
}

// ─── Esqueleto para la lista de ausencias (tabla) ────────────────────────────
export function SkeletonAbsenceList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-[var(--border)] flex justify-between items-center">
        <SkeletonBar className="h-6 w-40" />
        <SkeletonBar className="h-8 w-28 rounded-xl" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--bg3)]/50">
              {["w-32", "w-24", "w-48", "w-20"].map((w, i) => (
                <th key={i} className="p-5">
                  <SkeletonBar className={`h-2.5 ${w}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                <td className="p-5">
                  <SkeletonBar className="h-4 w-32 mb-1.5" />
                  <SkeletonBar className="h-2.5 w-20" />
                </td>
                <td className="p-5">
                  <SkeletonBar className="h-4 w-24 mb-1.5" />
                  <SkeletonBar className="h-2.5 w-32" />
                </td>
                <td className="p-5">
                  <SkeletonBar className="h-3 w-20 mb-1" />
                  <SkeletonBar className="h-3 w-20" />
                </td>
                <td className="p-5">
                  <SkeletonBar className="h-6 w-20 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Esqueleto de perfil/header del sidebar footer ───────────────────────────
export function SkeletonProfileCard() {
  return (
    <div className="w-full p-3 rounded-2xl flex items-center gap-3 border border-[var(--border)]">
      <SkeletonBar className="w-10 h-10 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1 overflow-hidden">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-2.5 w-16" />
      </div>
    </div>
  );
}

// ─── Esqueleto genérico de página completa (loading inicial) ─────────────────
export function SkeletonDashboardPage() {
  return (
    <div className="p-6 md:p-12 max-w-[1400px] mx-auto space-y-10 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBar className="h-9 w-56" />
        <SkeletonBar className="h-5 w-80" />
      </div>
      {/* Stats */}
      <SkeletonStatCards />
      {/* Table */}
      <SkeletonAbsenceList rows={5} />
    </div>
  );
}
