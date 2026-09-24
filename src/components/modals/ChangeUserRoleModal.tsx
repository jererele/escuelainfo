"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  X, 
  Check, 
  ShieldCheck, 
  UserCog, 
  UserCheck, 
  GraduationCap, 
  User, 
  Users,
  AlertTriangle,
  Info,
  Lock,
  ArrowRight
} from "lucide-react";
import { UserProfile, Alumno, Curso, getAllowedAssignableRoles, UserRole, parseUserCursos } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

interface ChangeUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    targetRole: UserProfile["rol"],
    selectedCurso?: string,
    preceptorCursos?: string[]
  ) => Promise<void> | void;
  user: UserProfile | null;
  alumnoDetails?: Alumno | null;
  cursos?: Curso[];
  isCurrentUser?: boolean;
  operatorRole?: string | null;
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
  operatorRole = "admin",
}: ChangeUserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<AssignableRole>("alumno");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedPreceptorCursos, setSelectedPreceptorCursos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmAdminEscalation, setConfirmAdminEscalation] = useState(false);

  const courseSectionRef = useRef<HTMLDivElement>(null);
  const courseSelectRef = useRef<HTMLSelectElement>(null);
  const preceptorSectionRef = useRef<HTMLDivElement>(null);
  const adminSectionRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Jerarquía de roles que el operador activo tiene permitido asignar
  const allowedRoles = useMemo<UserRole[]>(() => {
    return getAllowedAssignableRoles(operatorRole);
  }, [operatorRole]);

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

    // Si el rol actual no está dentro de los que este operador puede asignar, seleccionar el primer rol permitido
    if (!allowedRoles.includes(initialRole as UserRole) && allowedRoles.length > 0) {
      initialRole = allowedRoles[0] as AssignableRole;
    }

    setSelectedRole(initialRole);
    setConfirmAdminEscalation(false);

    // Si ya tiene cursos asignados como preceptor o usuario
    const preceptorAssigned = user.cursos ? parseUserCursos(user.cursos) : [];
    setSelectedPreceptorCursos(preceptorAssigned);

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
  }, [isOpen, user, alumnoDetails, cursos, onClose, allowedRoles]);

  if (!isOpen || !user) return null;

  const handleSelectRole = (roleId: AssignableRole) => {
    setSelectedRole(roleId);
    setConfirmAdminEscalation(false);

    // Automatización de desplazamiento suave (smooth scroll) y foco inmediato
    if (roleId === "alumno") {
      setTimeout(() => {
        courseSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        courseSelectRef.current?.focus();
      }, 60);
    } else if (roleId === "preceptor") {
      setTimeout(() => {
        preceptorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    } else if (roleId === "admin" && user.rol !== "admin") {
      setTimeout(() => {
        adminSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    }
  };

  const handleConfirm = async () => {
    if (isCurrentUser && selectedRole !== "admin") {
      return;
    }
    if (!allowedRoles.includes(selectedRole as UserRole)) {
      return;
    }
    // Si se asciende a admin y no se confirmó la alerta
    if (selectedRole === "admin" && user.rol !== "admin" && !confirmAdminEscalation) {
      setConfirmAdminEscalation(true);
      setTimeout(() => {
        adminSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(
        selectedRole,
        selectedRole === "alumno" ? (selectedCurso || undefined) : undefined,
        selectedRole === "preceptor" ? selectedPreceptorCursos : undefined
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const allRoleDefinitions: Array<{
    id: AssignableRole;
    name: string;
    badgeLabel: string;
    shortDesc: string;
    icon: React.ReactNode;
    colorClass: string;
    borderClass: string;
    bgHoverClass: string;
  }> = [
    {
      id: "admin",
      name: "Administrador",
      badgeLabel: "Acceso Total",
      shortDesc: "Gestión total de usuarios, roles, auditoría y configuración.",
      icon: <ShieldCheck size={20} strokeWidth={2.5} className="text-[var(--rojo)]" />,
      colorClass: "text-[var(--rojo)]",
      borderClass: "border-[var(--rojo-border)]",
      bgHoverClass: "hover:border-[var(--rojo)]/40 hover:bg-[var(--rojo-bg)]/30",
    },
    {
      id: "directivo",
      name: "Directivo",
      badgeLabel: "Dirección",
      shortDesc: "Supervisión institucional, control docente y estadísticas.",
      icon: <UserCog size={20} strokeWidth={2.5} className="text-[var(--violeta)]" />,
      colorClass: "text-[var(--violeta)]",
      borderClass: "border-[var(--violeta-border)]",
      bgHoverClass: "hover:border-[var(--violeta)]/40 hover:bg-[var(--violeta-bg)]/30",
    },
    {
      id: "preceptor",
      name: "Preceptor",
      badgeLabel: "Asistencia",
      shortDesc: "Toma de asistencia diaria, avisos y seguimiento de cursos.",
      icon: <UserCheck size={20} strokeWidth={2.5} className="text-[var(--cyan)]" />,
      colorClass: "text-[var(--cyan)]",
      borderClass: "border-[var(--cyan-border)]",
      bgHoverClass: "hover:border-[var(--cyan)]/40 hover:bg-[var(--cyan-bg)]/30",
    },
    {
      id: "profesor",
      name: "Profesor",
      badgeLabel: "Docente",
      shortDesc: "Asistencia por clase, materias asignadas y horarios.",
      icon: <GraduationCap size={20} strokeWidth={2.5} className="text-[var(--azul)]" />,
      colorClass: "text-[var(--azul)]",
      borderClass: "border-[var(--azul-border)]",
      bgHoverClass: "hover:border-[var(--azul)]/40 hover:bg-[var(--azul-bg)]/30",
    },
    {
      id: "alumno",
      name: "Alumno",
      badgeLabel: "Estudiante",
      shortDesc: "Consulta de horarios de su división, avisos y materias.",
      icon: <User size={20} strokeWidth={2.5} className="text-[var(--verde)]" />,
      colorClass: "text-[var(--verde)]",
      borderClass: "border-[var(--verde-border)]",
      bgHoverClass: "hover:border-[var(--verde)]/40 hover:bg-[var(--verde-bg)]/30",
    },
  ];

  // Filtrar estrictamente solo los roles que el operador tiene derecho a otorgar
  const visibleRoleDefinitions = useMemo(() => {
    return allRoleDefinitions.filter(r => allowedRoles.includes(r.id as UserRole));
  }, [allRoleDefinitions, allowedRoles]);

  const currentRoleIsSame = user.rol === selectedRole;

  // Mensaje explicativo según la jerarquía del operador
  const operatorHierarchyNotice = useMemo(() => {
    const op = (operatorRole || "").toLowerCase();
    if (op === "admin") {
      return "Como Administrador tenés permisos para asignar cualquier rol institucional.";
    }
    if (op === "directivo") {
      return "Como Directivo podés asignar los roles de Preceptor, Profesor o Alumno.";
    }
    if (op === "preceptor") {
      return "Como Preceptor podés asignar los roles de Profesor o Alumno.";
    }
    return "No contás con permisos para modificar roles institucionales.";
  }, [operatorRole]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden mt-auto sm:mt-0">
        
        {/* CABECERA FIJA (Sticky top) */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[var(--border)]/70 flex justify-between items-center shrink-0 bg-[var(--bg)] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar name={user.nombre} email={user.email} size={42} showRing={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black title-font text-[var(--text)]">
                  Cambiar Rol de Usuario
                </h2>
                {isCurrentUser && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)]">
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
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO INTERNO DESPLAZABLE CON SCROLLBAR ELEGANTE */}
        <div ref={modalBodyRef} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* ALERTA: Seguridad para la propia cuenta del administrador */}
          {isCurrentUser ? (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--text)] text-xs font-medium">
              <Lock size={16} className="text-[var(--amarillo)] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--amarillo)]">Protección de Cuenta Activa</p>
                <p className="text-[var(--text2)] mt-0.5 leading-snug">
                  Estás visualizando tu propia cuenta de Administrador. Para evitar bloqueos accidentales, no podés degradar tu propio rol.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg2)] border border-[var(--border)] text-xs text-[var(--text2)]">
              <Info size={14} className="text-[var(--text3)] shrink-0" />
              <span>{operatorHierarchyNotice}</span>
            </div>
          )}

          {/* SELECTOR DE ROLES: Cuadrícula compacta de roles permitidos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase text-[var(--text3)] tracking-wider">
                Roles Permitidos ({visibleRoleDefinitions.length})
              </label>
              <span className="text-[10px] text-[var(--text3)] font-semibold capitalize">
                Operador: {operatorRole || "Sin Rango"}
              </span>
            </div>

            {visibleRoleDefinitions.length === 0 ? (
              <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg2)] text-center text-xs text-[var(--text3)] italic">
                No tenés permisos para asignar roles en el sistema.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {visibleRoleDefinitions.map((role) => {
                  const isSelected = selectedRole === role.id;
                  const isCurrent = user.rol === role.id;
                  const isDisabled = isCurrentUser && role.id !== "admin";
                  const isAlumno = role.id === "alumno";
                  const isOddSingle = visibleRoleDefinitions.length % 2 !== 0 && isAlumno;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectRole(role.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 relative select-none ${
                        isOddSingle ? "sm:col-span-2" : ""
                      } ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed bg-[var(--bg2)] border-[var(--border)]"
                          : isSelected
                          ? `bg-[var(--bg2)] ${role.borderClass} ring-2 ring-[var(--verde)]/40 shadow-sm`
                          : `bg-[var(--bg)] border-[var(--border)] ${role.bgHoverClass}`
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-[var(--bg3)] border border-[var(--border)] shrink-0 mt-0.5">
                        {role.icon}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-[var(--text)]">
                            {role.name}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-[var(--bg3)] border border-[var(--border)] ${role.colorClass}`}>
                            {role.badgeLabel}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)]">
                              Actual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text2)] mt-0.5 font-medium line-clamp-2 leading-snug">
                          {role.shortDesc}
                        </p>
                      </div>

                      {/* Indicador de Selección */}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                          isSelected
                            ? "bg-[var(--verde)] border-[var(--verde)] text-black"
                            : "border-[var(--border)] bg-transparent"
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3.5} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SI SELECCIONA ALUMNO: SELECTOR DE CURSO/DIVISIÓN (Auto-scrolled) */}
          {selectedRole === "alumno" && allowedRoles.includes("alumno") && (
            <div
              ref={courseSectionRef}
              className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg2)] border border-[var(--border)] space-y-2.5 animate-fade-in ring-1 ring-[var(--verde)]/30"
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-[var(--text)] tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-[var(--verde)]" />
                  <span>División / Curso del Estudiante</span>
                  <span className="text-[var(--rojo)]">*</span>
                </label>
                <span className="text-[10px] text-[var(--text3)] font-semibold font-mono">
                  Sincronización Padrón
                </span>
              </div>

              <p className="text-[11px] text-[var(--text2)] leading-snug">
                Asigná la división escolar para conectar automáticamente los horarios de clase y ausencias docentes del alumno.
              </p>

              <select
                ref={courseSelectRef}
                value={selectedCurso}
                onChange={(e) => setSelectedCurso(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 px-3 outline-none focus:border-[var(--verde)] text-xs font-bold text-[var(--text)] transition-all cursor-pointer shadow-xs"
              >
                <option value="">Sin curso asignado (Pendiente / A confirmar)</option>
                {cursos.map((c) => (
                  <option key={c.id || c.nombre} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SELECCIÓN DE CURSOS ASIGNADOS PARA PRECEPTOR */}
          {selectedRole === "preceptor" && allowedRoles.includes("preceptor") && (
            <div
              ref={preceptorSectionRef}
              className="p-3.5 sm:p-4 rounded-2xl bg-[var(--azul-bg)]/30 border border-[var(--azul-border)] space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-[var(--azul)] flex items-center gap-2">
                  <Users size={14} className="text-[var(--azul)]" />
                  <span>Cursos Asignados a la Preceptoría</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPreceptorCursos(cursos.map(c => c.nombre))}
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
                Seleccioná las divisiones que este preceptor supervisa. Podrá consultar sus horarios de clases, ausencias docentes y horas libres.
              </p>

              {cursos.length === 0 ? (
                <p className="text-xs text-[var(--text3)] italic">No hay cursos registrados en el sistema.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
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
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[var(--azul-bg)] text-[var(--azul)] border-[var(--azul-border)] shadow-xs"
                            : "bg-[var(--bg)] text-[var(--text2)] border-[var(--border)] hover:bg-[var(--bg3)]"
                        }`}
                      >
                        <span className="truncate mr-2">{c.nombre}</span>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? "bg-[var(--azul)] text-white border-[var(--azul)]"
                            : "border-[var(--border)] bg-[var(--bg3)]"
                        }`}>
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedPreceptorCursos.length > 0 && (
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--azul)]">
                  <Check size={12} strokeWidth={2.5} />
                  <span>{selectedPreceptorCursos.length} división(es) seleccionada(s)</span>
                </div>
              )}
            </div>
          )}

          {/* ALERTA DE ASCENSO A ADMINISTRADOR */}
          {selectedRole === "admin" && allowedRoles.includes("admin") && user.rol !== "admin" && (
            <div
              ref={adminSectionRef}
              className="p-3.5 sm:p-4 rounded-2xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] space-y-2 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-[var(--rojo)] font-black text-xs uppercase tracking-wider">
                <AlertTriangle size={15} strokeWidth={2.5} />
                <span>Privilegios Elevados de Administrador</span>
              </div>
              <p className="text-xs text-[var(--text)] leading-relaxed">
                Estás por otorgarle acceso total a este usuario. Podrá gestionar usuarios, auditar registros y modificar la configuración global.
              </p>
              {confirmAdminEscalation && (
                <div className="pt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--rojo)]">
                  <Check size={14} strokeWidth={3} />
                  <span>Presioná &quot;Confirmar y Asignar Rol&quot; para proceder.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACCIONES Y BOTONES FIJOS (Sticky Bottom - Siempre visible sin scroll) */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--border)] bg-[var(--bg2)]/80 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto flex-1 min-h-[42px] px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--bg3)] active:scale-95 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (isCurrentUser && selectedRole !== "admin") || !allowedRoles.includes(selectedRole as UserRole)}
            className="w-full sm:w-auto flex-1 min-h-[42px] px-4 py-2.5 rounded-xl bg-[var(--verde)] text-black text-xs font-black hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
