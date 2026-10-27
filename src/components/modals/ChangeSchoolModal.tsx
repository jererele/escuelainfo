"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Check, 
  Building2, 
  Search, 
  School, 
  MapPin, 
  GraduationCap, 
  AlertTriangle, 
  Loader2, 
  Info,
  CheckCircle2
} from "lucide-react";
import { UserProfile, fromDbRol } from "@/lib/dataService";
import { 
  CHUBUT_REGIONS, 
  CHUBUT_SCHOOLS, 
  ChubutSchool, 
  getSchoolById, 
  DEFAULT_SCHOOL_ID 
} from "@/lib/chubutSchools";
import UserAvatar from "@/components/ui/UserAvatar";

interface ChangeSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetSchoolId: string) => Promise<void> | void;
  user: {
    id?: string;
    uid?: string;
    nombre: string;
    email?: string;
    rol?: string;
    schoolId?: string;
  } | null;
  currentSchoolId?: string;
}

export default function ChangeSchoolModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  currentSchoolId
}: ChangeSchoolModalProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    user?.schoolId || currentSchoolId || DEFAULT_SCHOOL_ID
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("todas");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.schoolId) {
      setSelectedSchoolId(user.schoolId);
    } else if (currentSchoolId) {
      setSelectedSchoolId(currentSchoolId);
    }
    setSearchQuery("");
    setSelectedRegionFilter("todas");
  }, [user, currentSchoolId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const activeSelectedSchool = useMemo(() => {
    return getSchoolById(selectedSchoolId);
  }, [selectedSchoolId]);

  const currentAssignedSchool = useMemo(() => {
    return getSchoolById(user?.schoolId || currentSchoolId || DEFAULT_SCHOOL_ID);
  }, [user, currentSchoolId]);

  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CHUBUT_SCHOOLS.filter((school) => {
      if (selectedRegionFilter !== "todas" && school.regionId !== selectedRegionFilter) {
        return false;
      }
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
  }, [searchQuery, selectedRegionFilter]);

  const groupedSchools = useMemo(() => {
    const groups: { region: (typeof CHUBUT_REGIONS)[0]; schools: ChubutSchool[] }[] = [];
    for (const region of CHUBUT_REGIONS) {
      const schools = filteredSchools.filter((s) => s.regionId === region.id);
      if (schools.length > 0) {
        groups.push({ region, schools });
      }
    }
    return groups;
  }, [filteredSchools]);

  if (!isOpen || !user) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedSchoolId);
      onClose();
    } catch {
      // Manejado en el contenedor principal
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUnchanged = selectedSchoolId === (user.schoolId || currentSchoolId);

  return createPortal(
    <div 
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[var(--bg)] border border-[var(--border)] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="p-4 sm:p-6 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg2)]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shadow-inner">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[var(--text)] tracking-tight flex items-center gap-2">
                <span>Asignar Escuela Institucional</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] font-black">
                  Admin / Directivo
                </span>
              </h3>
              <p className="text-xs text-[var(--text3)]">
                Fijá la escuela a la que pertenecerá este usuario dentro del sistema escolar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--bg3)] hover:bg-[var(--rojo-bg)] hover:text-[var(--rojo)] flex items-center justify-center text-[var(--text3)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENIDO SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TARJETA DE USUARIO */}
          <div className="p-3.5 bg-[var(--bg2)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar name={user.nombre} email={user.email} size={40} />
              <div className="min-w-0">
                <div className="font-bold text-sm text-[var(--text)] truncate">{user.nombre}</div>
                <div className="text-xs text-[var(--text3)] font-mono truncate">{user.email}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-[var(--text3)] uppercase block">Escuela Actual:</span>
              <span className="text-xs font-semibold text-[var(--text)]">
                {currentAssignedSchool.numero ? `N° ${currentAssignedSchool.numero} · ${currentAssignedSchool.ciudad}` : currentAssignedSchool.nombre}
              </span>
            </div>
          </div>

          {/* BUSCADOR DE ESCUELAS */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <School size={14} className="text-[var(--verde)]" />
                <span>Seleccionar Escuela Designada (Chubut)</span>
              </span>
              <span className="text-[10px] text-[var(--text3)] font-medium">
                {filteredSchools.length} escuelas disponibles
              </span>
            </label>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por número, nombre o ciudad (ej. 713, Esquel, Trelew)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--verde)] rounded-xl py-2.5 pl-10 pr-3 text-xs outline-none transition-all font-medium text-[var(--text)]"
              />
            </div>

            {/* FILTROS POR REGIÓN */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedRegionFilter("todas")}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                  selectedRegionFilter === "todas"
                    ? "bg-[var(--verde)] text-black font-black"
                    : "bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)]"
                }`}
              >
                Todas las Regiones
              </button>
              {CHUBUT_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRegionFilter(r.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    selectedRegionFilter === r.id
                      ? "bg-[var(--verde)] text-black font-black"
                      : "bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)]"
                  }`}
                >
                  {r.numeroRomano} · {r.nombre.replace("Región ", "")}
                </button>
              ))}
            </div>
          </div>

          {/* LISTADO DE ESCUELAS SELECCIONABLES */}
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--bg2)]/50 divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
            {groupedSchools.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text3)] italic">
                No se encontraron escuelas con el término &quot;{searchQuery}&quot;.
              </div>
            ) : (
              groupedSchools.map((group) => (
                <div key={group.region.id} className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--verde)]">
                    {group.region.nombre} · {group.region.zona}
                  </div>
                  {group.schools.map((school) => {
                    const isSelected = selectedSchoolId === school.id;
                    return (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => setSelectedSchoolId(school.id)}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[var(--verde-bg)] border border-[var(--verde-border)] shadow-xs"
                            : "hover:bg-[var(--bg3)] border border-transparent"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[var(--text)] truncate flex items-center gap-1.5">
                            <span className="truncate">{school.nombreCompleto}</span>
                          </div>
                          <div className="text-[11px] text-[var(--text3)] flex items-center gap-1.5 mt-0.5">
                            <MapPin size={11} className="shrink-0 text-[var(--verde)]" />
                            <span>{school.ciudad}</span>
                            <span className="opacity-40">•</span>
                            <span className="capitalize">{school.tipo}</span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[var(--verde)] text-black flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-[var(--border)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* ESCUELA SELECCIONADA CONFIRMACIÓN */}
          <div className="p-3.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] flex items-start gap-3">
            <Info size={16} className="text-[var(--verde)] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-[var(--text)]">
                Escuela a designar: <span className="text-[var(--verde)]">{activeSelectedSchool.nombreCompleto}</span> ({activeSelectedSchool.ciudad})
              </p>
              <p className="text-[var(--text3)] text-[11px]">
                El usuario quedará estrictamente limitado a los datos, listas, horarios y cursos de esta escuela. No podrá ingresar a otras instituciones escolares a menos que un administrador lo reasigne.
              </p>
            </div>
          </div>
        </div>

        {/* PIE DE ACCIONES */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--bg2)] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text2)] hover:bg-[var(--bg3)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSubmitting || isUnchanged}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--verde)] text-black font-black text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Asignando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                <span>Confirmar Asignación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
