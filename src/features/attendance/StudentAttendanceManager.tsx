"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { UserProfile, Alumno, Curso, AsistenciaJornada, getCursos, getAlumnos, getAsistenciasJornada, saveAsistenciasJornada, getAlumnoHistorialAsistencia, logAction, parseUserCursos } from "@/lib/dataService";
import { notify } from "@/lib/notify";
import { UserCheck, Check, X, AlertCircle, Calendar, Clock, Search, Printer, QrCode, Camera } from "lucide-react";
import AttendanceTableResponsive from "@/components/shared/AttendanceTableResponsive";
import { SkeletonAttendanceTable } from "@/components/shared/SkeletonLoaders";

const StudentQRScannerModal = dynamic(
  () => import("@/components/modals/StudentQRScannerModal"),
  { ssr: false, loading: () => null }
);

interface Props {
  user: any;
  userProfile: UserProfile | null;
}

export default function StudentAttendanceManager({ user, userProfile }: Props) {
  const [role, setRole] = useState<string>("alumno");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchJornada, setSearchJornada] = useState("");

  // Planillas de asistencias en edición
  const [asistenciasJornada, setAsistenciasJornada] = useState<Record<string, "P" | "A" | "M" | "T" | "R">>({});
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({}); // id de registro existente para actualizar

  // Historial del alumno (Vista Alumno)
  const [historialJornada, setHistorialJornada] = useState<AsistenciaJornada[]>([]);
  const [alumnoRecord, setAlumnoRecord] = useState<Alumno | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const refrescarDatosAlumno = useCallback(async () => {
    if (userProfile?.email) {
      try {
        const als = await getAlumnos();
        const al = als.find(a => (a.email || "").toLowerCase() === userProfile.email.toLowerCase());
        if (al) {
          setAlumnoRecord(al);
          await cargarHistorialAlumno(al.id || al.dni);
        }
      } catch (err) {
        console.error("Error al refrescar datos del alumno:", err);
      }
    }
  }, [userProfile]);

  const preceptorCursos = useMemo<string[]>(() => {
    if (!userProfile?.cursos) return [];
    return parseUserCursos(userProfile.cursos);
  }, [userProfile?.cursos]);

  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.rol);
    }
  }, [userProfile]);

  useEffect(() => {
    if (role === "preceptor" && preceptorCursos.length > 0 && !selectedCurso) {
      setSelectedCurso(preceptorCursos[0]);
    }
  }, [role, preceptorCursos, selectedCurso]);

  // Cargar datos básicos según el rol
  useEffect(() => {
    getCursos().then(setCursos);
    getAlumnos().then(setAlumnos);

    if (role === "alumno" && userProfile?.email) {
      getAlumnos().then(als => {
        const al = als.find(a => (a.email || "").toLowerCase() === userProfile.email.toLowerCase());
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
    } catch (err) {
      setErrorMsg("No se pudo cargar tu historial de asistencia.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar planilla de asistencia diaria (Preceptor/Admin)
  const cargarPlanillaJornada = useCallback(async () => {
    if (!selectedCurso) {
      setAsistenciasJornada({});
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
      
      const mapaAsistencias: Record<string, "P" | "A" | "M" | "T" | "R"> = {};
      const mapaIds: Record<string, string> = {};

      alumnosDelCurso.forEach(a => {
        const r = guardadas.find(g => g.alumnoId === a.id || g.alumnoId === a.dni);
        if (r) {
          mapaAsistencias[a.id || a.dni] = r.estado as "P" | "A" | "M" | "T" | "R";
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
  }, [selectedCurso, fecha, alumnos]);

  // Cargar automáticamente al cambiar el curso o la fecha
  useEffect(() => {
    if (role === "admin" || role === "directivo" || role === "preceptor") {
      cargarPlanillaJornada();
    }
  }, [cargarPlanillaJornada, role]);

  // Guardar asistencia diaria (Preceptor/Admin)
  const handleSaveJornada = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const savePromise = async () => {
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
        await logAction(userProfile?.email || "admin", "REGISTRAR_ASISTENCIA_JORNADA", `Curso: ${selectedCurso}, Fecha: ${fecha}`);
        await cargarPlanillaJornada();
      };

      await notify.promise(savePromise(), {
        loading: "Guardando planilla de asistencia...",
        success: "¡Planilla de asistencia guardada con éxito!",
        error: "Ocurrió un error al guardar la asistencia."
      });
      setSuccessMsg("Planilla de asistencia general guardada correctamente.");
    } catch {
      setErrorMsg("Ocurrió un error al guardar la asistencia.");
    } finally {
      setLoading(false);
    }
  };

  // Cálculos acumulados del alumno
  const totalFaltasJornada = historialJornada.reduce((acc, curr) => {
    if (curr.estado === "A") return acc + 1.0;
    if (curr.estado === "M") return acc + 0.5; // Media falta = 0.5
    if (curr.estado === "T") return acc + 0.25; // Llegada tarde cuenta como 0.25 falta
    return acc;
  }, 0);

  const totalTardesJornada = historialJornada.filter(h => h.estado === "T").length;
  const totalAusentesJornada = historialJornada.filter(h => h.estado === "A").length;
  const totalMediaFaltaJornada = historialJornada.filter(h => h.estado === "M").length;
  const totalRetirosJornada = historialJornada.filter(h => h.estado === "R").length;
  const totalJustificadosJornada = historialJornada.filter(h => h.estado === "J").length;

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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div>
              <h3 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
                <UserCheck className="text-[var(--verde)]" /> Planilla de Asistencia General
              </h3>
              <p className="text-[var(--text2)] text-xs font-bold uppercase tracking-wider mt-1">Control diario de alumnos</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Selector de Fecha */}
              <div 
                className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-1.5 cursor-pointer"
                onClick={() => { try { (document.getElementById("student-attendance-date") as HTMLInputElement)?.showPicker?.(); } catch {} }}
              >
                <Calendar size={16} className="text-[var(--text3)] pointer-events-none" />
                <input
                  id="student-attendance-date"
                  type="date"
                  className="bg-transparent text-sm font-bold outline-none text-[var(--text)] cursor-pointer"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
                />
              </div>

              {/* Selector de Curso */}
              <select
                className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold outline-none text-[var(--text)] focus:border-[var(--verde)]"
                value={selectedCurso}
                onChange={(e) => setSelectedCurso(e.target.value)}
              >
                <option value="">— Seleccionar Curso —</option>
                {role === "preceptor" && preceptorCursos.length > 0 ? (
                  <>
                    <optgroup label="Mis Cursos Asignados">
                      {cursos
                        .filter(c => preceptorCursos.includes(c.nombre))
                        .map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)
                      }
                    </optgroup>
                    <optgroup label="Otros Cursos Institucionales">
                      {cursos
                        .filter(c => !preceptorCursos.includes(c.nombre))
                        .map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)
                      }
                    </optgroup>
                  </>
                ) : (
                  cursos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)
                )}
              </select>
            </div>
          </div>

          {Object.keys(asistenciasJornada).length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg2)] p-3 rounded-2xl border border-[var(--border)] no-print">
                <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                  <input
                    type="text"
                    placeholder="Buscar alumno por nombre o DNI..."
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-sm font-semibold outline-none text-[var(--text)] focus:border-[var(--verde)] transition-all"
                    value={searchJornada}
                    onChange={(e) => setSearchJornada(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] text-xs font-bold px-4 py-2 rounded-xl hover:bg-[var(--bg4)] transition-all active:scale-95"
                >
                  <Printer size={16} /> Imprimir Planilla
                </button>
              </div>

              {loading ? (
                <SkeletonAttendanceTable rows={alumnos.filter(a => a.curso === selectedCurso).length || 5} />
              ) : (
                <AttendanceTableResponsive
                  alumnos={alumnos.filter(a => a.curso === selectedCurso).filter(a => (a.nombre + a.dni).toLowerCase().includes(searchJornada.toLowerCase()))}
                  asistencias={asistenciasJornada}
                  modo="jornada"
                  onChangeEstado={(alId, estado) =>
                    setAsistenciasJornada(prev => ({ ...prev, [alId]: estado as any }))
                  }
                />
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveJornada}
                  disabled={loading}
                  className="min-h-[44px] bg-[var(--verde)] text-black font-black px-6 py-3 rounded-2xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Asistencias"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[var(--border)] rounded-2xl">
              <UserCheck size={32} className="mx-auto text-[var(--text3)] mb-2 animate-pulse" />
              <p className="text-sm font-bold text-[var(--text2)]">Seleccioná un curso para cargar la planilla de asistencia diaria.</p>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: ALUMNO (Historial y Estadísticas de sólo lectura) */}
      {role === "alumno" && (
        <div className="space-y-6">
          {/* Banner de escaneo QR para el alumno */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-[28px] glass shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shadow-[0_0_20px_rgba(16,185,129,0.25)] shrink-0">
                <QrCode size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text)]">Escanear Asistencia QR</h3>
                <p className="text-xs font-semibold text-[var(--text3)]">
                  Apuntá con tu cámara al código del profesor o preceptor para dar el presente al instante
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="w-full sm:w-auto bg-[var(--verde)] hover:brightness-110 text-black font-black px-6 py-3.5 rounded-2xl shadow-[0_4px_20px_rgba(var(--verde-rgb),0.35)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm shrink-0"
            >
              <Camera size={18} />
              <span>Abrir Cámara y Escanear</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[24px] p-4 shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text3)]">Inasistencias</p>
              <p className="text-3xl font-black text-[var(--text)] mt-2">{totalFaltasJornada.toFixed(2)}</p>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[24px] p-4 shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text3)]">Ausentes</p>
              <p className="text-3xl font-black text-[var(--rojo)] mt-2">{totalAusentesJornada}</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[24px] p-4 shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text3)]">½ Faltas</p>
              <p className="text-3xl font-black text-[var(--amarillo)] mt-2">{totalMediaFaltaJornada}</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[24px] p-4 shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text3)]">Tardes</p>
              <p className="text-3xl font-black text-[var(--azul)] mt-2">{totalTardesJornada}</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[24px] p-4 shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text3)]">Retiros</p>
              <p className="text-3xl font-black text-[var(--naranja)] mt-2">{totalRetirosJornada}</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[24px] p-4 shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text3)]">Justificados</p>
              <p className="text-3xl font-black text-blue-500 mt-2">{totalJustificadosJornada}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-4">
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
                        {h.estado === "R" && <span className="bg-orange-500/15 text-orange-600 font-bold px-2 py-0.5 rounded text-xs">Retiro (0.0)</span>}
                        {h.estado === "J" && <span className="bg-blue-500/15 text-blue-600 font-bold px-2 py-0.5 rounded text-xs">Justificado (0.0)</span>}
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
          </div>
        </div>
      )}
      {/* Modal Lector QR de Asistencia para Alumnos */}
      <StudentQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        userProfile={userProfile}
        onSuccess={refrescarDatosAlumno}
      />
    </div>
  );
}
