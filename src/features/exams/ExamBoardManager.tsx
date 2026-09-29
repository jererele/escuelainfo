"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { AppwriteException } from "appwrite";
import { 
  UserProfile, 
  Profesor, 
  Alumno, 
  Curso,
  MesaExamen, 
  getProfesores, 
  getAlumnos, 
  getAlumnoByEmail,
  getCursos,
  getMesasExamen, 
  saveMesaExamen, 
  deleteMesaExamen, 
  logAction, 
  subscribeToMesasExamen 
} from "@/lib/dataService";
import { notify } from "@/lib/notify";
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Plus, 
  X, 
  Search, 
  Check, 
  Trash2, 
  Edit, 
  Printer,
  QrCode,
  Camera,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Users,
  IdCard,
  UserPlus,
  RefreshCw,
  Eye,
  GraduationCap
} from "lucide-react";

const OfficialDocumentExportModal = dynamic(
  () => import("@/components/modals/OfficialDocumentExportModal"),
  { ssr: false }
);

const ExamQRScannerModal = dynamic(
  () => import("@/components/modals/ExamQRScannerModal"),
  { ssr: false }
);

const MesaQRModal = dynamic(
  () => import("@/components/modals/MesaQRModal"),
  { ssr: false }
);

const StudentExamQRModal = dynamic(
  () => import("@/components/modals/StudentExamQRModal"),
  { ssr: false }
);

import SubjectSelect from "@/components/shared/SubjectSelect";
import { PLAN_DE_ESTUDIOS } from "@/lib/curriculum";

interface Props {
  user: any;
  userProfile: UserProfile | null;
}

