"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { account } from "@/lib/appwrite";
import { subscribeToAusencias, saveAusencia, Ausencia, deleteAusencia, updateAusenciaStatus, getUserProfile, UserProfile, logAction, getProfesores, Profesor, getAlumnos, getHorarios, Alumno, Horario, deleteProfesor, deleteAlumno, deleteHorario, saveProfesor, saveAlumno, saveHorario, getLogs, getUsuarios, deleteUserProfile, getCursos, deleteCurso, Curso, updateUserProfile, updateAlumno, migrateToCompactFormat, MigrationResult } from "@/lib/dataService";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NewAbsenceModal from "@/components/NewAbsenceModal";
import NewTeacherReportModal from "@/components/NewTeacherReportModal";
import NewTeacherModal from "@/components/NewTeacherModal";
import NewStudentModal from "@/components/NewStudentModal";
import NewUserModal from "@/components/NewUserModal";
import NewScheduleModal from "@/components/NewScheduleModal";
import NewCourseModal from "@/components/NewCourseModal";
import CustomSelect from "@/components/CustomSelect";
import UserProfileModal from "@/components/UserProfileModal";
import SendNoticeModal from "@/components/SendNoticeModal";
import { 
  LayoutDashboard, 
  ClipboardList, 
  CalendarDays, 
  GraduationCap, 
  Users, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  Search, 
  Trash2, 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Ban,
  Settings,
  FolderOpen,
  Coffee,
  RefreshCw,
  Mail,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Pencil,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecretAdmin, setShowSecretAdmin] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeacherReportModalOpen, setIsTeacherReportModalOpen] = useState(false);
  const [editingProfesor, setEditingProfesor] = useState<Profesor | null>(null);
  const [reportModalInitialTipo, setReportModalInitialTipo] = useState("Paro Docente");
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSendNoticeModalOpen, setIsSendNoticeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"hoy" | "semana">("hoy");
  const [selectedMobileDay, setSelectedMobileDay] = useState<string>("Lunes");
  const [scheduleQuery, setScheduleQuery] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: "", onConfirm: () => {}});
  const [hasMounted, setHasMounted] = useState(false);
  const [promotions, setPromotions] = useState<Record<string, string>>({});
  const [promoSearchQuery, setPromoSearchQuery] = useState("");
  const [promoFilterCourse, setPromoFilterCourse] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const sidebarLeaveTimeout = useRef<NodeJS.Timeout | null>(null);
  // Cache TTL: evita re-fetchear si el dato tiene menos de 60 segundos
  const dataCache = useRef<Map<string, number>>(new Map());
  const CACHE_TTL = 60_000;
  const isFresh = (key: string) => {
    const t = dataCache.current.get(key);
    return !!t && Date.now() - t < CACHE_TTL;
  };
  const stamp = (key: string) => dataCache.current.set(key, Date.now());

  const handleSidebarEnter = () => {
    if (sidebarLeaveTimeout.current) clearTimeout(sidebarLeaveTimeout.current);
    setIsSidebarCollapsed(false);
  };

  const handleSidebarLeave = () => {
    sidebarLeaveTimeout.current = setTimeout(() => setIsSidebarCollapsed(true), 200);
  };

  useEffect(() => {
    setHasMounted(true);
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser as any);
        // Cargar perfil de Appwrite
        const profile = await getUserProfile(currentUser.$id);
        if (profile) {
          setUserProfile(profile);
          // Cargar datos condicionalmente según el rol para optimizar rendimiento
          if (profile.rol === 'admin' || profile.rol === 'directivo' || profile.rol === 'preceptor') {
            getProfesores().then(d => { setProfesores(d); stamp('profesores'); });
            getAlumnos().then(d => { setAlumnos(d); stamp('alumnos'); });
          } else if (profile.rol === 'profesor') {
            getProfesores().then(d => { setProfesores(d); stamp('profesores'); });
          } else if (profile.rol === 'alumno') {
            getAlumnos().then(d => { setAlumnos(d); stamp('alumnos'); });
          }
          getHorarios().then(d => { setHorarios(d); stamp('horarios'); });
          getCursos().then(d => { setCursos(d); stamp('cursos'); });
          if (profile.rol === 'admin') getLogs().then(d => { setLogs(d); stamp('logs'); });
        } else {
          // Si no hay perfil, algo salió mal en el login, redirigir
          router.push("/");
        }
      } catch (err) {
        router.push("/");
      }
    };
    checkSession();

    const unsubscribeData = subscribeToAusencias((data) => {
      setAusencias(data);
      setLoading(false);
    });

    return () => {
      unsubscribeData();
    };
  }, [router]);

  useEffect(() => {
    if (activeTab === "configuracion" || activeTab === "alumnos") {
      if (!isFresh('usuarios')) getUsuarios().then(d => { setUsuarios(d); stamp('usuarios'); });
    } else if (activeTab === "cursos") {
      if (!isFresh('cursos')) getCursos().then(d => { setCursos(d); stamp('cursos'); });
    } else if (activeTab === "ciclo-lectivo") {
      if (!isFresh('alumnos')) getAlumnos().then(d => { setAlumnos(d); stamp('alumnos'); });
      if (!isFresh('cursos'))  getCursos().then(d => { setCursos(d); stamp('cursos'); });
    } else if (activeTab === "auditoria") {
      if (!isFresh('logs')) getLogs().then(d => { setLogs(d); stamp('logs'); });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "ciclo-lectivo") {
      const initialPromotions: Record<string, string> = {};
      alumnos.forEach(al => {
        initialPromotions[al.id!] = al.curso;
      });
      setPromotions(initialPromotions);
    }
  }, [activeTab, alumnos]);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.rol === 'alumno') {
        setActiveTab("horarios");
      }
    }
  }, [userProfile]);

  // Sistema de Auto-Logout por Inactividad (15 Minutos)
  // Performance: mousemove is throttled to fire reset at most once every 5 seconds
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    let lastMouseMove = 0;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        showToast("Sesión cerrada por inactividad (15 min). Volvé a ingresar.", "error");
        setTimeout(() => handleLogout(), 2000);
      }, 15 * 60 * 1000);
    };

    const throttledMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseMove > 5000) {
        lastMouseMove = now;
        resetTimer();
      }
    };

    window.addEventListener("mousemove", throttledMouseMove, { passive: true });
    window.addEventListener("keydown", resetTimer, { passive: true });
    window.addEventListener("click", resetTimer, { passive: true });
    window.addEventListener("scroll", resetTimer, { passive: true });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", throttledMouseMove);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [user]);

  const currentProfesor = profesores.find(p => p.email.toLowerCase() === user?.email?.toLowerCase());
  const currentAlumno = alumnos.find(a => a.email.toLowerCase() === user?.email?.toLowerCase());



  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/");
    } catch { /* redirect igualmente */ }
  };

  const showToast = (message: string, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };


  const isAdmin = userProfile?.rol === 'admin' || userProfile?.rol === 'directivo' || userProfile?.rol === 'preceptor';
  const isSuperAdmin = userProfile?.rol === 'admin';
  const isDirector = userProfile?.rol === 'directivo';
  const isPreceptor = userProfile?.rol === 'preceptor';
  
  // Jerarquía: Preceptor no puede gestionar ausencias. Solo Directivo y Admin.
  const canManageAusencias = isSuperAdmin || isDirector;
  const canManageColaboradores = isSuperAdmin || isDirector;

  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, message, onConfirm });
  };

  const handleDelete = async (id: string) => {
    if (!canManageAusencias) return showToast("No tienes permisos para eliminar ausencias", "error");
    askConfirm("¿Estás seguro de eliminar este registro? Esta acción quedará registrada en el sistema de auditoría.", async () => {
      // Optimistic update: remove immediately from local state
      const prev = ausencias;
      setAusencias(current => current.filter(a => a.id !== id));
      try {
        await deleteAusencia(id);
        await logAction(user?.email || "desconocido", "BORRAR_AUSENCIA", `ID: ${id}`);
        showToast("Registro eliminado con éxito", "success");
      } catch (error) {
        // Rollback on failure
        setAusencias(prev);
        showToast("Error al eliminar", "error");
      }
    });
  };

  const handleChangeStatus = async (id: string, status: "pendiente" | "aprobada" | "rechazada") => {
    if (!canManageAusencias) return showToast("No tienes permisos para modificar el estado", "error");
    // Save previous state for rollback
    const previousStatus = ausencias.find(a => a.id === id)?.estado;
    // Optimistic update: change state immediately without waiting for API
    setAusencias(current => current.map(a => a.id === id ? { ...a, estado: status } : a));
    try {
      await updateAusenciaStatus(id, status);
      logAction(user?.email || "desconocido", "CAMBIO_ESTADO", `ID: ${id} -> Nuevo estado: ${status}`);
      showToast(`Estado actualizado a ${status}`, "success");
    } catch (error) {
      // Rollback on failure
      if (previousStatus) {
        setAusencias(current => current.map(a => a.id === id ? { ...a, estado: previousStatus } : a));
      }
      showToast("Error al actualizar estado", "error");
    }
  };

  // APROBACIONES DE DIRECTIVOS, PRECEPTORES Y PROFESORES (Hecho por Admin/Director)
  const handleApproveRequest = async (u: UserProfile) => {
    try {
      const cleanRole = u.rol.replace("pendiente_", "") as UserProfile["rol"];
      await updateUserProfile(u.id!, { rol: cleanRole });

      // Bug fix: when approving a profesor, auto-create a Profesor record so the
      // teacher's dashboard features work immediately without manual admin setup.
      if (cleanRole === "profesor") {
        const existingTeachers = await getProfesores();
        const alreadyExists = existingTeachers.some(
          t => t.email.toLowerCase() === u.email.toLowerCase()
        );
        if (!alreadyExists) {
          await saveProfesor({
            nombre: u.nombre,
            dni: "",        // Admin can fill DNI and materias later
            materias: [],
            email: u.email,
          });
          getProfesores().then(setProfesores);
        }
      }

      await logAction(user?.email || "desconocido", "APROBAR_COLABORADOR", `Email: ${u.email}, Rol: ${cleanRole}`);
      showToast(`Solicitud de ${u.nombre} aprobada como ${cleanRole}`, "success");
      // Optimistic local update instead of refetch
      setUsuarios(prev => prev.map(usr => usr.id === u.id ? { ...usr, rol: cleanRole } : usr));
    } catch (err) {
      showToast("Error al aprobar solicitud", "error");
    }
  };

  const handleRejectRequest = async (u: UserProfile) => {
    askConfirm(`¿Estás seguro de rechazar la solicitud de ${u.nombre}? Se eliminará su registro.`, async () => {
      try {
        await deleteUserProfile(u.id!);
        if ((u.rol as string) === "pendiente_profesor") {
          const teachers = await getProfesores();
          const t = teachers.find(item => item.email.toLowerCase() === u.email.toLowerCase());
          if (t && t.id) {
            await deleteProfesor(t.id);
          }
        }
        await logAction(user?.email || "desconocido", "RECHAZAR_SOLICITUD", `Email: ${u.email}, Rol: ${u.rol}`);
        showToast("Solicitud rechazada y eliminada", "success");
        getUsuarios().then(setUsuarios);
      } catch (err) {
        showToast("Error al rechazar solicitud", "error");
      }
    });
  };

  // APROBACIONES DE ALUMNOS (Hecho por Preceptor)
  const handleApproveStudent = async (u: UserProfile) => {
    try {
      await updateUserProfile(u.id!, { rol: "alumno" });
      await logAction(user?.email || "desconocido", "APROBAR_ALUMNO", `Email: ${u.email}`);
      showToast(`Matriculación de ${u.nombre} aprobada con éxito`, "success");
      getUsuarios().then(setUsuarios);
      getAlumnos().then(setAlumnos);
    } catch (err) {
      showToast("Error al aprobar alumno", "error");
    }
  };

  const handleRejectStudent = async (u: UserProfile) => {
    askConfirm(`¿Estás seguro de rechazar la matrícula de ${u.nombre}? Se eliminará su registro de alumno.`, async () => {
      try {
        await deleteUserProfile(u.id!);
        const studDetails = alumnos.find(a => a.email.toLowerCase() === u.email.toLowerCase());
        if (studDetails && studDetails.id) {
          await deleteAlumno(studDetails.id);
        }
        await logAction(user?.email || "desconocido", "RECHAZAR_ALUMNO", `Email: ${u.email}`);
        showToast("Matriculación rechazada", "success");
        getUsuarios().then(setUsuarios);
        getAlumnos().then(setAlumnos);
      } catch (err) {
        showToast("Error al rechazar alumno", "error");
      }
    });
  };

  // Memoized derived state — avoids costly recalculations on every render
  const filteredAusencias = useMemo(() => ausencias.filter(a => {
    if (userProfile?.rol === 'profesor') {
      return currentProfesor && a.profId === currentProfesor.id;
    }
    const q = searchQuery.toLowerCase();
    return a.profNombre.toLowerCase().includes(q) || a.tipo.toLowerCase().includes(q);
  }), [ausencias, userProfile?.rol, currentProfesor, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now); monday.setDate(diff);
    const friday = new Date(now); friday.setDate(diff + 4);
    const mondayStr = monday.toISOString().split('T')[0];
    const fridayStr = friday.toISOString().split('T')[0];

    return {
      total: ausencias.filter(a => a.estado === 'aprobada').length,
      pendientes: ausencias.filter(a => a.estado === 'pendiente').length,
      hoy: ausencias.filter(a =>
        a.estado === 'aprobada' && today >= a.inicio && today <= a.fin
      ).length,
      semana: ausencias.filter(a =>
        a.estado === 'aprobada' && a.inicio <= fridayStr && a.fin >= mondayStr
      ).length,
    };
  }, [ausencias]);

  const handleLogoClick = () => {
    if (userProfile?.rol === 'alumno') {
      setActiveTab("horarios");
    } else {
      setActiveTab("general");
    }

    if (isSuperAdmin) {
      const newClicks = logoClicks + 1;
      setLogoClicks(newClicks);
      if (newClicks >= 5) {
        setShowSecretAdmin(!showSecretAdmin);
        setLogoClicks(0);
        showToast(showSecretAdmin ? "Modo Sigilo Activado" : "Modo Admin Revelado", "success");
      }
    }
  };

  const getAbsencesByDay = () => {
    const counts = { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0 };
    ausencias.forEach(a => {
      const date = new Date(a.inicio + "T00:00:00");
      const day = date.getDay();
      if (day === 1) counts.Lunes++;
      else if (day === 2) counts.Martes++;
      else if (day === 3) counts.Miércoles++;
      else if (day === 4) counts.Jueves++;
      else if (day === 5) counts.Viernes++;
    });
    return counts;
  };

  const getAbsenceTypeCounts = () => {
    const counts: Record<string, number> = {};
    ausencias.forEach(a => {
      if (a.tipo) {
        counts[a.tipo] = (counts[a.tipo] || 0) + 1;
      }
    });
    return counts;
  };

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

  const getVisibleSlots = () => {
    const allSlots = [
      ...morningSlots,
      "RECESO",
      ...afternoonSlots
    ];

    // Admins, directivos, and preceptors always see all slots so they can
    // add PE or cross-shift classes freely. Only students get smart trimming.
    if (userProfile?.rol !== 'alumno') {
      return allSlots;
    }

    const effectiveCourse = currentAlumno?.curso || "";
    if (!effectiveCourse) return allSlots;

    const courseSchedules = horarios.filter(h => h.curso === effectiveCourse);
    if (courseSchedules.length === 0) return allSlots;

    const hasMorning = courseSchedules.some(h => morningSlots.includes(h.hora));
    const hasAfternoon = courseSchedules.some(h => afternoonSlots.includes(h.hora));

    // For students: show only the relevant shift + a short PE window from the other shift
    if (hasMorning && !hasAfternoon) {
      // Morning course: show morning + first 2 afternoon slots for possible PE
      return [...morningSlots, "RECESO", afternoonSlots[0], afternoonSlots[1]];
    }
    if (hasAfternoon && !hasMorning) {
      // Afternoon course: show last 2 morning slots for possible PE + afternoon
      const peSlots = morningSlots.filter(s => !s.startsWith("RECREO:")).slice(-2);
      return [...peSlots, "RECESO", ...afternoonSlots];
    }

    return allSlots;
  };

  const exportToExcel = () => {
    const effectiveCourse = userProfile?.rol === 'alumno' ? (currentAlumno?.curso || "SinCurso") : (selectedCourse || "Todos_Cursos");
    const fileName = `Cronograma_${effectiveCourse}.xls`;

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const slots = getVisibleSlots();

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Cronograma</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    html += `<body><table border="1">`;
    
    // Header row
    html += `<tr style="background-color: #10B981; color: white; font-weight: bold; text-align: center;">`;
    html += `<th style="padding: 10px;">Horario</th>`;
    days.forEach(d => {
      html += `<th style="padding: 10px; min-width: 150px;">${d}</th>`;
    });
    html += `</tr>`;

    // Data rows
    slots.forEach(slot => {
      if (slot === "RECESO") {
        html += `<tr style="background-color: #f3f4f6; text-align: center; font-weight: bold; height: 30px;">`;
        html += `<td colspan="6">CAMBIO DE TURNO / RECESO</td>`;
        html += `</tr>`;
      } else if (slot.startsWith("RECREO:")) {
        html += `<tr style="background-color: #e6f7f0; text-align: center; color: #10B981; font-weight: bold; height: 30px;">`;
        html += `<td colspan="6">RECREO</td>`;
        html += `</tr>`;
      } else {
        html += `<tr style="height: 50px;">`;
        html += `<td style="font-weight: bold; background-color: #f9fafb; text-align: center; padding: 5px;">${slot}</td>`;
        days.forEach(dia => {
          const h = horarios.find(item => 
            item.dia === dia && 
            item.hora === slot && 
            (effectiveCourse === "" || item.curso === effectiveCourse)
          );
          if (h) {
            html += `<td style="padding: 8px; text-align: center; vertical-align: middle;"><b>${h.materia}</b><br/><font size="2" color="#4b5563">Prof. ${h.profesor}</font><br/><font size="1" color="#9ca3af">${h.curso}</font></td>`;
          } else {
            html += `<td style="color: #cbd5e1; font-style: italic; text-align: center; vertical-align: middle;">Hora Libre</td>`;
          }
        });
        html += `</tr>`;
      }
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Excel del cronograma descargado", "success");
  };

  const renderFreeHoursWidget = (isStudent = false) => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const daysMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const todayDayName = daysMap[new Date().getDay()];

    const getHolidayToday = () => {
      const today = new Date();
      const mmDd = today.toLocaleDateString("en-CA").slice(5);

      const holidays: {[key: string]: { name: string; type: "nacional" | "provincial" | "local" }} = {
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

        // Provinciales (Chubut) - Días no laborables con suspensión oficial de clases
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
        <div className="p-6 rounded-3xl border bg-[var(--azul-bg)]/20 border-[var(--azul-border)] shadow-[0_10px_30px_rgba(59,130,246,0.08)] flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in no-print">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-[var(--azul-bg)] text-[var(--azul)] flex items-center justify-center text-2xl shrink-0">
              🎉
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

    // Profesores ausentes hoy (aprobados)
    const activeAbsencesToday = ausencias.filter(a => 
      a.estado === 'aprobada' && 
      todayStr >= a.inicio && 
      todayStr <= a.fin
    );

    // Clases afectadas hoy
    let freeHoursToday = horarios.filter(h => 
      h.dia === todayDayName &&
      activeAbsencesToday.some(a => a.profNombre === h.profesor)
    );

    // Si es estudiante, filtrar solo por su curso
    if (isStudent) {
      if (!currentAlumno) return null;
      freeHoursToday = freeHoursToday.filter(h => h.curso === currentAlumno.curso);
    }

    const hasFreeHours = freeHoursToday.length > 0;

    return (
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
        hasFreeHours 
          ? "bg-[var(--amarillo-bg)]/20 border-[var(--amarillo-border)] shadow-[0_10px_30px_rgba(245,158,11,0.05)]" 
          : "bg-[var(--verde-bg)]/10 border-[var(--verde-border)]/40 shadow-[0_10px_30px_rgba(16,185,129,0.02)]"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
              hasFreeHours ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)]" : "bg-[var(--verde-bg)] text-[var(--verde)]"
            }`}>
              {hasFreeHours ? "⚠️" : "✓"}
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
            {freeHoursToday.map((free, idx) => (
              <div 
                key={idx} 
                className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-[var(--border)]/40 shadow-sm flex flex-col justify-between hover:border-[var(--border)] transition-all"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[9px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] px-2 py-0.5 rounded-md border border-[var(--verde-border)] tracking-wider">
                    {free.curso}
                  </span>
                  <span className="text-[10px] font-black bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] px-2.5 py-0.5 rounded-lg uppercase">
                    {free.hora}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--text)] line-clamp-1">{free.materia}</h4>
                  <p className="text-[11px] text-[var(--text3)] font-semibold mt-0.5">Prof: {free.profesor}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
      await getAlumnos().then(setAlumnos);
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
        showToast("Ausencias vaciadas con éxito", "success");
      } finally {
        setLoading(false);
      }
    });
  };

  const checkStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(user.$id);
      if (profile) {
        setUserProfile(profile);
        if (!profile.rol.startsWith("pendiente_")) {
          showToast("¡Tu cuenta ha sido aprobada! Cargando...", "success");
          // Fetch relevant tables based on the newly approved role
          if (profile.rol === 'admin' || profile.rol === 'directivo' || profile.rol === 'preceptor') {
            getProfesores().then(d => { setProfesores(d); stamp('profesores'); });
            getAlumnos().then(d => { setAlumnos(d); stamp('alumnos'); });
          } else if (profile.rol === 'profesor') {
            getProfesores().then(d => { setProfesores(d); stamp('profesores'); });
          } else if (profile.rol === 'alumno') {
            getAlumnos().then(d => { setAlumnos(d); stamp('alumnos'); });
          }
          getHorarios().then(d => { setHorarios(d); stamp('horarios'); });
          getCursos().then(d => { setCursos(d); stamp('cursos'); });
          if (profile.rol === 'admin') getLogs().then(d => { setLogs(d); stamp('logs'); });
        } else {
          showToast("Tu cuenta aún está en revisión.", "error");
        }
      }
    } catch {
      showToast("Error al verificar estado. Intentá de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!hasMounted || loading || !userProfile) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-transparent text-[var(--text)]">
        <div suppressHydrationWarning className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--verde)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // PANTALLA PREMIUM DE ESPERA DE APROBACIÓN POR JERARQUÍA
  if (userProfile && userProfile.rol.startsWith("pendiente_")) {
    const requestedCleanRole = userProfile.rol.replace("pendiente_", "");
    const roleLabels: {[key: string]: string} = {
      directivo: "Director / Directivo",
      preceptor: "Preceptor",
      profesor: "Profesor / Docente",
      alumno: "Alumno / Estudiante"
    };
    const approverLabels: {[key: string]: string} = {
      directivo: "Administrador / Creador del Sistema",
      preceptor: "Directivo / Director de la Escuela",
      profesor: "Directivo / Director de la Escuela",
      alumno: "Preceptor del Curso"
    };

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-transparent text-[var(--text)]">
        {/* DECORATIVE BACKGROUND */}
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[var(--amarillo-bg)] rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-[var(--azul-bg)] rounded-full blur-[140px] animate-pulse"></div>

        <div className="glass w-full max-w-[500px] p-10 md:p-12 rounded-[40px] border border-white/40 shadow-2xl relative z-10 text-center animate-zoom-in">
          <div className="text-[2.2rem] font-black tracking-tighter mb-4 title-font leading-none">
            Escuela<span className="text-[var(--verde)]">Info</span>
          </div>

          <div className="w-20 h-20 bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_10px_30px_rgba(245,158,11,0.2)] animate-pulse">
            <ShieldAlert size={36} />
          </div>

          <h2 className="text-2xl font-black mb-2">Cuenta en Verificación</h2>
          <p className="text-[var(--text2)] text-sm mb-6 font-medium">
            Hola, <span className="text-[var(--text)] font-bold">{userProfile.nombre}</span>. Tu cuenta ha sido registrada con éxito y está en espera de aprobación.
          </p>

          <div className="bg-[var(--bg3)] border border-[var(--border)] p-6 rounded-3xl text-left space-y-3 mb-8 text-xs font-bold shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text3)] uppercase">Tu Gmail:</span>
              <span className="text-[var(--text)]">{userProfile.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text3)] uppercase">Rol Solicitado:</span>
              <span className="text-[var(--verde)] uppercase tracking-wider">{roleLabels[requestedCleanRole] || requestedCleanRole}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text3)] uppercase">Quién Aprueba:</span>
              <span className="text-[var(--text2)]">{approverLabels[requestedCleanRole] || "Personal Autorizado"}</span>
            </div>
          </div>

          {/* TIMELINE PROGRESS */}
          <div className="mb-10 max-w-[340px] mx-auto select-none">
            {/* Row of circles and line */}
            <div className="relative flex justify-between items-center mb-3">
              {/* Progress Line Background (connecting centers of step circles) */}
              <div className="absolute left-[16px] right-[16px] h-[3px] bg-[var(--border)] top-1/2 -translate-y-1/2 z-0 rounded-full"></div>
              {/* Active Progress Line (from step 1 center to step 2 center) */}
              <div className="absolute left-[16px] w-[calc(50%-16px)] h-[3px] bg-[var(--verde)] top-1/2 -translate-y-1/2 z-0 rounded-full shadow-[0_0_10px_rgba(var(--verde-rgb),0.5)]"></div>

              {/* Step 1: Auth */}
              <div className="w-8 h-8 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border-2 border-[var(--verde)] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] z-10 transition-all duration-300">
                <Check size={15} strokeWidth={3} />
              </div>

              {/* Step 2: Request */}
              <div className="w-8 h-8 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border-2 border-[var(--verde)] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] z-10 transition-all duration-300">
                <Check size={15} strokeWidth={3} />
              </div>

              {/* Step 3: Approval */}
              <div className="w-8 h-8 rounded-full bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-2 border-[var(--amarillo)] flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)] z-10 transition-all duration-300">
                <Clock size={15} strokeWidth={2.5} className="animate-pulse" />
              </div>
            </div>

            {/* Row of labels matching the columns */}
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider px-1 text-center">
              <span className="text-[var(--text3)] w-16 -ml-4 text-left">Registro</span>
              <span className="text-[var(--text3)] w-16">Enviada</span>
              <span className="text-[var(--amarillo)] w-16 -mr-4 text-right">Pendiente</span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={checkStatus}
              disabled={loading}
              className="w-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] hover:bg-[var(--verde)] hover:text-black rounded-2xl p-4 text-[0.95rem] font-black cursor-pointer transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Verificar mi estado
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] hover:bg-[var(--rojo)] hover:text-white rounded-2xl p-4 text-[0.95rem] font-bold cursor-pointer transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
            <p className="text-[10px] text-[var(--text3)] uppercase tracking-[0.15em] font-black">
              Si crees que se trata de un error, contacta al Administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-[var(--text)]">
      {/* SIDEBAR DESKTOP */}
      <div
        className={`hidden lg:block shrink-0 h-screen z-50 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[90px]' : 'w-[280px]'
        }`}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        <aside
          className={`sidebar-glass flex flex-col h-full transition-all duration-300 ${
            isSidebarCollapsed ? 'w-[90px] px-4 py-8' : 'w-[280px] px-8 py-8'
          }`}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            user={user}
            userProfile={userProfile}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showSecretAdmin={showSecretAdmin}
            handleLogoClick={handleLogoClick}
            handleLogout={handleLogout}
            onProfileOpen={() => setIsProfileModalOpen(true)}
            onTabChange={(tabId) => {
              if (tabId === 'auditoria') getLogs().then(setLogs);
            }}
            pendingAccessCount={usuarios.filter(u => u.rol.startsWith("pendiente_") && u.rol !== "pendiente_alumno").length}
            pendingAlumnosCount={usuarios.filter(u => u.rol === "pendiente_alumno").length}
          />
        </aside>
      </div>

      {/* MOBILE NAV OVERLAY */}
      <div className={`mobile-nav-overlay lg:hidden ${isMobileMenuOpen ? "open" : ""}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div 
        className={`mobile-sidebar sidebar-glass lg:hidden flex flex-col ${isMobileMenuOpen ? "open" : ""}`} 
      >
        <Sidebar
          isCollapsed={false}
          user={user}
          userProfile={userProfile}
          activeTab={activeTab}
          setActiveTab={(tabId) => {
            setActiveTab(tabId);
            setIsMobileMenuOpen(false);
          }}
          showSecretAdmin={showSecretAdmin}
          handleLogoClick={handleLogoClick}
          handleLogout={handleLogout}
          onProfileOpen={() => setIsProfileModalOpen(true)}
          pendingAccessCount={usuarios.filter(u => u.rol.startsWith("pendiente_") && u.rol !== "pendiente_alumno").length}
          pendingAlumnosCount={usuarios.filter(u => u.rol === "pendiente_alumno").length}
        />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto relative">
        {/* MOBILE HEADER */}
        <header className="lg:hidden flex items-center justify-between p-4 glass border-b border-[var(--border)] sticky top-0 z-40 bg-[var(--bg)]/80">
          <div 
            onClick={handleLogoClick}
            className="title-font text-xl font-black cursor-pointer select-none active:scale-95 transition-transform"
          >
            Escuela<span className="text-[var(--verde)]">Info</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-[var(--bg3)] rounded-lg text-[var(--text2)] hover:text-[var(--text)]"><Menu size={24} /></button>
        </header>

        <div className="p-6 md:p-12 max-w-[1400px] mx-auto">
          {/* HEADER: saludo solo en inicio, título de sección en el resto */}
          {activeTab === "general" ? (
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black title-font mb-2 tracking-tight">¡Hola, {user?.displayName?.split(' ')[0] || "Bienvenido"}!</h1>
                <p className="text-[var(--text2)] text-sm sm:text-lg">
                  {userProfile?.rol === 'alumno' ? "Consulta tu horario y materias asignadas." : "Aquí tienes el control de tu institución en tiempo real."}
                </p>
              </div>
              {userProfile?.rol !== 'alumno' && (
                <button
                  onClick={() => setIsSendNoticeModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] hover:bg-[var(--verde)] hover:text-black rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-md active:scale-95 cursor-pointer"
                >
                  <Mail size={16} />
                  Enviar Aviso por Mail
                </button>
              )}
            </header>
          ) : (
            <header className="hidden lg:flex items-center gap-3 mb-10">
              <h1 className="text-2xl font-black title-font tracking-tight">
                {{
                  ausencias: "Ausencias",
                  horarios: "Horarios",
                  alumnos: "Alumnos",
                  profesores: "Profesores",
                  cursos: "Cursos",
                  configuracion: "Configuración",
                  auditoria: "Auditoría",
                  "ciclo-lectivo": "Ciclo Lectivo",
                }[activeTab] ?? "Panel"}
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text3)] bg-[var(--bg3)] border border-[var(--border)] px-3 py-1 rounded-full">
                EscuelaInfo
              </span>
            </header>
          )}

          {/* CONTENIDO SEGÚN PESTAÑA */}
          {activeTab === "general" && userProfile?.rol !== "alumno" && (
            <div className="space-y-10 animate-fade-in">
              {/* STATS */}
              <div className="grid grid-cols-3 gap-3 md:gap-8">
                 {[
                  { label: "Ausentes Hoy", value: stats.hoy, color: "var(--rojo)", bg: "var(--rojo-bg)" },
                  { label: "Pendientes", value: stats.pendientes, color: "var(--amarillo)", bg: "var(--amarillo-bg)" },
                  { label: "Total Registros", value: stats.total, color: "var(--verde)", bg: "var(--verde-bg)" },
                ].map((stat, i) => (
                  <div key={i} className="stat-card glass p-3 sm:p-6 rounded-2xl sm:rounded-[28px] border border-[var(--border)] group cursor-default text-center sm:text-left">
                    <div className="text-xl sm:text-4xl font-black mb-0.5 sm:mb-1 transition-transform group-hover:scale-110 origin-left" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[7px] sm:text-[11px] uppercase tracking-widest font-black text-[var(--text2)] leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* HORAS LIBRES DEL DÍA */}
              {renderFreeHoursWidget(false)}

              {/* LISTA COMPACTA */}
              <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="title-font font-black text-xl">Novedades Recientes</h2>
                  {canManageAusencias && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full md:w-auto bg-[var(--verde)] text-black font-black text-sm px-8 py-3.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95 transition-all"
                    >
                      + Registrar Ausencia
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg3)]/50">
                      <tr>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em]">Profesor</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em]">Tipo</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-[0.2em]">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ausencias.length === 0 ? (
                        <tr><td colSpan={3} className="p-20 text-center text-[var(--text3)] italic">No hay registros recientes.</td></tr>
                      ) : (
                        ausencias.slice(0, 5).map((a) => (
                          <tr key={a.id} className="hover:bg-[var(--bg3)]/30 transition-colors border-b border-[var(--border)] last:border-none">
                            <td className="p-6 font-bold">{a.profNombre}</td>
                            <td className="p-6 text-sm text-[var(--text2)]">{a.tipo}</td>
                            <td className="p-6">
                              <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${
                                a.estado === 'aprobada' ? 'bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]' : 
                                a.estado === 'pendiente' ? 'bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]' : 
                                'bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]'
                              }`}>
                                {a.estado === 'rechazada' ? 'reprobada' : a.estado}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ausencias" && userProfile?.rol !== "alumno" && (
            <div className="space-y-6 animate-fade-in">

              {/* PANEL DE AUTOGESTIÓN DOCENTE (Solo para Profesores) */}
              {userProfile?.rol === 'profesor' && currentProfesor && (
                <div className="card glass p-6 sm:p-8 rounded-[32px] border border-[var(--border)] space-y-6">
                  <div>
                    <h2 className="title-font font-black text-xl">Autogestión Docente</h2>
                    <p className="text-xs text-[var(--text2)] mt-1">
                      Gestioná rápidamente tu asistencia, licencias, paros o avisos urgentes.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* BOTÓN ADHESIÓN AL PARO */}
                    <button
                      onClick={() => {
                        askConfirm("¿Confirmás tu adhesión al Paro Docente para el día de hoy? Esto marcará automáticamente tus materias de hoy como Hora Libre.", async () => {
                          try {
                            const todayStr = new Date().toLocaleDateString("en-CA");
                            const alreadyLogged = ausencias.some(a => 
                              a.profNombre === currentProfesor.nombre && 
                              todayStr >= a.inicio && 
                              todayStr <= a.fin
                            );

                            if (alreadyLogged) {
                              showToast("Ya tenés una inasistencia o paro reportado para hoy.", "error");
                              return;
                            }

                            const newAbsence: Ausencia = {
                              profId: currentProfesor.id!,
                              profNombre: currentProfesor.nombre,
                              tipo: "Paro Docente",
                              inicio: todayStr,
                              fin: todayStr,
                              materias: currentProfesor.materias || [],
                              motivo: "Medida de fuerza gremial / Adhesión al Paro Docente",
                              cert: false,
                              estado: "aprobada",
                              fechaReg: new Date().toISOString()
                            };

                            await saveAusencia(newAbsence);
                            await logAction(user?.email || "desconocido", "REGISTRAR_PARO_DOCENTE", `Profesor: ${currentProfesor.nombre}`);
                            subscribeToAusencias(setAusencias);
                            showToast("Adhesión al paro registrada con éxito", "success");
                          } catch (err) {
                            showToast("Error al registrar adhesión", "error");
                          }
                        });
                      }}
                      className="p-5 rounded-2xl bg-[var(--rojo-bg)]/20 border border-[var(--rojo-border)] hover:bg-[var(--rojo-bg)]/30 active:scale-95 transition-all text-left flex flex-col gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--rojo-bg)] text-[var(--rojo)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[var(--text)]">Adherirse al Paro</h4>
                        <p className="text-[11px] text-[var(--text2)] mt-0.5">Notifica al instante adhesión a medida de fuerza.</p>
                      </div>
                    </button>

                    {/* BOTÓN AVISO DE SUSPENSIÓN URGENTE */}
                    <button
                      onClick={() => {
                        setReportModalInitialTipo("Suspensión (Fuerza Mayor)");
                        setIsTeacherReportModalOpen(true);
                      }}
                      className="p-5 rounded-2xl bg-[var(--amarillo-bg)]/20 border border-[var(--amarillo-border)] hover:bg-[var(--amarillo-bg)]/30 active:scale-95 transition-all text-left flex flex-col gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--amarillo-bg)] text-[var(--amarillo)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[var(--text)]">Suspensión Urgente</h4>
                        <p className="text-[11px] text-[var(--text2)] mt-0.5">Informa inasistencia de último momento por fuerza mayor.</p>
                      </div>
                    </button>

                    {/* BOTÓN SOLICITAR AUSENCIA */}
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="p-5 rounded-2xl bg-[var(--verde-bg)]/20 border border-[var(--verde-border)] hover:bg-[var(--verde-bg)]/30 active:scale-95 transition-all text-left flex flex-col gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[var(--text)]">Solicitar Ausencia</h4>
                        <p className="text-[11px] text-[var(--text2)] mt-0.5">Solicita una licencia sujeta a la aprobación directiva.</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)]">
                {userProfile?.rol !== 'profesor' ? (
                  <div className="relative w-full md:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]"><Search size={20} /></span>
                    <input 
                      type="text" 
                      placeholder="Buscar por profesor o tipo..." 
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[var(--verde)] transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="text-sm font-black text-[var(--text2)] uppercase tracking-wider pl-2">
                    Tu Historial de Inasistencias
                  </div>
                )}
                <div className="flex gap-2 w-full md:w-auto">
                  {canManageAusencias && (
                    <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-black text-white dark:bg-white dark:text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                      + Nuevo Registro
                    </button>
                  )}
                </div>
              </div>

              <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg3)]/50">
                      <tr>
                        <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Profesor</th>
                        <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Detalles</th>
                        <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Fechas</th>
                        <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Estado</th>
                        {isAdmin && (
                          <th className="p-5 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAusencias.map((a) => (
                        <tr key={a.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)]">
                          <td className="p-5">
                            <div className="font-bold">{a.profNombre}</div>
                            <div className="text-[10px] text-[var(--text3)] uppercase font-bold tracking-tighter">{a.materias.join(", ")}</div>
                          </td>
                          <td className="p-5">
                            <div className="text-sm font-medium">{a.tipo}</div>
                            <div className="text-xs text-[var(--text2)] italic">{a.motivo || "Sin motivo especificado"}</div>
                          </td>
                          <td className="p-5">
                            <div className="text-xs font-bold text-[var(--text2)]">Del {a.inicio}</div>
                            <div className="text-xs font-bold text-[var(--text2)]">Al {a.fin}</div>
                          </td>
                          <td className="p-5">
                            <div className="flex gap-1.5 items-center">
                              {[
                                { value: "pendiente", label: "Pendiente", activeClass: "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]", inactiveClass: "bg-transparent text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg3)] hover:text-[var(--text)]" },
                                { value: "aprobada", label: "Aprobado", activeClass: "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] font-black", inactiveClass: "bg-transparent text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg3)] hover:text-[var(--text)]" },
                                { value: "rechazada", label: "Rechazado", activeClass: "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)] font-black", inactiveClass: "bg-transparent text-[var(--text3)] border-[var(--border)] hover:bg-[var(--bg3)] hover:text-[var(--text)]" }
                              ].map((opt) => {
                                const isSelected = a.estado === opt.value;
                                if (!canManageAusencias && !isSelected) return null;
                                return (
                                  <button
                                    key={opt.value}
                                    disabled={!canManageAusencias}
                                    onClick={() => handleChangeStatus(a.id!, opt.value as any)}
                                    className={`px-2 py-1 text-[9px] font-black uppercase rounded border transition-all duration-150 shrink-0 ${
                                      !canManageAusencias ? "cursor-default" : "active:scale-95 cursor-pointer"
                                    } ${
                                      isSelected ? opt.activeClass : opt.inactiveClass
                                    }`}
                                  >
                                    {opt.label === "Rechazado" && !canManageAusencias ? "Reprobada" : opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          {canManageAusencias && (
                            <td className="p-5 text-right space-x-2">
                              <button 
                                onClick={() => handleDelete(a.id!)}
                                className="p-2 hover:bg-[var(--rojo-bg)] text-[var(--rojo)] rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            {activeTab === 'profesores' && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') && (
              <div className="animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl font-black title-font">Cuerpo Docente</h2>
                    <p className="text-[var(--text2)]">Gestión de profesores y sus materias asignadas.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    {isAdmin && (
                      <button 
                        onClick={() => setIsTeacherModalOpen(true)}
                        className="bg-black text-white dark:bg-white dark:text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl"
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
                      <div key={p.id} className="glass p-8 rounded-[32px] border border-[var(--border)] hover:border-[var(--verde)] transition-all group relative">
                        {isAdmin && (
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingProfesor(p); setIsTeacherModalOpen(true); }}
                              className="text-[var(--verde)] p-2 bg-[var(--verde-bg)] rounded-xl hover:scale-110 transition-transform"
                              title="Editar Profesor"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => askConfirm("¿Borrar profesor?", async () => {
                                try {
                                  await deleteProfesor(p.id!);
                                  await logAction(user?.email || "desconocido", "ELIMINAR_DOCENTE", `Nombre: ${p.nombre}, DNI: ${p.dni}`);
                                  await getProfesores().then(setProfesores);
                                  showToast("Docente eliminado", "success");
                                } catch (err) {
                                  showToast("Error al eliminar docente", "error");
                                }
                              })}
                              className="text-[var(--rojo)] p-2 bg-[var(--rojo-bg)] rounded-xl hover:scale-110 transition-transform"
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
                        <h3 className="text-xl font-bold mb-2">{p.nombre}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {p.materias.map(m => (
                            <span key={m} className="text-[9px] font-black uppercase px-2 py-1 bg-[var(--bg3)] rounded-lg text-[var(--text2)] border border-[var(--border)]">
                              {m}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--text3)]">{p.email}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'alumnos' && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo' || userProfile?.rol === 'preceptor') && (
              <div className="animate-fade-in space-y-10">
                
                {/* SOLICITUDES DE MATRICULACIÓN PENDIENTES (Solo Preceptor y superiores) */}
                {usuarios.filter(u => (u.rol as string) === 'pendiente_alumno').length > 0 && (
                  <div className="animate-fade-in">
                    <h3 className="text-xl font-black title-font mb-4 text-[var(--amarillo)] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--amarillo)] animate-pulse inline-block"></span>
                      Solicitudes de Inscripción Pendientes
                    </h3>
                    <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-[var(--bg3)]/50">
                          <tr>
                            <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Alumno</th>
                            <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">DNI</th>
                            <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Curso Asignado</th>
                            <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuarios.filter(u => (u.rol as string) === 'pendiente_alumno').map(u => {
                            const studDetails = alumnos.find(a => a.email.toLowerCase() === u.email.toLowerCase());
                            const cursoLabel = studDetails?.curso && studDetails.curso !== 'pendiente' ? studDetails.curso : null;
                            return (
                              <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                                <td className="p-6">
                                  <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                                  <div className="text-xs text-[var(--text3)]">{u.email}</div>
                                </td>
                                <td className="p-6 text-sm">{studDetails?.dni || "Cargando..."}</td>
                                <td className="p-6">
                                  {cursoLabel
                                    ? <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold uppercase">{cursoLabel}</span>
                                    : <span className="px-3 py-1 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-lg text-xs font-bold uppercase">⏳ Sin asignar</span>
                                  }
                                </td>
                                <td className="p-6 text-right space-x-2">
                                  <button
                                    onClick={() => handleApproveStudent(u)}
                                    className="px-4 py-2 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-all"
                                  >
                                    ✓ Aprobar
                                  </button>
                                  <button
                                    onClick={() => handleRejectStudent(u)}
                                    className="px-4 py-2 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold hover:bg-[var(--rojo)] hover:text-white transition-all"
                                  >
                                    ✕ Rechazar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div>
                      <h2 className="text-3xl font-black title-font">Gestión de Alumnos</h2>
                      <p className="text-[var(--text2)]">Listado oficial de estudiantes por curso.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {isAdmin && (
                        <button 
                          onClick={() => setIsStudentModalOpen(true)}
                          className="flex-1 md:flex-none bg-black text-white dark:bg-white dark:text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl"
                        >
                          + Inscribir Alumno
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg2)] p-4 rounded-[24px] border border-[var(--border)] mb-6">
                    <div className="relative w-full">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]"><Search size={20} /></span>
                      <input 
                        type="text" 
                        placeholder="Buscar alumnos por nombre, DNI o curso..." 
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[var(--verde)] transition-all"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[var(--bg3)]/50">
                        <tr>
                          <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Nombre</th>
                          <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">DNI</th>
                          <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Curso</th>
                          {isAdmin && <th className="p-6 text-right">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {alumnos.filter(al => 
                          al.nombre.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          al.dni.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          al.curso.toLowerCase().includes(studentSearchQuery.toLowerCase())
                        ).length === 0 ? (
                          <tr><td colSpan={4} className="p-20 text-center text-[var(--text3)] italic">No se encontraron alumnos.</td></tr>
                        ) : (
                          alumnos.filter(al => 
                            al.nombre.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                            al.dni.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                            al.curso.toLowerCase().includes(studentSearchQuery.toLowerCase())
                          ).map(al => (
                            <tr key={al.id} className="border-b border-[var(--border)] last:border-none hover:bg-white/5 transition-colors">
                              <td className="p-6 font-bold">{al.nombre}</td>
                              <td className="p-6 text-sm">{al.dni}</td>
                              <td className="p-6">
                                 {al.curso && al.curso !== 'pendiente'
                                   ? <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold">{al.curso}</span>
                                   : <span className="px-3 py-1 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] rounded-lg text-xs font-bold">⏳ Pendiente</span>
                                 }
                               </td>
                              {isAdmin && (
                                <td className="p-6 text-right">
                                  <button 
                                    onClick={() => askConfirm("¿Borrar alumno?", async () => {
                                      try {
                                        await deleteAlumno(al.id!);
                                        await logAction(user?.email || "desconocido", "ELIMINAR_ALUMNO", `Nombre: ${al.nombre}, DNI: ${al.dni}, Curso: ${al.curso}`);
                                        await getAlumnos().then(setAlumnos);
                                        showToast("Alumno eliminado", "success");
                                      } catch (err) {
                                        showToast("Error al eliminar alumno", "error");
                                      }
                                    })} 
                                    className="text-[var(--rojo)] hover:scale-125 transition-transform"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'horarios' && (
              <div className="animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-black title-font text-[var(--text)]">Cronograma Institucional</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3 z-30 relative no-print">
                      <div className="flex items-center gap-3">
                        <p className="text-[var(--text2)] text-sm font-medium">Filtrar por curso:</p>
                        {userProfile?.rol === 'alumno' ? (
                          <span className="px-4 py-2 bg-[var(--bg3)] text-[var(--verde)] rounded-2xl border border-[var(--border)] font-bold text-sm">
                            {currentAlumno?.curso || "Sin curso"}
                          </span>
                        ) : (
                          <CustomSelect 
                            value={selectedCourse} 
                            onChange={(val) => setSelectedCourse(val)}
                            placeholder="Todos los cursos"
                            className="w-48"
                            buttonClassName="text-[var(--verde)] bg-[var(--bg3)] text-xs"
                            options={[
                              { value: "", label: "Todos los cursos" },
                              ...cursos.map(c => ({
                                value: c.nombre, label: c.nombre
                              }))
                            ]}
                          />
                        )}
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
                          <button onClick={() => setScheduleQuery("")} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto no-print">
                    <button 
                      onClick={exportToExcel}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[var(--bg3)] text-[var(--text)] font-bold px-6 py-4 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg4)] transition-all shadow-md active:scale-95"
                    >
                      <FileSpreadsheet size={18} />
                      Descargar Excel
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="flex-1 md:flex-initial bg-[var(--verde)] text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-[0_8px_30px_rgb(16,185,129,0.3)] shrink-0"
                      >
                        + Programar Clase
                      </button>
                    )}
                  </div>
                </div>

                {/* HORAS LIBRES DEL DÍA (Personalizado para Alumnos / Vista Global para Colaboradores) */}
                <div className="mb-8 no-print animate-fade-in">
                  {renderFreeHoursWidget(userProfile?.rol === 'alumno')}
                </div>

                {/* Selector de días para dispositivos móviles */}
                <div className="flex lg:hidden justify-between items-center gap-1 bg-[var(--bg3)] p-1.5 rounded-2xl border border-[var(--border)] mb-6 z-30 relative no-print">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia) => {
                    const shortName = dia.slice(0, 3); // Lun, Mar, Mie, Jue, Vie
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => setSelectedMobileDay(dia)}
                        className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${
                          selectedMobileDay === dia
                            ? "bg-[var(--verde)] text-black shadow-md scale-105"
                            : "text-[var(--text2)] hover:bg-[var(--bg4)]"
                        }`}
                      >
                        {shortName}
                      </button>
                    );
                  })}
                </div>

                <div className="card glass rounded-[40px] border border-[var(--border)] overflow-x-auto shadow-2xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg3)]/80">
                        <th className="p-5 border-b border-r border-[var(--border)] text-[10px] font-black uppercase text-[var(--verde)] sticky left-0 bg-[var(--bg)] z-20 w-32">Horario</th>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(dia => (
                          <th 
                            key={dia} 
                            className={`p-5 border-b border-[var(--border)] text-[11px] font-black uppercase tracking-widest text-[var(--text)] min-w-[180px] ${
                              selectedMobileDay === dia ? "table-cell" : "hidden lg:table-cell"
                            }`}
                          >
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
                              const effectiveCourse = userProfile?.rol === 'alumno' ? (currentAlumno?.curso || "___NO_COURSE___") : selectedCourse;
                              const h = horarios.find(item => 
                                item.dia === dia && 
                                item.hora === slot && 
                                (effectiveCourse === "" || item.curso === effectiveCourse)
                              );

                              // Calcular si el profesor está ausente en este día específico
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
                                  className={`p-2 border-r border-[var(--border)] last:border-r-0 relative group min-h-[80px] ${
                                    selectedMobileDay === dia ? "table-cell" : "hidden lg:table-cell"
                                  }`}
                                >
                                  {h ? (
                                    <div className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[22px] border transition-all duration-300 relative overflow-hidden ${
                                      isDimmed ? "opacity-15 grayscale scale-95 blur-[0.5px]" : ""
                                    } ${
                                      isAbsent 
                                        ? "bg-gradient-to-br from-[var(--rojo-bg)] to-red-950/20 border-[var(--rojo-border)] shadow-[0_8px_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20" 
                                        : "bg-[var(--bg3)] border-[var(--border)] shadow-sm hover:shadow-md group-hover:border-[var(--verde)]"
                                    }`}>
                                      {isAbsent && (
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-xl pointer-events-none rounded-full" />
                                      )}
                                      <div className="flex justify-between items-start mb-1 pr-6">
                                        <div className={`font-black text-xs sm:text-sm leading-tight ${isAbsent ? "text-red-400 line-through decoration-red-500/80 decoration-2" : "text-white"}`}>{h.materia}</div>
                                        {isAbsent && (
                                          <span className="text-[var(--rojo)] animate-bounce shrink-0 ml-1">
                                            <Ban size={12} />
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-[10px] sm:text-xs font-bold ${isAbsent ? "text-red-300/70" : "text-[var(--text2)]"}`}>
                                        {h.profesor}
                                      </div>
                                      <div className="flex items-center justify-between mt-2.5 gap-2">
                                        <div className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${isAbsent ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]"}`}>
                                          {h.curso}
                                        </div>
                                        {isAbsent && (
                                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 animate-pulse shrink-0">
                                            🎉 Hora Libre
                                          </span>
                                        )}
                                      </div>
                                      {isAdmin && (
                                        <button 
                                          onClick={() => askConfirm("¿Eliminar clase?", async () => {
                                            try {
                                              await deleteHorario(h.id!);
                                              await logAction(user?.email || "desconocido", "ELIMINAR_HORARIO", `Materia: ${h.materia}, Profesor: ${h.profesor}, Curso: ${h.curso}, Día: ${h.dia}, Hora: ${h.hora}`);
                                              await getHorarios().then(setHorarios);
                                              showToast("Clase eliminada", "success");
                                            } catch (err) {
                                              showToast("Error al eliminar clase", "error");
                                            }
                                          })}
                                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1.5 bg-black/60 rounded-lg hover:bg-[var(--rojo)] transition-all text-white shadow-md z-20"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-full min-h-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      {isAdmin && (
                                        <button 
                                          onClick={() => setIsScheduleModalOpen(true)}
                                          className="w-8 h-8 rounded-full bg-[var(--bg3)] text-[var(--text3)] flex items-center justify-center border border-dashed border-[var(--border)] hover:bg-[var(--verde)] hover:text-black transition-all"
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
            )}
          
          {activeTab === 'configuracion' && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') && (
            <div className="animate-fade-in space-y-10">
              
              {/* SOLICITUDES DE REGISTRO PENDIENTES (Jerárquico: Admin aprueba directivos; Directivo aprueba preceptor/profesor) */}
              {usuarios.filter(u => {
                if (!u.rol.startsWith("pendiente_")) return false;
                if ((u.rol as string) === "pendiente_alumno") return false; // Handled in Alumnos tab
                if (userProfile?.rol === 'admin') return true;
                if (userProfile?.rol === 'directivo') {
                  // Directivos can only see and approve preceptor and profesor requests
                  return (u.rol as string) === 'pendiente_preceptor' || (u.rol as string) === 'pendiente_profesor';
                }
                return false;
              }).length > 0 && (
                <div className="animate-fade-in">
                  <h3 className="text-xl font-black title-font mb-4 text-[var(--amarillo)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--amarillo)] animate-pulse inline-block"></span>
                    Solicitudes de Acceso Pendientes
                  </h3>
                  <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[var(--bg3)]/50">
                        <tr>
                          <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Solicitante</th>
                          <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Rol Solicitado</th>
                          <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.filter(u => {
                          if (!u.rol.startsWith("pendiente_")) return false;
                          if ((u.rol as string) === "pendiente_alumno") return false;
                          if (userProfile?.rol === 'admin') return true;
                          if (userProfile?.rol === 'directivo') {
                            return (u.rol as string) === 'pendiente_preceptor' || (u.rol as string) === 'pendiente_profesor';
                          }
                          return false;
                        }).map(u => {
                          const cleanRole = u.rol.replace("pendiente_", "");
                          return (
                            <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                              <td className="p-6">
                                <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                                <div className="text-xs text-[var(--text3)]">{u.email}</div>
                              </td>
                              <td className="p-6">
                                <span className="px-3 py-1 bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] rounded-lg text-xs font-bold uppercase">{cleanRole}</span>
                              </td>
                              <td className="p-6 text-right space-x-2">
                                <button
                                  onClick={() => handleApproveRequest(u)}
                                  className="px-4 py-2 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-all"
                                >
                                  ✓ Aprobar
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(u)}
                                  className="px-4 py-2 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold hover:bg-[var(--rojo)] hover:text-white transition-all"
                                >
                                  ✕ Rechazar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl font-black title-font text-[var(--text)]">Configuración de Accesos</h2>
                    <p className="text-[var(--text2)]">Gestión de colaboradores, directivos y preceptores autorizados.</p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsUserModalOpen(true)}
                      className="bg-black text-white font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl"
                    >
                      + Autorizar Colaborador
                    </button>
                  )}
                </div>

                <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg3)]/50">
                      <tr>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Colaborador</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Estado de Ingreso</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Rol Asignado</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.filter(u => {
                        if (u.rol.startsWith("pendiente_")) return false;
                        if (u.rol === "alumno") return false; // Students are managed in Alumnos tab
                        if (userProfile?.rol === 'admin') return true;
                        if (userProfile?.rol === 'directivo') {
                          // Directivos can see other directivos, preceptores and profesores
                          return u.rol === 'directivo' || u.rol === 'preceptor' || u.rol === 'profesor';
                        }
                        return false;
                      }).length === 0 ? (
                        <tr><td colSpan={4} className="p-20 text-center text-[var(--text3)] italic">No hay colaboradores registrados.</td></tr>
                      ) : (
                        usuarios.filter(u => {
                          if (u.rol.startsWith("pendiente_")) return false;
                          if (u.rol === "alumno") return false;
                          if (userProfile?.rol === 'admin') return true;
                          if (userProfile?.rol === 'directivo') {
                            return u.rol === 'directivo' || u.rol === 'preceptor' || u.rol === 'profesor';
                          }
                          return false;
                        }).map(u => (
                        <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                          <td className="p-6">
                            <div className="font-bold">{u.nombre}</div>
                            <div className="text-xs text-[var(--text3)]">{u.email}</div>
                          </td>
                          <td className="p-6">
                            {u.uid.startsWith("PENDING_") ? (
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-[var(--amarillo-bg)] text-[var(--amarillo)] rounded">Invitación Pendiente</span>
                            ) : (
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-[var(--verde-bg)] text-[var(--verde)] rounded">Registrado y Activo</span>
                            )}
                          </td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold uppercase">
                              {u.rol === 'admin' ? 'Administrador' : (u.rol === 'directivo' ? 'Directivo' : u.rol)}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            {((u.rol !== 'admin' || userProfile?.rol === 'admin') && u.email !== userProfile?.email) ? (
                              <button 
                                onClick={() => askConfirm(`¿Revocar acceso a ${u.email}?`, async () => {
                                  try {
                                    await deleteUserProfile(u.id!);
                                    await logAction(user?.email || "desconocido", "REVOCAR_ACCESO", `Email: ${u.email}, Rol: ${u.rol}`);
                                    await getUsuarios().then(setUsuarios);
                                    showToast("Acceso revocado", "success");
                                  } catch (err) {
                                    showToast("Error al revocar acceso", "error");
                                  }
                                })} 
                                className="text-[var(--rojo)] hover:scale-125 transition-transform"
                                title="Revocar Acceso"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-[var(--text3)] italic">Protegido</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

            {activeTab === 'auditoria' && isSuperAdmin && (
              <div className="animate-fade-in">
                <div className="mb-12">
                  <h2 className="text-3xl font-black title-font">Logs de Seguridad</h2>
                  <p className="text-[var(--text2)]">Historial completo de acciones realizadas en el sistema.</p>
                </div>

                <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Usuario</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Acción</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Detalles</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={4} className="p-20 text-center text-[var(--text3)] italic">No hay actividad registrada aún.</td></tr>
                      ) : (
                        logs.map((log, i) => (
                          <tr key={i} className="border-b border-[var(--border)] hover:bg-white/5 transition-colors">
                            <td className="p-6 font-bold text-sm">{log.usuarioEmail}</td>
                            <td className="p-6"><span className="px-2 py-1 bg-gray-200 text-black text-[9px] font-black rounded uppercase">{log.accion}</span></td>
                            <td className="p-6 text-xs text-[var(--text2)]">{log.detalles}</td>
                            <td className="p-6 text-[10px] font-bold">{new Date(log.fecha).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {activeTab === 'cursos' && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo' || userProfile?.rol === 'preceptor') && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-12">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-black title-font text-[var(--text)]">Gestión de Cursos</h2>
                  <p className="text-[var(--text2)] text-sm mt-1">Crea y elimina las aulas y cursos oficiales de la escuela.</p>
                </div>
                <button 
                  onClick={() => setIsCourseModalOpen(true)}
                  className="w-full md:w-auto bg-[var(--verde)] text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shrink-0"
                >
                  + Agregar Nuevo Curso
                </button>
              </div>

              <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg3)]/50">
                    <tr>
                      <th className="p-4 sm:p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Nombre del Curso</th>
                      <th className="p-4 sm:p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursos.length === 0 ? (
                      <tr><td colSpan={2} className="p-16 sm:p-20 text-center text-[var(--text3)] italic">No hay cursos creados. Presiona "+ Agregar Nuevo Curso" para empezar.</td></tr>
                    ) : (
                      cursos.map(c => (
                        <tr key={c.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                          <td className="p-4 sm:p-6 font-bold text-[var(--text)]">{c.nombre}</td>
                          <td className="p-4 sm:p-6 text-right">
                            <button 
                              onClick={() => askConfirm(`¿Eliminar el curso ${c.nombre}? Los alumnos asignados seguirán existiendo pero no tendrán un curso válido asignado.`, async () => {
                                try {
                                  await deleteCurso(c.id!);
                                  await logAction(user?.email || "desconocido", "ELIMINAR_CURSO", `Curso: ${c.nombre}`);
                                  await getCursos().then(setCursos);
                                  showToast("Curso eliminado con éxito", "success");
                                } catch (err) {
                                  showToast("Error al eliminar curso", "error");
                                }
                              })} 
                              className="text-[var(--rojo)] hover:scale-125 transition-transform"
                              title="Eliminar Curso"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "ciclo-lectivo" && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') && (() => {
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
                      className="w-full py-3 rounded-2xl bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] font-black text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="w-full py-3 rounded-xl bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] hover:bg-[var(--rojo)] hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
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
                        className="w-full py-3 rounded-xl bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] hover:bg-[var(--rojo)] hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
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
                        className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] text-[var(--text)] font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 group"
                      >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        Promoción Automática
                      </button>
                      <button 
                        onClick={handleSavePromotions}
                        className="px-6 py-3 rounded-xl bg-[var(--verde)] text-black font-black text-xs shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 outline-none text-xs font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
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
                          <tr><td colSpan={5} className="p-20 text-center text-[var(--text3)] italic">No se encontraron alumnos para los filtros seleccionados.</td></tr>
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
                                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-[var(--text)] focus:border-[var(--verde)] transition-all"
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
          })()}
        </div>
      </main>

      {/* TOAST */}
      <div className={`toast ${toast.show ? "show" : ""} ${toast.type === "error" ? "border-[var(--rojo-border)] text-[var(--rojo)] bg-[var(--bg)]" : "border-[var(--verde-border)] text-[var(--verde)] bg-[var(--bg)]"}`}>
        <span className="shrink-0">{toast.type === "error" ? <X size={18} /> : <Check size={18} />}</span>
        <span className="font-bold text-sm flex-1">{toast.message}</span>
        <button 
          onClick={() => setToast(prev => ({ ...prev, show: false }))} 
          className="ml-2 p-1 rounded-lg hover:bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      <NewAbsenceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { subscribeToAusencias(setAusencias); showToast("Ausencia registrada con éxito", "success"); }}
        lockedProfesor={userProfile?.rol === 'profesor' ? currentProfesor : undefined}
      />

      <NewTeacherModal 
        isOpen={isTeacherModalOpen} 
        editingProfesor={editingProfesor}
        onClose={() => { setIsTeacherModalOpen(false); setEditingProfesor(null); }} 
        onSuccess={() => { getProfesores().then(setProfesores); showToast(editingProfesor ? "Docente actualizado" : "Profesor agregado", "success"); setEditingProfesor(null); }}
      />

      <NewStudentModal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)} 
        onSuccess={() => { getAlumnos().then(setAlumnos); showToast("Alumno inscrito"); }}
      />

      <NewScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSuccess={() => { getHorarios().then(setHorarios); showToast("Horario actualizado"); }}
      />

      <NewUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUserRole={userProfile?.rol || "directivo"}
        onSuccess={() => { 
          import("@/lib/dataService").then(mod => mod.getUsuarios().then(setUsuarios)); 
          showToast("Colaborador autorizado"); 
        }}
      />

      <NewCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={() => { getCursos().then(setCursos); showToast("Curso agregado"); }}
      />

      <SendNoticeModal
        isOpen={isSendNoticeModalOpen}
        onClose={() => setIsSendNoticeModalOpen(false)}
        alumnos={alumnos}
        profesores={profesores}
        usuarios={usuarios}
        cursos={cursos}
        showToast={showToast}
      />

      {isTeacherReportModalOpen && currentProfesor && (
        <NewTeacherReportModal
          isOpen={isTeacherReportModalOpen}
          initialTipo={reportModalInitialTipo}
          onClose={() => setIsTeacherReportModalOpen(false)}
          currentProfesor={currentProfesor}
          onSuccess={() => { subscribeToAusencias(setAusencias); showToast("Reporte registrado correctamente", "success"); }}
        />
      )}

      {/* CONFIRM MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg)] w-full max-w-sm rounded-[32px] p-8 border border-[var(--border)] shadow-2xl text-center">
            <div className="w-16 h-16 bg-[var(--rojo-bg)] text-[var(--rojo)] rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-xl font-black title-font mb-2">¿Estás seguro?</h3>
            <p className="text-[var(--text2)] text-sm mb-8">{confirmDialog.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
                className="flex-1 p-3 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }} 
                className="flex-1 p-3 rounded-2xl bg-[var(--rojo)] text-white font-black hover:scale-105 transition-all shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE PERFIL */}
      {userProfile && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={userProfile}
          onProfileUpdated={(updated) => {
            setUserProfile(prev => prev ? { ...prev, ...updated } : prev);
            showToast("Perfil actualizado.", "success");
          }}
        />
      )}
    </div>
  );
}

