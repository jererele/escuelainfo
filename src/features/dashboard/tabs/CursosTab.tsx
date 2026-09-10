import React from "react";
import { Users, Trash2 } from "lucide-react";
import { Curso, Alumno } from "@/lib/dataService";

interface CursosTabProps {
  cursos: Curso[];
  alumnos: Alumno[];
  onOpenCourseModal: () => void;
  onAssignAlumnos: (curso: Curso) => void;
  onDeleteCurso: (curso: Curso) => void;
}

export const CursosTab: React.FC<CursosTabProps> = ({
  cursos,
  alumnos,
  onOpenCourseModal,
  onAssignAlumnos,
  onDeleteCurso,
}) => {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-12">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-black title-font text-[var(--text)]">Gestión de Cursos</h2>
          <p className="text-[var(--text2)] text-sm mt-1">Crea y elimina las aulas y cursos oficiales de la escuela.</p>
        </div>
        <button 
          onClick={onOpenCourseModal}
          className="w-full md:w-auto bg-[var(--verde)] text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shrink-0 cursor-pointer"
        >
          + Agregar Nuevo Curso
        </button>
      </div>

      <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg3)]/50">
            <tr>
              <th className="p-4 sm:p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Nombre del Curso</th>
              <th className="p-4 sm:p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Alumnos</th>
              <th className="p-4 sm:p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursos.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-16 sm:p-20 text-center text-[var(--text3)] italic">
                  No hay cursos creados. Presiona "+ Agregar Nuevo Curso" para empezar.
                </td>
              </tr>
            ) : (
              cursos.map(c => {
                const alumnosEnCurso = alumnos.filter(a => a.curso === c.nombre).length;
                return (
                  <tr key={c.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                    <td className="p-4 sm:p-6">
                      <div className="font-bold text-[var(--text)]">{c.nombre}</div>
                    </td>
                    <td className="p-4 sm:p-6">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                        alumnosEnCurso > 0
                          ? 'bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]'
                          : 'bg-[var(--bg3)] text-[var(--text3)] border-[var(--border)]'
                      }`}>
                        {alumnosEnCurso} {alumnosEnCurso === 1 ? 'alumno' : 'alumnos'}
                      </span>
                    </td>
                    <td className="p-4 sm:p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onAssignAlumnos(c)}
                          className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase bg-[var(--azul-bg)] text-[var(--azul)] border border-[var(--azul-border)] rounded-xl hover:bg-[var(--azul)] hover:text-white transition-all active:scale-95 cursor-pointer"
                          title="Asignar alumnos a este curso"
                        >
                          <Users size={12} />
                          Gestionar Alumnos
                        </button>
                        <button
                          onClick={() => onDeleteCurso(c)}
                          className="text-[var(--rojo)] hover:scale-125 transition-transform p-2 cursor-pointer"
                          title="Eliminar Curso"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CursosTab;
