"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Check, GraduationCap, BookOpen, Users, AlertCircle } from "lucide-react";
import { UserProfile, Alumno, Curso, getAllowedAssignableRoles, UserRole } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

interface ApproveStudentRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    targetRole: "alumno" | "profesor" | "preceptor",
    selectedCurso?: string,
    preceptorCursos?: string[]
  ) => Promise<void> | void;
  user: UserProfile | null;
  alumnoDetails?: Alumno | null;
  cursos?: Curso[];
  operatorRole?: string | null;
}

export default function ApproveStudentRoleModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  alumnoDetails,
  cursos,
  operatorRole = "admin",
}: ApproveStudentRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<"alumno" | "profesor" | "preceptor">("alumno");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedPreceptorCursos, setSelectedPreceptorCursos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const courseSectionRef = useRef<HTMLDivElement>(null);
  const courseSelectRef = useRef<HTMLSelectElement>(null);
  const preceptorSectionRef = useRef<HTMLDivElement>(null);

  // Jerarquía de roles que el operador tiene permitido otorgar
  const allowedRoles = useMemo<UserRole[]>(() => {
    return getAllowedAssignableRoles(operatorRole);
  }, [operatorRole]);

  const allRoles = [
    {
      id: "alumno" as const,
      label: "Alumno",
      description: "Acceso a horarios, materias y avisos de su división escolar.",
      icon: <GraduationCap size={18} className="text-[var(--verde)]" />,
    },
    {
      id: "profesor" as const,
      label: "Profesor",
      description: "Cuerpo docente: licencias, asistencias y materias.",
      icon: <BookOpen size={18} className="text-[var(--amarillo)]" />,
    },
    {
      id: "preceptor" as const,
      label: "Preceptor",
      description: "Control de asistencia diaria y seguimiento de cursos.",
      icon: <Users size={18} className="text-[var(--azul)]" />,
    },
  ];

  // Filtrar los roles según los permisos jerárquicos del operador
  const availableRoles = useMemo(() => {
    return allRoles.filter((r) => allowedRoles.includes(r.id as UserRole));
  }, [allRoles, allowedRoles]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedRole("alumno");
      setSelectedCurso("");
      setLoading(false);
      return;
    }

    // Pre-seleccionar rol inicial válido
    if (availableRoles.some((r) => r.id === "alumno")) {
      setSelectedRole("alumno");
    } else if (availableRoles.length > 0) {
      setSelectedRole(availableRoles[0].id);
    }

    // Pre-seleccionar curso solicitado si existe en cursos, o el primer curso disponible
    const requested = alumnoDetails?.curso && alumnoDetails.curso !== "pendiente" ? alumnoDetails.curso : "";
    if (requested && cursos && cursos.some(c => c.nombre.trim().toLowerCase() === requested.trim().toLowerCase())) {
      const matched = cursos.find(c => c.nombre.trim().toLowerCase() === requested.trim().toLowerCase());
      setSelectedCurso(matched ? matched.nombre : requested);
    } else if (cursos && cursos.length > 0) {
      setSelectedCurso(cursos[0].nombre);
    } else {
      setSelectedCurso(requested || "");
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, alumnoDetails, cursos, onClose, availableRoles]);

  if (!isOpen || !user) return null;

  const handleSelectRole = (roleId: "alumno" | "profesor" | "preceptor") => {
    setSelectedRole(roleId);
    if (roleId === "alumno") {
      setTimeout(() => {
        courseSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        courseSelectRef.current?.focus();
      }, 60);
    } else if (roleId === "preceptor") {
      setTimeout(() => {
        preceptorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    }
  };

  const handleConfirm = async () => {
    if (selectedRole === "alumno" && cursos && cursos.length > 0 && !selectedCurso) {
      return;
    }
    if (!allowedRoles.includes(selectedRole as UserRole)) {
      return;
    }
    setLoading(true);
    try {
      await onConfirm(
        selectedRole,
        selectedRole === "alumno" ? selectedCurso : undefined,
        selectedRole === "preceptor" ? selectedPreceptorCursos : undefined
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden mt-auto sm:mt-0">
        
        {/* Cabecera Fija */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)]/70 flex justify-between items-center shrink-0 bg-[var(--bg)]">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar name={user.nombre} email={user.email} size={40} showRing={true} />
            <div className="min-w-0">
              <h2 className="text-lg font-black title-font text-[var(--text)]">
                Aprobar Solicitud
              </h2>
              <p className="text-xs text-[var(--text2)] font-semibold truncate max-w-[220px]">
                {user.nombre} · <span className="text-[var(--text3)] font-mono">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3.5">
          {/* Ficha rápida del solicitante */}
          <div className="bg-[var(--bg3)] p-3 rounded-2xl border border-[var(--border)] text-xs flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] font-black uppercase text-[var(--text3)]">DNI Registrado</div>
              <div className="font-bold text-[var(--text)] font-mono">{alumnoDetails?.dni || "No especificado"}</div>
            </div>
            <div className="space-y-0.5 text-right">
              <div className="text-[10px] font-black uppercase text-[var(--text3)]">Curso Solicitado</div>
              <div className="font-bold text-[var(--text)]">
                {alumnoDetails?.curso && alumnoDetails.curso !== "pendiente" ? (
                  <span className="font-mono">{alumnoDetails.curso}</span>
                ) : (
                  <span className="text-[var(--amarillo)] italic">Sin asignar</span>
                )}
              </div>
            </div>
          </div>

          {/* Selector de Rol */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)]">
                Seleccionar Rol a Asignar
              </label>
              <span className="text-[9px] text-[var(--text3)] font-semibold capitalize">
                Jerarquía: {operatorRole || "Sin Rango"}
              </span>
            </div>

            {availableRoles.length === 0 ? (
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg2)] text-center text-xs text-[var(--text3)] italic">
                No tenés permisos para aprobar con ningún rol.
              </div>
            ) : (
              <div className="space-y-2">
                {availableRoles.map((r) => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRole(r.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isSelected
                          ? "border-[var(--verde)] bg-[var(--verde-bg)]/40 shadow-xs ring-1 ring-[var(--verde)]/40"
                          : "border-[var(--border)] bg-[var(--bg2)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] shrink-0 mt-0.5">
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-[var(--text)]">{r.label}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[var(--verde)] text-black flex items-center justify-center shrink-0">
                              <Check size={10} strokeWidth={3.5} />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text2)] mt-0.5 leading-snug">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selector de Curso (solo si el rol seleccionado es Alumno) */}
          {selectedRole === "alumno" && allowedRoles.includes("alumno") && (
            <div
              ref={courseSectionRef}
              className="space-y-2 p-3.5 rounded-2xl bg-[var(--bg3)]/60 border border-[var(--border)] animate-fade-in ring-1 ring-[var(--verde)]/30"
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text2)] flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-[var(--verde)]" />
                  <span>División / Curso a Asignar</span>
                  <span className="text-[var(--rojo)]">*</span>
                </label>
                {selectedCurso && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] font-mono">
                    {selectedCurso}
                  </span>
                )}
              </div>

              {cursos && cursos.length > 0 ? (
                <div className="relative">
                  <select
                    ref={courseSelectRef}
                    value={selectedCurso}
                    onChange={(e) => setSelectedCurso(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--verde)] rounded-xl py-2.5 px-3 text-xs font-bold text-[var(--text)] outline-none transition-all cursor-pointer shadow-xs"
                  >
                    <option value="" disabled>-- Seleccionar Curso Obligatorio --</option>
                    {cursos.map((c) => (
                      <option key={c.id || c.nombre} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-xs text-[var(--amarillo)] bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>No hay cursos dados de alta. Podrás asignarlo luego desde Ciclo Lectivo.</span>
                </div>
              )}

              {alumnoDetails?.curso && alumnoDetails.curso !== "pendiente" && alumnoDetails.curso !== selectedCurso && (
                <p className="text-[10px] text-[var(--amarillo)] font-medium pl-1">
                  Nota: El alumno solicitó originalmente el curso <strong>{alumnoDetails.curso}</strong>.
                </p>
              )}
            </div>
          )}

          {/* Selector de Cursos Asignados para Preceptor */}
          {selectedRole === "preceptor" && allowedRoles.includes("preceptor") && (
            <div
              ref={preceptorSectionRef}
              className="space-y-2.5 p-3.5 rounded-2xl bg-[var(--azul-bg)]/30 border border-[var(--azul-border)] animate-fade-in ring-1 ring-[var(--azul)]/30"
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--azul)] flex items-center gap-1.5">
                  <Users size={13} className="text-[var(--azul)]" />
                  <span>Cursos Asignados a la Preceptoría</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPreceptorCursos((cursos || []).map(c => c.nombre))}
                    className="text-[10px] text-[var(--azul)] hover:underline font-bold cursor-pointer"
                  >
                    Todos
                  </button>
                  <span className="text-[10px] text-[var(--text3)]">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPreceptorCursos([])}
                    className="text-[10px] text-[var(--text3)] hover:underline font-bold cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text2)] leading-snug">
                Seleccioná los cursos que este preceptor supervisa para conectar sus horarios y ausencias docentes.
              </p>

              {(!cursos || cursos.length === 0) ? (
                <p className="text-xs text-[var(--text3)] italic">No hay cursos registrados.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-0.5">
                  {cursos.map((c) => {
                    const isSelected = selectedPreceptorCursos.includes(c.nombre);
                    return (
                      <button
                        key={c.id || c.nombre}
                        type="button"
                        onClick={() => {
                          setSelectedPreceptorCursos(prev =>
                            prev.includes(c.nombre)
                              ? prev.filter(x => x !== c.nombre)
                              : [...prev, c.nombre]
                          );
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[var(--azul-bg)] text-[var(--azul)] border-[var(--azul-border)] shadow-xs"
                            : "bg-[var(--bg)] text-[var(--text2)] border-[var(--border)] hover:bg-[var(--bg3)]"
                        }`}
                      >
                        <span className="truncate mr-2 text-[11px]">{c.nombre}</span>
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? "bg-[var(--azul)] text-white border-[var(--azul)]"
                            : "border-[var(--border)] bg-[var(--bg3)]"
                        }`}>
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedPreceptorCursos.length > 0 && (
                <div className="pt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-[var(--azul)]">
                  <Check size={11} strokeWidth={2.5} />
                  <span>{selectedPreceptorCursos.length} división(es) vinculada(s)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones Fijas (Sticky bottom) */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--border)] bg-[var(--bg2)]/80 backdrop-blur-md shrink-0 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-[var(--border)] font-bold text-xs hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (selectedRole === "alumno" && Boolean(cursos && cursos.length > 0 && !selectedCurso)) || !allowedRoles.includes(selectedRole as UserRole)}
            className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--verde)] text-black font-black text-xs disabled:opacity-50 shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>
              {loading
                ? "Aprobando..."
                : selectedRole === "alumno" && selectedCurso
                ? `Aprobar en ${selectedCurso}`
                : `Aprobar como ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