export default function ExamBoardManager({ user, userProfile }: Props) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string>("alumno");
  const [mesas, setMesas] = useState<MesaExamen[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Registro del alumno logueado para autocompletado instantáneo
  const [alumnoRecord, setAlumnoRecord] = useState<Alumno | null>(null);

  // Modales adicionales
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"student" | "manager">("student");
  const [isMesaQRModalOpen, setIsMesaQRModalOpen] = useState(false);
  const [selectedMesaForQR, setSelectedMesaForQR] = useState<MesaExamen | null>(null);
  const [isStudentQRModalOpen, setIsStudentQRModalOpen] = useState(false);
  const [lastScannedStudent, setLastScannedStudent] = useState<string>("");

  // Estado para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [materiaFilter, setMateriaFilter] = useState("");

  // Control del formulario/modal de creación y edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<MesaExamen | null>(null);

  // Campos del formulario de Mesa
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [materia, setMateria] = useState("");
  const [aula, setAula] = useState("");
  const [presidenteId, setPresidenteId] = useState("");
  const [vocal1Id, setVocal1Id] = useState("");
  const [vocal2Id, setVocal2Id] = useState("");
  const [estado, setEstado] = useState<"borrador" | "confirmada" | "evaluada">("borrador");

  // Planilla interactiva de inscriptos (armado automático)
  const [enrolledList, setEnrolledList] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedCourseToLoad, setSelectedCourseToLoad] = useState("");
  const [manualStudentInput, setManualStudentInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Estados de feedback
  const [panelError, setPanelError] = useState("");
  const [panelSuccess, setPanelSuccess] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  interface Feriado {
    fecha: string;
    tipo: string;
    nombre: string;
  }

  const [feriados, setFeriados] = useState<Feriado[]>([]);

  const currentHoliday = (() => {
    if (!fecha) return null;
    return feriados.find(f => f.fecha === fecha) || null;
  })();

  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.rol);
    }
  }, [userProfile]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const canManage = role === "admin" || role === "directivo" || role === "preceptor";
      const [profs, als, curs, mesasData] = await Promise.all([
        getProfesores(),
        canManage ? getAlumnos() : Promise.resolve([]),
        canManage ? getCursos() : Promise.resolve([]),
        getMesasExamen(true),
      ]);
      setProfesores(profs);
      setAlumnos(als);
      setCursos(curs);
      setMesas(mesasData);

      // Si es alumno, obtener únicamente su registro personal para autocompletado en 1 clic
      if (role === "alumno" && userProfile?.email) {
        const me = await getAlumnoByEmail(userProfile.email);
        if (me) setAlumnoRecord(me);
      }
    } catch {
      setPanelError("Error cargando mesas de examen o información de usuarios.");
    } finally {
      setLoading(false);
    }
  }, [role, userProfile]);

  useEffect(() => {
    setMounted(true);
    refreshData();

    const unsubscribe = subscribeToMesasExamen((data) => {
      setMesas(data);
    });

    fetch("/api/feriados")
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando feriados");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setFeriados(data);
        }
      })
      .catch((err) => console.error("Error al cargar feriados:", err));

    return () => {
      unsubscribe();
    };
  }, [refreshData]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isModalOpen]);

  // Alumnos sugeridos por autocompletado en el gestor de planillas
  const filteredStudentSuggestions = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return alumnos.filter(a => {
      const matchName = (a.nombre || "").toLowerCase().includes(q);
      const matchDni = (a.dni || "").includes(q);
      const matchCurso = (a.curso || "").toLowerCase().includes(q);
      return matchName || matchDni || matchCurso;
    }).slice(0, 8);
  }, [alumnos, studentSearchQuery]);

  // Apertura de modal de creación
  const openCreateModal = () => {
    setEditingMesa(null);
    setFecha(new Date().toISOString().split("T")[0]);
    setHora("08:00");
    setHoraFin("10:00");
    setMateria("");
    setAula("");
    setPresidenteId("");
    setVocal1Id("");
    setVocal2Id("");
    setEnrolledList([]);
    setStudentSearchQuery("");
    setSelectedCourseToLoad("");
    setManualStudentInput("");
    setShowManualInput(false);
    setEstado("borrador");
    setModalError("");
    setModalLoading(false);
    setIsModalOpen(true);
  };

  // Apertura de modal de edición
  const openEditModal = (m: MesaExamen) => {
    setEditingMesa(m);
    setFecha(m.fecha);
    setHora(m.hora);
    setHoraFin("10:00");
    setMateria(m.materia);
    setAula(m.aula);
    setPresidenteId(m.presidenteId);
    setVocal1Id(m.vocal1Id || "");
    setVocal2Id(m.vocal2Id || "");
    setEnrolledList(m.alumnosInscriptos || []);
    setStudentSearchQuery("");
    setSelectedCourseToLoad("");
    setManualStudentInput("");
    setShowManualInput(false);
    setEstado(m.estado);
    setModalError("");
    setModalLoading(false);
    setIsModalOpen(true);
  };

  // ─── GESTIÓN DE PLANILLA: ACCIONES DE AUTOCOMPLETADO Y ESCANEO ───────────────

  // Agregar alumno individual desde el autocompletado
  const handleAddStudentToPlanilla = (alumno: Alumno) => {
    const label = `${alumno.nombre} (DNI: ${alumno.dni}${alumno.curso ? ` · ${alumno.curso}` : ""})`;
    const alreadyExists = enrolledList.some(item => 
      (alumno.dni && item.includes(alumno.dni)) || 
      item.toLowerCase().includes(alumno.nombre.toLowerCase())
    );

    if (alreadyExists) {
      notify.error("El alumno ya se encuentra agregado en la planilla.");
      return;
    }

    setEnrolledList(prev => [...prev, label]);
    setStudentSearchQuery("");
    notify.success(`${alumno.nombre} sumado a la planilla.`);
  };

  // Carga masiva por curso completo
  const handleAddCourseStudents = (cursoNombre: string) => {
    if (!cursoNombre) return;
    const courseStudents = alumnos.filter(a => a.curso === cursoNombre);
    if (courseStudents.length === 0) {
      notify.error("No se encontraron alumnos registrados en este curso.");
      return;
    }

    let addedCount = 0;
    setEnrolledList(prev => {
      const updated = [...prev];
      courseStudents.forEach(st => {
        const exists = updated.some(item => 
          (st.dni && item.includes(st.dni)) || 
          item.toLowerCase().includes(st.nombre.toLowerCase())
        );
        if (!exists) {
          updated.push(`${st.nombre} (DNI: ${st.dni}${st.curso ? ` · ${st.curso}` : ""})`);
          addedCount++;
        }
      });
      return updated;
    });

    if (addedCount > 0) {
      notify.success(`Se agregaron ${addedCount} alumnos de ${cursoNombre} a la planilla.`);
    } else {
      notify.info("Todos los alumnos de este curso ya estaban en la planilla.");
    }
    setSelectedCourseToLoad("");
  };

  // Agregar alumno manual (para casos especiales)
  const handleAddManualStudent = () => {
    const trimmed = manualStudentInput.trim();
    if (!trimmed) return;
    if (enrolledList.includes(trimmed)) {
      notify.error("Este registro ya está en la lista.");
      return;
    }
    setEnrolledList(prev => [...prev, trimmed]);
    setManualStudentInput("");
    setShowManualInput(false);
    notify.success("Alumno manual agregado a la planilla.");
  };

  // Quitar alumno de la planilla
  const handleRemoveStudentFromPlanilla = (indexToRemove: number) => {
    setEnrolledList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ─── ACCIONES DE AUTOCOMPLETADO PARA EL ALUMNO LOGUEADO ─────────────────────

  // Determinar si el alumno actual está inscripto en una mesa
  const isStudentEnrolledInMesa = (mesa: MesaExamen) => {
    const list = mesa.alumnosInscriptos || [];
    const myName = (alumnoRecord?.nombre || userProfile?.nombre || "").toLowerCase();
    const myDni = alumnoRecord?.dni || "";
    const myEmail = (userProfile?.email || "").toLowerCase();

    return list.some(a => {
      const aLower = a.toLowerCase();
      const matchName = myName && aLower.includes(myName);
      const matchDni = myDni && a.includes(myDni);
      const matchEmail = myEmail && aLower.includes(myEmail);
      return matchName || matchDni || matchEmail;
    });
  };

  // Inscripción directa con 1 Clic (Autocompletado de sesión activa)
  const handleSelfEnroll = async (mesa: MesaExamen) => {
    if (!userProfile) return;
    setLoading(true);
    setPanelError("");
    setPanelSuccess("");

    try {
      const studentName = alumnoRecord?.nombre || userProfile.nombre;
      const studentDni = alumnoRecord?.dni || "";
      const studentCurso = alumnoRecord?.curso || "";
      const label = studentDni 
        ? `${studentName} (DNI: ${studentDni}${studentCurso ? ` · ${studentCurso}` : ""})`
        : studentName;

      const currentList = mesa.alumnosInscriptos || [];
      if (isStudentEnrolledInMesa(mesa)) {
        notify.info("Ya te encontrás inscripto en la planilla de esta mesa.");
        return;
      }

      const updatedInscriptos = [...currentList, label];
      const updatedMesa: MesaExamen = {
        ...mesa,
        alumnosInscriptos: updatedInscriptos,
      };

      // Actualización optimista inmediata
      setMesas(prev => prev.map(m => m.id === mesa.id ? updatedMesa : m));

      await saveMesaExamen(updatedMesa);
      await logAction(
        userProfile.email, 
        "INSCRIBIR_MESA_EXAMEN", 
        `Mesa: ${mesa.materia} (${mesa.fecha}) - Autocompletado inteligente`
      );

      setPanelSuccess(`¡Inscripción confirmada! Tus datos se cargaron en la planilla de ${mesa.materia}.`);
      notify.success("¡Inscripción confirmada! Tus datos se cargaron automáticamente en la planilla.");
    } catch (err) {
      console.error(err);
      notify.error("Ocurrió un error al inscribirte. Intentá nuevamente.");
      refreshData();
    } finally {
      setLoading(false);
    }
  };

  // Cancelar inscripción por parte del alumno
  const handleSelfUnenroll = async (mesa: MesaExamen) => {
    if (!confirm(`¿Estás seguro de cancelar tu inscripción a la mesa de ${mesa.materia}?`)) return;
    setLoading(true);
    setPanelError("");
    setPanelSuccess("");

    try {
      const myName = (alumnoRecord?.nombre || userProfile?.nombre || "").toLowerCase();
      const myDni = alumnoRecord?.dni || "";
      const myEmail = (userProfile?.email || "").toLowerCase();

      const updatedInscriptos = (mesa.alumnosInscriptos || []).filter(a => {
        const aLower = a.toLowerCase();
        const matchName = myName && aLower.includes(myName);
        const matchDni = myDni && a.includes(myDni);
        const matchEmail = myEmail && aLower.includes(myEmail);
        return !matchName && !matchDni && !matchEmail;
      });

      const updatedMesa: MesaExamen = {
        ...mesa,
        alumnosInscriptos: updatedInscriptos,
      };

      setMesas(prev => prev.map(m => m.id === mesa.id ? updatedMesa : m));
      await saveMesaExamen(updatedMesa);
      await logAction(userProfile?.email || "alumno", "CANCELAR_MESA_EXAMEN", `Mesa: ${mesa.materia}`);

      setPanelSuccess(`Inscripción cancelada para la mesa de ${mesa.materia}.`);
      notify.success("Inscripción cancelada correctamente.");
    } catch (err) {
      console.error(err);
      notify.error("Error al cancelar la inscripción.");
      refreshData();
    } finally {
      setLoading(false);
    }
  };

  // ─── MANEJADORES DE ESCANEO QR ──────────────────────────────────────────────

  // El alumno escaneó el QR de una mesa de examen
  const handleStudentScanMesa = async (scannedMesaId: string) => {
    const targetMesa = mesas.find(m => m.id === scannedMesaId);
    if (!targetMesa) {
      notify.error("No se encontró la mesa de examen con el código escaneado.");
      return;
    }
    await handleSelfEnroll(targetMesa);
    setTimeout(() => {
      setIsQRScannerOpen(false);
    }, 1200);
  };

  // El docente/preceptor escaneó el código o credencial de un alumno
  const handleManagerScanStudent = (scannedText: string) => {
    let dniFound = "";
    let nombreFound = "";

    try {
      const parsed = JSON.parse(scannedText);
      if (parsed.dni) dniFound = String(parsed.dni).trim();
      if (parsed.nombre) nombreFound = String(parsed.nombre).trim();
    } catch {
      const match = scannedText.match(/\b\d{7,9}\b/);
      if (match) dniFound = match[0];
      else nombreFound = scannedText.trim();
    }

    const matched = alumnos.find(a => 
      (dniFound && a.dni === dniFound) || 
      (nombreFound && a.nombre.toLowerCase().includes(nombreFound.toLowerCase()))
    );

    if (matched) {
      handleAddStudentToPlanilla(matched);
      setLastScannedStudent(`${matched.nombre} (DNI: ${matched.dni})`);
    } else if (dniFound || nombreFound) {
      const fallbackLabel = dniFound ? `Alumno DNI: ${dniFound}` : nombreFound;
      if (!enrolledList.includes(fallbackLabel)) {
        setEnrolledList(prev => [...prev, fallbackLabel]);
        setLastScannedStudent(fallbackLabel);
        notify.success(`${fallbackLabel} agregado a la planilla.`);
      }
    } else {
      notify.error("No se pudieron extraer datos del alumno del código escaneado.");
    }
  };

  // ─── ELIMINACIÓN Y GUARDADO DE MESA ─────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta mesa de examen?")) return;
    setLoading(true);
    setPanelError("");
    setPanelSuccess("");
    setMesas(prev => prev.filter(m => m.id !== id));
    try {
      await deleteMesaExamen(id);
      setPanelSuccess("Mesa de examen eliminada con éxito.");
      await logAction(userProfile?.email || "admin", "ELIMINAR_MESA_EXAMEN", `ID: ${id}`);
      const fresh = await getMesasExamen(true);
      setMesas(fresh);
    } catch (err) {
      if (err instanceof AppwriteException) {
        setPanelError(`Error Appwrite (${err.code}): ${err.message}`);
      } else {
        setPanelError("Error al eliminar la mesa de examen.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!fecha || !hora || !materia || !aula || !presidenteId) {
      setModalError("Completá todos los campos obligatorios (Fecha, Hora, Materia, Aula, Presidente).");
      return;
    }

    if (currentHoliday) {
      setModalError(`No se puede programar en un día feriado: ${currentHoliday.nombre}`);
      return;
    }

    if ((estado === "confirmada" || estado === "evaluada") && !vocal1Id) {
      setModalError("Una mesa confirmada o evaluada debe tener asignado al menos al Vocal 1 (Mínimo 2 profesores).");
      return;
    }

    if (presidenteId === vocal1Id || presidenteId === vocal2Id || (vocal1Id && vocal1Id === vocal2Id)) {
      setModalError("Un profesor no puede cumplir más de un rol en la misma mesa de examen.");
      return;
    }

    const collisionPresidente = mesas.find(m =>
      m.id !== editingMesa?.id &&
      m.fecha === fecha &&
      m.hora === hora &&
      (m.presidenteId === presidenteId || m.vocal1Id === presidenteId || m.vocal2Id === presidenteId)
    );
    if (collisionPresidente) {
      const profName = profesores.find(p => p.id === presidenteId || p.dni === presidenteId)?.nombre || "Presidente";
      setModalError(`Conflicto de horario: El Prof. ${profName} ya está asignado a otra mesa el día ${fecha} a las ${hora}.`);
      return;
    }

    if (vocal1Id) {
      const collisionVocal1 = mesas.find(m =>
        m.id !== editingMesa?.id &&
        m.fecha === fecha &&
        m.hora === hora &&
        (m.presidenteId === vocal1Id || m.vocal1Id === vocal1Id || m.vocal2Id === vocal1Id)
      );
      if (collisionVocal1) {
        const profName = profesores.find(p => p.id === vocal1Id || p.dni === vocal1Id)?.nombre || "Vocal 1";
        setModalError(`Conflicto de horario: El Prof. ${profName} ya está asignado a otra mesa el día ${fecha} a las ${hora}.`);
        return;
      }
    }

    const pres = profesores.find(p => p.id === presidenteId || p.dni === presidenteId);
    const v1 = profesores.find(p => p.id === vocal1Id || p.dni === vocal1Id);
    const v2 = profesores.find(p => p.id === vocal2Id || p.dni === vocal2Id);

    const payload: MesaExamen = {
      id: editingMesa?.id || undefined,
      fecha,
      hora,
      materia,
      aula,
      presidenteId,
      presidenteNombre: pres ? pres.nombre : "Presidente",
      vocal1Id: vocal1Id || undefined,
      vocal1Nombre: v1 ? v1.nombre : undefined,
      vocal2Id: vocal2Id || undefined,
      vocal2Nombre: v2 ? v2.nombre : undefined,
      alumnosInscriptos: enrolledList,
      estado
    };

    setModalLoading(true);
    try {
      const savedRes = await saveMesaExamen(payload);
      const savedId = (savedRes as any)?.$id || payload.id || `MESA_${Date.now()}`;
      const finalSaved: MesaExamen = {
        ...payload,
        id: savedId,
      };

      setMesas((prev) => {
        const exists = prev.some(
          (m) => m.id === savedId || (payload.id && m.id === payload.id)
        );
        if (exists) {
          return prev.map((m) =>
            m.id === savedId || (payload.id && m.id === payload.id)
              ? finalSaved
              : m
          );
        } else {
          return [finalSaved, ...prev];
        }
      });

      await logAction(
        userProfile?.email || "admin",
        editingMesa ? "EDITAR_MESA_EXAMEN" : "CREAR_MESA_EXAMEN",
        `Materia: ${materia}, Aula: ${aula}, Fecha: ${fecha}, Inscriptos: ${enrolledList.length}`
      );
      setIsModalOpen(false);
      setPanelSuccess(editingMesa ? "Mesa de examen actualizada." : "Mesa de examen creada con éxito.");
      notify.success(editingMesa ? "Mesa de examen actualizada." : "Mesa de examen creada con éxito.");

      getMesasExamen(true).then((fresh) => {
        if (fresh && fresh.length > 0) {
          setMesas(fresh);
        }
      });
    } catch (err: unknown) {
      if (err instanceof AppwriteException) {
        setModalError(
          err.code === 401
            ? "Sin permisos para realizar esta acción. Verificá tu sesión."
            : err.code === 409
            ? "Conflicto en la base de datos. Ya existe un registro con esos datos."
            : `Error de Appwrite (${err.code}): ${err.message}`
        );
      } else {
        setModalError("Ocurrió un error inesperado al guardar. Intentá de nuevo.");
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Filtrado de mesas por búsqueda y materia
  const filteredMesas = mesas.filter((m) => {
    if (materiaFilter && m.materia !== materiaFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const mat = (m.materia || "").toLowerCase();
    const aul = (m.aula || "").toLowerCase();
    const pres = (m.presidenteNombre || "").toLowerCase();
    const v1 = (m.vocal1Nombre || "").toLowerCase();
    const v2 = (m.vocal2Nombre || "").toLowerCase();
    const al = (m.alumnosInscriptos || []).some((a) =>
      (a || "").toLowerCase().includes(q)
    );
    return (
      mat.includes(q) ||
      aul.includes(q) ||
      pres.includes(q) ||
      v1.includes(q) ||
      v2.includes(q) ||
      al
    );
  });

  const canManage = role === "admin" || role === "directivo" || role === "preceptor";

  return (
    <div className="space-y-6">
      {/* Feedback alerts del PANEL EXTERIOR */}
      {panelSuccess && (
        <div className="flex items-center gap-2 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in">
          <Check size={18} className="shrink-0" />
          <span>{panelSuccess}</span>
        </div>
      )}
      {panelError && (
        <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <span>{panelError}</span>
        </div>
      )}

      {/* ─── BANNER INTELIGENTE PARA ALUMNOS (Autocompletado y Escáner) ──────── */}
      {role === "alumno" && (
        <div className="p-6 rounded-[32px] bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/25 backdrop-blur-md shadow-lg space-y-4 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shadow-[0_0_25px_rgba(var(--verde-rgb),0.3)] shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text)]">
                  Inscripción Rápida a Mesas de Examen
                </h3>
                <p className="text-xs font-semibold text-[var(--text2)]">
                  Sesión activa: <span className="font-bold text-[var(--text)]">{alumnoRecord?.nombre || userProfile?.nombre}</span>
                  {alumnoRecord?.dni && <span> · DNI: <span className="font-bold text-[var(--text)]">{alumnoRecord.dni}</span></span>}
                  {alumnoRecord?.curso && <span> · Curso: <span className="font-bold text-[var(--text)]">{alumnoRecord.curso}</span></span>}
                </p>
                <p className="text-[11px] text-[var(--text3)] mt-0.5">
                  Tus datos se autocompletan en la planilla con 1 solo clic, o podés escanear el código QR del aula.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setScannerMode("student");
                  setIsQRScannerOpen(true);
                }}
                className="flex-1 sm:flex-initial bg-[var(--verde)] hover:brightness-110 text-black font-black px-4 py-3 rounded-2xl shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Camera size={16} />
                <span>Escanear QR de Mesa</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStudentQRModalOpen(true)}
                className="flex-1 sm:flex-initial bg-[var(--bg3)] hover:bg-[var(--bg4)] border border-[var(--border)] text-[var(--text)] font-bold px-4 py-3 rounded-2xl hover:border-[var(--verde)] transition-all flex items-center justify-center gap-2 text-xs active:scale-95 cursor-pointer"
              >
                <IdCard size={16} className="text-[var(--verde)]" />
                <span>Mi Credencial QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header y Filtros */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md will-change-gpu border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
              <ClipboardCheck className="text-[var(--verde)]" /> Cronograma de Mesas de Examen
            </h3>
            <p className="text-[var(--text2)] text-xs font-bold uppercase tracking-wider mt-1">
              Planificación oficial de tribunales y planillas de examen
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                type="text"
                placeholder="Buscar por materia, docente o alumno..."
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 sm:py-2 text-sm font-semibold outline-none text-[var(--text)] focus:border-[var(--verde)] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Selector de Materias basado en Plan de Estudios */}
            <select
              value={materiaFilter}
              onChange={(e) => setMateriaFilter(e.target.value)}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2.5 sm:py-2 text-xs font-bold text-[var(--text)] outline-none focus:border-[var(--verde)] cursor-pointer w-full sm:w-auto shadow-xs"
              title="Filtrar mesas por materia del Plan de Estudios"
            >
              <option value="">Todas las Materias</option>
              {PLAN_DE_ESTUDIOS.map((cat) => (
                <optgroup key={cat.id} label={`${cat.name} (${cat.materias.length})`}>
                  {cat.materias.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="flex items-center gap-2">
              {canManage && (
                <button
                  onClick={openCreateModal}
                  className="flex-1 sm:flex-initial bg-[var(--verde)] text-black font-black text-xs px-4 py-2.5 rounded-xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 no-print cursor-pointer"
                >
                  <Plus size={16} /> <span>Crear Mesa</span>
                </button>
              )}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex-1 sm:flex-initial bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[var(--bg4)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 no-print cursor-pointer"
                title="Generar acta volante oficial de examen con libro, folio y firmas o exportar a Excel"
              >
                <Printer size={16} /> <span>Actas Oficiales (PDF/Excel)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grilla de Mesas de Examen */}
        {filteredMesas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMesas.map((m) => {
              const studentEnrolled = role === "alumno" && isStudentEnrolledInMesa(m);

              return (
                <div
                  key={m.id}
                  className={`bg-white/50 dark:bg-slate-950/20 border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between ${
                    studentEnrolled 
                      ? "border-emerald-500/50 bg-emerald-500/[0.03]" 
                      : m.estado === "borrador" 
                      ? "border-amber-500/30" 
                      : m.estado === "evaluada" 
                      ? "border-emerald-500/30" 
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="space-y-4">
                    {/* State Tag badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--verde)] bg-[var(--verde-bg)] border border-[var(--verde-border)] px-2.5 py-0.5 rounded-lg">
                        {m.aula}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {m.estado === "borrador" && (
                          <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">
                            Borrador
                          </span>
                        )}
                        {m.estado === "confirmada" && (
                          <span className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">
                            Confirmada
                          </span>
                        )}
                        {m.estado === "evaluada" && (
                          <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">
                            Evaluada
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-black text-base text-[var(--text)] line-clamp-1">{m.materia}</h4>
                      <div className="flex items-center gap-3 text-xs text-[var(--text2)] font-semibold pt-0.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-[var(--text3)]" />
                          <span>{m.fecha}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-[var(--text3)]" />
                          <span>{m.hora} hs</span>
                        </span>
                      </div>
                    </div>

                    {/* Tribunal */}
                    <div className="space-y-1 pt-2 border-t border-[var(--border)] text-xs">
                      <span className="font-bold text-[var(--text3)] uppercase text-[9px] tracking-wider block">Tribunal</span>
                      <p className="font-bold text-[var(--text)]">
                        <span className="text-[var(--text3)] font-normal">P:</span> {m.presidenteNombre}
                      </p>
                      {m.vocal1Nombre && (
                        <p className="font-semibold text-[var(--text2)]">
                          <span className="text-[var(--text3)] font-normal">V1:</span> {m.vocal1Nombre}
                        </p>
                      )}
                      {m.vocal2Nombre && (
                        <p className="font-semibold text-[var(--text2)]">
                          <span className="text-[var(--text3)] font-normal">V2:</span> {m.vocal2Nombre}
                        </p>
                      )}
                      {!m.vocal1Nombre && (
                        <p className="text-amber-500/90 font-semibold italic text-[11px] flex items-center gap-1.5">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>Sin vocales asignados</span>
                        </p>
                      )}
                    </div>

                    {/* Alumnos inscriptos */}
                    <div className="pt-2 border-t border-[var(--border)] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text3)] uppercase text-[9px] tracking-wider block">
                          Inscriptos en Planilla
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)] rounded-md">
                          {(m.alumnosInscriptos || []).length}
                        </span>
                      </div>

                      {role === "alumno" ? (
                        <div className="mt-1.5">
                          {studentEnrolled ? (
                            <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                              <CheckCircle2 size={15} className="shrink-0" />
                              <span>Inscripto en Planilla Oficial</span>
                            </div>
                          ) : (
                            <p className="text-[var(--text3)] font-semibold text-xs italic">
                              {(m.alumnosInscriptos || []).length > 0
                                ? `${(m.alumnosInscriptos || []).length} estudiante(s) anotado(s)`
                                : "Aún no hay inscriptos"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[var(--text2)] truncate font-medium text-xs mt-1">
                          {(m.alumnosInscriptos && m.alumnosInscriptos.length > 0)
                            ? m.alumnosInscriptos.join(", ")
                            : "Sin inscriptos"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones de Tarjeta */}
                  <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                    {/* Botón de QR de Mesa para Proyectar */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMesaForQR(m);
                        setIsMesaQRModalOpen(true);
                      }}
                      className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] hover:border-[var(--verde)] text-[var(--text2)] hover:text-[var(--text)] transition-colors active:scale-95"
                      title="Proyectar o ver código QR de la mesa para el aula"
                    >
                      <QrCode size={15} className="text-[var(--verde)]" />
                    </button>

                    {/* Acciones para Alumnos (Autocompletado de Planilla con 1 Clic) */}
                    {role === "alumno" && (
                      <div className="flex-1 flex justify-end">
                        {studentEnrolled ? (
                          m.estado !== "evaluada" && (
                            <button
                              type="button"
                              onClick={() => handleSelfUnenroll(m)}
                              disabled={loading}
                              className="px-3 py-1.5 rounded-xl border border-[var(--rojo-border)] hover:bg-[var(--rojo-bg)] text-[var(--rojo)] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              Cancelar Inscripción
                            </button>
                          )
                        ) : (
                          m.estado !== "evaluada" && (
                            <button
                              type="button"
                              onClick={() => handleSelfEnroll(m)}
                              disabled={loading}
                              className="px-4 py-2 rounded-xl bg-[var(--verde)] hover:brightness-110 text-black font-black text-xs shadow-sm hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <UserCheck size={14} />
                              <span>Inscribirme a la Planilla</span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Acciones de Gestión (Docente/Preceptor/Admin) */}
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] transition-colors active:scale-90"
                          title="Editar Mesa y Gestionar Planilla"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id!)}
                          className="p-2 rounded-xl border border-[var(--rojo-border)] hover:bg-[var(--rojo-bg)] text-[var(--rojo)] transition-colors active:scale-90"
                          title="Eliminar Mesa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <ClipboardCheck size={40} className="mx-auto text-[var(--text3)] mb-2 animate-pulse" />
            <p className="text-sm font-bold text-[var(--text2)]">No se encontraron mesas de examen registradas.</p>
          </div>
        )}
      </div>

      {/* ─── MODAL CREAR / EDITAR MESA CON GESTOR INTELIGENTE DE PLANILLA ───── */}
      {mounted && isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-[var(--bg)] w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in my-0 sm:my-auto max-h-[92dvh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-black title-font text-[var(--text)]">
                  {editingMesa ? "Editar Mesa de Examen" : "Crear Mesa de Examen"}
                </h2>
                <p className="text-[var(--text2)] text-xs mt-1 font-bold uppercase tracking-wider">
                  Tribunal evaluador y planilla de alumnos inscriptos
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Error del MODAL */}
            {modalError && (
              <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
                <AlertCircle size={14} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Alerta de Feriado */}
            {currentHoliday && (
              <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-bold mt-4 animate-fade-in">
                <AlertCircle size={14} className="shrink-0" />
                <span>Es día feriado: <span className="underline">{currentHoliday.nombre}</span> ({currentHoliday.tipo})</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label 
                    htmlFor="exam-fecha"
                    className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2 cursor-pointer select-none"
                    onClick={() => { try { (document.getElementById("exam-fecha") as HTMLInputElement)?.showPicker?.(); } catch {} }}
                  >
                    Fecha *
                  </label>
                  <input
                    id="exam-fecha"
                    type="date"
                    required
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm cursor-pointer"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Hora Fin *</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                  />
                </div>
              </div>

              <SubjectSelect
                required
                label="Materia / Espacio Curricular"
                value={materia}
                onChange={setMateria}
                placeholder="— Seleccionar Materia del Plan de Estudios —"
                extraSubjects={editingMesa?.materia ? [editingMesa.materia] : []}
              />

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Aula Física *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aula 3, Biblioteca, Laboratorio..."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                  value={aula}
                  onChange={(e) => setAula(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Presidente de Mesa *</label>
                <select
                  required
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm text-[var(--text)]"
                  value={presidenteId}
                  onChange={(e) => setPresidenteId(e.target.value)}
                >
                  <option value="">— Seleccionar Presidente —</option>
                  {profesores.map(p => <option key={p.id || p.dni} value={p.id || p.dni}>{p.nombre} (DNI: {p.dni})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Vocal 1</label>
                  <select
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-xs text-[var(--text)]"
                    value={vocal1Id}
                    onChange={(e) => setVocal1Id(e.target.value)}
                  >
                    <option value="">— Sin Asignar —</option>
                    {profesores.map(p => <option key={p.id || p.dni} value={p.id || p.dni}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Vocal 2</label>
                  <select
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-xs text-[var(--text)]"
                    value={vocal2Id}
                    onChange={(e) => setVocal2Id(e.target.value)}
                  >
                    <option value="">— Sin Asignar —</option>
                    {profesores.map(p => <option key={p.id || p.dni} value={p.id || p.dni}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* ─── SECCIÓN: GESTOR INTELIGENTE DE PLANILLA DE ALUMNOS ───────── */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg2)]/60 border border-[var(--border)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[var(--verde)] shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text)]">
                        Planilla de Alumnos Inscriptos ({enrolledList.length})
                      </h4>
                      <p className="text-[10px] text-[var(--text3)] font-semibold">
                        Autocompletado desde la base de alumnos o escaneo de credencial
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScannerMode("manager");
                        setIsQRScannerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] text-xs font-black hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Escanear DNI o código QR de credencial del alumno para cargarlo al instante"
                    >
                      <Camera size={14} />
                      <span>Escanear Credencial</span>
                    </button>
                  </div>
                </div>

                {/* Buscador predictivo de Alumnos */}
                <div className="relative">
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                    <input
                      type="text"
                      placeholder="Buscar alumno por nombre, apellido o DNI..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold outline-none text-[var(--text)] focus:border-[var(--verde)]"
                    />
                  </div>

                  {/* Desplegable de sugerencias de autocompletado */}
                  {filteredStudentSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-zoom-in">
                      <div className="p-2 divide-y divide-[var(--border)]">
                        {filteredStudentSuggestions.map((st) => (
                          <button
                            key={st.id || st.dni}
                            type="button"
                            onClick={() => handleAddStudentToPlanilla(st)}
                            className="w-full p-2.5 text-left hover:bg-[var(--bg3)] transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-xs text-[var(--text)] group-hover:text-[var(--verde)]">
                                {st.nombre}
                              </p>
                              <p className="text-[10px] text-[var(--text3)] font-semibold">
                                DNI: {st.dni} {st.curso ? `· Curso: ${st.curso}` : ""}
                              </p>
                            </div>
                            <span className="text-[10px] font-black text-[var(--verde)] bg-[var(--verde-bg)] px-2 py-0.5 rounded-lg border border-[var(--verde-border)] flex items-center gap-1">
                              <Plus size={11} /> Agregar
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones de carga masiva por curso y manual */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedCourseToLoad}
                    onChange={(e) => {
                      setSelectedCourseToLoad(e.target.value);
                      handleAddCourseStudents(e.target.value);
                    }}
                    className="w-full sm:w-1/2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-2 text-xs font-bold text-[var(--text)] outline-none focus:border-[var(--verde)]"
                  >
                    <option value="">— Cargar curso completo... —</option>
                    {cursos.map(c => (
                      <option key={c.id || c.nombre} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] text-[var(--text2)] text-xs font-bold transition-all active:scale-95"
                  >
                    {showManualInput ? "Ocultar manual" : "Agregar alumno manual"}
                  </button>

                  {enrolledList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("¿Vaciar la lista de alumnos inscriptos?")) setEnrolledList([]);
                      }}
                      className="ml-auto text-[10px] font-black uppercase text-rose-500 hover:underline"
                    >
                      Vaciar Lista
                    </button>
                  )}
                </div>

                {/* Formulario de carga manual libre (fallback) */}
                {showManualInput && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Ej: González Laura (DNI: 45192831)"
                      value={manualStudentInput}
                      onChange={(e) => setManualStudentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddManualStudent();
                        }
                      }}
                      className="flex-1 bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-semibold outline-none text-[var(--text)]"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualStudent}
                      className="px-3 py-2 rounded-xl bg-[var(--verde)] text-black font-black text-xs hover:brightness-110 active:scale-95"
                    >
                      Agregar
                    </button>
                  </div>
                )}

                {/* Lista visual de inscriptos (Chips) */}
                {enrolledList.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {enrolledList.map((studentItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--verde)] px-3 py-1.5 rounded-xl text-xs text-[var(--text)] font-semibold transition-all group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--verde)]" />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{studentItem}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentFromPlanilla(idx)}
                          className="text-[var(--text3)] hover:text-rose-500 transition-colors p-0.5"
                          title="Quitar de la planilla"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-[var(--border)] rounded-xl">
                    <p className="text-xs text-[var(--text3)] font-semibold">
                      La planilla no tiene alumnos inscriptos todavía. Buscá arriba por DNI o curso para autocompletar.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Estado de la Mesa</label>
                <select
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm text-[var(--text)]"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as any)}
                >
                  <option value="borrador">Borrador (Mesa en planeación)</option>
                  <option value="confirmada">Confirmada (Tribunal completo listo)</option>
                  <option value="evaluada">Evaluada (Exámenes tomados y cerrados)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setModalError(""); }}
                  className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95 text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={modalLoading || !!currentHoliday}
                  className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all text-sm"
                >
                  {modalLoading ? "Guardando..." : (editingMesa ? "Actualizar Mesa" : "Crear Mesa")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL LECTOR QR INTEGRADO DE EXÁMENES ───────────────────────────── */}
      <ExamQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        mode={scannerMode}
        onMesaScanned={handleStudentScanMesa}
        onStudentScanned={handleManagerScanStudent}
        lastAddedStudent={lastScannedStudent}
        title={scannerMode === "student" ? "Escanear QR de Mesa" : "Escanear Credencial de Alumno"}
        subtitle={scannerMode === "student" ? "Inscripción instantánea con tu usuario" : "Carga continua a la planilla"}
      />

      {/* ─── MODAL PROYECTOR DE QR DE MESA (Para el Aula) ────────────────────── */}
      <MesaQRModal
        isOpen={isMesaQRModalOpen}
        onClose={() => {
          setIsMesaQRModalOpen(false);
          setSelectedMesaForQR(null);
        }}
        mesa={selectedMesaForQR}
      />

      {/* ─── MODAL CREDENCIAL DIGITAL DE EXAMEN DEL ALUMNO ──────────────────── */}
      <StudentExamQRModal
        isOpen={isStudentQRModalOpen}
        onClose={() => setIsStudentQRModalOpen(false)}
        userProfile={userProfile}
        alumno={alumnoRecord}
      />

      {/* ─── MODAL EXPORTADOR OFICIAL DE ACTAS Y PLANILLAS ───────────────────── */}
      <OfficialDocumentExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        alumnos={alumnos}
        cursos={cursos}
        mesas={mesas}
        initialDocType="acta"
      />
    </div>
  );
}
