"use client";

import React, { useId, useMemo } from "react";
import { PLAN_DE_ESTUDIOS, PlanCategory } from "@/lib/curriculum";
import { BookOpen } from "lucide-react";

export interface SubjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
  label?: string;
  extraSubjects?: string[];
  id?: string;
  name?: string;
  autoFocus?: boolean;
}

export default function SubjectSelect({
  value,
  onChange,
  placeholder = "— Seleccionar Materia del Plan de Estudios —",
  required = false,
  disabled = false,
  className = "",
  selectClassName = "",
  label,
  extraSubjects = [],
  id,
  name,
  autoFocus = false,
}: SubjectSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  // Filtrar extras que no estén ya dentro del plan de estudios oficial para evitar duplicados
  const uniqueExtras = useMemo(() => {
    const allOfficial = new Set(
      PLAN_DE_ESTUDIOS.flatMap((c) => c.materias.map((m) => m.toLowerCase().trim()))
    );
    return Array.from(
      new Set(
        (extraSubjects || [])
          .map((s) => s.trim())
          .filter((s) => s && !allOfficial.has(s.toLowerCase()))
      )
    );
  }, [extraSubjects]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[10px] font-black uppercase text-[var(--text3)] ml-2 flex items-center gap-1.5"
        >
          <BookOpen size={12} className="text-[var(--verde)]" />
          <span>{label}</span>
          {required && <span className="text-[var(--rojo)]">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          name={name}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${selectClassName}`}
        >
          <option value="">{placeholder}</option>

          {/* Materias adicionales o preexistentes fuera del plan estándar */}
          {uniqueExtras.length > 0 && (
            <optgroup label="Materias Registradas Previamente">
              {uniqueExtras.map((m) => (
                <option key={`extra-${m}`} value={m}>
                  {m}
                </option>
              ))}
            </optgroup>
          )}

          {/* Materias del Plan de Estudios agrupadas por ciclo y orientación */}
          {PLAN_DE_ESTUDIOS.map((cat: PlanCategory) => (
            <optgroup key={cat.id} label={`${cat.name} (${cat.materias.length})`}>
              {cat.materias.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
