"use client";

import React, { useId, useMemo, useState, useRef, useEffect } from "react";
import { PLAN_DE_ESTUDIOS, PlanCategory } from "@/lib/curriculum";
import { BookOpen, Search, X, Check, ChevronDown } from "lucide-react";

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

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-foco en el input de búsqueda al abrir
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Filtrar categorías y materias por el término de búsqueda
  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return PLAN_DE_ESTUDIOS;

    return PLAN_DE_ESTUDIOS.map((cat) => {
      const matchingMaterias = cat.materias.filter((m) =>
        m.toLowerCase().includes(term)
      );
      if (matchingMaterias.length > 0 || cat.name.toLowerCase().includes(term)) {
        return {
          ...cat,
          materias: matchingMaterias.length > 0 ? matchingMaterias : cat.materias,
        };
      }
      return null;
    }).filter(Boolean) as PlanCategory[];
  }, [searchTerm]);

  const filteredExtras = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return uniqueExtras;
    return uniqueExtras.filter((m) => m.toLowerCase().includes(term));
  }, [uniqueExtras, searchTerm]);

  const handleSelect = (materia: string) => {
    onChange(materia);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
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

      {/* Input oculto para formularios requeridos nativos */}
      {required && (
        <input
          type="text"
          name={name}
          value={value}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      <div className="relative">
        {/* Botón trigger para abrir el menú con buscador */}
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          autoFocus={autoFocus}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          className={`w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--verde)]/50 focus:border-[var(--verde)] ${
            isOpen ? "border-[var(--verde)] ring-2 ring-[var(--verde)]/20" : ""
          } ${selectClassName}`}
        >
          <span className={`truncate ${value ? "text-[var(--text)]" : "text-[var(--text3)] font-medium"}`}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-2 text-[var(--text3)]">
            {value && !disabled && (
              <span
                onClick={handleClear}
                className="p-1 hover:text-[var(--rojo)] rounded-md transition-colors"
                title="Limpiar selección"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--verde)]" : ""}`} />
          </div>
        </button>

        {/* Dropdown con campo de búsqueda y árbol de materias */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-80">
            {/* Campo buscador integrado */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center gap-2">
              <Search size={15} className="text-[var(--verde)] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar materia (ej: Matemática, Lengua, Física)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-bold text-[var(--text)] placeholder:text-[var(--text3)] placeholder:font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-[var(--text3)] hover:text-[var(--text)] p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Listado agrupado con scroll */}
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-3 flex-1">
              {filteredExtras.length > 0 && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)] px-2.5 py-1">
                    Materias Registradas Previamente ({filteredExtras.length})
                  </div>
                  <div className="space-y-0.5">
                    {filteredExtras.map((m) => {
                      const isSelected = m.toLowerCase() === value.toLowerCase();
                      return (
                        <button
                          key={`extra-${m}`}
                          type="button"
                          onClick={() => handleSelect(m)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-[var(--verde-bg)] text-[var(--verde)] font-black"
                              : "text-[var(--text)] hover:bg-[var(--bg3)]"
                          }`}
                        >
                          <span className="truncate">{m}</span>
                          {isSelected && <Check size={14} className="text-[var(--verde)] shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <div key={cat.id}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-[var(--verde)] px-2.5 py-1 flex items-center justify-between bg-[var(--bg3)]/50 rounded-lg mb-1">
                      <span>{cat.name}</span>
                      <span className="text-[9px] text-[var(--text3)] font-mono">{cat.materias.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {cat.materias.map((mat) => {
                        const isSelected = mat.toLowerCase() === value.toLowerCase();
                        return (
                          <button
                            key={mat}
                            type="button"
                            onClick={() => handleSelect(mat)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-[var(--verde-bg)] text-[var(--verde)] font-black"
                                : "text-[var(--text)] hover:bg-[var(--bg3)]"
                            }`}
                          >
                            <span className="truncate">{mat}</span>
                            {isSelected && <Check size={14} className="text-[var(--verde)] shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text3)] font-semibold italic">
                  No se encontraron materias que coincidan con &quot;{searchTerm}&quot;.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
