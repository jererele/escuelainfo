import React, { useState, useMemo, useEffect } from "react";
import { Search, X, FileSpreadsheet, Clock, Coffee, RefreshCw, Trash2, Ban, UserCheck, Users, GraduationCap, AlertTriangle, Check } from "lucide-react";
import { Horario, Curso, Ausencia, Alumno, UserProfile, Profesor, parseUserCursos } from "@/lib/dataService";
import CustomSelect from "@/components/shared/CustomSelect";
import FreeHoursWidget from "../widgets/FreeHoursWidget";

interface HorariosTabProps {
  horarios: Horario[];
  cursos: Curso[];
  ausencias: Ausencia[];
  currentAlumno?: Alumno | null;
  currentProfesor?: Profesor | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  selectedCourse: string;
  setSelectedCourse: (c: string) => void;
  scheduleQuery: string;
  setScheduleQuery: (q: string) => void;
  onOpenScheduleModal: () => void;
  onDeleteHorario: (h: Horario) => void;
  onNavigateToAusencias: (profNombre: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export const HorariosTab: React.FC<HorariosTabProps> = ({
  horarios,
  cursos,
  ausencias,
  currentAlumno,
  currentProfesor,
  userProfile,
  isAdmin,
  selectedCourse,
  setSelectedCourse,
  scheduleQuery,
  setScheduleQuery,
  onOpenScheduleModal,
  onDeleteHorario,
  onNavigateToAusencias,
  showToast,
}) => {
  const [selectedMobileDay, setSelectedMobileDay] = useState<string>("Lunes");
  const isTeacher = userProfile?.rol === 'profesor';
  const isStudent = userProfile?.rol === 'alumno';
  const isPreceptor = userProfile?.rol === 'preceptor';
  const teacherName = currentProfesor?.nombre || userProfile?.nombre || "";
  const [teacherOnlyMine, setTeacherOnlyMine] = useState<boolean>(true);
  const [preceptorOnlyMine, setPreceptorOnlyMine] = useState<boolean>(true);

  // Cursos asignados a la preceptoría
  const preceptorCursos = useMemo<string[]>(() => {
    if (!userProfile?.cursos) return [];
    return parseUserCursos(userProfile.cursos);
  }, [userProfile?.cursos]);

  // Si es preceptor, auto-seleccionar por defecto su primer curso asignado
  useEffect(() => {
    if (isPreceptor && preceptorOnlyMine && preceptorCursos.length > 0) {
      if (!selectedCourse || !preceptorCursos.includes(selectedCourse)) {
        setSelectedCourse(preceptorCursos[0]);
      }
    }
  }, [isPreceptor, preceptorOnlyMine, preceptorCursos, selectedCourse, setSelectedCourse]);

  const morningSlots = [
    "07:40 - 08:20", 
    "08:20 - 09:00", 
    "RECREO: 09:00 - 09:10",
    "09:10 - 09:50", 
    "09:50 - 10:30", 
    "RECREO: 10:30 - 10:40",
    "10:40 - 11:20", 
    "11:20 - 12:00", 
    "12:00 - 12:40"
  ];

  const afternoonSlots = [
    "12:50 - 13:30", 
    "13:30 - 14:10", 
    "14:20 - 15:00", 
    "RECREO: 14:50 - 15:00",
    "15:00 - 15:40", 
    "15:50 - 16:30", 
    "RECREO: 16:20 - 16:30",
    "16:30 - 17:10", 
    "17:20 - 18:00", 
    "18:00 - 18:40", 
    "18:40 - 19:20"
  ];

  const normalizeStr = (s?: string | null) => (s || "").trim().toLowerCase();
  const normalizeSlot = (s?: string | null) => (s || "").replace(/\s+/g, "").toLowerCase();

  const getVisibleSlots = () => {
    const allSlots = [
      ...morningSlots,
      "RECESO",
      ...afternoonSlots
    ];

    if (userProfile?.rol !== 'alumno') {
      return allSlots;
    }

    const effectiveCourse = currentAlumno?.curso || "";
    if (!effectiveCourse) return allSlots;

    const courseSchedules = horarios.filter(h => normalizeStr(h.curso) === normalizeStr(effectiveCourse));
    if (courseSchedules.length === 0) return allSlots;

    const hasMorning = courseSchedules.some(h => morningSlots.some(s => normalizeSlot(s) === normalizeSlot(h.hora)));
    const hasAfternoon = courseSchedules.some(h => afternoonSlots.some(s => normalizeSlot(s) === normalizeSlot(h.hora)));

    if (hasMorning && !hasAfternoon) {
      return [...morningSlots, "RECESO", afternoonSlots[0], afternoonSlots[1]];
    }
    if (hasAfternoon && !hasMorning) {
      const peSlots = morningSlots.filter(s => !s.startsWith("RECREO:")).slice(-2);
      return [...peSlots, "RECESO", ...afternoonSlots];
    }

    return allSlots;
  };

  const findScheduleItem = (dia: string, slot: string) => {
    const normDia = normalizeStr(dia);
    const normSlot = normalizeSlot(slot);

    if (isTeacher && teacherOnlyMine) {
      return horarios.find(item =>
        normalizeStr(item.dia) === normDia &&
        normalizeSlot(item.hora) === normSlot &&
        normalizeStr(item.profesor) === normalizeStr(teacherName)
      );
    }

    const effectiveCourse = isStudent ? (currentAlumno?.curso || "___NO_COURSE___") : selectedCourse;
    return horarios.find(item =>
      normalizeStr(item.dia) === normDia &&
      normalizeSlot(item.hora) === normSlot &&
      (effectiveCourse === "" || normalizeStr(item.curso) === normalizeStr(effectiveCourse))
    );
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const slots = getVisibleSlots();

    const isTeacherMySchedule = isTeacher && (teacherOnlyMine || !selectedCourse);
    const targetCourse = isStudent ? (currentAlumno?.curso || "") : selectedCourse;

    let fileName = "Cronograma_General_Institucional.xlsx";
    let sheetName = "Cronograma";

    if (isTeacherMySchedule) {
      const cleanProf = teacherName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_') || 'Docente';
      fileName = `Mi_Horario_${cleanProf}.xlsx`;
      sheetName = "Mi Horario";
    } else if (isPreceptor && targetCourse) {
      const cleanCourse = targetCourse.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      fileName = `Horario_Preceptoria_${cleanCourse}.xlsx`;
      sheetName = targetCourse.slice(0, 31);
    } else if (targetCourse) {
      const cleanCourse = targetCourse.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_');
      fileName = isStudent ? `Mi_Horario_${cleanCourse}.xlsx` : `Horario_${cleanCourse}.xlsx`;
      sheetName = targetCourse.slice(0, 31);
    } else {
      fileName = "Cronograma_General_Institucional.xlsx";
      sheetName = "Cronograma General";
    }

    const rows: (string | null)[][] = [];
    rows.push(['Horario', ...days]);

    slots.forEach(slot => {
      if (slot === 'RECESO') {
        rows.push(['--- CAMBIO DE TURNO / RECESO ---', null, null, null, null, null]);
      } else if (slot.startsWith('RECREO:')) {
        rows.push(['--- RECREO ---', null, null, null, null, null]);
      } else {
        const row: (string | null)[] = [slot];
        days.forEach(dia => {
          const normDia = normalizeStr(dia);
          const normSlot = normalizeSlot(slot);

          let matching: Horario[] = [];

          if (isTeacherMySchedule) {
            matching = horarios.filter(item =>
              normalizeStr(item.dia) === normDia &&
              normalizeSlot(item.hora) === normSlot &&
              normalizeStr(item.profesor) === normalizeStr(teacherName)
            );
            if (matching.length > 0) {
              row.push(matching.map(h => `${h.materia}\nCurso: ${h.curso}`).join('\n---\n'));
            } else {
              row.push('');
            }
          } else if (targetCourse) {
            matching = horarios.filter(item =>
              normalizeStr(item.dia) === normDia &&
              normalizeSlot(item.hora) === normSlot &&
              normalizeStr(item.curso) === normalizeStr(targetCourse)
            );
            if (matching.length > 0) {
              row.push(matching.map(h => `${h.materia}\nProf. ${h.profesor}`).join('\n---\n'));
            } else {
              row.push('');
            }
          } else {
            // Cronograma General completo
            matching = horarios.filter(item =>
              normalizeStr(item.dia) === normDia &&
              normalizeSlot(item.hora) === normSlot
            );
            if (matching.length > 0) {
              row.push(matching.map(h => `[${h.curso}] ${h.materia} (${h.profesor})`).join('\n'));
            } else {
              row.push('');
            }
          }
        });
        rows.push(row);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
    ];
    ws['!rows'] = rows.map((_, i) => i === 0 ? { hpt: 24 } : { hpt: 60 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
    showToast('Excel del horario descargado con éxito', 'success');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black title-font text-[var(--text)]">Cronograma Institucional</h2>
            {isTeacher && teacherOnlyMine && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--verde-bg)] text-[var(--verde)] text-xs font-bold rounded-xl border border-[var(--verde-border)]">
                <UserCheck size={13} />
                Mi Horario: {teacherName}
              </span>
            )}
            {isPreceptor && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--azul-bg)] text-[var(--azul)] text-xs font-bold rounded-xl border border-[var(--azul-border)]">
                <Users size={13} />
                {preceptorCursos.length > 0 
                  ? `Preceptoría: ${preceptorCursos.length === 1 ? preceptorCursos[0] : `${preceptorCursos.length} cursos a cargo`}`
                  : "Preceptoría: Sin cursos asignados"}
              </span>
            )}
          </div>

          {/* Banner si el preceptor no tiene cursos asignados */}
          {isPreceptor && preceptorCursos.length === 0 && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-xs text-[var(--amarillo)] font-bold flex items-center gap-2.5 animate-fade-in no-print">
              <AlertTriangle size={16} className="shrink-0" />
              <span>Tu cuenta de preceptor aún no tiene divisiones escolares asignadas. Un directivo o administrador puede vincular tus cursos desde la sección <strong>Usuarios</strong>.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3 z-30 relative no-print">
            <div className="flex flex-wrap items-center gap-3">
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !teacherOnlyMine;
                    setTeacherOnlyMine(nextVal);
                    if (nextVal) setSelectedCourse("");
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border flex items-center gap-2 cursor-pointer ${
                    teacherOnlyMine
                      ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:bg-[var(--bg4)]"
                  }`}
                  title={teacherOnlyMine ? "Viendo únicamente tus materias asignadas" : "Cambiar a ver sólo tus materias"}
                >
                  <UserCheck size={15} className={teacherOnlyMine ? "text-[var(--verde)]" : "text-[var(--text3)]"} />
                  {teacherOnlyMine ? "Viendo: Mis Materias" : "Ver Mis Materias"}
                </button>
              )}

              {isPreceptor && preceptorCursos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !preceptorOnlyMine;
                    setPreceptorOnlyMine(nextVal);
                    if (nextVal && !preceptorCursos.includes(selectedCourse)) {
                      setSelectedCourse(preceptorCursos[0]);
                    }
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border flex items-center gap-2 cursor-pointer ${
                    preceptorOnlyMine
                      ? "bg-[var(--azul-bg)] text-[var(--azul)] border-[var(--azul-border)] shadow-sm"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:bg-[var(--bg4)]"
                  }`}
                  title={preceptorOnlyMine ? "Viendo tus divisiones asignadas" : "Ver todos los cursos de la escuela"}
                >
                  <Users size={15} className={preceptorOnlyMine ? "text-[var(--azul)]" : "text-[var(--text3)]"} />
                  {preceptorOnlyMine ? "Viendo: Mis Cursos Asignados" : "Ver Todos los Cursos"}
                </button>
              )}

              <div className="flex items-center gap-3">
                <p className="text-[var(--text2)] text-sm font-medium">
                  {isTeacher && teacherOnlyMine 
                    ? "Explorar por curso:" 
                    : isPreceptor && preceptorOnlyMine 
                    ? "Cursos asignados:" 
                    : "Filtrar por curso:"}
                </p>
                {userProfile?.rol === 'alumno' ? (
                  <span className="px-4 py-2 bg-[var(--bg3)] text-[var(--verde)] rounded-2xl border border-[var(--border)] font-bold text-sm">
                    {currentAlumno?.curso || "Sin curso"}
                  </span>
                ) : (
                  <CustomSelect 
                    value={teacherOnlyMine ? "" : selectedCourse} 
                    onChange={(val) => {
                      setSelectedCourse(val);
                      if (val) {
                        if (isTeacher) setTeacherOnlyMine(false);
                      }
                    }}
                    placeholder={
                      teacherOnlyMine 
                        ? "Seleccionar curso..." 
                        : isPreceptor && preceptorOnlyMine 
                        ? "Seleccionar curso..." 
                        : "Todos los cursos"
                    }
                    className="w-48 sm:w-56"
                    buttonClassName={
                      isPreceptor && preceptorOnlyMine 
                        ? "text-[var(--azul)] bg-[var(--bg3)] text-xs font-bold" 
                        : "text-[var(--verde)] bg-[var(--bg3)] text-xs font-bold"
                    }
                    options={
                      isPreceptor && preceptorOnlyMine && preceptorCursos.length > 0
                        ? preceptorCursos.map(c => ({ value: c, label: c }))
                        : [
                            { value: "", label: "Todos los cursos" },
                            ...cursos.map(c => ({
                              value: c.nombre, label: c.nombre
                            }))
                          ]
                    }
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl px-4 py-2 w-full sm:w-64">
              <Search size={16} className="text-[var(--text3)] shrink-0" />
              <input 
                type="text" 
                placeholder="Buscar docente o materia..." 
                value={scheduleQuery}
                onChange={(e) => setScheduleQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-[var(--text)] placeholder:text-[var(--text3)] w-full"
              />
              {scheduleQuery && (
                <button onClick={() => setScheduleQuery("")} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick chips para preceptor con múltiples cursos asignados */}
          {isPreceptor && preceptorCursos.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 no-print">
              <span className="text-[11px] text-[var(--text3)] font-semibold flex items-center gap-1 mr-1">
                <GraduationCap size={13} className="text-[var(--azul)]" /> Cursos a cargo:
              </span>
              {preceptorCursos.map((c) => {
                const isActive = selectedCourse === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedCourse(c);
                      setPreceptorOnlyMine(true);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[var(--azul-bg)] text-[var(--azul)] border-[var(--azul-border)] shadow-xs"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:bg-[var(--bg4)]"
                    }`}
                  >
                    <span>{c}</span>
                    {isActive && <Check size={11} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-4 w-full md:w-auto no-print">
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[var(--bg3)] text-[var(--text)] font-bold px-6 py-4 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg4)] transition-all shadow-md active:scale-95 cursor-pointer"
            title="Descargar horario en formato Excel (.xlsx)"
          >
            <FileSpreadsheet size={18} className="text-[var(--verde)] shrink-0" />
            {isTeacher 
              ? (teacherOnlyMine || !selectedCourse ? "Descargar Mi Horario (Excel)" : `Descargar Horario ${selectedCourse} (Excel)`)
              : isStudent 
              ? "Descargar Mi Horario (Excel)" 
              : isPreceptor && selectedCourse
              ? `Descargar Horario ${selectedCourse} (Excel)`
              : selectedCourse 
              ? `Descargar Horario ${selectedCourse} (Excel)` 
              : "Descargar Cronograma General (Excel)"}
          </button>
          {isAdmin && (
            <button 
              onClick={onOpenScheduleModal}
              className="flex-1 md:flex-initial bg-[var(--verde)] text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-[0_8px_30px_rgb(16,185,129,0.3)] shrink-0 cursor-pointer"
            >
              + Programar Clase
            </button>
          )}
        </div>
      </div>

      {/* HORAS LIBRES DEL DÍA */}
      <div className="mb-8 no-print animate-fade-in">
        <FreeHoursWidget 
          isStudent={userProfile?.rol === 'alumno'}
          currentAlumno={currentAlumno}
          isPreceptor={isPreceptor}
          preceptorCourses={preceptorCursos}
          ausencias={ausencias}
          horarios={horarios}
          onNavigateToAusencias={onNavigateToAusencias}
          onNavigateToHorarios={(c) => setSelectedCourse(c)}
        />
      </div>

      {/* Selector de días para dispositivos móviles */}
      <div className="flex lg:hidden justify-between items-center gap-1 bg-[var(--bg3)] p-1.5 rounded-2xl border border-[var(--border)] mb-6 z-30 relative no-print">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia) => {
          const shortName = dia.slice(0, 3);
          return (
            <button
              key={dia}
              type="button"
              onClick={() => setSelectedMobileDay(dia)}
              className={`flex-1 py-2.5 sm:py-3 text-xs uppercase rounded-xl transition-all cursor-pointer text-center ${
                selectedMobileDay === dia
                  ? "bg-[var(--verde)] text-black shadow-md font-black ring-1 ring-[var(--verde)]"
                  : "text-[var(--text2)] hover:bg-[var(--bg4)] font-bold"
              }`}
            >
              {shortName}
            </button>
          );
        })}
      </div>

      {/* VISTA MÓVIL (< lg) */}
      <div className="lg:hidden space-y-3">
        {getVisibleSlots().map((slot, idx) => {
          if (slot === "RECESO") {
            return (
              <div key={idx} className="p-3.5 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] text-center text-xs font-black uppercase tracking-widest text-[var(--text2)] flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin-slow text-[var(--text3)] shrink-0" />
                Cambio de Hora / Turno
              </div>
            );
          }
          if (slot.startsWith("RECREO:")) {
            return (
              <div key={idx} className="p-3.5 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] text-center text-xs font-black uppercase tracking-widest text-[var(--verde)] flex items-center justify-center gap-2">
                <Coffee size={14} className="shrink-0" />
                Recreo ({slot.replace("RECREO:", "")})
              </div>
            );
          }

          const h = findScheduleItem(selectedMobileDay, slot);

          const daysMap: {[key: string]: number} = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };
          const now = new Date();
          const currentDay = now.getDay();
          const diff = now.getDate() - currentDay + daysMap[selectedMobileDay];
          const targetDate = new Date(new Date().setDate(diff)).toISOString().split('T')[0];

          const isAbsent = h && ausencias.some(a => 
            a.profNombre === h.profesor && 
            targetDate >= a.inicio && 
            targetDate <= a.fin &&
            a.estado === 'aprobada'
          );

          const hasSearch = scheduleQuery.trim() !== "";
          const matchesSearch = h && (
            h.materia.toLowerCase().includes(scheduleQuery.toLowerCase()) || 
            h.profesor.toLowerCase().includes(scheduleQuery.toLowerCase()) ||
            h.curso.toLowerCase().includes(scheduleQuery.toLowerCase())
          );
          const isDimmed = hasSearch && h && !matchesSearch;

          return (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                isDimmed ? "opacity-30 grayscale" : ""
              } ${
                !h 
                  ? "bg-[var(--bg3)]/40 border-[var(--border)]" 
                  : isAbsent 
                  ? "bg-[var(--rojo-bg)] border-[var(--rojo-border)] shadow-sm" 
                  : "bg-[var(--bg2)] border-[var(--border)] shadow-sm"
              }`}
            >
              <div className="flex justify-between items-center text-xs font-black text-[var(--text3)] pb-2 border-b border-[var(--border)]/50">
                <span className="flex items-center gap-1.5 text-[var(--verde)] font-mono">
                  <Clock size={13} /> {slot}
                </span>
                {h && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourse(h.curso);
                    }}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md hover:scale-105 transition-all cursor-pointer ${
                      isAbsent ? "bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)]" : "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]"
                    }`}
                    title="Filtrar por este curso"
                  >
                    {h.curso}
                  </button>
                )}
              </div>

              {h ? (
                <div className="space-y-1 relative">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-black text-sm ${isAbsent ? "text-[var(--rojo)] line-through decoration-2" : "text-[var(--text)]"}`}>
                      {h.materia}
                    </h4>
                    {isAbsent && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] animate-pulse shrink-0">
                        Hora Libre
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToAusencias(h.profesor);
                    }}
                    className={`text-xs font-bold text-left hover:text-[var(--verde)] hover:underline transition-colors ${isAbsent ? "text-[var(--rojo)]/70" : "text-[var(--text2)]"}`}
                    title={`Ver ausencias de ${h.profesor}`}
                  >
                    Prof. {h.profesor}
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => onDeleteHorario(h)}
                      className="mt-2 text-xs text-[var(--rojo)] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 size={13} /> Eliminar clase
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-bold text-[var(--text3)] italic">Sin clase programada</span>
                  {isAdmin && (
                    <button 
                      onClick={onOpenScheduleModal}
                      className="text-xs font-black text-[var(--verde)] bg-[var(--verde-bg)] px-3 py-1 rounded-xl border border-[var(--verde-border)] cursor-pointer"
                    >
                      + Asignar
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO (lg+) */}
      <div className="hidden lg:block card glass rounded-[40px] border border-[var(--border)] overflow-x-auto shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--bg3)]/80">
              <th className="p-5 border-b border-r border-[var(--border)] text-[10px] font-black uppercase text-[var(--verde)] sticky left-0 bg-[var(--bg)] z-20 w-32">Horario</th>
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(dia => (
                <th key={dia} className="p-5 border-b border-[var(--border)] text-[11px] font-black uppercase tracking-widest text-[var(--text)] min-w-[180px]">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getVisibleSlots().map((slot, idx) => {
              if (slot === "RECESO") {
                return (
                  <tr key={idx} className="bg-[var(--bg3)] border-y border-[var(--border)]">
                    <td colSpan={6} className="p-4 text-center text-xs font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] text-[var(--text2)]">
                      <span className="inline-flex items-center gap-3">
                        <RefreshCw size={14} className="animate-spin-slow text-[var(--text3)] shrink-0" />
                        Cambio de Hora / Turno
                      </span>
                    </td>
                  </tr>
                );
              }
              if (slot.startsWith("RECREO:")) {
                return (
                  <tr key={idx} className="bg-[var(--verde-bg)] border-y border-[var(--verde-border)]">
                    <td colSpan={6} className="p-4 text-center text-xs font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] text-[var(--verde)]">
                      <span className="inline-flex items-center gap-3">
                        <Coffee size={14} className="text-[var(--verde)] shrink-0" />
                        Recreo
                      </span>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={idx} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)]">
                  <td className="p-4 border-r border-[var(--border)] text-[10px] font-black text-[var(--text)] text-center sticky left-0 bg-[var(--bg)]/95 backdrop-blur-md z-10">{slot}</td>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(dia => {
                    const h = findScheduleItem(dia, slot);

                    const daysMap: {[key: string]: number} = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };
                    const now = new Date();
                    const currentDay = now.getDay();
                    const diff = now.getDate() - currentDay + daysMap[dia];
                    const targetDate = new Date(new Date().setDate(diff)).toISOString().split('T')[0];

                    const isAbsent = h && ausencias.some(a => 
                      a.profNombre === h.profesor && 
                      targetDate >= a.inicio && 
                      targetDate <= a.fin &&
                      a.estado === 'aprobada'
                    );

                    const hasSearch = scheduleQuery.trim() !== "";
                    const matchesSearch = h && (
                      h.materia.toLowerCase().includes(scheduleQuery.toLowerCase()) || 
                      h.profesor.toLowerCase().includes(scheduleQuery.toLowerCase()) ||
                      h.curso.toLowerCase().includes(scheduleQuery.toLowerCase())
                    );
                    const isDimmed = hasSearch && h && !matchesSearch;

                    return (
                      <td 
                        key={dia} 
                        className="p-2 border-r border-[var(--border)] last:border-r-0 relative group min-h-[80px]"
                      >
                        {h ? (
                          <div className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border transition-all duration-300 relative overflow-hidden ${
                            isDimmed ? "opacity-15 grayscale scale-95 blur-[0.5px]" : ""
                          } ${
                            isAbsent 
                              ? "bg-[var(--rojo-bg)] border-[var(--rojo-border)] shadow-[0_8px_20px_rgba(239,68,68,0.15)] ring-1 ring-[var(--rojo-border)]" 
                              : "bg-[var(--bg3)] border-[var(--border)] shadow-sm hover:shadow-md group-hover:border-[var(--verde)]"
                          }`}>
                            {isAbsent && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--rojo)]/5 blur-xl pointer-events-none rounded-full" />
                            )}
                            <div className="flex justify-between items-start mb-1 pr-6">
                              <div className={`font-black text-xs sm:text-sm leading-tight ${isAbsent ? "text-[var(--rojo)] line-through decoration-[var(--rojo)]/80 decoration-2 opacity-80" : "text-[var(--text)]"}`}>{h.materia}</div>
                              {isAbsent && (
                                <span className="text-[var(--rojo)] animate-bounce shrink-0 ml-1">
                                  <Ban size={12} />
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToAusencias(h.profesor);
                              }}
                              className={`text-[10px] sm:text-xs font-bold text-left hover:text-[var(--verde)] hover:underline transition-colors block ${isAbsent ? "text-[var(--rojo)]/70" : "text-[var(--text2)]"}`}
                              title={`Ver ausencias de ${h.profesor}`}
                            >
                              Prof. {h.profesor}
                            </button>
                            <div className="flex items-center justify-between mt-2.5 gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCourse(h.curso);
                                }}
                                className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md hover:scale-105 transition-all cursor-pointer ${isAbsent ? "bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)]" : "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]"}`}
                                title={`Filtrar por ${h.curso}`}
                              >
                                {h.curso}
                              </button>
                              {isAbsent && (
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] animate-pulse shrink-0">
                                  Hora Libre
                                </span>
                              )}
                            </div>
                            {isAdmin && (
                              <button 
                                onClick={() => onDeleteHorario(h)}
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1.5 bg-black/60 rounded-lg hover:bg-[var(--rojo)] transition-all text-white shadow-md z-20 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="h-full min-h-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAdmin && (
                              <button 
                                onClick={onOpenScheduleModal}
                                className="w-8 h-8 rounded-full bg-[var(--bg3)] text-[var(--text3)] flex items-center justify-center border border-dashed border-[var(--border)] hover:bg-[var(--verde)] hover:text-black transition-all cursor-pointer"
                              >
                                +
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HorariosTab;
