import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getCursos, getAlumnos, getAsistenciasJornada, consolidateAbsences, Curso, Alumno, AsistenciaJornada } from "@/lib/dataService";
import { Activity, Users, CheckCircle, XCircle, Zap, RefreshCw } from "lucide-react";
import { SkeletonCourseCards } from "@/components/shared/SkeletonLoaders";
import { notify } from "@/lib/notify";

const EarlyWarningDropoutWidget = dynamic(
  () => import("@/features/attendance/EarlyWarningDropoutWidget"),
  { ssr: false }
);

export const MonitorAsistenciaTab = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaJornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [cursosData, alumnosData, asistenciasData] = await Promise.all([
        getCursos(),
        getAlumnos(),
        getAsistenciasJornada(today)
      ]);
      setCursos(cursosData);
      setAlumnos(alumnosData);
      setAsistencias(asistenciasData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching monitor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleSchoolChange = () => {
      fetchData();
    };
    window.addEventListener("escuelainfo:school-changed", handleSchoolChange);
    // Actualizar cada minuto
    const interval = setInterval(fetchData, 60000);
    return () => {
      window.removeEventListener("escuelainfo:school-changed", handleSchoolChange);
      clearInterval(interval);
    };
  }, []);

  const handleConsolidateToday = async () => {
    setIsConsolidating(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await notify.promise(
        consolidateAbsences({ targetDate: today }),
        {
          loading: "Asentando ausentes de hoy en la base de datos...",
          success: (res) => res.message || "¡Asistencias del día asentadas con éxito!",
          error: "Error al asentar asistencias de hoy."
        }
      );
      await fetchData();
    } catch (err: any) {
      console.error("Error al consolidar asistencias de hoy:", err);
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleConsolidateAll = async () => {
    setIsConsolidating(true);
    try {
      await notify.promise(
        consolidateAbsences(),
        {
          loading: "Consolidando historial completo de inasistencias en Appwrite...",
          success: (res) => res.message || "¡Historial de inasistencias consolidado con éxito!",
          error: "Error al consolidar inasistencias."
        }
      );
      await fetchData();
    } catch (err: any) {
      console.error("Error al consolidar historial:", err);
    } finally {
      setIsConsolidating(false);
    }
  };

  const statsPorCurso = cursos.map(curso => {
    const alumnosCurso = alumnos.filter(a => a.curso === curso.nombre);
    const total = alumnosCurso.length;
    let presentes = 0;
    let ausentes = 0;
    let otros = 0; // Media falta, Retiro, Tarde
    let sinRegistro = 0;

    alumnosCurso.forEach(alumno => {
      const asistencia = asistencias.find(a => a.alumnoId === alumno.id || a.alumnoId === alumno.dni);
      if (!asistencia) {
        // En la modalidad "Todos Ausentes por defecto hasta validar QR":
        // Quien no validó su presente aún se contabiliza en Ausente
        ausentes++;
        sinRegistro++;
      } else if (asistencia.estado === "P") {
        presentes++;
      } else if (asistencia.estado === "A") {
        ausentes++;
      } else {
        otros++;
      }
    });

    return {
      nombre: curso.nombre,
      total,
      presentes,
      ausentes,
      otros,
      sinRegistro
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="title-font font-black text-2xl flex items-center gap-2">
            <Activity className="text-[var(--verde)]" /> Monitor de Asistencia
          </h2>
          <p className="text-[var(--text2)] text-xs font-bold uppercase tracking-wider mt-1">
            Modalidad QR Activa: Todos los alumnos inician Ausentes hasta validar su presente
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleConsolidateToday}
            disabled={isConsolidating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black bg-[var(--verde)] text-black hover:bg-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="Guarda oficialmente como Ausentes en la base de datos a los alumnos que no han escaneado el QR hoy"
          >
            {isConsolidating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>Asentar Ausentes de Hoy</span>
          </button>

          <button
            type="button"
            onClick={handleConsolidateAll}
            disabled={isConsolidating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--verde)] transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="Consolida el historial de inasistencias de todos los días de clase transcurridos"
          >
            <RefreshCw size={14} className={isConsolidating ? "animate-spin" : ""} />
            <span>Consolidar Historial</span>
          </button>

          <div className="text-xs font-bold text-[var(--text3)] flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--bg3)] border border-[var(--border)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--verde)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--verde)]"></span>
            </span>
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {loading && cursos.length === 0 ? (
        <SkeletonCourseCards />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsPorCurso.map(stats => (
            <div key={stats.nombre} className="card glass p-5 sm:p-6 rounded-2xl border border-[var(--border)] shadow-xs transition-colors hover:border-[var(--border2)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-[var(--text)]">{stats.nombre}</h3>
                <div className="flex items-center gap-1 text-[var(--text2)] font-bold text-sm">
                  <Users size={16} /> {stats.total}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1 text-[var(--verde)] font-bold"><CheckCircle size={14} /> Presentes (Validados)</span>
                  <span className="font-black">{stats.presentes}</span>
                </div>
                <div className="w-full bg-[var(--bg3)] rounded-full h-1.5">
                  <div className="bg-[var(--verde)] h-1.5 rounded-full" style={{ width: `${stats.total > 0 ? (stats.presentes / stats.total) * 100 : 0}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="flex items-center gap-1 text-[var(--rojo)] font-bold"><XCircle size={14} /> Ausentes</span>
                  <span className="font-black">{stats.ausentes}</span>
                </div>

                {stats.otros > 0 && (
                  <div className="flex justify-between items-center text-sm text-[var(--amarillo)] font-bold">
                    <span>Llegadas tarde / Retiros</span>
                    <span>{stats.otros}</span>
                  </div>
                )}
                
                {stats.sinRegistro > 0 && (
                  <div className="flex justify-between items-center text-xs text-[var(--text3)] italic border-t border-[var(--border)] pt-2 mt-2">
                    <span>{stats.sinRegistro} alumno(s) aún sin escanear QR de hoy</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECCIÓN SATDE: SISTEMA DE ALERTA TEMPRANA DE DESERCIÓN ESCOLAR */}
      <div className="pt-2">
        <EarlyWarningDropoutWidget alumnos={alumnos} cursos={cursos} />
      </div>
    </div>
  );
};

export default MonitorAsistenciaTab;
