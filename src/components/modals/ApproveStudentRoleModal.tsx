"use client";

import React, { useState, useEffect } from "react";
import { X, Check, GraduationCap, BookOpen, Users, Clock, AlertCircle } from "lucide-react";
import { UserProfile, Alumno, Curso } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

interface ApproveStudentRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    targetRole: "alumno" | "profesor" | "preceptor",
    selectedCurso?: string
  ) => Promise<void> | void;
  user: UserProfile | null;
  alumnoDetails?: Alumno | null;
  cursos?: Curso[];
}

export default function ApproveStudentRoleModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  alumnoDetails,
  cursos,
}: ApproveStudentRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<"alumno" | "profesor" | "preceptor">("alumno");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedRole("alumno");
      setSelectedCurso("");
      setLoading(false);
      return;
    }
    setSelectedRole("alumno");

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
  }, [isOpen, alumnoDetails, cursos, onClose]);

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    if (selectedRole === "alumno" && cursos && cursos.length > 0 && !selectedCurso) {
      return;
    }
    setLoading(true);
    try {
      await onConfirm(selectedRole, selectedRole === "alumno" ? selectedCurso : undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: "alumno" as const,
      label: "Alumno",
      description: "Se matricula como estudiante con acceso a sus cursos, materias y horarios.",
      icon: <GraduationCap size={20} className="text-[var(--verde)]" />,
    },
    {
      id: "profesor" as const,
      label: "Profesor",
      description: "Se incorpora al cuerpo docente con acceso a materias, licencias y horarios docentes.",
      icon: <BookOpen size={20} className="text-[var(--amarillo)]" />,
    },
    {
      id: "preceptor" as const,
      label: "Preceptor",
      description: "Control de asistencia diaria, gestión de cursos y avisos institucionales.",
      icon: <Users size={20} className="text-[var(--azul)]" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0 space-y-5">
        {/* Cabecera */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <UserAvatar name={user.nombre} email={user.email} size={44} showRing={true} />
            <div>
              <h2 className="text-xl font-black title-font text-[var(--text)]">
                Aprobar Solicitud
              </h2>
              <p className="text-xs text-[var(--text2)] font-semibold truncate max-w-[230px]">
                {user.nombre} · <span className="text-[var(--text3)]">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ficha rápida del solicitante */}
        <div className="bg-[var(--bg3)] p-3.5 rounded-2xl border border-[var(--border)] text-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase text-[var(--text3)]">DNI Registrado</div>
            <div className="font-bold text-[var(--text)]">{alumnoDetails?.dni || "No especificado"}</div>
          </div>
          <div className="space-y-0.5 text-right">
            <div className="text-[10px] font-black uppercase text-[var(--text3)]">Curso Solicitado</div>
            <div className="font-bold text-[var(--text)]">
              {alumnoDetails?.curso && alumnoDetails.curso !== "pendiente" ? (
                alumnoDetails.curso
              ) : (
                <span className="text-[var(--amarillo)]">Sin asignar</span>
              )}
            </div>
          </div>
        </div>

        {/* Selector de Rol */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)] mb-2 block ml-1">
            Seleccionar Rol a Asignar
          </label>
          <div className="space-y-2.5">
            {roles.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isSelected
                      ? "border-[var(--verde)] bg-[var(--verde-bg)]/40 shadow-xs"
                      : "border-[var(--border)] bg-[var(--bg2)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] shrink-0 mt-0.5">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--text)]">{r.label}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[var(--verde)] text-black flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text2)] mt-0.5 leading-snug">
                      {r.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selector de Curso (solo si el rol seleccionado es Alumno) */}
        {selectedRole === "alumno" && (
          <div className="space-y-2.5 p-4 rounded-2xl bg-[var(--bg3)]/60 border border-[var(--border)] animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text2)] flex items-center gap-1.5">
                <GraduationCap size={14} className="text-[var(--verde)]" />
                <span>Curso a Asignar</span>
                <span className="text-[var(--rojo)]">*</span>
              </label>
              {selectedCurso && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]">
                  {selectedCurso}
                </span>
              )}
            </div>

            {cursos && cursos.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedCurso}
                  onChange={(e) => setSelectedCurso(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--verde)] rounded-2xl p-3.5 text-sm font-bold text-[var(--text)] outline-none transition-all cursor-pointer"
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
              <div className="text-xs text-[var(--amarillo)] bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>No hay cursos dados de alta. Podrás asignarlo luego desde Ciclo Lectivo.</span>
              </div>
            )}

            {alumnoDetails?.curso && alumnoDetails.curso !== "pendiente" && alumnoDetails.curso !== selectedCurso && (
              <p className="text-[11px] text-[var(--amarillo)] font-medium pl-1">
                Nota: El alumno solicitó originalmente el curso <strong>{alumnoDetails.curso}</strong>.
              </p>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 p-3.5 rounded-2xl border border-[var(--border)] font-bold text-sm hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (selectedRole === "alumno" && Boolean(cursos && cursos.length > 0 && !selectedCurso))}
            className="flex-1 p-3.5 rounded-2xl bg-[var(--verde)] text-black font-black text-sm disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} strokeWidth={2.5} />
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
