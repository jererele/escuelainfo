import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Search, Trash2, Check, X, Clock } from "lucide-react";
import { Alumno, UserProfile, Curso } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

const ApproveStudentRoleModal = dynamic(
  () => import("@/components/modals/ApproveStudentRoleModal"),
  { ssr: false }
);

interface AlumnosTabProps {
  alumnos: Alumno[];
  usuarios: UserProfile[];
  isAdmin: boolean;
  studentSearchQuery: string;
  setStudentSearchQuery: (q: string) => void;
  onOpenAddStudent: (al?: Alumno) => void;
  onApproveStudent: (
    u: UserProfile,
    targetRole?: "alumno" | "profesor" | "preceptor",
    selectedCurso?: string
  ) => Promise<void> | void;
  onRejectStudent: (u: UserProfile) => void;
  onDeleteAlumno: (al: Alumno) => void;
  cursos?: Curso[];
}

export const AlumnosTab: React.FC<AlumnosTabProps> = ({
  alumnos,
  usuarios,
  isAdmin,
  studentSearchQuery,
  setStudentSearchQuery,
  onOpenAddStudent,
  onApproveStudent,
  onRejectStudent,
  onDeleteAlumno,
  cursos,
}) => {
  const [approvingUser, setApprovingUser] = useState<UserProfile | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const pendingAlumnos = usuarios.filter(u => (u.rol as string) === 'pendiente_alumno');

  const filteredAlumnos = alumnos.filter(al => {
    const q = studentSearchQuery.toLowerCase().trim();
    return (
      (al.nombre || "").toLowerCase().includes(q) ||
      (al.dni || "").toLowerCase().includes(q) ||
      (al.curso || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in space-y-10">
      {/* SOLICITUDES DE MATRICULACIÓN PENDIENTES */}
      {pendingAlumnos.length > 0 && (
        <div className="animate-fade-in space-y-3">
          <h3 className="text-xl font-black title-font text-[var(--amarillo)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--amarillo)] animate-pulse inline-block"></span>
            Solicitudes de Inscripción Pendientes
          </h3>

          {/* VISTA MÓVIL: Tarjetas táctiles (< md) */}
          <div className="md:hidden space-y-3">
            {pendingAlumnos.map(u => {
              const studDetails = alumnos.find(a => a.email.toLowerCase() === u.email.toLowerCase());
              const cursoLabel = studDetails?.curso && studDetails.curso !== 'pendiente' ? studDetails.curso : null;
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
                    {cursoLabel ? (
                      <span className="px-2.5 py-1 bg-[var(--bg3)] rounded-lg text-[10px] font-bold uppercase shrink-0">{cursoLabel}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-lg text-[10px] font-bold uppercase shrink-0">
                        <Clock size={10} strokeWidth={2.5} className="shrink-0" />
                        <span>Sin asignar</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text2)] font-mono">
                    DNI: <span className="font-bold text-[var(--text)]">{studDetails?.dni || "Cargando..."}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]/50">
                    <button
                      onClick={() => {
                        setApprovingUser(u);
                        setIsApproveModalOpen(true);
                      }}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>Aprobar</span>
                    </button>
                    <button
                      onClick={() => onRejectStudent(u)}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <X size={14} strokeWidth={2.5} />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA ESCRITORIO: Tabla horizontal (>= md) */}
          <div className="hidden md:block card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-[var(--bg3)]/50">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Alumno</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">DNI</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Curso Asignado</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAlumnos.map(u => {
                    const studDetails = alumnos.find(a => a.email.toLowerCase() === u.email.toLowerCase());
                    const cursoLabel = studDetails?.curso && studDetails.curso !== 'pendiente' ? studDetails.curso : null;
                    return (
                      <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={u.nombre} email={u.email} size={36} />
                            <div>
                              <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                              <div className="text-xs text-[var(--text3)]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-sm">{studDetails?.dni || "Cargando..."}</td>
                        <td className="p-6">
                          {cursoLabel
                            ? <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold uppercase">{cursoLabel}</span>
                            : <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-lg text-xs font-bold uppercase">
                                <Clock size={11} strokeWidth={2.5} className="shrink-0" />
                                <span>Sin asignar</span>
                              </span>
                          }
                        </td>
                        <td className="p-6 text-right space-x-2">
                          <button
                            onClick={() => {
                              setApprovingUser(u);
                              setIsApproveModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-all cursor-pointer"
                          >
                            <Check size={13} strokeWidth={2.5} />
                            <span>Aprobar</span>
                          </button>
                          <button
                            onClick={() => onRejectStudent(u)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold hover:bg-[var(--rojo)] hover:text-white transition-all cursor-pointer"
                          >
                            <X size={13} strokeWidth={2.5} />
                            <span>Rechazar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black title-font">Gestión de Alumnos</h2>
            <p className="text-xs sm:text-sm text-[var(--text2)]">Listado oficial de estudiantes por curso.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)] mb-6">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]"><Search size={20} /></span>
            <input 
              type="text" 
              placeholder="Buscar alumnos por nombre, DNI o curso..." 
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[var(--verde)] transition-all text-sm"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* VISTA MÓVIL: Tarjetas de alumnos filtrados (< md) */}
        <div className="md:hidden space-y-3 mb-6">
          {filteredAlumnos.length === 0 ? (
            <div className="card glass rounded-2xl border border-[var(--border)] p-8 text-center text-[var(--text3)] italic text-sm">
              No se encontraron alumnos.
            </div>
          ) : (
            filteredAlumnos.map(al => (
              <div key={al.id} className="card glass rounded-2xl border border-[var(--border)] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={al.nombre} email={al.email} size={38} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[var(--text)] truncate">{al.nombre}</div>
                      {al.email && <div className="text-xs text-[var(--text3)] truncate">{al.email}</div>}
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => onDeleteAlumno(al)} 
                      className="p-2 rounded-lg text-[var(--rojo)] hover:bg-[var(--rojo-bg)] transition-colors"
                      title="Eliminar Alumno"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]/50">
                  <span className="font-mono text-[var(--text2)]">DNI: <strong className="text-[var(--text)]">{al.dni}</strong></span>
                  {al.curso && al.curso !== 'pendiente' ? (
                    <button
                      type="button"
                      onClick={() => isAdmin && onOpenAddStudent(al)}
                      disabled={!isAdmin}
                      className={`inline-block text-center px-2.5 py-0.5 bg-[var(--bg3)] border border-[var(--border)] rounded-lg text-[10px] font-bold leading-tight ${
                        isAdmin ? "hover:border-[var(--verde)] cursor-pointer active:scale-95" : ""
                      }`}
                      title={isAdmin ? "Hacé clic para cambiar o asignar curso" : undefined}
                    >
                      {al.curso}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => isAdmin && onOpenAddStudent(al)}
                      disabled={!isAdmin}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-lg text-[10px] font-bold ${
                        isAdmin ? "hover:border-[var(--verde)] hover:text-[var(--verde)] cursor-pointer active:scale-95" : ""
                      }`}
                      title={isAdmin ? "Hacé clic para asignar curso" : undefined}
                    >
                      <Clock size={10} strokeWidth={2.5} className="shrink-0" />
                      <span>Pendiente {isAdmin ? "· Asignar" : ""}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* VISTA ESCRITORIO: Tabla horizontal (>= md) */}
        <div className="hidden md:block card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[550px]">
              <thead className="bg-[var(--bg3)]/50">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Nombre</th>
                  <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">DNI</th>
                  <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Curso</th>
                  {isAdmin && <th className="p-6 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAlumnos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-[var(--text3)] italic">
                      No se encontraron alumnos.
                    </td>
                  </tr>
                ) : (
                  filteredAlumnos.map(al => (
                    <tr key={al.id} className="border-b border-[var(--border)] last:border-none hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={al.nombre} email={al.email} size={36} />
                          <div>
                            <div className="font-bold text-[var(--text)]">{al.nombre}</div>
                            {al.email && <div className="text-[11px] text-[var(--text3)]">{al.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-sm">{al.dni}</td>
                      <td className="p-6">
                        {al.curso && al.curso !== 'pendiente' ? (
                          <button
                            type="button"
                            onClick={() => isAdmin && onOpenAddStudent(al)}
                            disabled={!isAdmin}
                            className={`inline-block text-center px-3 py-1.5 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-xs font-bold leading-tight shadow-sm transition-all ${
                              isAdmin ? "hover:border-[var(--verde)] hover:bg-[var(--verde-bg)]/20 cursor-pointer" : ""
                            }`}
                            title={isAdmin ? "Hacé clic para cambiar o asignar curso" : undefined}
                          >
                            {al.curso}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => isAdmin && onOpenAddStudent(al)}
                            disabled={!isAdmin}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-xl text-xs font-bold leading-tight shadow-sm transition-all ${
                              isAdmin ? "hover:border-[var(--verde)] hover:text-[var(--verde)] cursor-pointer" : ""
                            }`}
                            title={isAdmin ? "Hacé clic para asignar curso" : undefined}
                          >
                            <Clock size={11} strokeWidth={2.5} className="shrink-0" />
                            <span>Pendiente {isAdmin ? "· Asignar" : ""}</span>
                          </button>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => onDeleteAlumno(al)} 
                            className="text-[var(--rojo)] hover:scale-125 transition-transform cursor-pointer"
                            title="Eliminar Alumno"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE SELECCIÓN DE ROL AL APROBAR */}
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
    </div>
  );
};

export default AlumnosTab;
