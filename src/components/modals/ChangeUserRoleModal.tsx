"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
  ArrowRight,
  Mail,
  KeyRound,
  RefreshCw,
  Loader2,
  Send,
  ShieldAlert
} from "lucide-react";
import { 
  UserProfile, 
  Alumno, 
  Curso, 
  getAllowedAssignableRoles, 
  UserRole, 
  parseUserCursos, 
  fromDbRol,
  requestAdminOtpApi
} from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

interface ChangeUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    targetRole: UserProfile["rol"],
    selectedCurso?: string,
    preceptorCursos?: string[],
    adminOtpCode?: string,
    adminOtpToken?: string
  ) => Promise<void> | void;
  user: UserProfile | null;
  alumnoDetails?: Alumno | null;
  cursos?: Curso[];
  isCurrentUser?: boolean;
  operatorRole?: string | null;
  isAdmin?: boolean;
}

export type AssignableRole = "admin" | "directivo" | "preceptor" | "profesor" | "alumno";

const ALL_ROLE_DEFINITIONS: Array<{
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

export default function ChangeUserRoleModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  alumnoDetails,
  cursos = [],
  isCurrentUser = false,
  operatorRole = "",
  isAdmin = false,
}: ChangeUserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<AssignableRole>("alumno");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedPreceptorCursos, setSelectedPreceptorCursos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmAdminEscalation, setConfirmAdminEscalation] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estados de seguridad para validación OTP de Administrador (jeree.castroo10@gmail.com)
  const [adminOtpCode, setAdminOtpCode] = useState<string>("");
  const [adminOtpToken, setAdminOtpToken] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const [otpError, setOtpError] = useState<string>("");
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string>("");

  const courseSectionRef = useRef<HTMLDivElement>(null);
  const courseSelectRef = useRef<HTMLSelectElement>(null);
  const preceptorSectionRef = useRef<HTMLDivElement>(null);
  const adminSectionRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const initializedUserRef = useRef<string | null>(null);

  const effectiveRole = isAdmin ? "admin" : fromDbRol(operatorRole);

  // Jerarquía de roles que el operador activo tiene permitido asignar
  const allowedRoles = useMemo<UserRole[]>(() => {
    if (isAdmin) {
      return ["admin", "directivo", "preceptor", "profesor", "alumno"];
    }
    return getAllowedAssignableRoles(effectiveRole);
  }, [isAdmin, effectiveRole]);

  // Filtrar estrictamente solo los roles que el operador tiene derecho a otorgar
  const visibleRoleDefinitions = useMemo(() => {
    const isOpPreceptor = !isAdmin && effectiveRole === "preceptor";
    return ALL_ROLE_DEFINITIONS.filter(r => {
      // Un preceptor bajo ninguna circunstancia puede otorgar el rol de preceptor
      if (isOpPreceptor && r.id === "preceptor") return false;
      return allowedRoles.includes(r.id as UserRole);
    });
  }, [allowedRoles, isAdmin, effectiveRole]);

  const currentRoleIsSame = fromDbRol(user?.rol || "").toLowerCase() === (selectedRole || "").toLowerCase();

  // Mensaje explicativo según la jerarquía del operador
  const operatorHierarchyNotice = useMemo(() => {
    const op = isAdmin ? "admin" : effectiveRole.toLowerCase();
    if (op === "admin") {
      return "Como Administrador tenés permisos para asignar cualquier rol institucional.";
    }
    if (op === "directivo") {
      return "Como Directivo podés asignar los roles de Preceptor, Profesor o Alumno.";
    }
    if (op === "preceptor") {
      return "Como Preceptor podés asignar los roles de Profesor o Alumno (no podés asignar Preceptores, Directivos ni Administradores).";
    }
    return "No contás con permisos para modificar roles institucionales.";
  }, [isAdmin, effectiveRole]);

  useEffect(() => {
    if (!isOpen || !user) {
      setLoading(false);
      setConfirmAdminEscalation(false);
      setAdminOtpCode("");
      setAdminOtpToken("");
      setIsSendingOtp(false);
      setOtpSent(false);
      setOtpCooldown(0);
      setOtpError("");
      setOtpSuccessMessage("");
      initializedUserRef.current = null;
      return;
    }

    // Inicializar sólo una vez al abrir o cambiar de usuario objetivo, impidiendo que re-renders sobreescriban la elección del operador
    const userKey = `${user.id || user.uid || user.email}-${isOpen}`;
    if (initializedUserRef.current === userKey) {
      return;
    }
    initializedUserRef.current = userKey;

    // Normalizar rol actual del usuario para pre-seleccionar
    let initialRole: AssignableRole = "alumno";
    const rawRole = fromDbRol(user?.rol || "").replace("pendiente_", "").toLowerCase();
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
    const preceptorAssigned = user?.cursos ? parseUserCursos(user.cursos) : [];
    setSelectedPreceptorCursos(preceptorAssigned);

    // Si ya tiene curso asignado en alumnoDetails
    const currentCourse = alumnoDetails?.curso && alumnoDetails.curso !== "pendiente" ? alumnoDetails.curso : "";
    const validCursos = (cursos || []).filter(c => Boolean(c && c.nombre));
    if (currentCourse && validCursos.some(c => (c.nombre || "").trim().toLowerCase() === currentCourse.trim().toLowerCase())) {
      const match = validCursos.find(c => (c.nombre || "").trim().toLowerCase() === currentCourse.trim().toLowerCase());
      setSelectedCurso(match ? match.nombre : currentCourse);
    } else if (validCursos.length > 0) {
      setSelectedCurso(validCursos[0].nombre);
    } else {
      setSelectedCurso("");
    }
  }, [isOpen, user, alumnoDetails, cursos, allowedRoles]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Temporizador para reenvío de código OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueo de scroll en el fondo mientras el modal está abierto
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleSelectRole = (roleId: AssignableRole) => {
    setSelectedRole(roleId);
    setConfirmAdminEscalation(false);

    // Automatización de desplazamiento suave dentro del cuerpo del modal (sin mover la ventana principal)
    if (roleId === "alumno") {
      setTimeout(() => {
        if (courseSectionRef.current && modalBodyRef.current) {
          const topPos = courseSectionRef.current.offsetTop - modalBodyRef.current.offsetTop;
          modalBodyRef.current.scrollTo({ top: topPos, behavior: "smooth" });
        }
        courseSelectRef.current?.focus({ preventScroll: true });
      }, 60);
    } else if (roleId === "preceptor") {
      setTimeout(() => {
        if (preceptorSectionRef.current && modalBodyRef.current) {
          const topPos = preceptorSectionRef.current.offsetTop - modalBodyRef.current.offsetTop;
          modalBodyRef.current.scrollTo({ top: topPos, behavior: "smooth" });
        }
      }, 60);
    } else if (roleId === "admin" && fromDbRol(user?.rol) !== "admin") {
      setTimeout(() => {
        if (adminSectionRef.current && modalBodyRef.current) {
          const topPos = adminSectionRef.current.offsetTop - modalBodyRef.current.offsetTop;
          modalBodyRef.current.scrollTo({ top: topPos, behavior: "smooth" });
        }
      }, 60);
    }
  };

  const handleRequestAdminOtp = async () => {
    if (!user?.email || isSendingOtp || otpCooldown > 0) return;
    setIsSendingOtp(true);
    setOtpError("");
    setOtpSuccessMessage("");
    try {
      const res = await requestAdminOtpApi(user.email, user.nombre);
      if (res.success) {
        setOtpSent(true);
        if (res.token) setAdminOtpToken(res.token);
        setOtpSuccessMessage(res.message || "Código enviado exitosamente a jeree.castroo10@gmail.com");
        setOtpCooldown(60);
      } else {
        setOtpError(res.error || "No se pudo enviar el código a jeree.castroo10@gmail.com");
      }
    } catch (err: any) {
      setOtpError(err?.message || "Error al solicitar código de verificación.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirm = async () => {
    if (isCurrentUser && selectedRole !== "admin") {
      return;
    }
    const isOpPreceptor = !isAdmin && effectiveRole === "preceptor";
    if (isOpPreceptor && selectedRole === "preceptor") {
      return;
    }
    if (!allowedRoles.includes(selectedRole as UserRole)) {
      return;
    }

    const isPromotingToAdmin = selectedRole === "admin" && fromDbRol(user?.rol || "").toLowerCase() !== "admin";

    // Salvaguarda: Exigir código OTP verificado en jeree.castroo10@gmail.com
    if (isPromotingToAdmin) {
      if (!otpSent) {
        setOtpError("Primero debés solicitar el código de verificación para jeree.castroo10@gmail.com");
        setTimeout(() => {
          if (adminSectionRef.current && modalBodyRef.current) {
            const topPos = adminSectionRef.current.offsetTop - modalBodyRef.current.offsetTop;
            modalBodyRef.current.scrollTo({ top: topPos, behavior: "smooth" });
          }
        }, 50);
        return;
      }
      if (!adminOtpCode || adminOtpCode.trim().length !== 6) {
        setOtpError("Ingresá el código numérico de 6 dígitos recibido en jeree.castroo10@gmail.com");
        return;
      }
    }

    setLoading(true);
    setOtpError("");
    try {
      await onConfirm(
        selectedRole,
        selectedRole === "alumno" ? (selectedCurso || undefined) : undefined,
        selectedRole === "preceptor" ? selectedPreceptorCursos : undefined,
        isPromotingToAdmin ? adminOtpCode.trim() : undefined,
        isPromotingToAdmin ? adminOtpToken : undefined
      );
      onClose();
    } catch (err: any) {
      if (isPromotingToAdmin) {
        setOtpError(err?.message || "Código de verificación inválido o expirado. Solicitá uno nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user || !mounted || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all duration-300 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden my-0 sm:my-auto">
        
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
                Operador: {isAdmin ? "Administrador" : (effectiveRole || "Sin Rango")}
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
                  const isCurrent = fromDbRol(user?.rol || "").toLowerCase() === role.id.toLowerCase();
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
                {(cursos || []).filter(c => Boolean(c && c.nombre)).map((c) => (
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
                    onClick={() => setSelectedPreceptorCursos((cursos || []).map(c => c?.nombre).filter(Boolean) as string[])}
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
                  {(cursos || []).filter(c => Boolean(c && c.nombre)).map((c) => {
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

          {/* ALERTA Y VERIFICACIÓN OTP PARA ASCENSO A ADMINISTRADOR */}
          {selectedRole === "admin" && allowedRoles.includes("admin") && fromDbRol(user?.rol || "").toLowerCase() !== "admin" && (
            <div
              ref={adminSectionRef}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] space-y-3.5 animate-fade-in ring-1 ring-[var(--rojo)]/30"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[var(--rojo)] font-black text-xs uppercase tracking-wider">
                  <ShieldAlert size={16} strokeWidth={2.5} />
                  <span>Autorización de Seguridad Requerida</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[var(--rojo)]/20 text-[var(--rojo)] border border-[var(--rojo)]/30">
                  Acceso Total
                </span>
              </div>

              <p className="text-xs text-[var(--text)] leading-relaxed">
                Para otorgarle privilegios de Administrador a este usuario, es indispensable ingresar el código de verificación de 6 dígitos enviado al correo del Administrador Principal:
                <br />
                <span className="font-mono text-xs font-bold text-[var(--rojo)] bg-black/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 mt-1.5 border border-[var(--rojo-border)]">
                  <Mail size={13} />
                  jeree.castroo10@gmail.com
                </span>
              </p>

              {/* Botón de envío de código / Cooldown */}
              <div className="pt-1">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleRequestAdminOtp}
                    disabled={isSendingOtp}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--rojo)] hover:brightness-110 active:scale-95 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Enviando código a jeree.castroo10@gmail.com...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Enviar Código a jeree.castroo10@gmail.com</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                      <span className="text-[10px] font-black uppercase text-[var(--verde)] flex items-center gap-1">
                        <Check size={12} strokeWidth={3} />
                        Código enviado a jeree.castroo10@gmail.com
                      </span>
                      <button
                        type="button"
                        onClick={handleRequestAdminOtp}
                        disabled={isSendingOtp || otpCooldown > 0}
                        className="text-[10px] text-[var(--rojo)] hover:underline font-bold disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw size={11} className={isSendingOtp ? "animate-spin" : ""} />
                        {otpCooldown > 0 ? `Reenviar en ${otpCooldown}s` : "Reenviar código"}
                      </button>
                    </div>

                    {/* Input para el código de 6 dígitos */}
                    <div className="space-y-1">
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoFocus
                          value={adminOtpCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setAdminOtpCode(val);
                            if (otpError) setOtpError("");
                          }}
                          placeholder="000000"
                          className="w-full bg-[var(--bg)] border-2 border-[var(--rojo-border)] focus:border-[var(--rojo)] text-[var(--rojo)] text-center text-2xl font-black font-mono tracking-[0.3em] rounded-xl py-2 px-3 outline-none transition-all placeholder:text-[var(--text3)]/40 shadow-inner"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] pointer-events-none">
                          <KeyRound size={16} />
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--text3)] text-center">
                        Ingresá los 6 dígitos recibidos en la casilla (válido por 10 min)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensajes de error o éxito */}
              {otpError && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-[var(--rojo-border)] text-[var(--rojo)] text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
              {otpSuccessMessage && !otpError && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-[var(--verde-border)] text-[var(--verde)] text-xs font-semibold flex items-center gap-2">
                  <Check size={14} className="shrink-0" />
                  <span>{otpSuccessMessage}</span>
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
            disabled={
              loading || 
              (isCurrentUser && selectedRole !== "admin") || 
              !allowedRoles.includes(selectedRole as UserRole) ||
              (selectedRole === "admin" && fromDbRol(user?.rol || "").toLowerCase() !== "admin" && (!otpSent || adminOtpCode.length !== 6))
            }
            className="w-full sm:w-auto flex-1 min-h-[42px] px-4 py-2.5 rounded-xl bg-[var(--verde)] text-black text-xs font-black hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Actualizando rol...</span>
            ) : selectedRole === "admin" && fromDbRol(user?.rol || "").toLowerCase() !== "admin" ? (
              <>
                <span>Verificar y Asignar Administrador</span>
                <ShieldCheck size={14} strokeWidth={2.5} />
              </>
            ) : (
              <>
                <span>
                  {currentRoleIsSame
                    ? "Guardar Configuración"
                    : "Guardar Nuevo Rol"}
                </span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
