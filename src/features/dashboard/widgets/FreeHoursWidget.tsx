import React, { useMemo } from "react";
import { Ausencia, Horario, Alumno } from "@/lib/dataService";
import { Clock, ArrowRight, User, PartyPopper, AlertTriangle, Check, ArrowUpRight } from "lucide-react";

interface FreeHoursWidgetProps {
  isStudent?: boolean;
  currentAlumno?: Alumno | null;
  ausencias: Ausencia[];
  horarios: Horario[];
  onNavigateToAusencias: (profNombre: string) => void;
  onNavigateToHorarios: (curso: string) => void;
}

export const FreeHoursWidget: React.FC<FreeHoursWidgetProps> = ({
  isStudent = false,
  currentAlumno,
  ausencias,
  horarios,
  onNavigateToAusencias,
  onNavigateToHorarios,
}) => {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const daysMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const todayDayName = daysMap[new Date().getDay()];

  const getHolidayToday = () => {
    const today = new Date();
    const mmDd = today.toLocaleDateString("en-CA").slice(5);

    const holidays: { [key: string]: { name: string; type: "nacional" | "provincial" | "local" } } = {
      // Nacionales (Argentina)
      "01-01": { name: "Año Nuevo", type: "nacional" },
      "02-16": { name: "Lunes de Carnaval", type: "nacional" },
      "02-17": { name: "Martes de Carnaval", type: "nacional" },
      "03-24": { name: "Día Nacional de la Memoria por la Verdad y la Justicia", type: "nacional" },
      "04-02": { name: "Día del Veterano y de los Caídos en la Guerra de Malvinas", type: "nacional" },
      "04-03": { name: "Viernes Santo", type: "nacional" },
      "05-01": { name: "Día del Trabajador", type: "nacional" },
      "05-25": { name: "Día de la Revolución de Mayo", type: "nacional" },
      "06-15": { name: "Feriado por el Paso de Güemes", type: "nacional" },
      "06-17": { name: "Paso a la Inmortalidad del Gral. Martín Miguel de Güemes", type: "nacional" },
      "06-20": { name: "Paso a la Inmortalidad del Gral. Manuel Belgrano (Día de la Bandera)", type: "nacional" },
      "07-09": { name: "Día de la Declaración de la Independencia", type: "nacional" },
      "08-17": { name: "Paso a la Inmortalidad del Gral. José de San Martín", type: "nacional" },
      "10-12": { name: "Día del Respeto a la Diversidad Cultural", type: "nacional" },
      "11-20": { name: "Día de la Soberanía Nacional", type: "nacional" },
      "11-23": { name: "Feriado por el Día de la Soberanía Nacional", type: "nacional" },
      "12-08": { name: "Día de la Inmaculada Concepción", type: "nacional" },
      "12-25": { name: "Navidad", type: "nacional" },

      // Provinciales (Chubut)
      "04-30": { name: "Día del Plebiscito de la Escuela de Río Corinto de 1902 (Feriado Provincial Chubut)", type: "provincial" },
      "07-28": { name: "Día del Desembarco de los Colonos Galeses (Feriado Provincial Chubut)", type: "provincial" },
      "11-03": { name: "Día de la Unificación Provincial / Juramento del Cacique Casimiro Biguá (Feriado Provincial Chubut)", type: "provincial" },

      // Locales (Esquel)
      "02-25": { name: "Aniversario del Origen de Esquel (Asueto Municipal)", type: "local" }
    };
    return holidays[mmDd] || null;
  };

  const holiday = getHolidayToday();
  if (holiday) {
    const typeLabels = {
      nacional: "Feriado Nacional Argentino",
      provincial: "Feriado Provincial (Chubut)",
      local: "Feriado Local (Esquel)"
    };
    return (
      <div className="p-6 rounded-3xl border bg-[var(--azul-bg)]/20 border-[var(--azul-border)] shadow-[0_10px_30px_rgba(59,130,246,0.08)] flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in will-change-gpu no-print">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-full bg-[var(--azul-bg)] text-[var(--azul)] flex items-center justify-center shrink-0">
            <PartyPopper size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-[var(--azul)] bg-[var(--azul-bg)] px-2.5 py-1 rounded-md border border-[var(--azul-border)] tracking-wider">
              {typeLabels[holiday.type]}
            </span>
            <h3 className="font-black text-xl text-[var(--text)] mt-1.5 leading-tight">{holiday.name}</h3>
            <p className="text-xs text-[var(--text2)] mt-0.5">
              Hoy no se dictan clases debido a la conmemoración oficial de esta fecha patria o local. ¡Disfrutá tu día libre de descanso!
            </p>
          </div>
        </div>
        <div className="text-xs font-black uppercase tracking-widest px-4 py-2 border border-[var(--azul-border)] bg-[var(--azul-bg)] text-[var(--azul)] rounded-xl shrink-0 select-none">
          Día Libre
        </div>
      </div>
    );
  }

  if (todayDayName === "Sábado" || todayDayName === "Domingo") {
    return null;
  }

  // Profesores ausentes hoy (aprobados) memoizado
  const activeAbsencesToday = useMemo(() => {
    return ausencias.filter(a => 
      a.estado === 'aprobada' && 
      todayStr >= a.inicio && 
      todayStr <= a.fin
    );
  }, [ausencias, todayStr]);

  // Clases afectadas hoy memoizado
  const freeHoursToday = useMemo(() => {
    const normToday = todayDayName.trim().toLowerCase();
    let list = horarios.filter(h => {
      const matchDay = (h.dia || "").trim().toLowerCase() === normToday;
      if (!matchDay) return false;
      const hProf = (h.profesor || "").trim().toLowerCase();
      const hCourseNorm = (h.curso || "").trim().toLowerCase();
      const hMatNorm = (h.materia || "").trim().toLowerCase();

      return activeAbsencesToday.some(a => {
        if ((a.profNombre || "").trim().toLowerCase() !== hProf) return false;

        // Si la ausencia está acotada a un curso específico en materias:
        if (a.materias && a.materias.length > 0) {
          const hasCourseTag = a.materias.some(m => m.includes("(") && m.includes(")"));
          if (hasCourseTag) {
            return a.materias.some(m => {
              const mNorm = m.toLowerCase();
              return (hCourseNorm && mNorm.includes(hCourseNorm)) || (hMatNorm && mNorm.includes(hMatNorm));
            });
          }
        }

        return true;
      });
    });

    if (isStudent && currentAlumno?.curso) {
      const studentCourse = currentAlumno.curso.trim().toLowerCase();
      list = list.filter(h => (h.curso || "").trim().toLowerCase() === studentCourse);
    }
    return list;
  }, [horarios, todayDayName, activeAbsencesToday, isStudent, currentAlumno]);

  const hasFreeHours = freeHoursToday.length > 0;

  return (
    <div className={`p-6 rounded-3xl border transition-colors duration-200 shadow-md ${
      hasFreeHours 
        ? "bg-[var(--bg2)] border-[var(--amarillo-border)] shadow-[0_10px_30px_rgba(245,158,11,0.08)]" 
        : "bg-[var(--bg2)] border-[var(--border)] hover:border-[var(--verde-border)]"
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            hasFreeHours ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)]" : "bg-[var(--verde-bg)] text-[var(--verde)]"
          }`}>
            {hasFreeHours ? <AlertTriangle size={20} strokeWidth={2.5} /> : <Check size={20} strokeWidth={2.5} />}
          </div>
          <div>
            <h3 className="font-black text-lg text-[var(--text)] leading-tight">
              {isStudent 
                ? `Tus Horas Libres de Hoy (${currentAlumno?.curso || "Tu Curso"})` 
                : `Horas Libres Activas Hoy (${todayDayName})`
              }
            </h3>
            <p className="text-xs text-[var(--text2)] mt-0.5">
              {hasFreeHours 
                ? "Se detectaron los siguientes bloques libres debido a licencias docentes confirmadas." 
                : "Todas las clases programadas para hoy se dictan con total normalidad."
              }
            </p>
          </div>
        </div>
      </div>

      {hasFreeHours && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {freeHoursToday.map((free, idx) => {
            const isHoraValida =
              Boolean(free.hora) &&
              free.hora.toLowerCase() !== "null" &&
              free.hora.toLowerCase() !== "undefined" &&
              free.hora !== "0" &&
              free.hora !== "Hora a confirmar";

            const displayHora = isHoraValida ? free.hora : "Hora a confirmar";

            return (
              <div 
                key={free.id || `${free.curso}-${free.materia}-${idx}`} 
                className="bg-[var(--bg3)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--verde)] p-4 rounded-2xl shadow-sm hover:shadow-md flex flex-col justify-between hover:-translate-y-0.5 transition-all cursor-pointer group"
                onClick={() => {
                  onNavigateToAusencias(free.profesor);
                }}
                title={`Ver ausencias de ${free.profesor}`}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToHorarios(free.curso);
                    }}
                    className="text-[9px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] hover:bg-[var(--verde)] hover:text-black transition-all px-2.5 py-1 rounded-lg border border-[var(--verde-border)] tracking-wider cursor-pointer shadow-xs flex items-center gap-1"
                    title="Ver horarios de este curso"
                  >
                    <span className="truncate">{free.curso}</span>
                    <ArrowUpRight size={12} strokeWidth={2.5} className="shrink-0" />
                  </button>
                  <span 
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-xs shrink-0 ${
                      isHoraValida 
                        ? "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]"
                        : "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]"
                    }`}
                  >
                    <Clock size={11} className="shrink-0" />
                    <span>{displayHora}</span>
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--text)] line-clamp-1 group-hover:text-[var(--verde)] transition-colors capitalize">
                    {free.materia}
                  </h4>
                  <div className="text-xs text-[var(--text2)] font-bold mt-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <User size={13} className="text-[var(--text3)] shrink-0" />
                      <span className="truncate">Prof: {free.profesor}</span>
                    </span>
                    <span className="text-[10px] font-black text-[var(--verde)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-0.5 ml-2">
                      Ver ausencias <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FreeHoursWidget;
