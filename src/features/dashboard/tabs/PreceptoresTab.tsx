"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  UserCheck, 
  Users, 
  BookOpen, 
  Search, 
  Plus, 
  Pencil, 
  Mail, 
  FolderOpen, 
  AlertCircle, 
  Check, 
  X, 
  Layers, 
  Percent, 
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Filter
} from "lucide-react";
import { UserProfile, Curso, updateUserProfile, logAction } from "@/lib/dataService";
import { account } from "@/lib/appwrite";
import UserAvatar from "@/components/ui/UserAvatar";

interface PreceptoresTabProps {
  usuarios: UserProfile[];
  cursos: Curso[];
  userProfile: UserProfile | null;
  isAdmin: boolean;
  onRefreshUsuarios: () => void;
  showToast: (message: string, type?: "success" | "error") => void;
}

export const PreceptoresTab: React.FC<PreceptoresTabProps> = ({
  usuarios,
  cursos,
  userProfile,
  isAdmin,
  onRefreshUsuarios,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("todos");
  const [coverageFilter, setCoverageFilter] = useState<"todos" | "con_cursos" | "sin_cursos">("todos");
  const [editingPreceptor, setEditingPreceptor] = useState<UserProfile | null>(null);
  const [selectedCursos, setSelectedCursos] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado para asignación rápida de preceptores a un curso seleccionado
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<string | null>(null);
  const [selectedPreceptorsForCourse, setSelectedPreceptorsForCourse] = useState<string[]>([]);
  const [isCourseAssignModalOpen, setIsCourseAssignModalOpen] = useState(false);
  const [savingCoursePreceptors, setSavingCoursePreceptors] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueo de scroll en el fondo mientras algún modal está abierto
  useEffect(() => {
    if (isModalOpen || isCourseAssignModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen, isCourseAssignModalOpen]);

  // Obtener listado de preceptores
  const preceptores = useMemo(() => {
    return usuarios.filter(u => u.rol === "preceptor");
  }, [usuarios]);

  // Mapa de cursos y qué preceptores los tienen a cargo
  const courseCoverageMap = useMemo(() => {
    const map = new Map<string, UserProfile[]>();
    cursos.forEach(c => map.set(c.nombre, []));

    preceptores.forEach(p => {
      (p.cursos || []).forEach(cName => {
        const list = map.get(cName) || [];
        list.push(p);
        map.set(cName, list);
      });
    });

    return map;
  }, [cursos, preceptores]);

  // Estadísticas institucionales de preceptoría
  const stats = useMemo(() => {
    const totalPreceptores = preceptores.length;
    const totalCursos = cursos.length;
    let coveredCursosCount = 0;
    const unassignedCursosList: string[] = [];

    cursos.forEach(c => {
      const assigned = courseCoverageMap.get(c.nombre) || [];
      if (assigned.length > 0) {
        coveredCursosCount++;
      } else {
        unassignedCursosList.push(c.nombre);
      }
    });

    const coveragePercent = totalCursos > 0 ? Math.round((coveredCursosCount / totalCursos) * 100) : 0;

    return {
      totalPreceptores,
      totalCursos,
      coveredCursosCount,
      unassignedCursosCount: unassignedCursosList.length,
      unassignedCursosList,
      coveragePercent
    };
  }, [preceptores, cursos, courseCoverageMap]);

  // Filtrado de preceptores
  const filteredPreceptores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return preceptores.filter(p => {
      const matchesSearch = 
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.cursos || []).some(c => c.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Filtro de cobertura
      const hasCourses = p.cursos && p.cursos.length > 0;
      if (coverageFilter === "con_cursos" && !hasCourses) return false;
      if (coverageFilter === "sin_cursos" && hasCourses) return false;

      // Filtro por curso específico
      if (selectedCourseFilter !== "todos") {
        if (!p.cursos || !p.cursos.includes(selectedCourseFilter)) return false;
      }

      return true;
    });
  }, [preceptores, searchQuery, coverageFilter, selectedCourseFilter]);

  // Apertura de modal para asignar/gestionar cursos
  const handleOpenAssignModal = (preceptor: UserProfile) => {
    setEditingPreceptor(preceptor);
    setSelectedCursos(preceptor.cursos ? [...preceptor.cursos] : []);
    setIsModalOpen(true);
  };

  const handleToggleCourse = (cursoNombre: string) => {
    setSelectedCursos(prev => 
      prev.includes(cursoNombre)
        ? prev.filter(c => c !== cursoNombre)
        : [...prev, cursoNombre]
    );
  };

  const handleSelectAllCourses = () => {
    setSelectedCursos(cursos.map(c => c.nombre));
  };

  const handleClearCourses = () => {
    setSelectedCursos([]);
  };

  const handleSaveCourses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreceptor || !editingPreceptor.id) return;

    setSaving(true);
    try {
      await updateUserProfile(editingPreceptor.id, {
        cursos: selectedCursos
      });

      let adminEmail = "desconocido";
      try {
        const u = await account.get();
        adminEmail = u.email;
      } catch {}

      await logAction(
        adminEmail,
        "ASIGNAR_CURSOS_PRECEPTOR",
        `Preceptor: ${editingPreceptor.nombre} (${editingPreceptor.email}) - Cursos: ${selectedCursos.join(", ") || "Sin cursos"}`
      );

      showToast(`Cursos asignados correctamente a ${editingPreceptor.nombre}`, "success");
      onRefreshUsuarios();
      setIsModalOpen(false);
      setEditingPreceptor(null);
    } catch (err) {
      showToast("Error al guardar la asignación de cursos", "error");
    } finally {
      setSaving(false);
    }
  };

  // Apertura de modal para asignar preceptores a una división específica
  const handleOpenCoursePreceptorModal = (cursoNombre: string) => {
    setSelectedCourseForModal(cursoNombre);
    const assignedIds = preceptores
      .filter(p => (p.cursos || []).includes(cursoNombre))
      .map(p => p.id!)
      .filter(Boolean);
    setSelectedPreceptorsForCourse(assignedIds);
    setIsCourseAssignModalOpen(true);
  };

  const handleTogglePreceptorForCourse = (preceptorId: string) => {
    setSelectedPreceptorsForCourse(prev =>
      prev.includes(preceptorId)
        ? prev.filter(id => id !== preceptorId)
        : [...prev, preceptorId]
    );
  };

  const handleSavePreceptorsForCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForModal) return;

    setSavingCoursePreceptors(true);
    try {
      const updates = preceptores.map(async (p) => {
        if (!p.id) return;
        const currentCursos = p.cursos ? [...p.cursos] : [];
        const isSelected = selectedPreceptorsForCourse.includes(p.id);
        const hasCourse = currentCursos.includes(selectedCourseForModal);

        if (isSelected && !hasCourse) {
          const newCursos = [...currentCursos, selectedCourseForModal];
          return updateUserProfile(p.id, { cursos: newCursos });
        } else if (!isSelected && hasCourse) {
          const newCursos = currentCursos.filter(c => c !== selectedCourseForModal);
          return updateUserProfile(p.id, { cursos: newCursos });
        }
      });

      await Promise.all(updates);

      let adminEmail = "desconocido";
      try {
        const u = await account.get();
        adminEmail = u.email;
      } catch {}

      await logAction(
        adminEmail,
        "ASIGNAR_CURSOS_PRECEPTOR",
        `Curso: ${selectedCourseForModal} - Preceptores actualizados: ${selectedPreceptorsForCourse.length}`
      );

      showToast(`Asignación de preceptoría guardada para ${selectedCourseForModal}`, "success");
      onRefreshUsuarios();
      setIsCourseAssignModalOpen(false);
      setSelectedCourseForModal(null);
    } catch (err) {
      showToast("Error al guardar la asignación de preceptoría", "error");
    } finally {
      setSavingCoursePreceptors(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-[10px] font-black uppercase tracking-wider mb-2">
            <ShieldCheck size={13} strokeWidth={2.5} />
            <span>Exclusivo Directivos y Administradores</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black title-font text-[var(--text)]">
            Cuerpo de Preceptoría
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text2)] font-semibold mt-1">
            Gestión integral de preceptores, asignación de cursos a cargo y control de cobertura escolar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (preceptores.length > 0) {
              handleOpenAssignModal(preceptores[0]);
            } else {
              showToast("No hay usuarios con rol de preceptor registrados aún.", "error");
            }
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--verde)] text-black font-black text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Asignar Cursos a Preceptor</span>
        </button>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS Y MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Preceptores */}
        <div className="card glass p-4 sm:p-5 rounded-[28px] border border-[var(--border)] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--text3)]">
              Preceptores
            </span>
            <div className="w-8 h-8 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] flex items-center justify-center">
              <UserCheck size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[var(--text)]">
              {stats.totalPreceptores}
            </div>
            <p className="text-[11px] text-[var(--text2)] font-semibold mt-0.5">
              Cuentas habilitadas
            </p>
          </div>
        </div>

        {/* Cursos Cubiertos */}
        <div className="card glass p-4 sm:p-5 rounded-[28px] border border-[var(--border)] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--text3)]">
              Cursos Cubiertos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <FolderOpen size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[var(--text)]">
              {stats.coveredCursosCount} <span className="text-sm font-bold text-[var(--text3)]">/ {stats.totalCursos}</span>
            </div>
            <p className="text-[11px] text-[var(--text2)] font-semibold mt-0.5">
              Divisiones con preceptor
            </p>
          </div>
        </div>

        {/* Cursos sin Preceptor */}
        <div className={`card glass p-4 sm:p-5 rounded-[28px] border flex flex-col justify-between shadow-xs ${
          stats.unassignedCursosCount > 0 
            ? "border-[var(--amarillo-border)] bg-[var(--amarillo-bg)]/30" 
            : "border-[var(--border)]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--text3)]">
              Sin Asignación
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.unassignedCursosCount > 0 
                ? "bg-[var(--amarillo)]/20 text-[var(--amarillo)]" 
                : "bg-[var(--bg3)] text-[var(--text3)]"
            }`}>
              <AlertCircle size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-black ${
              stats.unassignedCursosCount > 0 ? "text-[var(--amarillo)]" : "text-[var(--text)]"
            }`}>
              {stats.unassignedCursosCount}
            </div>
            <p className="text-[11px] text-[var(--text2)] font-semibold mt-0.5">
              {stats.unassignedCursosCount === 0 ? "Cobertura plena" : "Divisiones sin preceptor"}
            </p>
          </div>
        </div>

        {/* Cobertura Institucional */}
        <div className="card glass p-4 sm:p-5 rounded-[28px] border border-[var(--border)] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--text3)]">
              Cobertura Plena
            </span>
            <div className="w-8 h-8 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] flex items-center justify-center">
              <Percent size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[var(--verde)]">
              {stats.coveragePercent}%
            </div>
            <div className="w-full bg-[var(--bg3)] rounded-full h-1.5 mt-2 overflow-hidden border border-[var(--border)]">
              <div 
                className="bg-[var(--verde)] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.coveragePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MATRIZ DE COBERTURA DE DIVISIONES */}
      <div className="card glass rounded-[32px] p-5 sm:p-6 border border-[var(--border)] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text)]">
                Mapa General de Divisiones Escolares
              </h3>
              <p className="text-xs text-[var(--text2)] font-semibold">
                Estado de asignación por curso institucional.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
          {cursos.map(c => {
            const assignedPreceptors = courseCoverageMap.get(c.nombre) || [];
            const isCovered = assignedPreceptors.length > 0;

            return (
              <div 
                key={c.id || c.nombre}
                onClick={() => handleOpenCoursePreceptorModal(c.nombre)}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 cursor-pointer active:scale-[0.98] group hover:shadow-md ${
                  isCovered
                    ? "bg-[var(--bg)]/80 border-[var(--border)] hover:border-[var(--verde)] shadow-xs"
                    : "bg-[var(--amarillo-bg)]/40 border-[var(--amarillo-border)] hover:border-[var(--amarillo)]"
                }`}
                title={`Hacé clic para asignar o modificar preceptores de ${c.nombre}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[var(--text)] truncate group-hover:text-[var(--verde)] transition-colors">
                    {c.nombre}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                    isCovered 
                      ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] group-hover:bg-[var(--verde)] group-hover:text-black" 
                      : "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)] group-hover:bg-[var(--amarillo)] group-hover:text-black"
                  }`}>
                    {isCovered ? "Asignado" : "+ Asignar"}
                  </span>
                </div>

                <div className="text-[11px] text-[var(--text2)]">
                  {isCovered ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {assignedPreceptors.map(p => (
                        <span 
                          key={p.id || p.email} 
                          className="inline-flex items-center gap-1 font-bold text-[10px] text-[var(--text)] bg-[var(--bg3)] px-2 py-0.5 rounded-md border border-[var(--border)] truncate max-w-full"
                          title={p.email}
                        >
                          <UserAvatar name={p.nombre} email={p.email} size={14} />
                          <span className="truncate">{p.nombre.split(" ")[0]}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-[var(--amarillo)] font-bold italic flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>Clic para asignar preceptor</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)] shadow-xs">
        {/* Buscador */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, email o división..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-xs sm:text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all placeholder:text-[var(--text3)]"
          />
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Filtro por estado de cursos */}
          <div className="flex bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setCoverageFilter("todos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                coverageFilter === "todos"
                  ? "bg-[var(--verde)] text-black shadow-xs font-black"
                  : "text-[var(--text2)] hover:text-[var(--text)]"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setCoverageFilter("con_cursos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                coverageFilter === "con_cursos"
                  ? "bg-[var(--verde)] text-black shadow-xs font-black"
                  : "text-[var(--text2)] hover:text-[var(--text)]"
              }`}
            >
              Con Cursos
            </button>
            <button
              onClick={() => setCoverageFilter("sin_cursos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                coverageFilter === "sin_cursos"
                  ? "bg-[var(--verde)] text-black shadow-xs font-black"
                  : "text-[var(--text2)] hover:text-[var(--text)]"
              }`}
            >
              Sin Cursos
            </button>
          </div>

          {/* Filtro por división específica */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text)] outline-none focus:border-[var(--verde)] cursor-pointer"
          >
            <option value="todos">Cualquier división</option>
            {cursos.map(c => (
              <option key={c.id || c.nombre} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRILLA DE PRECEPTORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPreceptores.length === 0 ? (
          <div className="col-span-full p-16 sm:p-20 glass rounded-[32px] text-center border border-dashed border-[var(--border)]">
            <UserCheck size={36} className="mx-auto text-[var(--text3)] mb-3 opacity-50" />
            <p className="text-[var(--text2)] font-bold text-base">
              {searchQuery || selectedCourseFilter !== "todos" || coverageFilter !== "todos"
                ? "No se encontraron preceptores que coincidan con los filtros aplicados."
                : "No hay usuarios con rol de preceptor registrados en la institución."}
            </p>
            {(searchQuery || selectedCourseFilter !== "todos" || coverageFilter !== "todos") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCourseFilter("todos");
                  setCoverageFilter("todos");
                }}
                className="mt-3 text-xs font-bold text-[var(--verde)] hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          filteredPreceptores.map((p) => {
            const assignedCourses = p.cursos || [];
            const hasCourses = assignedCourses.length > 0;

            return (
              <div
                key={p.id}
                className="glass p-6 sm:p-7 rounded-[32px] border border-[var(--border)] hover:border-[var(--verde)] transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg"
              >
                <div>
                  {/* Encabezado de la tarjeta: Avatar, Info y Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <UserAvatar name={p.nombre} email={p.email} size={50} showRing={true} />
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] shadow-xs shrink-0">
                      Preceptor Oficial
                    </span>
                  </div>

                  {/* Nombre y correo */}
                  <h3 className="text-lg sm:text-xl font-black text-[var(--text)] group-hover:text-[var(--verde)] transition-colors line-clamp-1 mb-1">
                    {p.nombre}
                  </h3>
                  <p className="text-xs text-[var(--text3)] font-semibold truncate mb-4" title={p.email}>
                    {p.email}
                  </p>

                  {/* Sección de Cursos y Divisiones Asignadas */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]/60 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)] flex items-center gap-1">
                        <BookOpen size={11} className="text-[var(--verde)]" />
                        <span>Cursos a Cargo ({assignedCourses.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(p)}
                        className="text-[10px] font-black uppercase text-[var(--verde)] hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <Pencil size={11} />
                        <span>{hasCourses ? "Modificar" : "+ Asignar"}</span>
                      </button>
                    </div>

                    {!hasCourses ? (
                      <div 
                        onClick={() => handleOpenAssignModal(p)}
                        className="p-3 rounded-2xl border border-dashed border-[var(--amarillo-border)] bg-[var(--amarillo-bg)] flex items-center justify-between gap-2 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
                      >
                        <div className="flex items-center gap-2 text-[var(--amarillo)]">
                          <AlertCircle size={14} className="shrink-0" />
                          <span className="text-xs font-bold">Sin divisiones asignadas</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-[var(--amarillo)] bg-[var(--bg)] px-2.5 py-1 rounded-xl border border-[var(--amarillo-border)] shadow-xs">
                          + Asignar
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pt-0.5">
                        {assignedCourses.map(cName => (
                          <span
                            key={cName}
                            className="text-[10px] font-black px-2.5 py-1 bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)] rounded-xl"
                          >
                            {cName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botonera inferior de acciones */}
                <div className="pt-3 border-t border-[var(--border)]/60 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAssignModal(p)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] hover:bg-[var(--verde)] hover:text-black font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <FolderOpen size={14} />
                    <span>Gestionar Cursos</span>
                  </button>
                  <a
                    href={`mailto:${p.email}?subject=Comunicación Institucional - Preceptoría Escuela 713`}
                    className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-all cursor-pointer active:scale-95 shadow-xs"
                    title={`Enviar correo a ${p.nombre}`}
                  >
                    <Mail size={15} />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE ASIGNACIÓN DE CURSOS AL PRECEPTOR */}
      {mounted && isModalOpen && editingPreceptor && createPortal(
        <div 
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all duration-300 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setIsModalOpen(false);
              setEditingPreceptor(null);
            }
          }}
        >
          <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] flex flex-col justify-between overflow-hidden my-0 sm:my-auto">
            {/* Cabecera del modal */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <UserAvatar name={editingPreceptor.nombre} email={editingPreceptor.email} size={46} showRing={true} />
                  <div>
                    <h3 className="text-lg sm:text-xl font-black title-font text-[var(--text)]">
                      Asignar Divisiones Escolares
                    </h3>
                    <p className="text-xs text-[var(--text2)] font-semibold truncate max-w-[220px] sm:max-w-xs">
                      {editingPreceptor.nombre} · <span className="text-[var(--text3)]">{editingPreceptor.email}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPreceptor(null);
                  }}
                  disabled={saving}
                  className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Selector de preceptor si hay más de 1 registrado */}
              {preceptores.length > 1 && (
                <div className="mb-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)] mb-1 block">
                    Cambiar Preceptor a Gestionar:
                  </label>
                  <select
                    value={editingPreceptor.id}
                    onChange={(e) => {
                      const found = preceptores.find(p => p.id === e.target.value);
                      if (found) {
                        setEditingPreceptor(found);
                        setSelectedCursos(found.cursos ? [...found.cursos] : []);
                      }
                    }}
                    className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text)] outline-none focus:border-[var(--verde)] cursor-pointer"
                  >
                    {preceptores.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.cursos?.length || 0} cursos a cargo)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Atajos de selección */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-[var(--bg2)] rounded-2xl border border-[var(--border)] mb-4">
                <span className="text-xs font-bold text-[var(--text2)] ml-1">
                  Seleccionados: <strong className="text-[var(--verde)]">{selectedCursos.length}</strong> de {cursos.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllCourses}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg3)] hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] text-[11px] font-bold text-[var(--text)] transition-all cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCourses}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg3)] hover:bg-[var(--rojo-bg)] hover:text-[var(--rojo)] text-[11px] font-bold text-[var(--text)] transition-all cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de cursos con checkboxes */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-2 max-h-[46dvh] space-y-2">
              {cursos.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text3)] italic">
                  No hay cursos configurados en la escuela.
                </div>
              ) : (
                cursos.map(c => {
                  const isChecked = selectedCursos.includes(c.nombre);
                  // Otros preceptores que tienen asignado este mismo curso
                  const otherPreceptors = (courseCoverageMap.get(c.nombre) || [])
                    .filter(p => p.id !== editingPreceptor.id);

                  return (
                    <label
                      key={c.id || c.nombre}
                      onClick={() => handleToggleCourse(c.nombre)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isChecked
                          ? "bg-[var(--verde-bg)] border-[var(--verde-border)] shadow-xs"
                          : "bg-[var(--bg3)]/60 border-[var(--border)] hover:border-[var(--text3)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          isChecked
                            ? "bg-[var(--verde)] border-[var(--verde)] text-black"
                            : "border-[var(--border)] bg-[var(--bg)]"
                        }`}>
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${
                            isChecked ? "text-[var(--text)]" : "text-[var(--text2)]"
                          }`}>
                            {c.nombre}
                          </span>
                          {otherPreceptors.length > 0 && (
                            <span className="text-[10px] text-[var(--text3)] block truncate">
                              También asignado a: {otherPreceptors.map(p => p.nombre.split(" ")[0]).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {isChecked && (
                        <span className="text-[10px] font-black uppercase text-[var(--verde)] bg-[var(--bg)] px-2 py-0.5 rounded-md border border-[var(--verde-border)] shrink-0">
                          Asignado
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {/* Botones de acción */}
            <div className="pt-4 border-t border-[var(--border)] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPreceptor(null);
                }}
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl border border-[var(--border)] font-bold text-xs sm:text-sm hover:bg-[var(--bg3)] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCourses}
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--verde)] text-black font-black text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Asignación"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE ASIGNACIÓN DE PRECEPTORES A UN CURSO SELECCIONADO */}
      {mounted && isCourseAssignModalOpen && selectedCourseForModal && createPortal(
        <div 
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all duration-300 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingCoursePreceptors) {
              setIsCourseAssignModalOpen(false);
              setSelectedCourseForModal(null);
            }
          }}
        >
          <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] flex flex-col justify-between overflow-hidden my-0 sm:my-auto">
            {/* Cabecera del modal */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] flex items-center justify-center shrink-0">
                    <Layers size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black title-font text-[var(--text)]">
                      Asignar Preceptores a {selectedCourseForModal}
                    </h3>
                    <p className="text-xs text-[var(--text2)] font-semibold">
                      Seleccioná qué preceptor o preceptores tendrán a cargo esta división.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCourseAssignModalOpen(false);
                    setSelectedCourseForModal(null);
                  }}
                  disabled={savingCoursePreceptors}
                  className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Atajos de selección */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-[var(--bg2)] rounded-2xl border border-[var(--border)] mb-4">
                <span className="text-xs font-bold text-[var(--text2)] ml-1">
                  Preceptores seleccionados: <strong className="text-[var(--verde)]">{selectedPreceptorsForCourse.length}</strong> de {preceptores.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPreceptorsForCourse(preceptores.map(p => p.id!).filter(Boolean))}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg3)] hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] text-[11px] font-bold text-[var(--text)] transition-all cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPreceptorsForCourse([])}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg3)] hover:bg-[var(--rojo-bg)] hover:text-[var(--rojo)] text-[11px] font-bold text-[var(--text)] transition-all cursor-pointer"
                  >
                    Ninguno
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de preceptores con checkboxes */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-2 max-h-[46dvh] space-y-2">
              {preceptores.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text3)] italic">
                  No hay usuarios con rol de preceptor registrados en la institución.
                </div>
              ) : (
                preceptores.map(p => {
                  const isChecked = selectedPreceptorsForCourse.includes(p.id!);
                  const otherCourses = (p.cursos || []).filter(c => c !== selectedCourseForModal);

                  return (
                    <label
                      key={p.id}
                      onClick={() => handleTogglePreceptorForCourse(p.id!)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isChecked
                          ? "bg-[var(--verde-bg)] border-[var(--verde-border)] shadow-xs"
                          : "bg-[var(--bg3)]/60 border-[var(--border)] hover:border-[var(--text3)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          isChecked
                            ? "bg-[var(--verde)] border-[var(--verde)] text-black"
                            : "border-[var(--border)] bg-[var(--bg)]"
                        }`}>
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                        <UserAvatar name={p.nombre} email={p.email} size={34} showRing={false} />
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${
                            isChecked ? "text-[var(--text)]" : "text-[var(--text2)]"
                          }`}>
                            {p.nombre}
                          </span>
                          <span className="text-[10px] text-[var(--text3)] block truncate">
                            {p.email} · {otherCourses.length > 0 ? `${otherCourses.length} otros cursos` : "Sin otros cursos"}
                          </span>
                        </div>
                      </div>

                      {isChecked && (
                        <span className="text-[10px] font-black uppercase text-[var(--verde)] bg-[var(--bg)] px-2 py-0.5 rounded-md border border-[var(--verde-border)] shrink-0">
                          Asignado
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {/* Botones de acción */}
            <div className="pt-4 border-t border-[var(--border)] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCourseAssignModalOpen(false);
                  setSelectedCourseForModal(null);
                }}
                disabled={savingCoursePreceptors}
                className="flex-1 py-3.5 rounded-2xl border border-[var(--border)] font-bold text-xs sm:text-sm hover:bg-[var(--bg3)] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePreceptorsForCourse}
                disabled={savingCoursePreceptors}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--verde)] text-black font-black text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingCoursePreceptors ? "Guardando..." : "Guardar Asignación"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PreceptoresTab;
