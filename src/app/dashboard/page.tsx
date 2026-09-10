"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { runAppwriteHealthCheck, logHealthCheckSummary } from "@/lib/healthCheck";
import { account } from "@/lib/appwrite";
import { subscribeToAusencias, saveAusencia, Ausencia, deleteAusencia, updateAusenciaStatus, getUserProfile, UserProfile, logAction, getProfesores, Profesor, getAlumnos, getHorarios, Alumno, Horario, deleteProfesor, deleteAlumno, deleteHorario, saveProfesor, saveAlumno, saveHorario, getLogs, getUsuarios, deleteUserProfile, getCursos, deleteCurso, Curso, updateUserProfile, updateAlumno, migrateToCompactFormat, MigrationResult, subscribeToUsuarios, subscribeToAlumnos, subscribeToProfesores, subscribeToCursos, getCertificateFileUrl } from "@/lib/dataService";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import TopNavSidebar from "@/components/layout/TopNavSidebar";
import CustomSelect from "@/components/shared/CustomSelect";
import ContactForm from "@/components/ContactForm";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SkeletonExamGrid, SkeletonAttendanceTable } from "@/components/shared/SkeletonLoaders";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";
import {
  GeneralTab,
  AusenciasTab,
  ProfesoresTab,
  AlumnosTab,
  HorariosTab,
  ConfiguracionTab,
  AuditoriaTab,
  CursosTab,
  CicloLectivoTab,
} from "@/features/dashboard/tabs";

// ─── Spinner inline para managers que renderizan en el dashboard ─────────────
const ManagerSkeleton = ({ rows }: { rows?: number }) => (
  <div className="space-y-4">
    <SkeletonAttendanceTable rows={rows ?? 5} />
  </div>
);

// ─── LAZY LOADING: Modales pesados (solo se descargan al abrir) ──────────────
// Esto reduce el bundle inicial en ~400KB y elimina el lag al presionar botones.
const NewAbsenceModal = dynamic(() => import("@/components/modals/NewAbsenceModal"), {
  ssr: false,
  loading: () => null,
});
const NewTeacherReportModal = dynamic(() => import("@/components/modals/NewTeacherReportModal"), {
  ssr: false,
  loading: () => null,
});
const NewTeacherModal = dynamic(() => import("@/components/modals/NewTeacherModal"), {
  ssr: false,
  loading: () => null,
});
const NewStudentModal = dynamic(() => import("@/components/modals/NewStudentModal"), {
  ssr: false,
  loading: () => null,
});
const NewUserModal = dynamic(() => import("@/components/modals/NewUserModal"), {
  ssr: false,
  loading: () => null,
});
const NewScheduleModal = dynamic(() => import("@/components/modals/NewScheduleModal"), {
  ssr: false,
  loading: () => null,
});
const NewCourseModal = dynamic(() => import("@/components/modals/NewCourseModal"), {
  ssr: false,
  loading: () => null,
});
const AssignStudentsModal = dynamic(() => import("@/components/modals/AssignStudentsModal"), {
  ssr: false,
  loading: () => null,
});
const UserProfileModal = dynamic(() => import("@/components/modals/UserProfileModal"), {
  ssr: false,
  loading: () => null,
});
const SendNoticeModal = dynamic(() => import("@/components/modals/SendNoticeModal"), {
  ssr: false,
  loading: () => null,
});
const VersionModal = dynamic(() => import("@/components/modals/VersionModal"), {
  ssr: false,
  loading: () => null,
});
const DynamicQRModal = dynamic(() => import("@/components/modals/DynamicQRModal"), {
  ssr: false,
  loading: () => null,
});

