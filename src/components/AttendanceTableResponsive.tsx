"use client";

/**
 * AttendanceTableResponsive
 * ─────────────────────────────────────────────────────────────────────────────
 * MOBILE-FIRST: En pantallas < sm muestra TARJETAS (cards) por alumno.
 * En sm+ muestra la tabla horizontal clásica con overflow-x-auto.
 *
 * Touch targets: todos los botones de estado son ≥ 44×44px en móvil.
 * Animaciones: usa solo transform/opacity para no causar layout thrashing.
 */

import { useMemo } from "react";
import { Alumno } from "@/lib/dataService";

// ─── Tipos de estado disponibles ─────────────────────────────────────────────
type EstadoJornada = "P" | "A" | "M" | "T";
type EstadoMateria = "P" | "A" | "T";
type ModoTabla = "jornada" | "materia";

const ESTADOS_JORNADA = [
  { val: "P" as EstadoJornada, label: "Presente", short: "P",
    active: "bg-emerald-500 text-white shadow-sm",
    idle: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25" },
  { val: "A" as EstadoJornada, label: "Ausente", short: "A",
    active: "bg-rose-500 text-white shadow-sm",
    idle: "bg-rose-500/10 text-rose-600 border border-rose-500/25" },
  { val: "M" as EstadoJornada, label: "½ Falta", short: "M",
    active: "bg-amber-500 text-white shadow-sm",
    idle: "bg-amber-500/10 text-amber-600 border border-amber-500/25" },
  { val: "T" as EstadoJornada, label: "Tarde", short: "T",
    active: "bg-indigo-500 text-white shadow-sm",
    idle: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/25" },
];

const ESTADOS_MATERIA = [
  { val: "P" as EstadoMateria, label: "Presente", short: "P",
    active: "bg-emerald-500 text-white shadow-sm",
    idle: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25" },
  { val: "A" as EstadoMateria, label: "Ausente", short: "A",
    active: "bg-rose-500 text-white shadow-sm",
    idle: "bg-rose-500/10 text-rose-600 border border-rose-500/25" },
  { val: "T" as EstadoMateria, label: "Tarde", short: "T",
    active: "bg-indigo-500 text-white shadow-sm",
    idle: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/25" },
];

interface AttendanceTableResponsiveProps {
  alumnos: Alumno[];
  asistencias: Record<string, string>;
  modo: ModoTabla;
  onChangeEstado: (alId: string, estado: string) => void;
  readOnly?: boolean;
}

// ─── Botón de estado individual ───────────────────────────────────────────────
function EstadoBtn({
  val, label, short, isActive, active, idle, onClick, readOnly,
}: {
  val: string; label: string; short: string;
  isActive: boolean; active: string; idle: string;
  onClick: () => void; readOnly?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={`
        min-w-[44px] min-h-[44px] sm:min-h-[34px] 
        flex items-center justify-center
        px-2 sm:px-3 
        rounded-xl sm:rounded-lg 
        text-xs font-black 
        transition-all duration-150
        active:scale-90
        disabled:cursor-default
        ${isActive ? active + " scale-105" : idle + " hover:opacity-80"}
      `}
    >
      {/* En móvil: letra corta. En sm+: etiqueta completa */}
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Vista Mobile: Tarjeta por alumno ─────────────────────────────────────────
function AlumnoCard({
  alumno, estado, estados, onChangeEstado, readOnly,
}: {
  alumno: Alumno;
  estado: string;
  estados: typeof ESTADOS_JORNADA | typeof ESTADOS_MATERIA;
  onChangeEstado: (alId: string, estado: string) => void;
  readOnly?: boolean;
}) {
  const alId = alumno.id || alumno.dni;
  const estadoActual = estados.find(e => e.val === estado);

  return (
    <div className={`
      p-4 rounded-2xl border transition-all duration-200
      ${estadoActual
        ? estado === "A" ? "border-rose-500/30 bg-rose-500/5"
        : estado === "M" ? "border-amber-500/30 bg-amber-500/5"
        : estado === "T" ? "border-indigo-500/30 bg-indigo-500/5"
        : "border-emerald-500/20 bg-emerald-500/5"
        : "border-[var(--border)] bg-[var(--bg3)]/30"
      }
    `}>
      {/* Nombre y DNI */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <p className="font-bold text-sm text-[var(--text)] leading-tight">{alumno.nombre}</p>
          <p className="font-mono text-[10px] text-[var(--text3)] mt-0.5">DNI: {alumno.dni}</p>
        </div>
        {/* Badge del estado actual */}
        {estadoActual && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${estadoActual.active}`}>
            {estadoActual.label}
          </span>
        )}
      </div>

      {/* Botones de estado (touch-friendly) */}
      <div className="flex gap-2 flex-wrap">
        {estados.map(btn => (
          <EstadoBtn
            key={btn.val}
            val={btn.val}
            label={btn.label}
            short={btn.short}
            isActive={estado === btn.val}
            active={btn.active}
            idle={btn.idle}
            onClick={() => onChangeEstado(alId, btn.val)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Vista Desktop: Tabla con overflow-x-auto ─────────────────────────────────
function AlumnoTableRow({
  alumno, estado, estados, onChangeEstado, readOnly,
}: {
  alumno: Alumno;
  estado: string;
  estados: typeof ESTADOS_JORNADA | typeof ESTADOS_MATERIA;
  onChangeEstado: (alId: string, estado: string) => void;
  readOnly?: boolean;
}) {
  const alId = alumno.id || alumno.dni;

  return (
    <tr className="border-b border-[var(--border)] last:border-none hover:bg-slate-500/5 transition-colors">
      <td className="p-4 font-mono text-xs font-semibold text-[var(--text2)] whitespace-nowrap">
        {alumno.dni}
      </td>
      <td className="p-4 font-bold text-sm text-[var(--text)]">
        {alumno.nombre}
      </td>
      <td className="p-4">
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {estados.map(btn => (
            <EstadoBtn
              key={btn.val}
              val={btn.val}
              label={btn.label}
              short={btn.short}
              isActive={estado === btn.val}
              active={btn.active}
              idle={btn.idle}
              onClick={() => onChangeEstado(alId, btn.val)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AttendanceTableResponsive({
  alumnos,
  asistencias,
  modo,
  onChangeEstado,
  readOnly = false,
}: AttendanceTableResponsiveProps) {
  const estados = modo === "jornada" ? ESTADOS_JORNADA : ESTADOS_MATERIA;

  // Resumen rápido de conteo por estado (útil en el header)
  const resumen = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(asistencias).forEach(e => {
      counts[e] = (counts[e] || 0) + 1;
    });
    return counts;
  }, [asistencias]);

  if (alumnos.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Resumen compacto (útil en móvil para ver el estado general rápido) */}
      <div className="flex gap-2 flex-wrap text-[10px] font-black uppercase tracking-wider">
        {Object.entries(resumen).map(([estado, count]) => {
          const def = estados.find(e => e.val === estado);
          if (!def) return null;
          return (
            <span key={estado} className={`px-2.5 py-1 rounded-lg ${def.active}`}>
              {def.short}: {count}
            </span>
          );
        })}
        <span className="ml-auto text-[var(--text3)] font-bold normal-case">
          {alumnos.length} alumnos
        </span>
      </div>

      {/* ── MOBILE: Tarjetas (< sm) ── */}
      <div className="sm:hidden space-y-3">
        {alumnos.map(alumno => {
          const alId = alumno.id || alumno.dni;
          return (
            <AlumnoCard
              key={alId}
              alumno={alumno}
              estado={asistencias[alId] || "P"}
              estados={estados}
              onChangeEstado={onChangeEstado}
              readOnly={readOnly}
            />
          );
        })}
      </div>

      {/* ── TABLET/DESKTOP: Tabla con scroll horizontal (sm+) ── */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-left border-collapse bg-white/50 dark:bg-slate-950/20 min-w-[520px]">
          <thead>
            <tr className="bg-[var(--bg3)] border-b border-[var(--border)] text-[10px] font-black uppercase text-[var(--text3)] tracking-wider">
              <th className="p-4 whitespace-nowrap">DNI</th>
              <th className="p-4">Nombre del Alumno</th>
              <th className="p-4 text-center">Estado de Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map(alumno => {
              const alId = alumno.id || alumno.dni;
              return (
                <AlumnoTableRow
                  key={alId}
                  alumno={alumno}
                  estado={asistencias[alId] || "P"}
                  estados={estados}
                  onChangeEstado={onChangeEstado}
                  readOnly={readOnly}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
