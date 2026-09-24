"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  ShieldCheck, 
  UserCog, 
  UserCheck, 
  GraduationCap, 
  User, 
  AlertCircle, 
  AlertTriangle,
  Info,
  Lock,
  ArrowRight
} from "lucide-react";
import { UserProfile, Alumno, Curso } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

interface ChangeUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    targetRole: UserProfile["rol"],
    selectedCurso?: string
  ) => Promise<void> | void;
  user: UserProfile | null;
  alumnoDetails?: Alumno | null;
  cursos?: Curso[];
  isCurrentUser?: boolean;
}

export type AssignableRole = "admin" | "directivo" | "preceptor" | "profesor" | "alumno";

export default function ChangeUserRoleModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  alumnoDetails,
  cursos = [],
  isCurrentUser = false,
}: ChangeUserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<AssignableRole>("alumno");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [confirmAdminEscalation, setConfirmAdminEscalation] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) {
      setLoading(false);
      setConfirmAdminEscalation(false);
      return;
    }

    // Normalizar rol actual del usuario para pre-seleccionar
    let initialRole: AssignableRole = "alumno";
    const rawRole = user.rol.replace("pendiente_", "").toLowerCase();
    if (rawRole === "admin") initialRole = "admin";
    else if (rawRole === "directivo") initialRole = "directivo";
    else if (rawRole === "preceptor") initialRole = "preceptor";
    else if (rawRole === "profesor") initialRole = "profesor";
    else initialRole = "alumno";

    setSelectedRole(initialRole);
    setConfirmAdminEscalation(false);

    // Si ya tiene curso asignado en alumnoDetails
    const currentCourse = alumnoDetails?.curso && alumnoDetails.curso !== "pendiente" ? alumnoDetails.curso : "";
    if (currentCourse && cursos.some(c => c.nombre.trim().toLowerCase() === currentCourse.trim().toLowerCase())) {
      const match = cursos.find(c => c.nombre.trim().toLowerCase() === currentCourse.trim().toLowerCase());
      setSelectedCurso(match ? match.nombre : currentCourse);
    } else if (cursos.length > 0) {
      setSelectedCurso(cursos[0].nombre);
    } else {
      setSelectedCurso("");
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, user, alumnoDetails, cursos, onClose]);

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    if (isCurrentUser && selectedRole !== "admin") {
      return;
    }
    // Si se asciende a admin y no se confirmó la alerta
    if (selectedRole === "admin" && user.rol !== "admin" && !confirmAdminEscalation) {
      setConfirmAdminEscalation(true);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(
        selectedRole,
        selectedRole === "alumno" ? (selectedCurso || undefined) : undefined
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const roleDefinitions: Array<{
    id: AssignableRole;
    name: string;
    badgeLabel: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    borderClass: string;
    bgHoverClass: string;
  }> = [
    {
      id: "admin",
      name: "Administrador",
      badgeLabel: "Acceso Total",
      description: "Control absoluto de la plataforma: gestión de usuarios, auditoría, roles y configuración del sistema.",
      icon: <ShieldCheck size={22} strokeWidth={2.5} className="text-[var(--rojo)]" />,
      colorClass: "text-[var(--rojo)]",
      borderClass: "border-[var(--rojo-border)]",
      bgHoverClass: "hover:border-[var(--rojo)]/40 hover:bg-[var(--rojo-bg)]/30",
    },
    {
      id: "directivo",
      name: "Directivo / Equipo Directivo",
      badgeLabel: "Gestión Institucional",
      description: "Supervisión institucional, control de ausencias docentes, aprobación de matrículas y estadísticas generales.",
      icon: <UserCog size={22} strokeWidth={2.5} className="text-[var(--violeta)]" />,
      colorClass: "text-[var(--violeta)]",
      borderClass: "border-[var(--violeta-border)]",
      bgHoverClass: "hover:border-[var(--violeta)]/40 hover:bg-[var(--violeta-bg)]/30",
    },
    {
      id: "preceptor",
      name: "Preceptor",
      badgeLabel: "Control y Asistencia",
      description: "Toma de asistencia por jornada escolar, administración de cursos asignados, avisos y seguimiento de alumnos.",
      icon: <UserCheck size={22} strokeWidth={2.5} className="text-[var(--cyan)]" />,
      colorClass: "text-[var(--cyan)]",
      borderClass: "border-[var(--cyan-border)]",
      bgHoverClass: "hover:border-[var(--cyan)]/40 hover:bg-[var(--cyan-bg)]/30",
    },
    {
      id: "profesor",
      name: "Profesor / Docente",
      badgeLabel: "Cuerpo Docente",
      description: "Gestión de materias asignadas, registro de asistencia por hora/clase, horarios docentes y mesas de examen.",
      icon: <GraduationCap size={22} strokeWidth={2.5} className="text-[var(--azul)]" />,
      colorClass: "text-[var(--azul)]",
      borderClass: "border-[var(--azul-border)]",
      bgHoverClass: "hover:border-[var(--azul)]/40 hover:bg-[var(--azul-bg)]/30",
    },
    {
      id: "alumno",
      name: "Alumno / Estudiante",
      badgeLabel: "Estudiante Matriculado",
      description: "Acceso como alumno para consultar horarios de clase, materias de su división, ausencias docentes y avisos.",
      icon: <User size={22} strokeWidth={2.5} className="text-[var(--verde)]" />,
      colorClass: "text-[var(--verde)]",
      borderClass: "border-[var(--verde-border)]",
      bgHoverClass: "hover:border-[var(--verde)]/40 hover:bg-[var(--verde-bg)]/30",
    },
  ];

  const currentRoleIsSame = user.rol === selectedRole;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[92dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0 space-y-6">
        {/* Cabecera */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar name={user.nombre} email={user.email} size={48} showRing={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black title-font text-[var(--text)]">
                  Cambiar Rol de Usuario
                </h2>
                {isCurrentUser && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)]">
                    Tu Cuenta
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text2)] font-semibold truncate mt-0.5">
                {user.nombre} · <span className="font-mono text-[var(--text3)]">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ALERTA: Seguridad para la propia cuenta del administrador */}
        {isCurrentUser ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--text)] text-xs font-medium">
            <Lock size={18} className="text-[var(--amarillo)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--amarillo)]">Protección de Cuenta Activa</p>
              <p className="text-[var(--text2)] mt-0.5">
                Estás visualizando tu propia cuenta de Administrador. Para evitar bloqueos accidentales de acceso al sistema, no podés quitarte el rol de Administrador desde este panel.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--bg2)] border border-[var(--border)] text-xs text-[var(--text2)]">
            <Info size={15} className="text-[var(--text3)] shrink-0" />
            <span>
              Seleccioná el nuevo rol institucional que tendrá este usuario en la plataforma.
            </span>
          </div>
        )}

        {/* SELECTOR DE ROLES */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase text-[var(--text3)] tracking-wider block ml-1">
            Rol Institucional
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {roleDefinitions.map((role) => {
              const isSelected = selectedRole === role.id;
              const isCurrent = user.rol === role.id;
              const isDisabled = isCurrentUser && role.id !== "admin";

              return (
                <button
                  key={role.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    setSelectedRole(role.id);
                    setConfirmAdminEscalation(false);
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 relative ${
                    isDisabled
                      ? "opacity-40 cursor-not-allowed bg-[var(--bg2)] border-[var(--border)]"
                      : isSelected
                      ? `bg-[var(--bg2)] ${role.borderClass} ring-2 ring-[var(--verde)]/30 shadow-md`
                      : `bg-[var(--bg)] border-[var(--border)] ${role.bgHoverClass}`
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] shrink-0 mt-0.5">
                    {role.icon}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-[var(--text)]">
                        {role.name}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--bg3)] border border-[var(--border)] ${role.colorClass}`}>
                        {role.badgeLabel}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)]">
                          Rol Actual
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text2)] mt-1 font-medium leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  {/* Check Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                      isSelected
                        ? "bg-[var(--verde)] border-[var(--verde)] text-black"
                        : "border-[var(--border)] bg-transparent"
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SI SELECCIONA ALUMNO: SELECTOR DE CURSO/DIVISIÓN */}
        {selectedRole === "alumno" && (
          <div className="p-4 rounded-2xl bg-[var(--bg2)] border border-[var(--border)] space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-[var(--text)] tracking-wider flex items-center gap-2">
                <User size={14} className="text-[var(--verde)]" />
                <span>División / Curso a Asignar</span>
              </label>
              <span className="text-[10px] text-[var(--text3)] font-semibold">
                Padrón Escolar
              </span>
            </div>

            <p className="text-xs text-[var(--text2)] leading-relaxed">
              Seleccioná el curso al que pertenecerá el estudiante para sincronizar sus horarios de materias y asistencia diaria.
            </p>

            <select
              value={selectedCurso}
              onChange={(e) => setSelectedCurso(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 px-3.5 outline-none focus:border-[var(--verde)] text-sm font-bold text-[var(--text)] transition-all cursor-pointer"
            >
              <option value="">Sin curso (Pendiente / A confirmar)</option>
              {cursos.map((c) => (
                <option key={c.id || c.nombre} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ALERTA DE ASCENSO A ADMINISTRADOR */}
        {selectedRole === "admin" && user.rol !== "admin" && (
          <div className="p-4 rounded-2xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-[var(--rojo)] font-black text-xs uppercase tracking-wider">
              <AlertTriangle size={16} strokeWidth={2.5} />
              <span>Privilegios Elevados de Administrador</span>
            </div>
            <p className="text-xs text-[var(--text)] leading-relaxed">
              Estás por otorgarle acceso total a este usuario. Podrá gestionar todos los usuarios, consultar registros de auditoría y configurar el sistema.
            </p>
            {confirmAdminEscalation && (
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[var(--rojo)]">
                <Check size={14} strokeWidth={3} />
                <span>Presioná &quot;Confirmar y Asignar Rol&quot; para proceder.</span>
              </div>
            )}
          </div>
        )}

        {/* ACCIONES Y BOTONES */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto flex-1 min-h-[46px] px-5 py-3 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--bg3)] active:scale-95 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (isCurrentUser && selectedRole !== "admin")}
            className="w-full sm:w-auto flex-1 min-h-[46px] px-5 py-3 rounded-xl bg-[var(--verde)] text-black text-xs font-black hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Actualizando rol...</span>
            ) : (
              <>
                <span>
                  {confirmAdminEscalation
                    ? "Confirmar y Asignar Rol"
                    : currentRoleIsSame
                    ? "Guardar Configuración"
                    : "Guardar Nuevo Rol"}
                </span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