// ─── Managers inline (renderizan en el dashboard, muestran skeleton) ─────────
const StudentAttendanceManager = dynamic(
  () => import("@/features/attendance/StudentAttendanceManager"),
  { ssr: false, loading: () => <ManagerSkeleton rows={6} /> }
);
const ExamBoardManager = dynamic(
  () => import("@/features/exams/ExamBoardManager"),
  { ssr: false, loading: () => <SkeletonExamGrid count={3} /> }
);
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
  Clock,
  UserCheck
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningCurso, setAssigningCurso] = useState<Curso | null>(null);
  const [isSendNoticeModalOpen, setIsSendNoticeModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
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



  useEffect(() => {
    setHasMounted(true);
    let isMounted = true;
    let unsubscribes: (() => void)[] = [];

    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        if (!isMounted) return;
        setUser(currentUser as any);
        // Cargar perfil de Appwrite
        const profile = await getUserProfile(currentUser.$id);
        if (!isMounted) return;

        if (profile) {
          setUserProfile(profile);
          // Cargar datos condicionalmente según el rol con suscripciones en tiempo real
          if (profile.rol === 'admin' || profile.rol === 'directivo' || profile.rol === 'preceptor') {
            unsubscribes.push(subscribeToUsuarios(setUsuarios));
            unsubscribes.push(subscribeToProfesores(setProfesores));
            unsubscribes.push(subscribeToAlumnos(setAlumnos));
          } else if (profile.rol === 'profesor') {
            unsubscribes.push(subscribeToProfesores(setProfesores));
          } else if (profile.rol === 'alumno') {
            unsubscribes.push(subscribeToAlumnos(setAlumnos));
          }
          
          unsubscribes.push(subscribeToCursos(setCursos));

          getHorarios().then(d => { if (isMounted) { setHorarios(d); stamp('horarios'); }});
          if (profile.rol === 'admin') getLogs().then(d => { if (isMounted) { setLogs(d); stamp('logs'); }});
        } else {
          // Si no hay perfil, algo salió mal en el login, redirigir
          if (isMounted) router.push("/");
        }
      } catch (err) {
        if (isMounted) router.push("/");
      }
    };
    checkSession();

    // ─── Appwrite collection health-check (dev-only, read-only, zero-risk) ─────
    if (process.env.NODE_ENV === "development") {
      runAppwriteHealthCheck().then(logHealthCheckSummary);
    }

    const unsubscribeData = subscribeToAusencias((data) => {
      if (!isMounted) return;
      setAusencias(data);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribeData();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [router]);

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

  const handleDeleteProfesor = (p: Profesor) => {
    askConfirm("¿Borrar profesor?", async () => {
      try {
        await deleteProfesor(p.id!);
        const userRecord = usuarios.find(u => u.email.toLowerCase() === p.email.toLowerCase());
        if (userRecord?.id) {
          await deleteUserProfile(userRecord.id);
          setUsuarios(prev => prev.filter(u => u.id !== userRecord.id));
        }
        await logAction(user?.email || "desconocido", "ELIMINAR_DOCENTE", `Nombre: ${p.nombre}, DNI: ${p.dni}`);
        await getProfesores().then(setProfesores);
        showToast("Docente eliminado", "success");
      } catch (err) {
        showToast("Error al eliminar docente", "error");
      }
    });
  };

  const handleDeleteAlumno = (al: Alumno) => {
    askConfirm("¿Borrar alumno?", async () => {
      try {
        await deleteAlumno(al.id!);
        const userRecord = usuarios.find(u => u.email.toLowerCase() === al.email.toLowerCase());
        if (userRecord?.id) {
          await deleteUserProfile(userRecord.id);
          setUsuarios(prev => prev.filter(u => u.id !== userRecord.id));
        }
        await logAction(user?.email || "desconocido", "ELIMINAR_ALUMNO", `Nombre: ${al.nombre}, DNI: ${al.dni}, Curso: ${al.curso}`);
        await getAlumnos().then(setAlumnos);
        showToast("Alumno eliminado", "success");
      } catch (err) {
        showToast("Error al eliminar alumno", "error");
      }
    });
  };

  const handleDeleteHorario = (h: Horario) => {
    askConfirm("¿Eliminar clase?", async () => {
      try {
        await deleteHorario(h.id!);
        await logAction(user?.email || "desconocido", "ELIMINAR_HORARIO", `Materia: ${h.materia}, Profesor: ${h.profesor}, Curso: ${h.curso}, Día: ${h.dia}, Hora: ${h.hora}`);
        await getHorarios().then(setHorarios);
        showToast("Clase eliminada", "success");
      } catch (err) {
        showToast("Error al eliminar clase", "error");
      }
    });
  };

  const handleDeleteCurso = (c: Curso) => {
    askConfirm(`¿Eliminar el curso ${c.nombre}? Los alumnos asignados seguirán existiendo pero no tendrán un curso válido asignado.`, async () => {
      try {
        await deleteCurso(c.id!);
        await logAction(user?.email || "desconocido", "ELIMINAR_CURSO", `Curso: ${c.nombre}`);
        await getCursos().then(setCursos);
        showToast("Curso eliminado con éxito", "success");
      } catch (err) {
        showToast("Error al eliminar curso", "error");
      }
    });
  };

  const handleRevokeAccess = (u: UserProfile) => {
    askConfirm(`¿Revocar acceso a ${u.email}?`, async () => {
      try {
        await deleteUserProfile(u.id!);
        await logAction(user?.email || "desconocido", "REVOCAR_ACCESO", `Email: ${u.email}, Rol: ${u.rol}`);
        await getUsuarios().then(setUsuarios);
        showToast("Acceso revocado", "success");
      } catch (err) {
        showToast("Error al revocar acceso", "error");
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
      <div suppressHydrationWarning className="flex-1 flex items-center justify-center bg-transparent text-[var(--text)]">
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
    <SidebarProvider>
      {/* flex-1: ocupa el espacio restante dejado por el Footer del layout raíz.
          overflow-hidden solo en el eje X para evitar scroll horizontal.
          NO usar h-screen aquí para no cortar el Footer global. */}
      <div className="flex flex-col w-full flex-1 overflow-x-hidden bg-transparent text-[var(--text)]">

        {/* ── TOP NAV SIDEBAR (retráctil hacia arriba) ── */}
        <TopNavSidebar
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
          onTabChange={(tabId) => {
            if (tabId === 'auditoria') getLogs().then(setLogs);
          }}
          pendingAccessCount={usuarios.filter(u => u.rol.startsWith("pendiente_") && u.rol !== "pendiente_alumno").length}
          pendingAlumnosCount={usuarios.filter(u => u.rol === "pendiente_alumno").length}
        />

      {/* MAIN CONTENT: flex-1 para ocupar el ancho disponible.
          overflow-y-auto aquí para scroll interno del contenido (sin atrapar el Footer).
          pt-14 para compensar el TopNav fijo. */}
      <main className="flex-1 min-w-0 overflow-y-auto relative pt-14">

        <div className="p-6 md:p-12 pb-16 max-w-[1400px] mx-auto">
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
                  asistencia: "Asistencia",
                  ausencias: "Ausencias",
                  "mesas-examen": "Mesas de Examen",
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
          {activeTab === "asistencia" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsQRModalOpen(true)}
                  className="bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] font-bold px-6 py-4 rounded-2xl hover:bg-[var(--verde)] hover:text-black transition-all shadow-md flex items-center gap-2 w-full md:w-auto justify-center"
                >
                  <UserCheck size={18} />
                  Asistencias
                </button>
              </div>
              <StudentAttendanceManager user={user} userProfile={userProfile} />
            </div>
          )}

          {activeTab === "mesas-examen" && (
            <div className="animate-fade-in">
              <ExamBoardManager user={user} userProfile={userProfile} />
            </div>
          )}

          {activeTab === "general" && userProfile?.rol !== "alumno" && (
            <GeneralTab
              stats={stats}
              ausencias={ausencias}
              horarios={horarios}
              canManageAusencias={canManageAusencias}
              currentAlumno={currentAlumno}
              onNavigateToAusencias={(search) => { setActiveTab("ausencias"); setSearchQuery(search || ""); }}
              onNavigateToHorarios={(curso) => { setActiveTab("horarios"); setSelectedCourse(curso); }}
              onOpenNewAbsenceModal={() => setIsModalOpen(true)}
              showToast={showToast}
            />
          )}

          {activeTab === "ausencias" && userProfile?.rol !== "alumno" && (
            <AusenciasTab
              ausencias={ausencias}
              filteredAusencias={filteredAusencias}
              currentProfesor={currentProfesor}
              userProfile={userProfile}
              user={user}
              isAdmin={isAdmin}
              canManageAusencias={canManageAusencias}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenAbsenceModal={() => setIsModalOpen(true)}
              onOpenTeacherReportModal={(tipo) => {
                setReportModalInitialTipo(tipo);
                setIsTeacherReportModalOpen(true);
              }}
              onChangeStatus={handleChangeStatus}
              onDeleteAbsence={handleDelete}
              askConfirm={askConfirm}
              showToast={showToast}
              onRefreshAusencias={() => {
                import('@/lib/dataService').then(mod => {
                  mod.subscribeToAusencias(setAusencias);
                });
              }}
            />
          )}

          {activeTab === "profesores" && userProfile?.rol !== "alumno" && (
            <ProfesoresTab
              profesores={profesores}
              usuarios={usuarios}
              isAdmin={isAdmin}
              onOpenAddTeacher={() => setIsTeacherModalOpen(true)}
              onEditTeacher={(p: Profesor) => { setEditingProfesor(p); setIsTeacherModalOpen(true); }}
              onDeleteTeacher={handleDeleteProfesor}
              onNavigateToAusencias={(search: string) => { setActiveTab("ausencias"); setSearchQuery(search); }}
            />
          )}

          {activeTab === "alumnos" && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo' || userProfile?.rol === 'preceptor') && (
            <AlumnosTab
              alumnos={alumnos}
              usuarios={usuarios}
              isAdmin={isAdmin}
              studentSearchQuery={studentSearchQuery}
              setStudentSearchQuery={setStudentSearchQuery}
              onOpenAddStudent={() => setIsStudentModalOpen(true)}
              onApproveStudent={handleApproveStudent}
              onRejectStudent={handleRejectStudent}
              onDeleteAlumno={handleDeleteAlumno}
            />
          )}

          {activeTab === "horarios" && (
            <HorariosTab
              horarios={horarios}
              cursos={cursos}
              ausencias={ausencias}
              currentAlumno={currentAlumno}
              userProfile={userProfile}
              isAdmin={isAdmin}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              scheduleQuery={scheduleQuery}
              setScheduleQuery={setScheduleQuery}
              onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              onDeleteHorario={handleDeleteHorario}
              onNavigateToAusencias={(profNombre) => { setActiveTab("ausencias"); setSearchQuery(profNombre); }}
              showToast={showToast}
            />
          )}

          {activeTab === "configuracion" && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') && (
            <ConfiguracionTab
              usuarios={usuarios}
              userProfile={userProfile}
              isAdmin={isAdmin}
              onOpenUserModal={() => setIsUserModalOpen(true)}
              onOpenVersionModal={() => setIsVersionModalOpen(true)}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              onRevokeAccess={handleRevokeAccess}
            />
          )}

          {activeTab === "auditoria" && isSuperAdmin && (
            <AuditoriaTab
              logs={logs}
            />
          )}

          {activeTab === "cursos" && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo' || userProfile?.rol === 'preceptor') && (
            <CursosTab
              cursos={cursos}
              alumnos={alumnos}
              onOpenCourseModal={() => setIsCourseModalOpen(true)}
              onAssignAlumnos={(curso: Curso) => { setAssigningCurso(curso); setIsAssignModalOpen(true); }}
              onDeleteCurso={handleDeleteCurso}
            />
          )}

          {activeTab === "ciclo-lectivo" && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') && (
            <CicloLectivoTab
              alumnos={alumnos}
              cursos={cursos}
              userProfile={userProfile}
              user={user}
              setAlumnos={setAlumnos}
              setHorarios={setHorarios}
              ausencias={ausencias}
              setAusencias={setAusencias}
              askConfirm={askConfirm}
              showToast={showToast}
              setLoading={setLoading}
            />
          )}
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
        onSuccess={() => { showToast("Ausencia registrada con éxito", "success"); }}
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
          onSuccess={() => { showToast("Reporte registrado correctamente", "success"); }}
        />
      )}

      <AssignStudentsModal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setAssigningCurso(null); }}
        onSuccess={() => {
          getAlumnos(true).then(d => { setAlumnos(d); stamp('alumnos'); });
          showToast("Alumnos asignados con éxito", "success");
        }}
        curso={assigningCurso}
        alumnos={alumnos}
        cursos={cursos}
      />

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
      {isSuperAdmin && (
        <VersionModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
        />
      )}
      <DynamicQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        userProfile={userProfile}
      />
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[10000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-semibold border transition-all animate-slide-in-right ${
          toast.type === 'success'
            ? 'bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]'
            : 'bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
    </SidebarProvider>
  );
}

