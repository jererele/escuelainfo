"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  Users, 
  Search, 
  Check, 
  X, 
  Clock, 
  UserCheck, 
  GraduationCap, 
  ShieldCheck, 
  UserCog, 
  User, 
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { UserProfile, Alumno, Curso, isPendingRole } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";
import ApproveStudentRoleModal from "@/components/modals/ApproveStudentRoleModal";

const ChangeUserRoleModal = dynamic(() => import("@/components/modals/ChangeUserRoleModal"), {
  ssr: false,
});

interface UsuariosTabProps {
  usuarios: UserProfile[];
  alumnos: Alumno[];
  cursos: Curso[];
  isAdmin: boolean;
  userProfile: UserProfile | null;
  onApproveStudent: (
    user: UserProfile,
    targetRole?: "alumno" | "profesor" | "preceptor",
    selectedCurso?: string
  ) => Promise<void> | void;
  onRejectStudent: (user: UserProfile) => Promise<void> | void;
  onChangeUserRole?: (
    user: UserProfile,
    newRole: UserProfile["rol"],
    selectedCurso?: string
  ) => Promise<void> | void;
  showToast: (message: string, type?: "success" | "error") => void;
  onRefreshUsuarios?: () => void;
}

export const UsuariosTab: React.FC<UsuariosTabProps> = ({
  usuarios,
  alumnos,
  cursos,
  isAdmin,
  userProfile,
  onApproveStudent,
  onRejectStudent,
  onChangeUserRole,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"solicitudes" | "activos">("solicitudes");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [approvingUser, setApprovingUser] = useState<UserProfile | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [roleChangingUser, setRoleChangingUser] = useState<UserProfile | null>(null);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);

  // Todas las solicitudes de acceso pendientes
  const pendingRequests = useMemo(() => {
    return usuarios.filter(u => isPendingRole(u.rol));
  }, [usuarios]);

  // Usuarios activos (con rol oficial asignado)
  const activeUsers = useMemo(() => {
    return usuarios.filter(u => !isPendingRole(u.rol));
  }, [usuarios]);

  // Filtrado de solicitudes pendientes por búsqueda
  const filteredPending = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return pendingRequests.filter(u => {
      const studDetails = alumnos.find(a => a.email.toLowerCase() === u.email.toLowerCase());
      const dni = studDetails?.dni || "";
      const curso = studDetails?.curso || "";
      const matchesSearch = 
        (u.nombre || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        dni.toLowerCase().includes(q) ||
        curso.toLowerCase().includes(q);

      if (roleFilter === "todos") return matchesSearch;
      if (roleFilter === "alumno") return matchesSearch && u.rol === "pendiente_alumno";
      if (roleFilter === "profesor") return matchesSearch && u.rol === "pendiente_profesor";
      if (roleFilter === "preceptor") return matchesSearch && u.rol === "pendiente_preceptor";
      return matchesSearch;
    });
  }, [pendingRequests, alumnos, searchQuery, roleFilter]);

  // Filtrado de usuarios activos por búsqueda
  const filteredActive = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activeUsers.filter(u => {
      const matchesSearch = 
        (u.nombre || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.rol || "").toLowerCase().includes(q);

      if (roleFilter === "todos") return matchesSearch;
      return matchesSearch && u.rol === roleFilter;
    });
  }, [activeUsers, searchQuery, roleFilter]);

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)]">
            <ShieldCheck size={11} strokeWidth={2.5} />
            <span>Administrador</span>
          </span>
        );
      case "directivo":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--violeta-bg)] text-[var(--violeta)] border border-[var(--violeta-border)]">
            <UserCog size={11} strokeWidth={2.5} />
            <span>Directivo</span>
          </span>
        );
      case "profesor":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--azul-bg)] text-[var(--azul)] border border-[var(--azul-border)]">
            <GraduationCap size={11} strokeWidth={2.5} />
            <span>Profesor</span>
          </span>
        );
      case "preceptor":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--cyan-bg)] text-[var(--cyan)] border border-[var(--cyan-border)]">
            <UserCheck size={11} strokeWidth={2.5} />
            <span>Preceptor</span>
          </span>
        );
      case "alumno":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]">
            <User size={11} strokeWidth={2.5} />
            <span>Alumno</span>
          </span>
        );
      default:
        if (rol.startsWith("pendiente") || rol === "pe") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)]">
              <Clock size={11} strokeWidth={2.5} />
              <span>Sin Rango · Pendiente</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[var(--bg3)] text-[var(--text2)] border border-[var(--border)]">
            <span>{rol}</span>
          </span>
        );
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black title-font flex items-center gap-2.5">
            <Users size={28} className="text-[var(--verde)]" />
            <span>Gestión de Usuarios</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text2)] mt-1">
            Revisá y aprobá las solicitudes de ingreso a la plataforma institucional o consultá el directorio de usuarios.
          </p>
        </div>

        {/* SELECTOR DE VISTA: Solicitudes Pendientes vs Usuarios Activos */}
        <div className="flex items-center gap-1 p-1 bg-[var(--bg2)] rounded-2xl border border-[var(--border)] w-full md:w-auto">
          <button
            type="button"
            onClick={() => { setActiveSubTab("solicitudes"); setSearchQuery(""); setRoleFilter("todos"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "solicitudes"
                ? "bg-[var(--verde)] text-black font-black shadow-sm"
                : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
            }`}
          >
            <span>Solicitudes</span>
            {pendingRequests.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === "solicitudes" ? "bg-black text-white" : "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)]"
              }`}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab("activos"); setSearchQuery(""); setRoleFilter("todos"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "activos"
                ? "bg-[var(--verde)] text-black font-black shadow-sm"
                : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
            }`}
          >
            <span>Activos</span>
            <span className="text-[10px] opacity-75">({activeUsers.length})</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTRO */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)]">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={
              activeSubTab === "solicitudes"
                ? "Buscar solicitudes por nombre, DNI, email o curso..."
                : "Buscar usuarios registrados por nombre, email o rol..."
            }
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-[var(--verde)] transition-all text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--text3)] shrink-0 hidden sm:block" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 px-3 outline-none focus:border-[var(--verde)] text-xs font-bold cursor-pointer"
          >
            <option value="todos">Todos los roles</option>
            <option value="alumno">Alumnos</option>
            <option value="profesor">Profesores</option>
            <option value="preceptor">Preceptores</option>
            {activeSubTab === "activos" && <option value="directivo">Directivos</option>}
            {activeSubTab === "activos" && <option value="admin">Administradores</option>}
          </select>
        </div>
      </div>

      {/* ─── VISTA 1: SOLICITUDES DE ACCESO PENDIENTES ───────────────────────── */}
      {activeSubTab === "solicitudes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black title-font text-[var(--amarillo)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--amarillo)] animate-pulse inline-block" />
              Solicitudes Pendientes de Revisión ({filteredPending.length})
            </h3>
          </div>

          {/* VISTA MÓVIL: Tarjetas táctiles (< md) */}
          <div className="md:hidden space-y-3">
            {filteredPending.length === 0 ? (
              <div className="card glass rounded-2xl border border-[var(--border)] p-12 text-center text-[var(--text3)] italic text-sm space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-[var(--verde)] opacity-70 mb-1" />
                <p className="font-bold text-[var(--text)] not-italic">No hay solicitudes pendientes</p>
                <p className="text-xs">Todas las solicitudes de registro han sido procesadas.</p>
              </div>
            ) : (
              filteredPending.map(u => {
                const studDetails = alumnos.find(a => a.email.toLowerCase() === u.email.toLowerCase());
                const cursoLabel = studDetails?.curso && studDetails.curso !== "pendiente" ? studDetails.curso : null;
                const requestedRole = u.rol.replace("pendiente_", "");

                return (
                  <div key={u.id} className="card glass rounded-2xl border border-[var(--border)] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={u.nombre} email={u.email} size={38} />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[var(--text)] truncate">{u.nombre}</div>
                          <div className="text-xs text-[var(--text3)] truncate">{u.email}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] rounded-lg text-[10px] font-bold uppercase shrink-0">
                        Sin Rango
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text2)] pt-1 border-t border-[var(--border)]/50">
                      <span className="font-mono">
                        DNI: <strong className="text-[var(--text)]">{studDetails?.dni || "—"}</strong>
                      </span>
                      {cursoLabel ? (
                        <span className="px-2 py-0.5 bg-[var(--bg3)] border border-[var(--border)] rounded-lg text-[10px] font-bold uppercase">
                          {cursoLabel}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text3)] font-semibold">
                          <Clock size={10} className="shrink-0" />
                          <span>Por asignar</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]/50">
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingUser(u);
                          setIsApproveModalOpen(true);
                        }}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Aprobar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectStudent(u)}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
                      >
                        <X size={14} strokeWidth={2.5} />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* VISTA ESCRITORIO: Tabla horizontal (>= md) */}
          <div className="hidden md:block card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[650px]">
                <thead className="bg-[var(--bg3)]/50">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Solicitante</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">DNI</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Estado de Acceso</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">División / Curso</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-[var(--text3)] italic">
                        <CheckCircle2 size={36} className="mx-auto text-[var(--verde)] opacity-70 mb-2" />
                        <div className="font-bold text-sm text-[var(--text)] not-italic">No hay solicitudes pendientes</div>
                        <div className="text-xs mt-1">Todos los usuarios que se registraron ya fueron aprobados o revisados.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredPending.map(u => {
                      const studDetails = alumnos.find(a => a.email.toLowerCase() === u.email.toLowerCase());
                      const cursoLabel = studDetails?.curso && studDetails.curso !== "pendiente" ? studDetails.curso : null;

                      return (
                        <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={u.nombre} email={u.email} size={38} />
                              <div>
                                <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                                <div className="text-xs text-[var(--text3)]">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 font-mono text-sm">
                            {studDetails?.dni || "—"}
                          </td>
                          <td className="p-6">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] rounded-lg text-xs font-bold uppercase">
                              <Clock size={11} strokeWidth={2.5} className="shrink-0" />
                              <span>Sin rango asignado</span>
                            </span>
                          </td>
                          <td className="p-6">
                            {cursoLabel ? (
                              <span className="px-3 py-1 bg-[var(--bg3)] border border-[var(--border)] rounded-lg text-xs font-bold uppercase">
                                {cursoLabel}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--bg3)] border border-[var(--border)] text-[var(--text3)] rounded-lg text-xs font-medium">
                                <span>A definir al aprobar</span>
                              </span>
                            )}
                          </td>
                          <td className="p-6 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setApprovingUser(u);
                                setIsApproveModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <Check size={13} strokeWidth={2.5} />
                              <span>Aprobar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onRejectStudent(u)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold hover:bg-[var(--rojo)] hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <X size={13} strokeWidth={2.5} />
                              <span>Rechazar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── VISTA 2: USUARIOS ACTIVOS ──────────────────────────────────────── */}
      {activeSubTab === "activos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black title-font text-[var(--text)] flex items-center gap-2">
                <UserCheck size={20} className="text-[var(--verde)]" />
                <span>Directorio Institucional de Usuarios ({filteredActive.length})</span>
              </h3>
              <p className="text-xs text-[var(--text3)] mt-0.5">
                {isAdmin
                  ? "Como administrador podés reasignar el rol de cualquier usuario en la plataforma (desde Alumno hasta Administrador)."
                  : "Listado de miembros con acceso habilitado al sistema escolar."}
              </p>
            </div>
            {isAdmin && (
              <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-[11px] font-black uppercase tracking-wider">
                <ShieldCheck size={13} strokeWidth={2.5} />
                <span>Gestión de Roles Activa</span>
              </span>
            )}
          </div>

          {/* VISTA MÓVIL: Tarjetas táctiles (< md) */}
          <div className="md:hidden space-y-3">
            {filteredActive.length === 0 ? (
              <div className="card glass rounded-2xl border border-[var(--border)] p-12 text-center text-[var(--text3)] italic text-sm">
                No se encontraron usuarios con ese criterio.
              </div>
            ) : (
              filteredActive.map((u) => {
                const studDetails = alumnos.find((a) => a.email.toLowerCase() === u.email.toLowerCase());
                const isCurrentAccount =
                  (userProfile?.email && u.email.toLowerCase() === userProfile.email.toLowerCase()) ||
                  (userProfile?.id && u.id === userProfile.id);

                return (
                  <div key={u.id} className="card glass rounded-2xl border border-[var(--border)] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={u.nombre} email={u.email} size={38} />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[var(--text)] truncate flex items-center gap-1.5">
                            <span className="truncate">{u.nombre}</span>
                            {isCurrentAccount && (
                              <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] text-[9px] font-black uppercase">
                                Vos
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text3)] font-mono truncate">{u.email}</div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleChangingUser(u);
                              setIsChangeRoleModalOpen(true);
                            }}
                            className="cursor-pointer text-left active:scale-95 transition-transform group"
                            title="Hacé clic para cambiar rol institucional"
                          >
                            <span className="flex items-center gap-1">
                              {getRoleBadge(u.rol)}
                            </span>
                          </button>
                        ) : (
                          getRoleBadge(u.rol)
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text2)] pt-1 border-t border-[var(--border)]/50">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--verde)]">
                        <span className="w-2 h-2 rounded-full bg-[var(--verde)]" />
                        Activo
                      </span>

                      {u.rol === "alumno" && (
                        <div className="text-[11px] font-bold text-[var(--text2)]">
                          {studDetails?.curso && studDetails.curso !== "pendiente" ? (
                            <span className="px-2 py-0.5 rounded-lg bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] uppercase font-mono">
                              {studDetails.curso}
                            </span>
                          ) : (
                            <span className="text-[var(--amarillo)] italic">Sin curso</span>
                          )}
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="pt-1 border-t border-[var(--border)]/50">
                        <button
                          type="button"
                          onClick={() => {
                            setRoleChangingUser(u);
                            setIsChangeRoleModalOpen(true);
                          }}
                          className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-[var(--bg3)] hover:bg-[var(--bg2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--verde)] hover:text-[var(--verde)] rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          <UserCog size={15} strokeWidth={2.2} />
                          <span>Cambiar Rol</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* VISTA ESCRITORIO: Tabla horizontal (>= md) */}
          <div className="hidden md:block card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[650px]">
                <thead className="bg-[var(--bg3)]/50">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Usuario</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Email</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Rol Asignado</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Detalle / Curso</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Estado</th>
                    {isAdmin && (
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredActive.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="p-20 text-center text-[var(--text3)] italic">
                        No se encontraron usuarios con ese criterio.
                      </td>
                    </tr>
                  ) : (
                    filteredActive.map((u) => {
                      const studDetails = alumnos.find((a) => a.email.toLowerCase() === u.email.toLowerCase());
                      const isCurrentAccount =
                        (userProfile?.email && u.email.toLowerCase() === userProfile.email.toLowerCase()) ||
                        (userProfile?.id && u.id === userProfile.id);

                      return (
                        <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={u.nombre} email={u.email} size={36} />
                              <div>
                                <div className="font-bold text-[var(--text)] flex items-center gap-2">
                                  <span>{u.nombre}</span>
                                  {isCurrentAccount && (
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] text-[9px] font-black uppercase">
                                      Tu Cuenta
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-sm text-[var(--text2)] font-mono">
                            {u.email}
                          </td>
                          <td className="p-6">
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRoleChangingUser(u);
                                  setIsChangeRoleModalOpen(true);
                                }}
                                className="group cursor-pointer text-left focus:outline-none"
                                title="Hacé clic para cambiar el rol de este usuario"
                              >
                                <span className="inline-flex items-center gap-1.5 transition-transform group-hover:scale-105 active:scale-95">
                                  {getRoleBadge(u.rol)}
                                  <UserCog size={12} className="text-[var(--text3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                              </button>
                            ) : (
                              getRoleBadge(u.rol)
                            )}
                          </td>
                          <td className="p-6 text-xs">
                            {u.rol === "alumno" ? (
                              studDetails?.curso && studDetails.curso !== "pendiente" ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--bg3)] border border-[var(--border)] font-bold text-[var(--text)] uppercase font-mono">
                                  {studDetails.curso}
                                </span>
                              ) : (
                                <span className="text-[var(--amarillo)] font-medium italic">Sin curso</span>
                              )
                            ) : (
                              <span className="text-[var(--text3)] font-mono text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-6">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--verde)]">
                              <span className="w-2 h-2 rounded-full bg-[var(--verde)]" />
                              Activo
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="p-6 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setRoleChangingUser(u);
                                  setIsChangeRoleModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--verde)] hover:text-[var(--verde)] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                title="Cambiar rol y permisos de este usuario"
                              >
                                <UserCog size={13} strokeWidth={2.2} />
                                <span>Cambiar Rol</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE ROL Y CURSO AL APROBAR */}
      {isApproveModalOpen && approvingUser && (
        <ApproveStudentRoleModal
          isOpen={isApproveModalOpen}
          onClose={() => {
            setIsApproveModalOpen(false);
            setApprovingUser(null);
          }}
          onConfirm={(targetRole, selectedCurso) =>
            onApproveStudent(approvingUser, targetRole, selectedCurso)
          }
          user={approvingUser}
          alumnoDetails={alumnos.find(
            (a) => a.email.toLowerCase() === approvingUser.email.toLowerCase()
          )}
          cursos={cursos}
        />
      )}

      {/* MODAL DE CAMBIO DE ROL INSTITUCIONAL (Solo Administradores) */}
      {isChangeRoleModalOpen && roleChangingUser && (
        <ChangeUserRoleModal
          isOpen={isChangeRoleModalOpen}
          onClose={() => {
            setIsChangeRoleModalOpen(false);
            setRoleChangingUser(null);
          }}
          onConfirm={async (targetRole, selectedCurso) => {
            if (onChangeUserRole) {
              await onChangeUserRole(roleChangingUser, targetRole, selectedCurso);
            }
          }}
          user={roleChangingUser}
          alumnoDetails={alumnos.find(
            (a) => a.email.toLowerCase() === roleChangingUser.email.toLowerCase()
          )}
          cursos={cursos}
          isCurrentUser={
            userProfile?.email?.toLowerCase() === roleChangingUser.email.toLowerCase() ||
            userProfile?.id === roleChangingUser.id
          }
        />
      )}
    </div>
  );
};

export default UsuariosTab;
