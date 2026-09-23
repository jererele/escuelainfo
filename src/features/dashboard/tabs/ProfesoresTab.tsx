"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  GraduationCap, 
  Pencil, 
  Trash2, 
  Search, 
  BookOpen, 
  AlertCircle, 
  Plus, 
  Edit3, 
  Users, 
  Check, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Profesor, UserProfile, Horario, getProfesores } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

const AssignTeacherSubjectsModal = dynamic(
  () => import("@/components/modals/AssignTeacherSubjectsModal"),
  { ssr: false }
);

interface ProfesoresTabProps {
  profesores: Profesor[];
  usuarios: UserProfile[];
  horarios?: Horario[];
  isAdmin: boolean;
  canManage?: boolean;
  onOpenAddTeacher: () => void;
  onEditTeacher: (p: Profesor) => void;
  onDeleteTeacher: (p: Profesor) => void;
  onNavigateToAusencias: (profNombre: string) => void;
  onRefreshProfesores?: () => void;
  showToast?: (message: string, type?: "success" | "error") => void;
}

export const ProfesoresTab: React.FC<ProfesoresTabProps> = ({
  profesores,
  usuarios,
  horarios = [],
  isAdmin,
  canManage = isAdmin,
  onOpenAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onNavigateToAusencias,
  onRefreshProfesores,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherForMaterias, setSelectedTeacherForMaterias] = useState<{
    id?: string;
    nombre: string;
    email: string;
    dni?: string;
    materias: string[];
  } | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Docentes registrados en el sistema (usuarios con rol profesor) que aún no tienen registro en la colección profesores
  const pendingConfigTeachers = useMemo(() => {
    const profEmails = new Set(
      profesores.map((p) => (p.email || "").trim().toLowerCase()).filter(Boolean)
    );
    return usuarios.filter(
      (u) =>
        u.rol === "profesor" &&
        u.email &&
        !profEmails.has(u.email.trim().toLowerCase())
    );
  }, [usuarios, profesores]);

  // Recopilación de todas las materias únicas de la institución para sugerencias
  const allSchoolSubjects = useMemo(() => {
    const subjects = new Set<string>();
    profesores.forEach((p) => {
      (p.materias || []).forEach((m) => {
        if (m && m.trim()) subjects.add(m.trim());
      });
    });
    horarios.forEach((h) => {
      if (h.materia && h.materia.trim()) subjects.add(h.materia.trim());
    });
    return Array.from(subjects).sort((a, b) => a.localeCompare(b));
  }, [profesores, horarios]);

  // Filtrado de profesores por búsqueda
  const filteredProfesores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return profesores;
    return profesores.filter((p) => {
      const matchName = (p.nombre || "").toLowerCase().includes(q);
      const matchDni = (p.dni || "").toLowerCase().includes(q);
      const matchEmail = (p.email || "").toLowerCase().includes(q);
      const matchMaterias = (p.materias || []).some((m) =>
        m.toLowerCase().includes(q)
      );
      return matchName || matchDni || matchEmail || matchMaterias;
    });
  }, [profesores, searchQuery]);

  const handleOpenAssignModal = (teacher: {
    id?: string;
    nombre: string;
    email: string;
    dni?: string;
    materias: string[];
  }) => {
    setSelectedTeacherForMaterias(teacher);
    setIsAssignModalOpen(true);
  };

  const handleModalSuccess = () => {
    if (onRefreshProfesores) {
      onRefreshProfesores();
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black title-font text-[var(--text)]">
            Cuerpo Docente
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text2)] font-semibold mt-1">
            Gestión de profesores, asignación de materias oficiales y consultas de historial.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
          {canManage && (
            <button
              onClick={onOpenAddTeacher}
              className="w-full md:w-auto bg-black text-white dark:bg-white dark:text-black font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl hover:scale-105 transition-all shadow-xl cursor-pointer text-xs sm:text-sm text-center active:scale-95"
            >
              + Agregar Profesor
            </button>
          )}
        </div>
      </div>

      {/* SECCIÓN DESTACADA: DOCENTES REGISTRADOS SIN MATERIAS ASIGNADAS */}
      {canManage && pendingConfigTeachers.length > 0 && (
        <div className="card glass rounded-[28px] p-5 sm:p-6 border border-[var(--amarillo-border)] bg-[var(--amarillo-bg)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--amarillo)]/20 text-[var(--amarillo)] flex items-center justify-center shrink-0">
                <AlertCircle size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[var(--amarillo)]">
                  Docentes Registrados sin Materias ({pendingConfigTeachers.length})
                </h3>
                <p className="text-xs text-[var(--text2)] font-semibold">
                  Tienen cuenta institucional pero aún no tienen materias asignadas en el cuerpo docente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingConfigTeachers.map((u) => (
              <div
                key={u.id}
                className="bg-[var(--bg)]/90 backdrop-blur-md p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between gap-3 shadow-xs hover:border-[var(--amarillo)] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={u.nombre} email={u.email} size={38} showRing={true} />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[var(--text)] truncate">
                      {u.nombre}
                    </h4>
                    <p className="text-[11px] text-[var(--text3)] truncate">
                      {u.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleOpenAssignModal({
                      nombre: u.nombre,
                      email: u.email,
                      dni: "",
                      materias: [],
                    })
                  }
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-xs font-black hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                  title={`Asignar materias a ${u.nombre}`}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Asignar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y ESTADÍSTICAS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)] shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, materia o email..."
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-xs sm:text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all placeholder:text-[var(--text3)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text3)] shrink-0 self-end sm:self-center">
          <GraduationCap size={15} className="text-[var(--verde)]" />
          <span>
            {filteredProfesores.length} {filteredProfesores.length === 1 ? "docente cargado" : "docentes cargados"}
          </span>
        </div>
      </div>

      {/* GRILLA DE PROFESORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfesores.length === 0 ? (
          <div className="col-span-full p-16 sm:p-20 glass rounded-[32px] text-center border border-dashed border-[var(--border)]">
            <GraduationCap size={36} className="mx-auto text-[var(--text3)] mb-3 opacity-50" />
            <p className="text-[var(--text2)] font-bold text-base">
              {searchQuery ? "No se encontraron profesores que coincidan con la búsqueda." : "No hay profesores cargados todavía."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs font-bold text-[var(--verde)] hover:underline cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          filteredProfesores.map((p) => {
            const hasMaterias = p.materias && p.materias.length > 0;

            return (
              <div
                key={p.id}
                onClick={() => onNavigateToAusencias(p.nombre)}
                className="glass p-6 sm:p-7 rounded-[32px] border border-[var(--border)] hover:border-[var(--verde)] transition-all group relative cursor-pointer flex flex-col justify-between hover:shadow-lg active:scale-[0.99]"
                title={`Ver ausencias y asistencias de ${p.nombre}`}
              >
                {/* BOTONES DE EDICIÓN / BORRADO */}
                {canManage && (
                  <div
                    className="absolute top-4 right-4 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEditTeacher(p)}
                      className="text-[var(--verde)] p-2 bg-[var(--verde-bg)] rounded-xl hover:scale-110 active:scale-95 transition-all cursor-pointer border border-[var(--verde-border)]/50 shadow-xs"
                      title="Editar datos del docente"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteTeacher(p)}
                      className="text-[var(--rojo)] p-2 bg-[var(--rojo-bg)] rounded-xl hover:scale-110 active:scale-95 transition-all cursor-pointer border border-[var(--rojo-border)]/50 shadow-xs"
                      title="Eliminar docente"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div>
                  {/* AVATAR Y DNI */}
                  <div className="flex justify-between items-start mb-4">
                    <UserAvatar name={p.nombre} email={p.email} size={46} showRing={true} />
                    <div className="text-[10px] font-black uppercase text-[var(--text3)] pr-12 sm:pr-14">
                      {p.dni ? `DNI: ${p.dni}` : "Sin DNI"}
                    </div>
                  </div>

                  {/* NOMBRE */}
                  <h3 className="text-lg sm:text-xl font-bold mb-3 text-[var(--text)] group-hover:text-[var(--verde)] transition-colors line-clamp-1">
                    {p.nombre}
                  </h3>

                  {/* SECCIÓN DE MATERIAS CON BOTÓN PARA ASIGNAR/MODIFICAR */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)] flex items-center gap-1">
                        <BookOpen size={11} className="text-[var(--verde)]" />
                        <span>Materias ({p.materias ? p.materias.length : 0})</span>
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignModal(p);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[var(--verde)] hover:underline cursor-pointer transition-all"
                          title={`Gestionar materias de ${p.nombre}`}
                        >
                          <Edit3 size={11} strokeWidth={2.5} />
                          <span>{hasMaterias ? "Modificar" : "+ Asignar"}</span>
                        </button>
                      )}
                    </div>

                    {!hasMaterias ? (
                      <div
                        onClick={(e) => {
                          if (canManage) {
                            e.stopPropagation();
                            handleOpenAssignModal(p);
                          }
                        }}
                        className={`p-3 rounded-2xl border border-dashed border-[var(--amarillo-border)] bg-[var(--amarillo-bg)] flex items-center justify-between gap-2 ${
                          canManage ? "cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[var(--amarillo)]">
                          <AlertCircle size={14} className="shrink-0" />
                          <span className="text-xs font-bold">Sin materias asignadas</span>
                        </div>
                        {canManage && (
                          <span className="text-[10px] font-black uppercase text-[var(--amarillo)] bg-[var(--bg)] px-2.5 py-1 rounded-xl border border-[var(--amarillo-border)] shadow-xs">
                            + Asignar
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                        {p.materias.map((m) => (
                          <span
                            key={m}
                            className="text-[10px] font-bold px-2.5 py-1 bg-[var(--bg3)] rounded-xl text-[var(--text)] border border-[var(--border)]"
                          >
                            {m}
                          </span>
                        ))}
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssignModal(p);
                            }}
                            className="text-[10px] font-black uppercase px-2 py-1 bg-[var(--verde-bg)] text-[var(--verde)] rounded-xl border border-[var(--verde-border)] hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-0.5"
                            title="Agregar más materias"
                          >
                            <Plus size={10} strokeWidth={2.5} />
                            <span>Más</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* PIE DE TARJETA: EMAIL Y ENLACE A AUSENCIAS */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/50 mt-2">
                  <p className="text-xs text-[var(--text3)] truncate max-w-[150px] sm:max-w-[170px]" title={p.email}>
                    {p.email}
                  </p>
                  <span className="text-[10px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] px-2.5 py-1 rounded-xl border border-[var(--verde-border)] opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all shrink-0">
                    Ausencias →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE ASIGNACIÓN DE MATERIAS */}
      {isAssignModalOpen && selectedTeacherForMaterias && (
        <AssignTeacherSubjectsModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedTeacherForMaterias(null);
          }}
          onSuccess={handleModalSuccess}
          teacher={selectedTeacherForMaterias}
          suggestedMaterias={allSchoolSubjects}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default ProfesoresTab;
