import React, { useState } from "react";
import { Trash2, RefreshCw, Check, Search } from "lucide-react";
import { Alumno, Curso, UserProfile, MigrationResult, migrateToCompactFormat, logAction, updateAlumno, deleteHorario, getHorarios, deleteAusencia } from "@/lib/dataService";

interface CicloLectivoTabProps {
  alumnos: Alumno[];
  cursos: Curso[];
  userProfile: UserProfile | null;
  user: any;
  setAlumnos: React.Dispatch<React.SetStateAction<Alumno[]>>;
  setHorarios: React.Dispatch<React.SetStateAction<any[]>>;
  ausencias: any[];
  setAusencias: React.Dispatch<React.SetStateAction<any[]>>;
  askConfirm: (msg: string, onConfirm: () => void) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  setLoading: (l: boolean) => void;
}

export const CicloLectivoTab: React.FC<CicloLectivoTabProps> = ({
  alumnos,
  cursos,
  userProfile,
  user,
  setAlumnos,
  setHorarios,
  ausencias,
  setAusencias,
  askConfirm,
  showToast,
  setLoading,
}) => {
  const [promoSearchQuery, setPromoSearchQuery] = useState("");
  const [promoFilterCourse, setPromoFilterCourse] = useState("");
  const [promotions, setPromotions] = useState<Record<string, string>>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  const getNextCourseHeuristic = (currentCourse: string, allCourses: string[]): string => {
    const parts = currentCourse.split(" - ");
    if (parts.length < 2) return currentCourse;
    
    const base = parts[0];
    const shift = parts[1];
    
    const years = [
      { current: "1ro", next: "2do" },
      { current: "2do", next: "3ro" },
      { current: "3ro", next: "4to" },
      { current: "4to", next: "5to" },
      { current: "5to", next: "6to" },
      { current: "6to", next: "7mo" },
      { current: "7mo", next: "Egresado" }
    ];
    
    for (const year of years) {
      if (base.startsWith(year.current)) {
        if (year.next === "Egresado") {
          return "Egresado";
        }
        const nextBase = base.replace(year.current, year.next);
        const nextCourseName = `${nextBase} - ${shift}`;
        if (allCourses.includes(nextCourseName)) {
          return nextCourseName;
        } else {
          if (year.current === "6to") {
            return "Egresado";
          }
        }
      }
    }
    return currentCourse;
  };

  const handleAutoPromote = () => {
    const nextPromotions: Record<string, string> = { ...promotions };
    const allCourseNames = cursos.map(c => c.nombre);
    alumnos.forEach(al => {
      if (al.curso !== "Egresado") {
        nextPromotions[al.id!] = getNextCourseHeuristic(al.curso, allCourseNames);
      }
    });
    setPromotions(nextPromotions);
    showToast("Heurística de promoción aplicada. Revisa y confirma los cambios.", "success");
  };

  const handleSavePromotions = async () => {
    setLoading(true);
    try {
      let count = 0;
      for (const al of alumnos) {
        const newCourse = promotions[al.id!];
        if (newCourse && newCourse !== al.curso) {
          await updateAlumno(al.id!, { curso: newCourse });
          count++;
        }
      }
      await logAction(
        user?.email || "desconocido", 
        "PROMOCION_ALUMNOS", 
        `Se promovieron ${count} alumnos para el nuevo ciclo lectivo`
      );
      const updated = await import("@/lib/dataService").then(m => m.getAlumnos());
      setAlumnos(updated);
      showToast(`¡Éxito! Se actualizaron ${count} alumnos.`, "success");
    } catch (err) {
      showToast("Error al guardar las promociones", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHorarios = () => {
    askConfirm("⚠️ ¿Estás seguro de VACIAR TODOS los horarios? Esta acción eliminará permanentemente la grilla de clases para todos los cursos y no se puede deshacer.", async () => {
      setLoading(true);
      try {
        const currentHorarios = await getHorarios();
        for (const h of currentHorarios) {
          await deleteHorario(h.id!);
        }
        await logAction(user?.email || "desconocido", "REINICIAR_HORARIOS", "Se eliminaron todos los horarios del ciclo lectivo");
        setHorarios([]);
        showToast("Horarios vaciados con éxito", "success");
      } catch (err) {
        showToast("Error al vaciar horarios", "error");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleClearAusencias = () => {
    askConfirm("⚠️ ¿Estás seguro de VACIAR TODAS las ausencias? Esta acción eliminará permanentemente todos los registros de licencias, inasistencias y paros del ciclo anterior.", async () => {
      setLoading(true);
      try {
        for (const a of ausencias) {
          await deleteAusencia(a.id!);
        }
        await logAction(user?.email || "desconocido", "REINICIAR_AUSENCIAS", "Se eliminaron todas las ausencias del ciclo lectivo");
        setAusencias([]);
        showToast("Historial de ausencias vaciado con éxito", "success");
      } catch (err) {
        showToast("Error al vaciar ausencias", "error");
      } finally {
        setLoading(false);
      }
    });
  };

  const filteredPromoAlumnos = alumnos.filter(al => {
    const matchesSearch = al.nombre.toLowerCase().includes(promoSearchQuery.toLowerCase()) || 
                          al.dni.includes(promoSearchQuery);
    const matchesCourse = promoFilterCourse === "" || al.curso === promoFilterCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-10 animate-fade-in">
      {/* MIGRACIÓN A FORMATO COMPACTO */}
      {userProfile?.rol === 'admin' && (
        <div className="card glass p-8 rounded-[32px] border border-[var(--amarillo-border)]/50 space-y-4">
          <div>
            <h2 className="title-font font-black text-xl text-[var(--amarillo)]">Optimización de Base de Datos</h2>
            <p className="text-xs text-[var(--text2)] mt-1">
              Migra los valores existentes en Appwrite al formato compacto (roles y estados abreviados). Ejecutar una sola vez.
            </p>
          </div>
          {migrationResult && (
            <div className={`p-4 rounded-2xl text-xs font-bold space-y-1 ${
              migrationResult.errors.length > 0
                ? 'bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)]'
                : 'bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)]'
            }`}>
              <div>✓ Usuarios migrados: {migrationResult.usuariosMigrated}</div>
              <div>✓ Ausencias migradas: {migrationResult.ausenciasMigrated}</div>
              {migrationResult.errors.length > 0 && (
                <div className="mt-2 text-[var(--rojo)] space-y-1">
                  {migrationResult.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
                </div>
              )}
              {migrationResult.errors.length === 0 && (
                <div className="mt-1 opacity-70">Sin errores. La base de datos está optimizada.</div>
              )}
            </div>
          )}
          <button
            disabled={isMigrating}
            onClick={async () => {
              setIsMigrating(true);
              setMigrationResult(null);
              try {
                const res = await migrateToCompactFormat();
                setMigrationResult(res);
                await logAction(user?.email || "desconocido", "MIGRAR_BASE_DATOS",
                  `Usuarios: ${res.usuariosMigrated}, Ausencias: ${res.ausenciasMigrated}, Errores: ${res.errors.length}`);
                showToast(`Migración completa: ${res.usuariosMigrated + res.ausenciasMigrated} documentos actualizados`, "success");
              } catch (err) {
                showToast("Error en la migración", "error");
              } finally {
                setIsMigrating(false);
              }
            }}
            className="w-full py-3 rounded-2xl bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] font-black text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isMigrating ? "Migrando... no cierres la página" : "▶ Ejecutar Migración"}
          </button>
        </div>
      )}

      {/* REINICIAR DATOS */}
      <div className="card glass p-8 rounded-[32px] border border-[var(--border)] space-y-6">
        <div>
          <h2 className="title-font font-black text-xl text-[var(--rojo)]">Acciones de Fin de Ciclo Lectivo</h2>
          <p className="text-xs text-[var(--text2)] mt-1">
            Preparación del sistema para el inicio de un nuevo año escolar. Estas acciones son irreversibles.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LIMPIAR HORARIOS */}
          <div className="p-6 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] flex flex-col justify-between gap-4 text-left">
            <div>
              <h4 className="font-extrabold text-sm text-[var(--text)]">Vaciar Horarios Anterior</h4>
              <p className="text-[11px] text-[var(--text2)] mt-1">
                Elimina la programación de materias de todos los cursos para comenzar el año escolar con una grilla limpia.
              </p>
            </div>
            <button
              onClick={handleClearHorarios}
              className="w-full py-3 rounded-xl bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] hover:bg-[var(--rojo)] hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} />
              Vaciar Todos los Horarios
            </button>
          </div>

          {/* LIMPIAR AUSENCIAS */}
          <div className="p-6 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] flex flex-col justify-between gap-4 text-left">
            <div>
              <h4 className="font-extrabold text-sm text-[var(--text)]">Vaciar Historial de Ausencias</h4>
              <p className="text-[11px] text-[var(--text2)] mt-1">
                Elimina el registro histórico de licencias, avisos y suspensiones docentes del ciclo lectivo anterior.
              </p>
            </div>
            <button
              onClick={handleClearAusencias}
              className="w-full py-3 rounded-xl bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] hover:bg-[var(--rojo)] hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} />
              Vaciar Registro de Ausencias
            </button>
          </div>
        </div>
      </div>

      {/* PROMOCIÓN DE ALUMNOS */}
      <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left">
            <h2 className="title-font font-black text-xl">Promoción y Repitencia de Alumnos</h2>
            <p className="text-xs text-[var(--text2)] mt-1">
              Actualiza el curso asignado de cada estudiante para el nuevo ciclo. Puedes usar la promoción automática y ajustar casos puntuales de repitencia.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button 
              onClick={handleAutoPromote}
              className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] text-[var(--text)] font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Promoción Automática
            </button>
            <button 
              onClick={handleSavePromotions}
              className="px-6 py-3 rounded-xl bg-[var(--verde)] text-black font-black text-xs shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={14} />
              Confirmar Promociones
            </button>
          </div>
        </div>

        {/* BARRA DE FILTRO Y BÚSQUEDA */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg2)]/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..." 
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 outline-none text-xs font-semibold focus:border-[var(--verde)] transition-all"
              value={promoSearchQuery}
              onChange={(e) => setPromoSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 outline-none text-xs font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer"
              value={promoFilterCourse}
              onChange={(e) => setPromoFilterCourse(e.target.value)}
            >
              <option value="">Todos los cursos anteriores...</option>
              <option value="Egresado">🎓 Graduados / Egresados</option>
              {cursos.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg3)]/50">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em]">Alumno</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em]">DNI</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em]">Curso Anterior</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em] w-72">Curso Nuevo (Ciclo Entrante)</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromoAlumnos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-[var(--text3)] italic">
                    No se encontraron alumnos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPromoAlumnos.map((al) => {
                  const newCourse = promotions[al.id!] || al.curso;
                  const isChanged = newCourse !== al.curso;
                  const isGraduated = newCourse === "Egresado";
                  
                  return (
                    <tr 
                      key={al.id} 
                      className={`hover:bg-[var(--bg3)]/20 transition-all border-b border-[var(--border)] last:border-none duration-200 ${
                        isChanged 
                          ? isGraduated 
                            ? "border-l-4 border-amber-500 bg-amber-500/[0.02]" 
                            : "border-l-4 border-emerald-500 bg-emerald-500/[0.02]"
                          : "border-l-4 border-transparent"
                      }`}
                    >
                      <td className="p-6">
                        <div className="font-bold">{al.nombre}</div>
                        <div className="text-[10px] text-[var(--text3)]">{al.email}</div>
                      </td>
                      <td className="p-6 text-xs text-[var(--text2)] font-semibold">{al.dni}</td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold text-[var(--text2)]">
                          {al.curso}
                        </span>
                      </td>
                      <td className="p-6">
                        <select
                          className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer"
                          value={newCourse}
                          onChange={(e) => setPromotions({
                            ...promotions,
                            [al.id!]: e.target.value
                          })}
                        >
                          <option value="Egresado">🎓 Graduado / Egresado</option>
                          {cursos.map(c => (
                            <option key={c.id} value={c.nombre}>{c.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-6">
                        {isGraduated ? (
                          <span className="text-[9px] font-black uppercase px-2.5 py-1.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20 tracking-wider">
                            🎓 Egreso
                          </span>
                        ) : isChanged ? (
                          <span className="text-[9px] font-black uppercase px-2.5 py-1.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 tracking-wider">
                            ↗️ Promoción
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2.5 py-1.5 rounded-full border bg-gray-500/10 text-gray-500 border-gray-500/20 tracking-wider">
                            🔁 Mantiene
                          </span>
                        )}
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
  );
};

export default CicloLectivoTab;
