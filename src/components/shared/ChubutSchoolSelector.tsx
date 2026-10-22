"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Building2, 
  MapPin, 
  Search, 
  Check, 
  ChevronDown, 
  X, 
  GraduationCap, 
  SlidersHorizontal,
  School
} from "lucide-react";
import {
  CHUBUT_REGIONS,
  CHUBUT_SCHOOLS,
  ChubutSchool,
  getSchoolById,
  getSavedSchoolId,
  setSavedSchoolId,
  DEFAULT_SCHOOL_ID
} from "@/lib/chubutSchools";

interface ChubutSchoolSelectorProps {
  selectedSchoolId?: string;
  onSelect?: (school: ChubutSchool) => void;
  className?: string;
  variant?: "badge" | "compact" | "form-input";
  label?: string;
  isReadOnly?: boolean;
  allowedSchoolIds?: string[];
  readOnlyMessage?: string;
}

export default function ChubutSchoolSelector({
  selectedSchoolId,
  onSelect,
  className = "",
  variant = "badge",
  label = "Escuela Secundaria",
  isReadOnly = false,
  allowedSchoolIds,
  readOnlyMessage = "Institución asignada a tu cuenta. Solo un administrador puede reasignarla."
}: ChubutSchoolSelectorProps) {
  const [internalSchoolId, setInternalSchoolId] = useState<string>(DEFAULT_SCHOOL_ID);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("todas");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar con almacenamiento local o props
  useEffect(() => {
    if (selectedSchoolId) {
      setInternalSchoolId(selectedSchoolId);
    } else {
      setInternalSchoolId(getSavedSchoolId());
    }

    const handleSchoolChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ schoolId: string }>;
      if (customEvent.detail?.schoolId) {
        setInternalSchoolId(customEvent.detail.schoolId);
      }
    };

    window.addEventListener("escuelainfo:school-changed", handleSchoolChanged);
    return () => window.removeEventListener("escuelainfo:school-changed", handleSchoolChanged);
  }, [selectedSchoolId]);

  const activeSchool = useMemo(() => {
    return getSchoolById(internalSchoolId);
  }, [internalSchoolId]);

  // Filtrado reactivo de escuelas
  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CHUBUT_SCHOOLS.filter((school) => {
      // Filtro por escuelas permitidas si se especificó
      if (allowedSchoolIds && allowedSchoolIds.length > 0 && !allowedSchoolIds.includes(school.id)) {
        return false;
      }
      // Filtro por región
      if (selectedRegionFilter !== "todas" && school.regionId !== selectedRegionFilter) {
        return false;
      }
      // Filtro por búsqueda de texto
      if (!q) return true;
      return (
        school.numero.toLowerCase().includes(q) ||
        school.nombre.toLowerCase().includes(q) ||
        school.nombreCompleto.toLowerCase().includes(q) ||
        school.ciudad.toLowerCase().includes(q) ||
        school.regionNombre.toLowerCase().includes(q) ||
        school.tipo.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedRegionFilter, allowedSchoolIds]);

  // Agrupación de las escuelas filtradas por región
  const groupedFiltered = useMemo(() => {
    const groups: { region: (typeof CHUBUT_REGIONS)[0]; schools: ChubutSchool[] }[] = [];
    for (const region of CHUBUT_REGIONS) {
      const schools = filteredSchools.filter((s) => s.regionId === region.id);
      if (schools.length > 0) {
        groups.push({ region, schools });
      }
    }
    return groups;
  }, [filteredSchools]);

  // Manejador de selección
  const handleSelectSchool = (school: ChubutSchool) => {
    setInternalSchoolId(school.id);
    setSavedSchoolId(school.id);
    if (onSelect) {
      onSelect(school);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  // Auto-focus en el buscador al abrir modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Cerrar modal al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const getTipoBadge = (tipo: ChubutSchool["tipo"]) => {
    switch (tipo) {
      case "tecnica":
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Técnica
          </span>
        );
      case "agrotecnica":
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Agrotécnica
          </span>
        );
      case "arte":
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Arte
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-[var(--verde)]/10 text-[var(--verde)] border border-[var(--verde)]/20">
            Secundaria
          </span>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* TRIGGER SEGÚN VARIANTE */}
      {variant === "form-input" ? (
        <div className="space-y-1">
          {label && (
            <label className="text-xs font-semibold text-[var(--text3)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <School size={13} className="text-[var(--verde)]" />
                {label}
              </span>
              <span className="text-[10px] text-[var(--text3)] font-medium">
                {isReadOnly ? "Escuela Designada" : "Chubut · 6 Regiones"}
              </span>
            </label>
          )}
          {isReadOnly ? (
            <div
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 font-medium text-sm text-[var(--text)] flex items-center justify-between gap-2 shadow-xs cursor-default"
              title={readOnlyMessage}
            >
              <div className="min-w-0 flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center shrink-0 text-[var(--verde)]">
                  <GraduationCap size={16} />
                </div>
                <div className="min-w-0 truncate">
                  <div className="font-bold text-xs truncate text-[var(--text)] flex items-center gap-1.5">
                    <span>{activeSchool.nombreCompleto}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text3)] flex items-center gap-1 truncate">
                    <MapPin size={11} className="shrink-0 text-[var(--verde)]" />
                    <span>{activeSchool.ciudad}</span>
                    <span className="opacity-40">•</span>
                    <span>{activeSchool.regionNombre.split("·")[0].trim()}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] px-2 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--border)] shrink-0">
                Fija
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="w-full bg-[var(--bg3)] hover:bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--verde)] rounded-xl px-3.5 py-2.5 outline-none font-medium text-sm text-[var(--text)] transition-all flex items-center justify-between gap-2 text-left group shadow-sm"
            >
              <div className="min-w-0 flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center shrink-0 text-[var(--verde)]">
                  <GraduationCap size={16} />
                </div>
                <div className="min-w-0 truncate">
                  <div className="font-bold text-xs truncate text-[var(--text)] flex items-center gap-1.5">
                    <span>{activeSchool.nombreCompleto}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text3)] flex items-center gap-1 truncate">
                    <MapPin size={11} className="shrink-0 text-[var(--verde)]" />
                    <span>{activeSchool.ciudad}</span>
                    <span className="opacity-40">•</span>
                    <span>{activeSchool.regionNombre.split("·")[0].trim()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-[var(--verde)] group-hover:underline">
                <span>Elegir</span>
                <ChevronDown size={14} className="text-[var(--text3)] group-hover:text-[var(--verde)] transition-colors" />
              </div>
            </button>
          )}
        </div>
      ) : variant === "compact" ? (
        isReadOnly ? (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] cursor-default"
            title={readOnlyMessage}
          >
            <Building2 size={13} className="text-[var(--verde)]" />
            <span className="truncate max-w-[200px]">{activeSchool.nombreCompleto}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg3)] hover:bg-[var(--bg2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-all"
          >
            <Building2 size={13} className="text-[var(--verde)]" />
            <span className="truncate max-w-[200px]">{activeSchool.nombreCompleto}</span>
            <ChevronDown size={12} className="text-[var(--text3)]" />
          </button>
        )
      ) : (
        /* VARIANTE "badge" PARA CABECERAS DE ACCESO */
        <div className="inline-flex flex-col items-center">
          {isReadOnly ? (
            <div
              className="relative inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-full text-xs font-bold tracking-wide shadow-sm cursor-default"
              title={readOnlyMessage}
            >
              <div className="w-2 h-2 rounded-full bg-[var(--verde)]" />
              <span className="truncate max-w-[280px] sm:max-w-[360px]">
                {activeSchool.nombreCompleto}
              </span>
              <span className="text-[10px] opacity-75 font-normal px-1.5 py-0.2 bg-black/20 rounded-md">
                {activeSchool.ciudad}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--verde-bg)] hover:brightness-110 active:scale-[0.98] text-[var(--verde)] border border-[var(--verde-border)] rounded-full text-xs font-bold tracking-wide transition-all shadow-sm cursor-pointer"
              title="Hacé clic para cambiar la escuela secundaria"
            >
              <div className="w-2 h-2 rounded-full bg-[var(--verde)] animate-pulse" />
              <span className="truncate max-w-[280px] sm:max-w-[360px]">
                {activeSchool.nombreCompleto}
              </span>
              <span className="text-[10px] opacity-75 font-normal px-1.5 py-0.2 bg-black/20 rounded-md">
                {activeSchool.ciudad}
              </span>
              <ChevronDown size={13} className="text-[var(--verde)] opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
            </button>
          )}

          <span className="text-[10px] text-[var(--text3)] mt-1 font-medium flex items-center gap-1">
            <span>{activeSchool.regionNombre}</span>
            {isReadOnly ? (
              <>
                <span>•</span>
                <span className="text-[var(--verde)] font-semibold">Escuela Designada</span>
              </>
            ) : (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="text-[var(--verde)] hover:underline font-semibold cursor-pointer"
                >
                  Cambiar escuela
                </button>
              </>
            )}
          </span>
        </div>
      )}

      {/* MODAL / DIÁLOGO DE SELECCIÓN DE ESCUELA POR REGIONES DE CHUBUT */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            className="bg-[var(--bg2)] border border-[var(--border)] w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--bg)]/50 shrink-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shadow-inner">
                    <School size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-[var(--text)]">
                      Escuelas Secundarias de Chubut
                    </h3>
                    <p className="text-xs text-[var(--text3)]">
                      Seleccioná tu institución educativa organizada por región
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors cursor-pointer"
                  aria-label="Cerrar selector"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Barra de Búsqueda Rápida */}
              <div className="relative mt-3">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por número (ej: 713, 703), nombre o ciudad (Esquel, Madryn, Trelew)..."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--verde)] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--text3)]/60 outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtros de Regiones */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 custom-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRegionFilter("todas")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    selectedRegionFilter === "todas"
                      ? "bg-[var(--verde)] text-black shadow-sm"
                      : "bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                  }`}
                >
                  Todas ({CHUBUT_SCHOOLS.length})
                </button>
                {CHUBUT_REGIONS.map((reg) => {
                  const count = CHUBUT_SCHOOLS.filter((s) => s.regionId === reg.id).length;
                  const isSelected = selectedRegionFilter === reg.id;
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => setSelectedRegionFilter(reg.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-[var(--verde)] text-black shadow-sm"
                          : "bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                      }`}
                    >
                      <span>{reg.nombre}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded ${isSelected ? "bg-black/20" : "bg-black/40 text-[var(--text3)]"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listado de Escuelas con Scroll */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
              {groupedFiltered.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg3)] flex items-center justify-center mx-auto text-[var(--text3)]">
                    <Search size={20} />
                  </div>
                  <p className="text-sm font-bold text-[var(--text)]">No se encontraron escuelas</p>
                  <p className="text-xs text-[var(--text3)] max-w-sm mx-auto">
                    No hay resultados para &quot;{searchQuery}&quot; en la región seleccionada. Intentá buscar por número de escuela o ciudad.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedRegionFilter("todas");
                    }}
                    className="mt-2 text-xs font-bold text-[var(--verde)] hover:underline"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : (
                groupedFiltered.map(({ region, schools }) => (
                  <div key={region.id} className="space-y-2">
                    {/* Encabezado de Región */}
                    <div className="flex items-center justify-between px-2 pt-1 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-[var(--verde)] bg-[var(--verde-bg)] px-2 py-0.5 rounded border border-[var(--verde-border)]">
                          {region.nombre}
                        </span>
                        <span className="text-xs font-bold text-[var(--text)]">
                          {region.zona}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text3)]">
                        {schools.length} {schools.length === 1 ? "institución" : "instituciones"}
                      </span>
                    </div>

                    {/* Tarjetas de escuelas de la región */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {schools.map((school) => {
                        const isCurrent = school.id === internalSchoolId;
                        return (
                          <button
                            key={school.id}
                            type="button"
                            onClick={() => handleSelectSchool(school)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 cursor-pointer group ${
                              isCurrent
                                ? "bg-[var(--verde-bg)] border-[var(--verde)] ring-1 ring-[var(--verde)]/50 shadow-md"
                                : "bg-[var(--bg3)] hover:bg-[var(--bg)] border-[var(--border)] hover:border-[var(--verde-border)]"
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-black text-[var(--text)] group-hover:text-[var(--verde)] transition-colors">
                                  N° {school.numero}
                                </span>
                                {getTipoBadge(school.tipo)}
                              </div>

                              <div className="font-semibold text-xs text-[var(--text)] line-clamp-1 group-hover:text-[var(--text)]">
                                {school.nombre}
                              </div>

                              <div className="text-[11px] text-[var(--text3)] flex items-center gap-1 truncate">
                                <MapPin size={11} className="shrink-0 text-[var(--verde)]" />
                                <span>{school.ciudad}</span>
                              </div>
                            </div>

                            <div className="shrink-0 pt-0.5">
                              {isCurrent ? (
                                <div className="w-5 h-5 rounded-full bg-[var(--verde)] text-black flex items-center justify-center shadow-sm">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-[var(--border)] group-hover:border-[var(--verde)] transition-colors" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Informativo */}
            <div className="p-3 bg-[var(--bg)]/80 border-t border-[var(--border)] text-center text-[11px] text-[var(--text3)] flex items-center justify-between flex-wrap gap-2 px-4 shrink-0">
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-[var(--verde)]" />
                <span>63 Secundarias · Ministerio de Educación del Chubut</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-[var(--bg3)] hover:bg-[var(--border)] text-xs font-bold text-[var(--text)] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
