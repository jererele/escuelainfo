import React, { useMemo } from "react";
import { Users, Trash2, Plus, GraduationCap, UserCheck } from "lucide-react";
import { Curso, Alumno, UserProfile } from "@/lib/dataService";
import { TiltCard, FluidOrb } from "@/components/ui/rare";
import UserAvatar from "@/components/ui/UserAvatar";

interface CursosTabProps {
  cursos: Curso[];
  alumnos: Alumno[];
  usuarios?: UserProfile[];
  userProfile?: UserProfile | null;
  onOpenCourseModal: () => void;
  onAssignAlumnos: (curso: Curso) => void;
  onDeleteCurso: (curso: Curso) => void;
  onNavigateToPreceptores?: () => void;
}

export const CursosTab: React.FC<CursosTabProps> = ({
  cursos,
  alumnos,
  usuarios,
  userProfile,
  onOpenCourseModal,
  onAssignAlumnos,
  onDeleteCurso,
  onNavigateToPreceptores,
}) => {
  // Preceptores de la institución
  const preceptores = useMemo(() => {
    return (usuarios || []).filter(u => u.rol === "preceptor");
  }, [usuarios]);
  return (
    <div className="animate-fade-in space-y-8">
      {/* HEADER CON FLUID ORB */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-[32px] border border-[var(--border)] bg-gradient-to-br from-[var(--bg2)] to-[var(--bg3)]/60 backdrop-blur-md shadow-sm flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
        <FluidOrb color="rgba(16, 185, 129, 0.18)" size={260} className="-top-16 -right-12" />
        <div className="text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] text-[10px] font-black uppercase tracking-wider mb-2">
            Aulas y Cursos Oficiales
          </div>
          <h2 className="text-3xl font-black title-font text-[var(--text)]">Gestión de Cursos</h2>
          <p className="text-[var(--text2)] text-sm mt-1">Organiza las divisiones, asigna alumnos y supervisa la matrícula por aula.</p>
        </div>
        <button 
          onClick={onOpenCourseModal}
          className="relative z-10 w-full md:w-auto bg-[var(--verde)] text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shrink-0 cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>Agregar Nuevo Curso</span>
        </button>
      </div>

      {/* GRID DE CURSOS CON TILT CARDS DE RARE UI */}
      {cursos.length === 0 ? (
        <div className="card glass rounded-[32px] border border-[var(--border)] p-16 sm:p-20 text-center text-[var(--text3)] italic">
          No hay cursos creados. Presiona "+ Agregar Nuevo Curso" para empezar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((c) => {
            const alumnosCurso = alumnos.filter((a) => a.curso === c.nombre);
            const totalAlumnos = alumnosCurso.length;
            const previewAlumnos = alumnosCurso.slice(0, 4);
            const assignedPreceptores = preceptores.filter(p => (p.cursos || []).includes(c.nombre));

            return (
              <TiltCard
                key={c.id}
                className="p-6 flex flex-col justify-between group"
                glowColor="rgba(16, 185, 129, 0.16)"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] font-black text-lg">
                      <GraduationCap size={24} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCurso(c);
                      }}
                      className="text-[var(--rojo)] p-2 hover:bg-[var(--rojo-bg)] rounded-xl transition-all active:scale-95 cursor-pointer"
                      title="Eliminar Curso"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-xl font-black text-[var(--text)] group-hover:text-[var(--verde)] transition-colors mb-1">
                    {c.nombre}
                  </h3>
                  <p className="text-xs text-[var(--text3)] font-semibold mb-4">
                    División Escolar Activa
                  </p>

                  {/* PREVIEW DE ALUMNOS CON BLOBATAR */}
                  <div className="flex items-center justify-between gap-3 mb-6 pt-3 border-t border-[var(--border)]/50">
                    {previewAlumnos.length > 0 ? (
                      <div className="flex items-center gap-1.5 py-1">
                        {previewAlumnos.map((al) => (
                          <div 
                            key={al.id || al.dni} 
                            className="inline-block rounded-full ring-1 ring-[var(--border)] hover:scale-110 transition-transform shadow-xs"
                            title={al.nombre}
                          >
                            <UserAvatar name={al.nombre} email={al.email} size={28} showRing={false} />
                          </div>
                        ))}
                        {totalAlumnos > 4 && (
                          <span 
                            className="w-7 h-7 rounded-full bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-center text-[10px] font-black text-[var(--text3)]"
                            title={`${totalAlumnos - 4} alumnos más`}
                          >
                            +{totalAlumnos - 4}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <span className="text-xs font-bold text-[var(--text2)] bg-[var(--bg3)] border border-[var(--border)] px-2.5 py-1 rounded-xl shrink-0">
                      {totalAlumnos} {totalAlumnos === 1 ? "alumno" : "alumnos"}
                    </span>
                  </div>
                  {/* PRECEPTORÍA ASIGNADA */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[var(--bg3)]/50 border border-[var(--border)] mb-4 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        assignedPreceptores.length > 0
                          ? "bg-[var(--verde-bg)] text-[var(--verde)]"
                          : "bg-[var(--amarillo-bg)] text-[var(--amarillo)]"
                      }`}>
                        <UserCheck size={14} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)] block leading-none mb-0.5">
                          Preceptoría:
                        </span>
                        {assignedPreceptores.length > 0 ? (
                          <span className="font-black text-xs text-[var(--text)] block truncate" title={assignedPreceptores.map(p => p.nombre).join(", ")}>
                            {assignedPreceptores.map(p => p.nombre.split(" ")[0]).join(", ")}
                          </span>
                        ) : (
                          <span className="font-bold text-[11px] text-[var(--amarillo)] block italic">
                            Sin preceptor asignado
                          </span>
                        )}
                      </div>
                    </div>

                    {(userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') && onNavigateToPreceptores && (
                      <button
                        type="button"
                        onClick={onNavigateToPreceptores}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] hover:bg-[var(--verde)] hover:text-black border border-[var(--verde-border)] transition-all cursor-pointer shrink-0"
                        title="Ir a gestionar asignación de cursos a preceptores"
                      >
                        {assignedPreceptores.length > 0 ? "Modificar" : "+ Asignar"}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onAssignAlumnos(c)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase bg-[var(--bg2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--verde)] hover:text-black hover:border-[var(--verde)] transition-all active:scale-95 cursor-pointer"
                >
                  <Users size={14} />
                  <span>Gestionar Alumnos</span>
                </button>
              </TiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CursosTab;
