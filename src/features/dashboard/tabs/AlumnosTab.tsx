import React from "react";
import { Search, Trash2 } from "lucide-react";
import { Alumno, UserProfile } from "@/lib/dataService";

interface AlumnosTabProps {
  alumnos: Alumno[];
  usuarios: UserProfile[];
  isAdmin: boolean;
  studentSearchQuery: string;
  setStudentSearchQuery: (q: string) => void;
  onOpenAddStudent: () => void;
  onApproveStudent: (u: UserProfile) => void;
  onRejectStudent: (u: UserProfile) => void;
  onDeleteAlumno: (al: Alumno) => void;
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
}) => {
  const pendingAlumnos = usuarios.filter(u => (u.rol as string) === 'pendiente_alumno');

  const filteredAlumnos = alumnos.filter(al => 
    al.nombre.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    al.dni.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    al.curso.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-10">
      {/* SOLICITUDES DE MATRICULACIÓN PENDIENTES */}
      {pendingAlumnos.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="text-xl font-black title-font mb-4 text-[var(--amarillo)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--amarillo)] animate-pulse inline-block"></span>
            Solicitudes de Inscripción Pendientes
          </h3>
          <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
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
                          <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                          <div className="text-xs text-[var(--text3)]">{u.email}</div>
                        </td>
                        <td className="p-6 text-sm">{studDetails?.dni || "Cargando..."}</td>
                        <td className="p-6">
                          {cursoLabel
                            ? <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold uppercase">{cursoLabel}</span>
                            : <span className="px-3 py-1 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-lg text-xs font-bold uppercase">⏳ Sin asignar</span>
                          }
                        </td>
                        <td className="p-6 text-right space-x-2">
                          <button
                            onClick={() => onApproveStudent(u)}
                            className="px-4 py-2 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-all cursor-pointer"
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            onClick={() => onRejectStudent(u)}
                            className="px-4 py-2 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold hover:bg-[var(--rojo)] hover:text-white transition-all cursor-pointer"
                          >
                            ✕ Rechazar
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black title-font">Gestión de Alumnos</h2>
            <p className="text-[var(--text2)]">Listado oficial de estudiantes por curso.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {isAdmin && (
              <button 
                onClick={onOpenAddStudent}
                className="flex-1 md:flex-none bg-black text-white dark:bg-white dark:text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl cursor-pointer"
              >
                + Inscribir Alumno
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)] mb-6">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]"><Search size={20} /></span>
            <input 
              type="text" 
              placeholder="Buscar alumnos por nombre, DNI o curso..." 
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[var(--verde)] transition-all"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
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
                      <td className="p-6 font-bold">{al.nombre}</td>
                      <td className="p-6 text-sm">{al.dni}</td>
                      <td className="p-6">
                        {al.curso && al.curso !== 'pendiente'
                          ? <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold">{al.curso}</span>
                          : <span className="px-3 py-1 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-lg text-xs font-bold">⏳ Pendiente</span>
                        }
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
    </div>
  );
};

export default AlumnosTab;
