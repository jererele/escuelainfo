"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  UserX, 
  Printer, 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  FileText,
  Clock,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Alumno, Curso, AsistenciaJornada, getAllAsistenciasJornada } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";
import { printParentAbsenceCitation } from "@/lib/officialPrintService";

interface EarlyWarningDropoutWidgetProps {
  alumnos: Alumno[];
  cursos: Curso[];
  preceptorNombre?: string;
}

export type RiskLevel = "normal" | "preventivo" | "critico" | "libre";

export interface StudentAbsenceStats {
  alumno: Alumno;
  totalFaltas: number;
  totalA: number;
  totalM: number;
  totalT: number;
  totalJ: number;
  riskLevel: RiskLevel;
  riskLabel: string;
}

export const EarlyWarningDropoutWidget: React.FC<EarlyWarningDropoutWidgetProps> = ({
  alumnos,
  cursos,
  preceptorNombre = "Preceptoría",
}) => {
  const [allAsistencias, setAllAsistencias] = useState<AsistenciaJornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<"todos" | "riesgo" | "preventivo" | "critico" | "libre">("riesgo");

  useEffect(() => {
    let isMounted = true;
    getAllAsistenciasJornada()
      .then((records) => {
        if (isMounted) {
          setAllAsistencias(records);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Calcular inasistencias y nivel de riesgo por alumno
  const statsPorAlumno = useMemo<StudentAbsenceStats[]>(() => {
    // Indexar asistencias por alumnoId / dni
    const recordsByStudent = new Map<string, AsistenciaJornada[]>();

    allAsistencias.forEach((asist) => {
      const idKey = asist.alumnoId;
      if (!recordsByStudent.has(idKey)) {
        recordsByStudent.set(idKey, []);
      }
      recordsByStudent.get(idKey)!.push(asist);
    });

    return alumnos
      .filter((a) => a.curso && a.curso !== "pendiente")
      .map((alumno) => {
        const studentRecords = [
          ...(recordsByStudent.get(alumno.id || "") || []),
          ...(alumno.dni ? recordsByStudent.get(alumno.dni) || [] : []),
        ];

        let totalA = 0;
        let totalM = 0;
        let totalT = 0;
        let totalJ = 0;

        studentRecords.forEach((r) => {
          if (r.estado === "A") totalA++;
          else if (r.estado === "M") totalM++;
          else if (r.estado === "T") totalT++;
          else if (r.estado === "J") totalJ++;
        });

        // Fórmula reglamentaria Chubut:
        // A = 1 falta, M = 0.5 falta, T = 0.25 falta (4 llegadas tarde = 1 falta)
        const totalFaltas = totalA + (totalM * 0.5) + (totalT * 0.25);

        let riskLevel: RiskLevel = "normal";
        let riskLabel = "Regularidad Normal";

        if (totalFaltas >= 20) {
          riskLevel = "libre";
          riskLabel = "Pérdida de Regularidad (Condición Libre)";
        } else if (totalFaltas >= 15) {
          riskLevel = "critico";
          riskLabel = "Riesgo Crítico (15 faltas alcanzadas)";
        } else if (totalFaltas >= 10) {
          riskLevel = "preventivo";
          riskLabel = "Alerta Preventiva (10 faltas)";
        }

        return {
          alumno,
          totalFaltas,
          totalA,
          totalM,
          totalT,
          totalJ,
          riskLevel,
          riskLabel,
        };
      })
      .sort((a, b) => b.totalFaltas - a.totalFaltas);
  }, [alumnos, allAsistencias]);

  // Contadores globales
  const countNormal = statsPorAlumno.filter(s => s.riskLevel === "normal").length;
  const countPreventivo = statsPorAlumno.filter(s => s.riskLevel === "preventivo").length;
  const countCritico = statsPorAlumno.filter(s => s.riskLevel === "critico").length;
  const countLibre = statsPorAlumno.filter(s => s.riskLevel === "libre").length;
  const countEnRiesgoTotal = countPreventivo + countCritico + countLibre;

  // Filtrado
  const filteredStats = useMemo(() => {
    return statsPorAlumno.filter((s) => {
      // Filtro de curso
      if (selectedCurso !== "todos" && s.alumno.curso !== selectedCurso) {
        return false;
      }
      // Filtro de nivel de riesgo
      if (selectedRiskFilter === "riesgo" && s.riskLevel === "normal") {
        return false;
      }
      if (selectedRiskFilter !== "todos" && selectedRiskFilter !== "riesgo" && s.riskLevel !== selectedRiskFilter) {
        return false;
      }
      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (s.alumno.nombre || "").toLowerCase().includes(q);
        const dniMatch = (s.alumno.dni || "").includes(q);
        const cursoMatch = (s.alumno.curso || "").toLowerCase().includes(q);
        return nameMatch || dniMatch || cursoMatch;
      }
      return true;
    });
  }, [statsPorAlumno, selectedCurso, selectedRiskFilter, searchQuery]);

  const handleEmitCitation = (item: StudentAbsenceStats) => {
    let formalNivel: "Preventivo (10 faltas)" | "Crítico (15 faltas)" | "Pérdida de Regularidad (20 faltas)" = "Preventivo (10 faltas)";
    if (item.riskLevel === "libre") formalNivel = "Pérdida de Regularidad (20 faltas)";
    else if (item.riskLevel === "critico") formalNivel = "Crítico (15 faltas)";

    printParentAbsenceCitation({
      alumnoNombre: item.alumno.nombre,
      alumnoDni: item.alumno.dni,
      curso: item.alumno.curso,
      totalFaltas: item.totalFaltas,
      nivelRiesgo: formalNivel,
      preceptorNombre,
    });
  };

  return (
    <div className="card glass rounded-[32px] border border-[var(--border)] p-6 sm:p-8 space-y-6 shadow-sm">
      {/* CABECERA SATDE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
              <ShieldAlert size={12} strokeWidth={2.5} />
              <span>SATDE · Chubut</span>
            </span>
            <span className="text-xs font-semibold text-[var(--text3)]">
              Resolución Ministerial N° 340/ME
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black title-font text-[var(--text)] mt-2">
            Sistema de Alerta Temprana de Deserción Escolar
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text2)] font-semibold mt-0.5">
            Detección predictiva de ausentismo acumulado y emisión de cédulas preventivas a familias.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-[var(--bg3)] border border-[var(--border)] px-4 py-2 rounded-2xl">
          <TrendingUp size={16} className="text-[var(--verde)]" />
          <span>{countEnRiesgoTotal} estudiantes en seguimiento prioritario</span>
        </div>
      </div>

      {/* METRIC GAUGES (4 TARJETAS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setSelectedRiskFilter("todos")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedRiskFilter === "todos"
              ? "bg-[var(--bg3)] border-[var(--verde)] shadow-sm"
              : "border-[var(--border)] hover:bg-[var(--bg2)]"
          }`}
        >
          <div className="text-2xl font-black text-[var(--verde)]">{countNormal}</div>
          <div className="text-xs font-bold text-[var(--text)] mt-1">Regularidad Normal</div>
          <p className="text-[10px] text-[var(--text3)] mt-0.5">Menos de 10 faltas acumuladas</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRiskFilter("preventivo")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedRiskFilter === "preventivo"
              ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
              : "border-[var(--border)] hover:bg-[var(--bg2)]"
          }`}
        >
          <div className="text-2xl font-black text-amber-500">{countPreventivo}</div>
          <div className="text-xs font-bold text-[var(--text)] mt-1">Alerta Preventiva</div>
          <p className="text-[10px] text-[var(--text3)] mt-0.5">10 a 14.5 faltas (1° Notificación)</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRiskFilter("critico")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedRiskFilter === "critico"
              ? "bg-orange-500/10 border-orange-500/40 shadow-sm"
              : "border-[var(--border)] hover:bg-[var(--bg2)]"
          }`}
        >
          <div className="text-2xl font-black text-orange-500">{countCritico}</div>
          <div className="text-xs font-bold text-[var(--text)] mt-1">Riesgo Crítico</div>
          <p className="text-[10px] text-[var(--text3)] mt-0.5">15 a 19.5 faltas (Límite ordinario)</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRiskFilter("libre")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedRiskFilter === "libre"
              ? "bg-rose-500/10 border-rose-500/40 shadow-sm"
              : "border-[var(--border)] hover:bg-[var(--bg2)]"
          }`}
        >
          <div className="text-2xl font-black text-rose-500">{countLibre}</div>
          <div className="text-xs font-bold text-[var(--text)] mt-1">Pérdida de Regularidad</div>
          <p className="text-[10px] text-[var(--text3)] mt-0.5">20+ faltas (Condición libre)</p>
        </button>
      </div>

      {/* BARRA DE FILTROS Y CONTROLES */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o curso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-[var(--verde)] text-[var(--text)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCurso}
            onChange={(e) => setSelectedCurso(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:border-[var(--verde)] text-[var(--text)]"
          >
            <option value="todos">Todos los Cursos</option>
            {cursos.map((c) => (
              <option key={c.id || c.nombre} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSelectedRiskFilter(selectedRiskFilter === "riesgo" ? "todos" : "riesgo")}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
              selectedRiskFilter === "riesgo"
                ? "bg-[var(--verde-bg)] border-[var(--verde-border)] text-[var(--verde)]"
                : "border-[var(--border)] text-[var(--text2)] hover:bg-[var(--bg3)]"
            }`}
            title="Mostrar solo estudiantes con 10 o más faltas"
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Solo en Riesgo (≥10)</span>
          </button>
        </div>
      </div>

      {/* LISTADO DE ESTUDIANTES / SEMÁFORO */}
      <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg)]/50">
        {filteredStats.length === 0 ? (
          <div className="p-12 text-center text-[var(--text3)] italic text-xs">
            No se encontraron alumnos con el criterio seleccionado.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredStats.map((item) => {
              const al = item.alumno;
              const isUrgent = item.riskLevel === "critico" || item.riskLevel === "libre";
              const percentOfMax = Math.min(Math.round((item.totalFaltas / 20) * 100), 100);

              let badgeColor = "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]";
              let barColor = "bg-[var(--verde)]";
              if (item.riskLevel === "preventivo") {
                badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/30";
                barColor = "bg-amber-500";
              } else if (item.riskLevel === "critico") {
                badgeColor = "bg-orange-500/10 text-orange-500 border-orange-500/30";
                barColor = "bg-orange-500";
              } else if (item.riskLevel === "libre") {
                badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/30";
                barColor = "bg-rose-500";
              }

              return (
                <div
                  key={al.id || al.dni}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[var(--bg2)]/50 transition-colors"
                >
                  {/* ALUMNO INFO */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <UserAvatar name={al.nombre} email={al.email} size={42} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-[var(--text)]">{al.nombre}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg3)] border border-[var(--border)] text-[var(--text3)]">
                          DNI {al.dni}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--bg3)] text-[var(--text2)]">
                          {al.curso}
                        </span>
                      </div>
                      
                      {/* DESGLOSE DE FALTAS */}
                      <div className="text-[11px] text-[var(--text3)] flex items-center gap-3 mt-1 flex-wrap">
                        <span>Ausentes (A): <strong className="text-[var(--text)]">{item.totalA}</strong></span>
                        <span>Medias Faltas (M): <strong className="text-[var(--text)]">{item.totalM}</strong></span>
                        <span>Tardes (T): <strong className="text-[var(--text)]">{item.totalT}</strong></span>
                        <span>Justificadas (J): <strong className="text-[var(--text)]">{item.totalJ}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* SEMÁFORO Y ACCIÓN */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-end">
                    {/* BARRA DE PROXIMIDAD AL LÍMITE */}
                    <div className="w-full sm:w-44 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className={badgeColor.split(" ")[1]}>
                          {item.totalFaltas.toFixed(2)} faltas
                        </span>
                        <span className="text-[var(--text3)]">Límite: 20</span>
                      </div>
                      <div className="w-full bg-[var(--bg3)] h-2 rounded-full overflow-hidden border border-[var(--border)]/50">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${percentOfMax}%` }}
                        />
                      </div>
                      <div className="text-[9px] font-semibold text-[var(--text3)] truncate">
                        {item.riskLabel}
                      </div>
                    </div>

                    {/* BOTÓN EMITIR CÉDULA */}
                    {item.riskLevel !== "normal" && (
                      <button
                        type="button"
                        onClick={() => handleEmitCitation(item)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm ${
                          isUrgent
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : "bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--verde)] hover:text-[var(--verde)]"
                        }`}
                        title="Generar e imprimir cédula legal de citación y notificación para padres"
                      >
                        <FileText size={14} />
                        <span>{isUrgent ? "Cédula Urgente" : "Citación Padres"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EarlyWarningDropoutWidget;
