import React from "react";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";
import { Profesor, UserProfile } from "@/lib/dataService";

interface ProfesoresTabProps {
  profesores: Profesor[];
  usuarios: UserProfile[];
  isAdmin: boolean;
  onOpenAddTeacher: () => void;
  onEditTeacher: (p: Profesor) => void;
  onDeleteTeacher: (p: Profesor) => void;
  onNavigateToAusencias: (profNombre: string) => void;
}

export const ProfesoresTab: React.FC<ProfesoresTabProps> = ({
  profesores,
  isAdmin,
  onOpenAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onNavigateToAusencias,
}) => {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black title-font">Cuerpo Docente</h2>
          <p className="text-[var(--text2)]">Gestión de profesores y sus materias asignadas.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
          {isAdmin && (
            <button 
              onClick={onOpenAddTeacher}
              className="bg-black text-white dark:bg-white dark:text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl cursor-pointer"
            >
              + Agregar Profesor
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profesores.length === 0 ? (
          <div className="col-span-full p-20 glass rounded-[32px] text-center border border-dashed border-[var(--border)]">
            <p className="text-[var(--text3)] font-bold italic">No hay profesores cargados todavía.</p>
          </div>
        ) : (
          profesores.map(p => (
            <div 
              key={p.id} 
              onClick={() => onNavigateToAusencias(p.nombre)}
              className="glass p-8 rounded-[32px] border border-[var(--border)] hover:border-[var(--verde)] transition-all group relative cursor-pointer"
              title={`Ver ausencias de ${p.nombre}`}
            >
              {isAdmin && (
                <div 
                  className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => onEditTeacher(p)}
                    className="text-[var(--verde)] p-2 bg-[var(--verde-bg)] rounded-xl hover:scale-110 transition-transform cursor-pointer"
                    title="Editar Profesor"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => onDeleteTeacher(p)}
                    className="text-[var(--rojo)] p-2 bg-[var(--rojo-bg)] rounded-xl hover:scale-110 transition-transform cursor-pointer"
                    title="Eliminar Profesor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <div className="flex justify-between items-start mb-6 mt-4">
                <div className="w-12 h-12 bg-[var(--bg3)] rounded-2xl flex items-center justify-center text-[var(--text2)] group-hover:bg-[var(--verde-bg)] group-hover:text-[var(--verde)] transition-colors">
                  <GraduationCap size={24} />
                </div>
                <div className="text-[10px] font-black uppercase text-[var(--text3)]">DNI: {p.dni}</div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--verde)] transition-colors">{p.nombre}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {p.materias.map(m => (
                  <span key={m} className="text-[9px] font-black uppercase px-2 py-1 bg-[var(--bg3)] rounded-lg text-[var(--text2)] border border-[var(--border)]">
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/50">
                <p className="text-xs text-[var(--text3)] truncate max-w-[170px]">{p.email}</p>
                <span className="text-[10px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] px-2.5 py-1 rounded-xl border border-[var(--verde-border)] opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  Ausencias →
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfesoresTab;
