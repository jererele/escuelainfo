"use client";

import { useEffect, useState } from "react";
import { UserProfile, Alumno, Curso, AsistenciaJornada, AsistenciaMateria, getCursos, getAlumnos, getAsistenciasJornada, saveAsistenciasJornada, getAsistenciasMateria, saveAsistenciasMateria, getAlumnoHistorialAsistencia, getProfesores, logAction } from "@/lib/dataService";
import { UserCheck, Check, X, AlertCircle, Calendar, BookOpen, Clock, Award, ShieldAlert, Search } from "lucide-react";

interface Props {
  user: any;
  userProfile: UserProfile | null;
}

export default function StudentAttendanceManager({ user, userProfile }: Props) {
  const [role, setRole] = useState<string>("alumno");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [profesorMaterias, setProfesorMaterias] = useState<string[]>([]);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Planillas de asistencias en edición
  const [asistenciasJornada, setAsistenciasJornada] = useState<Record<string, "P" | "A" | "M" | "T">>({});
  const [asistenciasMateria, setAsistenciasMateria] = useState<Record<string, "P" | "A" | "T">>({});
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({}); // id de registro existente para actualizar

  // Historial del alumno (Vista Alumno)
  const [historialJornada, setHistorialJornada] = useState<AsistenciaJornada[]>([]);
  const [historialMateria, setHistorialMateria] = useState<AsistenciaMateria[]>([]);
  const [alumnoRecord, setAlumnoRecord] = useState<Alumno | null>(null);

  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.rol);
    }
  }, [userProfile]);

  // Cargar datos básicos según el rol
  useEffect(() => {
    getCursos().then(setCursos);
    getAlumnos().then(setAlumnos);

    if (role === "profesor" && userProfile?.email) {
      getProfesores().then(profs => {
        const prof = profs.find(p => p.email.toLowerCase() === userProfile.email.toLowerCase());
        if (prof) {
          setProfesorMaterias(prof.materias || []);
          if (prof.materias && prof.materias.length > 0) {
            setSelectedMateria(prof.materias[0]);
          }
        }
      });
    }

    if (role === "alumno" && userProfile?.email) {
      getAlumnos().then(als => {
        const al = als.find(a => a.email.toLowerCase() === userProfile.email.toLowerCase());
        if (al) {
          setAlumnoRecord(al);
          cargarHistorialAlumno(al.id || al.dni);
        }
      });
    }
  }, [role, userProfile]);

  const cargarHistorialAlumno = async (id: string) => {
    setLoading(true);
    try {
      const hist = await getAlumnoHistorialAsistencia(id);
      setHistorialJornada(hist.jornada);
      setHistorialMateria(hist.materia);
    } catch (err) {
      setErrorMsg("No se pudo cargar tu historial de asistencia.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar planilla de asistencia diaria (Preceptor/Admin)
  const cargarPlanillaJornada = async () => {
    if (!selectedCurso) {
      setErrorMsg("Seleccioná un curso para cargar la planilla.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Filtrar alumnos del curso
      const alumnosDelCurso = alumnos.filter(a => a.curso === selectedCurso);
      // Obtener asistencias guardadas para esa fecha
      const guardadas = await getAsistenciasJornada(fecha);
      
      const mapaAsistencias: Record<string, "P" | "A" | "M" | "T"> = {};
      const mapaIds: Record<string, string> = {};

      alumnosDelCurso.forEach(a => {
        const r = guardadas.find(g => g.alumnoId === a.id || g.alumnoId === a.dni);
        if (r) {
          mapaAsistencias[a.id || a.dni] = r.estado;
          mapaIds[a.id || a.dni] = r.id || "";
        } else {
          mapaAsistencias[a.id || a.dni] = "P"; // por defecto Presente
        }
      });

      setAsistenciasJornada(mapaAsistencias);
      setExistingRecords(mapaIds);
    } catch {
      setErrorMsg("Error al obtener la planilla de asistencia.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar planilla de asistencia por materia (Profesor)
  const cargarPlanillaMateria = async () => {
    if (!selectedCurso || !selectedMateria) {
      setErrorMsg("Seleccioná el curso y la materia para cargar la planilla.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const alumnosDelCurso = alumnos.filter(a => a.curso === selectedCurso);
      const guardadas = await getAsistenciasMateria(fecha, selectedMateria, selectedCurso);
      
      const mapaAsistencias: Record<string, "P" | "A" | "T"> = {};
      const mapaIds: Record<string, string> = {};

      alumnosDelCurso.forEach(a => {
        const r = guardadas.find(g => g.alumnoId === a.id || g.alumnoId === a.dni);
        if (r) {
          mapaAsistencias[a.id || a.dni] = r.estado;
          mapaIds[a.id || a.dni] = r.id || "";
        } else {
          mapaAsistencias[a.id || a.dni] = "P"; // por defecto Presente
        }
      });

      setAsistenciasMateria(mapaAsistencias);
      setExistingRecords(mapaIds);
    } catch {
      setErrorMsg("Error al cargar la asistencia por materia.");
    } finally {
      setLoading(false);
    }
  };

  // Guardar asistencia diaria (Preceptor/Admin)
  const handleSaveJornada = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const listToSave: AsistenciaJornada[] = Object.entries(asistenciasJornada).map(([alumnoId, estado]) => {
        const al = alumnos.find(a => a.id === alumnoId || a.dni === alumnoId);
        return {
          id: existingRecords[alumnoId] || undefined,
          alumnoId,
          alumnoNombre: al ? al.nombre : "Alumno",
          fecha,
          estado,
          preceptorId: userProfile?.uid || "admin"
        };
      });

      await saveAsistenciasJornada(listToSave);
      setSuccessMsg("Planilla de asistencia general guardada correctamente.");
      await logAction(userProfile?.email || "admin", "REGISTRAR_ASISTENCIA_JORNADA", `Curso: ${selectedCurso}, Fecha: ${fecha}`);
      
      // Recargar para actualizar los IDs guardados
      await cargarPlanillaJornada();
    } catch {
      setErrorMsg("Ocurrió un error al guardar la asistencia.");
    } finally {
      setLoading(false);
    }
  };

  // Guardar asistencia por materia (Profesor)
  const handleSaveMateria = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const listToSave: AsistenciaMateria[] = Object.entries(asistenciasMateria).map(([alumnoId, estado]) => {
        const al = alumnos.find(a => a.id === alumnoId || a.dni === alumnoId);
        return {
          id: existingRecords[alumnoId] || undefined,
          alumnoId,
          alumnoNombre: al ? al.nombre : "Alumno",
          fecha,
          materia: selectedMateria,
          curso: selectedCurso,
          estado,
          profesorId: userProfile?.uid || "profesor"
        };
      });

      await saveAsistenciasMateria(listToSave);
      setSuccessMsg("Planilla de asistencia de materia guardada correctamente.");
      await logAction(userProfile?.email || "profesor", "REGISTRAR_ASISTENCIA_MATERIA", `Materia: ${selectedMateria}, Curso: ${selectedCurso}, Fecha: ${fecha}`);
      
      await cargarPlanillaMateria();
    } catch {
      setErrorMsg("Ocurrió un error al guardar la asistencia de la materia.");
    } finally {
      setLoading(false);
    }
  };

  // Cálculos acumulados del alumno
  const totalFaltasJornada = historialJornada.reduce((acc, curr) => {
    if (curr.estado === "A") return acc + 1.0;
    if (curr.estado === "M") return acc + 0.5;
    if (curr.estado === "T") return acc + 0.25; // Llegada tarde cuenta como 0.25 falta
    return acc;
  }, 0);

  const totalTardesJornada = historialJornada.filter(h => h.estado === "T").length;
  const totalAusentesJornada = historialJornada.filter(h => h.estado === "A").length;
  const totalMediaFaltaJornada = historialJornada.filter(h => h.estado === "M").length;

  return (
    <div className="space-y-6">
      {/* Mensajes de feedback */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in">
          <Check size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VISTA 1: PRECEPTOR / ADMIN (Control General de Jornada) */}
      {(role === "admin" || role === "directivo" || role === "preceptor") && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div>
              <h3 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
                <UserCheck className="text-[var(--verde)]" /> Planilla de Asistencia General (Jornada)
              </h3>
              <p className="text-[var(--text2)] text-xs font-bold uppercase tracking-wider mt-1">Control diario de alumnos por día y turno</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Selector de Fecha */}
              <div className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-1.5">
                <Calendar size={16} className="text-[var(--text3)]" />
                <input
                  type="date"
                  className="bg-transparent text-sm font-bold outline-none text-[var(--text)]"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              {/* Selector de Curso */}
              <select
                className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold outline-none text-[var(--text)] focus:border-[var(--verde)]"
                value={selectedCurso}
                onChange={(e) => {
                  setSelectedCurso(e.target.value);
                  setAsistenciasJornada({});
                }}
              >
                <option value="">— Seleccionar Curso —</option>
                {cursos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>

              <button
                onClick={cargarPlanillaJornada}
                disabled={loading || !selectedCurso}
                className="bg-[var(--verde)] text-black font-black text-xs px-4 py-2.5 rounded-xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                Cargar Planilla
              </button>
            </div>
          </div>

          {Object.keys(asistenciasJornada).length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                <table className="w-full text-left border-collapse bg-white/50 dark:bg-slate-950/20">
                  <thead>
                    <tr className="bg-[var(--bg3)] border-b border-[var(--border)] text-[10px] font-black uppercase text-[var(--text3)] tracking-wider">
                      <th className="p-4">DNI</th>
                      <th className="p-4">Nombre del Alumno</th>
                      <th className="p-4 text-center">Estado de Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.filter(a => a.curso === selectedCurso).map((alumno) => {
                      const alId = alumno.id || alumno.dni;
                      const currentEstado = asistenciasJornada[alId] || "P";
                      
                      return (
                        <tr key={alId} className="border-b border-[var(--border)] last:border-none hover:bg-slate-500/5 transition-colors">
                          <td className="p-4 font-mono text-xs font-semibold text-[var(--text2)]">{alumno.dni}</td>
                          <td className="p-4 font-bold text-sm text-[var(--text)]">{alumno.nombre}</td>
                          <td className="p-4">
                            <div className="flex justify-center items-center gap-2">
                              {/* Botones de Estado */}
                              {[
                                { val: "P", label: "Presente", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", activeBg: "bg-emerald-500 text-white" },
                                { val: "A", label: "Ausente", bg: "bg-rose-500/10 text-rose-500 border-rose-500/20", activeBg: "bg-rose-500 text-white" },
                                { val: "M", label: "Media Falta", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20", activeBg: "bg-amber-500 text-white" },
                                { val: "T", label: "Tarde", bg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", activeBg: "bg-indigo-500 text-white" }
                              ].map(btn => (
                                <button
                                  key={btn.val}
                                  type="button"
                                  onClick={() => setAsistenciasJornada(prev => ({ ...prev, [alId]: btn.val as any }))}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                                    currentEstado === btn.val ? btn.activeBg + " shadow-sm scale-105" : btn.bg + " hover:bg-slate-500/10"
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveJornada}
                  disabled={loading}
                  className="bg-[var(--verde)] text-black font-black px-6 py-3 rounded-2xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  {loading ? "Guardando..." : "Guardar Asistencias"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[var(--border)] rounded-2xl">
              <UserCheck size={32} className="mx-auto text-[var(--text3)] mb-2 animate-pulse" />
              <p className="text-sm font-bold text-[var(--text2)]">Seleccioná un curso y presioná "Cargar Planilla" para registrar asistencia diaria.</p>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: PROFESOR (Control por Materia) */}
      {(role === "admin" || role === "directivo" || role === "profesor") && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div>
              <h3 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
                <BookOpen className="text-[var(--verde)]" /> Planilla por Materias (Profesor)
              </h3>
              <p className="text-[var(--text2)] text-xs font-bold uppercase tracking-wider mt-1">Planilla digital del profesor por hora de clase</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Selector de Fecha */}
              <div className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-1.5">
                <Calendar size={16} className="text-[var(--text3)]" />
                <input
                  type="date"
                  className="bg-transparent text-sm font-bold outline-none text-[var(--text)]"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              {/* Selector de Curso */}
              <select
                className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold outline-none text-[var(--text)] focus:border-[var(--verde)]"
                value={selectedCurso}
                onChange={(e) => {
                  setSelectedCurso(e.target.value);
                  setAsistenciasMateria({});
                }}
              >
                <option value="">— Seleccionar Curso —</option>
                {cursos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>

              {/* Selector de Materia */}
              <select
                className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold outline-none text-[var(--text)] focus:border-[var(--verde)]"
                value={selectedMateria}
                onChange={(e) => {
                  setSelectedMateria(e.target.value);
                  setAsistenciasMateria({});
                }}
              >
                <option value="">— Seleccionar Materia —</option>
                {role === "profesor" ? (
                  profesorMaterias.map(m => <option key={m} value={m}>{m}</option>)
                ) : (
                  // Admins y directivos ven listado genérico de materias
                  Array.from(new Set(alumnos.map(a => a.curso))).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))
                )}
              </select>

              <button
                onClick={cargarPlanillaMateria}
                disabled={loading || !selectedCurso || !selectedMateria}
                className="bg-[var(--verde)] text-black font-black text-xs px-4 py-2.5 rounded-xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                Cargar Planilla
              </button>
            </div>
          </div>

          {Object.keys(asistenciasMateria).length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                <table className="w-full text-left border-collapse bg-white/50 dark:bg-slate-950/20">
                  <thead>
                    <tr className="bg-[var(--bg3)] border-b border-[var(--border)] text-[10px] font-black uppercase text-[var(--text3)] tracking-wider">
                      <th className="p-4">DNI</th>
                      <th className="p-4">Nombre del Alumno</th>
                      <th className="p-4 text-center">Estado en Materia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.filter(a => a.curso === selectedCurso).map((alumno) => {
                      const alId = alumno.id || alumno.dni;
                      const currentEstado = asistenciasMateria[alId] || "P";
                      
                      return (
                        <tr key={alId} className="border-b border-[var(--border)] last:border-none hover:bg-slate-500/5 transition-colors">
                          <td className="p-4 font-mono text-xs font-semibold text-[var(--text2)]">{alumno.dni}</td>
                          <td className="p-4 font-bold text-sm text-[var(--text)]">{alumno.nombre}</td>
                          <td className="p-4">
                            <div className="flex justify-center items-center gap-2">
                              {[
                                { val: "P", label: "Presente", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", activeBg: "bg-emerald-500 text-white" },
                                { val: "A", label: "Ausente", bg: "bg-rose-500/10 text-rose-500 border-rose-500/20", activeBg: "bg-rose-500 text-white" },
                                { val: "T", label: "Tarde", bg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", activeBg: "bg-indigo-500 text-white" }
                              ].map(btn => (
                                <button
                                  key={btn.val}
                                  type="button"
                                  onClick={() => setAsistenciasMateria(prev => ({ ...prev, [alId]: btn.val as any }))}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                                    currentEstado === btn.val ? btn.activeBg + " shadow-sm scale-105" : btn.bg + " hover:bg-slate-500/10"
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveMateria}
                  disabled={loading}
                  className="bg-[var(--verde)] text-black font-black px-6 py-3 rounded-2xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  {loading ? "Guardando..." : "Guardar Planilla de Materia"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[var(--border)] rounded-2xl">
              <BookOpen size={32} className="mx-auto text-[var(--text3)] mb-2 animate-pulse" />
              <p className="text-sm font-bold text-[var(--text2)]">Seleccioná curso, materia y presioná "Cargar Planilla" para pasar asistencia de clase.</p>
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: ALUMNO (Historial y Estadísticas de sólo lectura) */}
      {role === "alumno" && (
        <div className="space-y-6">
          {/* Tarjeta de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[24px] p-5 shadow-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)]">Inasistencias Totales</p>
              <p className="text-4xl font-black text-[var(--text)] mt-2">{totalFaltasJornada.toFixed(2)}</p>
              <p className="text-[10px] text-[var(--text3)] font-bold mt-1">Cómputo acumulado de inasistencias</p>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[24px] p-5 shadow-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)]">Ausentes Completos</p>
              <p className="text-4xl font-black text-[var(--rojo)] mt-2">{totalAusentesJornada}</p>
              <p className="text-[10px] text-[var(--text3)] font-bold mt-1">1.0 falta por cada falta diaria</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[24px] p-5 shadow-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)]">Medias Faltas</p>
              <p className="text-4xl font-black text-[var(--amarillo)] mt-2">{totalMediaFaltaJornada}</p>
              <p className="text-[10px] text-[var(--text3)] font-bold mt-1">0.5 faltas por inasistencia parcial</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[24px] p-5 shadow-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text3)]">Llegadas Tarde</p>
              <p className="text-4xl font-black text-[var(--azul)] mt-2">{totalTardesJornada}</p>
              <p className="text-[10px] text-[var(--text3)] font-bold mt-1">0.25 faltas por llegada tarde</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalle Asistencia General */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-lg font-black text-[var(--text)] flex items-center gap-2">
                  <Clock size={18} className="text-[var(--verde)]" /> Historial de Asistencia General
                </h4>
                <p className="text-[var(--text2)] text-xs font-semibold">Registro de firmas tomadas por preceptoría</p>
              </div>

              {historialJornada.length > 0 ? (
                <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto pr-1">
                  {historialJornada.map(h => (
                    <div key={h.id} className="py-3 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[var(--text3)]" />
                        <span className="font-bold">{h.fecha}</span>
                      </div>
                      <div>
                        {h.estado === "P" && <span className="bg-emerald-500/15 text-emerald-600 font-bold px-2 py-0.5 rounded text-xs">Presente</span>}
                        {h.estado === "A" && <span className="bg-rose-500/15 text-rose-600 font-bold px-2 py-0.5 rounded text-xs">Ausente (1.0)</span>}
                        {h.estado === "M" && <span className="bg-amber-500/15 text-amber-600 font-bold px-2 py-0.5 rounded text-xs">Media Falta (0.5)</span>}
                        {h.estado === "T" && <span className="bg-indigo-500/15 text-indigo-600 font-bold px-2 py-0.5 rounded text-xs">Tarde (0.25)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[var(--text3)] font-semibold text-xs border border-dashed border-[var(--border)] rounded-2xl">
                  No tenés inasistencias ni novedades registradas en el ciclo lectivo.
                </div>
              )}
            </div>

            {/* Detalle Asistencia por Materias */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-lg font-black text-[var(--text)] flex items-center gap-2">
                  <BookOpen size={18} className="text-[var(--verde)]" /> Registro de Asistencias por Materias
                </h4>
                <p className="text-[var(--text2)] text-xs font-semibold">Firma de regularidad cargada por tus profesores</p>
              </div>

              {historialMateria.length > 0 ? (
                <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto pr-1">
                  {historialMateria.map(h => (
                    <div key={h.id} className="py-3 flex justify-between items-center text-sm">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[var(--text)]">{h.materia}</div>
                        <div className="text-[10px] text-[var(--text3)] flex items-center gap-1">
                          <Calendar size={10} /> {h.fecha}
                        </div>
                      </div>
                      <div>
                        {h.estado === "P" && <span className="bg-emerald-500/15 text-emerald-600 font-bold px-2 py-0.5 rounded text-xs">Presente</span>}
                        {h.estado === "A" && <span className="bg-rose-500/15 text-rose-600 font-bold px-2 py-0.5 rounded text-xs">Ausente</span>}
                        {h.estado === "T" && <span className="bg-indigo-500/15 text-indigo-600 font-bold px-2 py-0.5 rounded text-xs">Tarde</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[var(--text3)] font-semibold text-xs border border-dashed border-[var(--border)] rounded-2xl">
                  No hay firmas de materias registradas todavía.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
