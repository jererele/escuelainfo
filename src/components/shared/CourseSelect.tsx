"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import { 
  GraduationCap, 
  Layers, 
  Calendar, 
  Compass, 
  ChevronDown, 
  Check, 
  Sparkles,
  Info,
  Clock
} from "lucide-react";
import { 
  ORIENTACIONES_OFICIALES, 
  DIVISIONES_OFICIALES, 
  TURNOS_OFICIALES,
  formatOfficialCourseName, 
  parseCourseNameComponents,
  OrientacionItem 
} from "@/lib/curriculum";
import { Curso } from "@/lib/dataService";

export interface CourseSelectProps {
  value: string;
  onChange: (value: string) => void;
  cursos?: Curso[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  allowCustomOrBuilder?: boolean; // Permite armar curso con Orientación, Año, División y Turno
  showBuilderByDefault?: boolean;
  includeSinCursoOption?: boolean;
}

export default function CourseSelect({
  value,
  onChange,
  cursos = [],
  label = "División / Curso",
  placeholder = "— Seleccionar Curso —",
  required = false,
  disabled = false,
  className = "",
  id,
  name,
  allowCustomOrBuilder = true,
  showBuilderByDefault = false,
  includeSinCursoOption = false
}: CourseSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  // Estado para el constructor guiado: Orientación, Año, División y Turno
  const parsed = useMemo(() => parseCourseNameComponents(value), [value]);

  const [useBuilder, setUseBuilder] = useState<boolean>(
    showBuilderByDefault || (!cursos.some(c => c.nombre === value) && Boolean(value))
  );

  const [selectedOrientacion, setSelectedOrientacion] = useState<string>(
    parsed.orientacion || "Ciclo Básico"
  );
  const [selectedAnio, setSelectedAnio] = useState<string>(
    parsed.anio || "1°"
  );
  const [selectedDivision, setSelectedDivision] = useState<string>(
    parsed.division || "1ra"
  );
  const [selectedTurno, setSelectedTurno] = useState<string>(
    parsed.turno || "Mañana"
  );

  // Encontrar el objeto de orientación seleccionado
  const orientacionObj = useMemo<OrientacionItem>(() => {
    return (
      ORIENTACIONES_OFICIALES.find(
        (o) => o.shortName.toLowerCase() === selectedOrientacion.toLowerCase() || o.id === selectedOrientacion
      ) || ORIENTACIONES_OFICIALES[0]
    );
  }, [selectedOrientacion]);

  // Años disponibles según la orientación
  const aniosDisponibles = orientacionObj.anios;

  // Asegurar que el año seleccionado sea válido para la orientación actual
  useEffect(() => {
    if (!aniosDisponibles.includes(selectedAnio)) {
      setSelectedAnio(aniosDisponibles[0]);
    }
  }, [selectedOrientacion, aniosDisponibles, selectedAnio]);

  // Actualizar el valor padre cuando se usa el constructor guiado
  const handleBuilderChange = (newOri: string, newAnio: string, newDiv: string, newTurno?: string) => {
    const oriItem = ORIENTACIONES_OFICIALES.find(
      (o) => o.shortName.toLowerCase() === newOri.toLowerCase() || o.id === newOri
    );
    const turnoToApply = newTurno !== undefined ? newTurno : selectedTurno;
    const formatted = formatOfficialCourseName(newAnio, newDiv, oriItem?.shortName, turnoToApply);
    onChange(formatted);
  };

  // Cursos agrupados por Orientación / Ciclo para el selector dropdown rápido
  const cursosAgrupados = useMemo(() => {
    const map: Record<string, Curso[]> = {
      "Ciclo Básico (1° a 3°)": [],
      "Informática (4° a 7°)": [],
      "Electromecánica (4° a 7°)": [],
      "Construcciones (4° a 7°)": [],
      "Economía y Gestión (4° a 6°)": [],
      "Otros Cursos / Aulas": []
    };

    cursos.forEach((c) => {
      const lower = c.nombre.toLowerCase();
      if (lower.includes("info")) {
        map["Informática (4° a 7°)"].push(c);
      } else if (lower.includes("electro")) {
        map["Electromecánica (4° a 7°)"].push(c);
      } else if (lower.includes("construc") || lower.includes("mmo")) {
        map["Construcciones (4° a 7°)"].push(c);
      } else if (lower.includes("gest") || lower.includes("econ")) {
        map["Economía y Gestión (4° a 6°)"].push(c);
      } else if (
        lower.startsWith("1") ||
        lower.startsWith("2") ||
        lower.startsWith("3") ||
        lower.includes("ciclo b") ||
        lower.includes("básico")
      ) {
        map["Ciclo Básico (1° a 3°)"].push(c);
      } else {
        map["Otros Cursos / Aulas"].push(c);
      }
    });

    return map;
  }, [cursos]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Cabecera del Campo */}
      <div className="flex items-center justify-between ml-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[10px] font-black uppercase text-[var(--text3)] flex items-center gap-1.5"
          >
            <GraduationCap size={13} className="text-[var(--verde)]" />
            <span>{label}</span>
            {required && <span className="text-[var(--rojo)]">*</span>}
          </label>
        )}

        {allowCustomOrBuilder && (
          <button
            type="button"
            onClick={() => setUseBuilder(!useBuilder)}
            className="text-[10px] font-bold text-[var(--verde)] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles size={11} />
            <span>{useBuilder ? "Ver lista de cursos" : "Armar con Orientación / Año / Div."}</span>
          </button>
        )}
      </div>

      {/* MODO 1: CONSTRUCTOR DETALLADO (Orientación + Año + División) */}
      {useBuilder ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg2)]/80 border border-[var(--border)] space-y-3.5 shadow-xs animate-fade-in">
          {/* Fila 1: Selector de Orientación */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-[var(--text3)] flex items-center gap-1">
              <Compass size={11} className="text-[var(--verde)]" />
              1. Orientación / Especialidad
            </span>
            <select
              value={selectedOrientacion}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedOrientacion(val);
                const targetOri = ORIENTACIONES_OFICIALES.find(o => o.shortName === val || o.id === val);
                const firstAnio = targetOri ? targetOri.anios[0] : "1°";
                setSelectedAnio(firstAnio);
                handleBuilderChange(val, firstAnio, selectedDivision, selectedTurno);
              }}
              className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--verde)] text-[var(--text)] rounded-xl py-2 px-3 text-xs font-bold outline-none cursor-pointer"
            >
              {ORIENTACIONES_OFICIALES.map((ori) => (
                <option key={ori.id} value={ori.shortName}>
                  {ori.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fila 2: Año, División y Turno */}
          <div className="grid grid-cols-3 gap-2">
            {/* Año de cursada */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[var(--text3)] flex items-center gap-1 truncate">
                <Calendar size={11} className="text-[var(--verde)]" />
                2. Año
              </span>
              <select
                value={selectedAnio}
                disabled={disabled}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAnio(val);
                  handleBuilderChange(selectedOrientacion, val, selectedDivision, selectedTurno);
                }}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--verde)] text-[var(--text)] rounded-xl py-2 px-2 text-xs font-bold outline-none cursor-pointer"
              >
                {aniosDisponibles.map((a) => (
                  <option key={a} value={a}>
                    Año {a}
                  </option>
                ))}
              </select>
            </div>

            {/* División */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[var(--text3)] flex items-center gap-1 truncate">
                <Layers size={11} className="text-[var(--verde)]" />
                3. División
              </span>
              <select
                value={selectedDivision}
                disabled={disabled}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDivision(val);
                  handleBuilderChange(selectedOrientacion, selectedAnio, val, selectedTurno);
                }}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--verde)] text-[var(--text)] rounded-xl py-2 px-2 text-xs font-bold outline-none cursor-pointer"
              >
                {DIVISIONES_OFICIALES.map((div) => (
                  <option key={div} value={div}>
                    División {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Turno */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[var(--text3)] flex items-center gap-1 truncate">
                <Clock size={11} className="text-[var(--verde)]" />
                4. Turno
              </span>
              <select
                value={selectedTurno}
                disabled={disabled}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTurno(val);
                  handleBuilderChange(selectedOrientacion, selectedAnio, selectedDivision, val);
                }}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--verde)] text-[var(--text)] rounded-xl py-2 px-2 text-xs font-bold outline-none cursor-pointer"
              >
                {TURNOS_OFICIALES.map((t) => (
                  <option key={t} value={t}>
                    Turno {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview del curso armado */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--verde-bg)]/30 border border-[var(--verde-border)]/50 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--verde)]">
              Resultado generado:
            </span>
            <span className="font-black text-[var(--text)] font-mono">
              {value || formatOfficialCourseName(selectedAnio, selectedDivision, orientacionObj.shortName, selectedTurno)}
            </span>
          </div>
        </div>
      ) : (
        /* MODO 2: SELECTOR COMPACTO LISTADO DE CURSOS EXISTENTES */
        <div className="relative">
          <select
            id={selectId}
            name={name}
            value={value}
            required={required}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--verde)] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-[var(--text)] outline-none transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <option value="" disabled>
              {placeholder}
            </option>

            {includeSinCursoOption && (
              <option value="pendiente">Sin curso (Desinscribir / Por asignar)</option>
            )}

            {Object.entries(cursosAgrupados).map(([categoria, lista]) => {
              if (lista.length === 0) return null;
              return (
                <optgroup key={categoria} label={categoria}>
                  {lista.map((c) => (
                    <option key={c.id || c.nombre} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </optgroup>
              );
            })}

            {/* Si el valor actual no está en la lista de cursos agrupados, mostrarlo para no perderlo */}
            {value &&
              value !== "pendiente" &&
              !cursos.some((c) => c.nombre.trim().toLowerCase() === value.trim().toLowerCase()) && (
                <optgroup label="Curso Personalizado">
                  <option value={value}>{value}</option>
                </optgroup>
              )}
          </select>
        </div>
      )}
    </div>
  );
}
