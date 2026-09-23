"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { runAppwriteHealthCheck, logHealthCheckSummary } from "@/lib/healthCheck";
import { account } from "@/lib/appwrite";
import { subscribeToAusencias, saveAusencia, Ausencia, deleteAusencia, updateAusenciaStatus, getUserProfile, getUserProfileByEmail, UserProfile, logAction, getProfesores, Profesor, getAlumnos, getHorarios, Alumno, Horario, deleteProfesor, deleteAlumno, deleteHorario, saveProfesor, saveAlumno, saveHorario, getLogs, getUsuarios, deleteUserProfile, getCursos, deleteCurso, Curso, updateUserProfile, updateAlumno, migrateToCompactFormat, MigrationResult, subscribeToUsuarios, subscribeToAlumnos, subscribeToProfesores, subscribeToCursos, getCertificateFileUrl } from "@/lib/dataService";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import TopNavSidebar from "@/components/layout/TopNavSidebar";
import CustomSelect from "@/components/shared/CustomSelect";
import ContactForm from "@/components/ContactForm";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SkeletonExamGrid, SkeletonAttendanceTable } from "@/components/shared/SkeletonLoaders";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";
import { notify } from "@/lib/notify";
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
  MonitorAsistenciaTab,
  CalendarioTab,
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
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";
import { 
  LayoutDashboard, 
  ClipboardList, 
  CalendarDays, 
  GraduationCap, 
  Users, 
  ShieldAlert, 
  ShieldCheck,
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
  UserCheck,
  Hourglass,
  Info,
  QrCode
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "success" | "warning" | "info";
  }>({ isOpen: false, message: "", onConfirm: () => {} });
  const [hasMounted, setHasMounted] = useState(false);
  const [promotions, setPromotions] = useState<Record<string, string>>({});
  const [promoSearchQuery, setPromoSearchQuery] = useState("");
  const [promoFilterCourse, setPromoFilterCourse] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  


  const isLoggingOut = useRef(false);
  const lastBackToastRef = useRef<number>(0);

  // ── Sincronización de pestañas con historial del navegador ──
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab((prev) => {
      if (prev === newTab) return prev;
      if (typeof window !== "undefined") {
        const targetUrl = newTab === "general" ? "/dashboard" : `/dashboard?tab=${newTab}`;
        window.history.pushState({ app: "escuelainfo-dashboard", tab: newTab, isBase: false }, "", targetUrl);
      }
      return newTab;
    });
  }, []);

  // ── Configurar pestaña inicial y resguardo inexpugnable de historial ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get("tab") || "general";
    if (initialTab !== "general") {
      setActiveTab(initialTab);
    }
    // 1. Establecer ancla base en el dashboard (reemplaza cualquier entrada previa al login)
    window.history.replaceState({ app: "escuelainfo-dashboard", tab: "general", isBase: true }, "", "/dashboard");
    // 2. Empujar entrada activa como buffer protector para que el botón "Atrás" nunca expulse fuera
    const activeUrl = initialTab === "general" ? "/dashboard" : `/dashboard?tab=${initialTab}`;
    window.history.pushState({ app: "escuelainfo-dashboard", tab: initialTab, isBase: false }, "", activeUrl);
  }, []);

  // ── Manejo inteligente del botón Atrás (móviles y gestos) ──
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isLoggingOut.current) return;

      // 1. Si hay un diálogo de confirmación abierto, cerrarlo con prioridad
      if (confirmDialog.isOpen) {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        window.history.pushState({ app: "escuelainfo-dashboard", tab: activeTab, isBase: false }, "", window.location.href);
        return;
      }

      // 2. Si hay algún modal abierto, cerrarlo con prioridad sin salir
      const anyModalOpen =
        isProfileModalOpen ||
        isModalOpen ||
        isTeacherModalOpen ||
        isTeacherReportModalOpen ||
        isStudentModalOpen ||
        isScheduleModalOpen ||
        isCourseModalOpen ||
        isAssignModalOpen ||
        isSendNoticeModalOpen ||
        isUserModalOpen ||
        isQRModalOpen ||
        isVersionModalOpen;

      if (anyModalOpen) {
        if (isProfileModalOpen) setIsProfileModalOpen(false);
        if (isModalOpen) setIsModalOpen(false);
        if (isTeacherModalOpen) setIsTeacherModalOpen(false);
        if (isTeacherReportModalOpen) setIsTeacherReportModalOpen(false);
        if (isStudentModalOpen) setIsStudentModalOpen(false);
        if (isScheduleModalOpen) setIsScheduleModalOpen(false);
        if (isCourseModalOpen) setIsCourseModalOpen(false);
        if (isAssignModalOpen) setIsAssignModalOpen(false);
        if (isSendNoticeModalOpen) setIsSendNoticeModalOpen(false);
        if (isUserModalOpen) setIsUserModalOpen(false);
        if (isQRModalOpen) setIsQRModalOpen(false);
        if (isVersionModalOpen) setIsVersionModalOpen(false);

        window.history.pushState({ app: "escuelainfo-dashboard", tab: activeTab, isBase: false }, "", window.location.href);
        return;
      }

      // 3. Si no hay modales y la pestaña no es "general", volver suavemente a "general"
      if (activeTab !== "general") {
        setActiveTab("general");
        window.history.pushState({ app: "escuelainfo-dashboard", tab: "general", isBase: false }, "", "/dashboard");
        return;
      }

      // 4. Si ya estamos en "general" y no hay modales:
      // Restablecer el buffer protector para que el navegador JAMÁS salga al login o hacia afuera
      window.history.pushState({ app: "escuelainfo-dashboard", tab: "general", isBase: false }, "", "/dashboard");

      const now = Date.now();
      if (now - lastBackToastRef.current > 2500) {
        lastBackToastRef.current = now;
        notify.info("Para cerrar sesión de forma segura, usá el botón 'Cerrar Sesión' en el menú.");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    activeTab,
    confirmDialog.isOpen,
    isProfileModalOpen,
    isModalOpen,
    isTeacherModalOpen,
    isTeacherReportModalOpen,
    isStudentModalOpen,
    isScheduleModalOpen,
    isCourseModalOpen,
    isAssignModalOpen,
    isSendNoticeModalOpen,
    isUserModalOpen,
    isQRModalOpen,
    isVersionModalOpen,
  ]);

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
        let profile = await getUserProfile(currentUser.$id);
        if (!profile && currentUser.email) {
          const pre = await getUserProfileByEmail(currentUser.email);
          if (pre?.id) {
            await updateUserProfile(pre.id, { uid: currentUser.$id, nombre: currentUser.name || "Usuario" }).catch(() => {});
            profile = { ...pre, uid: currentUser.$id };
          }
        }
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
          if (isMounted) router.replace("/");
        }
      } catch (err) {
        if (isMounted) router.replace("/");
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
    isLoggingOut.current = true;
    try {
      sessionStorage.clear(); // Limpiar caché de datos locales por seguridad
      await account.deleteSession("current");
    } catch { 
      sessionStorage.clear();
    } finally {
      window.location.replace("/");
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (type === "error") {
      notify.error(message);
    } else {
      notify.success(message);
    }
  };


  const isAdmin = userProfile?.rol === 'admin' || userProfile?.rol === 'directivo' || userProfile?.rol === 'preceptor';
  const isSuperAdmin = userProfile?.rol === 'admin';
  const isDirector = userProfile?.rol === 'directivo';
  const isPreceptor = userProfile?.rol === 'preceptor';
  
  // Jerarquía: Preceptor no puede gestionar ausencias. Solo Directivo y Admin.
  const canManageAusencias = isSuperAdmin || isDirector;
  const canManageColaboradores = isSuperAdmin || isDirector;

  const askConfirm = (
    message: string,
    onConfirm: () => void,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      variant?: "danger" | "success" | "warning" | "info";
    }
  ) => {
    const lower = message.toLowerCase();
    let defaultConfirmText = "Confirmar";
    let defaultVariant: "danger" | "success" | "warning" | "info" = "danger";
    let defaultTitle = "¿Estás seguro?";

    if (lower.includes("aprobar")) {
      defaultConfirmText = "Aprobar";
      defaultVariant = "success";
      defaultTitle = "Confirmar Aprobación";
    } else if (lower.includes("rechazar")) {
      defaultConfirmText = "Rechazar";
      defaultVariant = "danger";
      defaultTitle = "Confirmar Rechazo";
    } else if (lower.includes("eliminar") || lower.includes("borrar") || lower.includes("vaciar")) {
      defaultConfirmText = "Eliminar";
      defaultVariant = "danger";
      defaultTitle = "¿Estás seguro?";
    } else if (lower.includes("revocar")) {
      defaultConfirmText = "Revocar";
      defaultVariant = "danger";
      defaultTitle = "Revocar Acceso";
    } else if (lower.includes("adhesión") || lower.includes("paro")) {
      defaultConfirmText = "Confirmar Adhesión";
      defaultVariant = "warning";
      defaultTitle = "Adhesión a Paro";
    }

    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm,
      title: options?.title || defaultTitle,
      confirmText: options?.confirmText || defaultConfirmText,
      cancelText: options?.cancelText || "Cancelar",
      variant: options?.variant || defaultVariant,
    });
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
  const filteredAusencias = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = searchQuery.toLowerCase().trim();

    return ausencias.filter(a => {
      // Si es profesor, debe ver todo su historial (incluso licencias pasadas)
      if (userProfile?.rol === 'profesor') {
        const isCurrentTeacher = currentProfesor && (
          (a.profId && String(a.profId) === String(currentProfesor.id)) ||
          (a.profNombre && currentProfesor.nombre && a.profNombre.trim().toLowerCase() === currentProfesor.nombre.trim().toLowerCase())
        );
        if (!isCurrentTeacher) return false;
        return q === "" || (a.tipo || "").toLowerCase().includes(q) || (a.motivo || "").toLowerCase().includes(q);
      }

      // Para administradores y equipo institucional, ocultar pasadas solo si no hay búsqueda activa
      const isExpired = a.fin < today;
      if (isExpired && q === "") {
        return false;
      }

      return (a.profNombre || "").toLowerCase().includes(q) || (a.tipo || "").toLowerCase().includes(q);
    });
  }, [ausencias, userProfile?.rol, currentProfesor, searchQuery]);

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

  // Comprobación periódica automática para usuarios en espera de aprobación
  useEffect(() => {
    if (!userProfile || !userProfile.rol.startsWith("pendiente_")) return;
    const interval = setInterval(() => {
      checkStatus(false);
    }, 10000);
    const onFocus = () => {
      checkStatus(false);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [userProfile?.rol, user?.$id]);

  const checkStatus = async (isManual = true) => {
    if (!user) return;
    if (isManual) setLoading(true);
    try {
      const profile = await getUserProfile(user.$id);
      if (profile) {
        setUserProfile(profile);
        if (!profile.rol.startsWith("pendiente_")) {
          showToast("¡Tu cuenta ha sido aprobada! Ingresando al panel...", "success");
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
        } else if (isManual) {
          notify.info("Tu solicitud continúa en proceso de revisión institucional.");
        }
      }
    } catch {
      if (isManual) {
        showToast("Error al verificar estado. Intentá de nuevo.", "error");
      }
    } finally {
      if (isManual) setLoading(false);
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
      directivo: "Dirección / Administrador",
      preceptor: "Equipo Directivo",
      profesor: "Equipo Directivo",
      alumno: "Preceptores del Curso"
    };

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 bg-transparent text-[var(--text)]">
        {/* Glows ambientales decorativos */}
        <div className="hidden sm:block absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="hidden sm:block absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-[var(--verde-bg)] rounded-full blur-[140px] pointer-events-none animate-pulse" />

        <div className="glass w-full max-w-[480px] p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/20 dark:border-white/10 shadow-2xl relative z-10 text-center animate-zoom-in">
          {/* Header con Identidad Institucional */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-3 shrink-0 transition-transform duration-300 hover:scale-105">
              <EscuelaInfoLogo size={52} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
              Escuela N° 713 &quot;Juan Abdala Chayep&quot;
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight title-font">
              Escuela<span className="text-[var(--verde)]">Info</span>
            </div>
          </div>

          {/* Insignia Hero de Estado */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center relative shadow-[0_8px_30px_rgba(245,158,11,0.25)]">
                <Clock size={36} className="text-amber-400 animate-[spin_16s_linear_infinite]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center border-2 border-[var(--bg)] shadow-md">
                <Hourglass size={13} strokeWidth={2.5} className="animate-pulse" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Cuenta en Verificación
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] mb-1">
              ¡Tu solicitud está en camino!
            </h2>
            <p className="text-[var(--text2)] text-xs sm:text-sm font-medium max-w-sm">
              Hola <span className="text-[var(--text)] font-extrabold">{userProfile.nombre}</span>, tu registro se completó exitosamente y se encuentra a la espera de validación institucional.
            </p>
          </div>

          {/* Ficha de Información Institucional */}
          <div className="bg-[var(--bg3)]/80 backdrop-blur-md border border-[var(--border)] p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left space-y-3 mb-6 text-xs shadow-inner">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--text3)] font-bold text-[11px] uppercase tracking-wider">
                <Mail size={14} className="text-emerald-400 shrink-0" />
                <span>Correo Registrado:</span>
              </div>
              <span className="text-[var(--text)] font-bold font-mono text-[11px] truncate max-w-[200px]" title={userProfile.email}>
                {userProfile.email}
              </span>
            </div>

            <div className="h-px bg-[var(--border)]/60 w-full" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--text3)] font-bold text-[11px] uppercase tracking-wider">
                <GraduationCap size={14} className="text-cyan-400 shrink-0" />
                <span>Rol Solicitado:</span>
              </div>
              <span className="text-[var(--verde)] font-black uppercase text-[11px] tracking-wider px-2 py-0.5 rounded-lg bg-[var(--verde-bg)] border border-[var(--verde-border)]">
                {roleLabels[requestedCleanRole] || requestedCleanRole}
              </span>
            </div>

            <div className="h-px bg-[var(--border)]/60 w-full" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--text3)] font-bold text-[11px] uppercase tracking-wider">
                <UserCheck size={14} className="text-amber-400 shrink-0" />
                <span>Quién Habilita:</span>
              </div>
              <span className="text-[var(--text2)] font-extrabold text-[11px]">
                {approverLabels[requestedCleanRole] || "Personal Autorizado"}
              </span>
            </div>
          </div>

          {/* Línea de Progreso 3 Pasos (Alineación Matemática Perfecta) */}
          <div className="mb-8 select-none px-2">
            <div className="grid grid-cols-3 relative">
              {/* Línea conectora entre círculos */}
              <div className="absolute top-4 left-[16.66%] right-[16.66%] h-[3px] bg-[var(--border)] -translate-y-1/2 z-0 rounded-full">
                <div className="h-full w-1/2 bg-gradient-to-r from-[var(--verde)] to-amber-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>

              {/* Paso 1: Registro */}
              <div className="flex flex-col items-center z-10">
                <div className="w-8 h-8 rounded-full bg-[var(--verde)] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-transform hover:scale-110">
                  <Check size={16} strokeWidth={3} />
                </div>
                <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-[var(--text)]">Registro</span>
                <span className="text-[9px] font-bold text-emerald-400">Completado</span>
              </div>

              {/* Paso 2: Revisión */}
              <div className="flex flex-col items-center z-10">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.45)] border-2 border-amber-300 animate-pulse">
                  <Clock size={15} strokeWidth={2.5} />
                </div>
                <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-amber-400">Revisión</span>
                <span className="text-[9px] font-bold text-amber-400/80">En proceso</span>
              </div>

              {/* Paso 3: Aprobación */}
              <div className="flex flex-col items-center z-10">
                <div className="w-8 h-8 rounded-full bg-[var(--bg3)] text-[var(--text3)] border-2 border-[var(--border)] flex items-center justify-center transition-all">
                  <ShieldCheck size={15} />
                </div>
                <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-[var(--text3)]">Acceso</span>
                <span className="text-[9px] font-bold text-[var(--text3)]">Habilitación</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => checkStatus(true)}
              disabled={loading}
              className="w-full bg-[var(--verde)] hover:brightness-110 text-black rounded-2xl py-3.5 px-4 text-sm font-black cursor-pointer transition-all duration-300 shadow-[0_4px_20px_rgba(var(--verde-rgb),0.35)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : "transition-transform group-hover:rotate-180"} />
              <span>{loading ? "Comprobando aprobación..." : "Verificar Estado de mi Cuenta"}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-[var(--bg3)] hover:bg-[var(--rojo-bg)] hover:text-[var(--rojo)] hover:border-[var(--rojo-border)] text-[var(--text2)] border border-[var(--border)] rounded-2xl py-3 px-4 text-xs font-bold cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <LogOut size={15} />
              <span>Cerrar Sesión</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text3)] font-semibold pt-1">
              <Info size={12} className="text-emerald-400 shrink-0" />
              <span>Esta pantalla se actualiza en tiempo real al ser aprobada.</span>
            </div>

            <p className="text-[9px] text-[var(--text3)] uppercase tracking-[0.15em] font-semibold pt-1">
              ¿Tenés alguna urgencia? Contactá a la secretaría o directivo de la escuela.
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
            handleTabChange(tabId);
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

        <div className="p-3.5 sm:p-6 md:p-12 pb-20 max-w-[1400px] mx-auto">
          {/* HEADER: saludo solo en inicio, título de sección en el resto */}
          {activeTab === "general" ? (
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black title-font mb-1.5 sm:mb-2 tracking-tight">¡Hola, {user?.displayName?.split(' ')[0] || "Bienvenido"}!</h1>
                <p className="text-[var(--text2)] text-xs sm:text-base md:text-lg">
                  {userProfile?.rol === 'alumno' ? "Consulta tu horario y materias asignadas." : "Aquí tienes el control de tu institución en tiempo real."}
                </p>
              </div>
              {userProfile?.rol !== 'alumno' && (
                <button
                  onClick={() => setIsSendNoticeModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] hover:bg-[var(--verde)] hover:text-black rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-md active:scale-95 cursor-pointer"
                >
                  <Mail size={16} />
                  <span>Enviar Aviso por Mail</span>
                </button>
              )}
            </header>
          ) : (
            <header className="flex items-center justify-between gap-3 mb-6 sm:mb-10">
              <h1 className="text-xl sm:text-2xl font-black title-font tracking-tight">
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
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black text-[var(--text3)] bg-[var(--bg3)] border border-[var(--border)] px-2.5 sm:px-3 py-1 rounded-full shrink-0">
                EscuelaInfo
              </span>
            </header>
          )}

          {/* CONTENIDO SEGÚN PESTAÑA */}
          {activeTab === "asistencia" && (
            <div className="animate-fade-in space-y-6">
              {userProfile?.rol !== "alumno" && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => setIsQRModalOpen(true)}
                    className="bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] font-bold px-6 py-3.5 rounded-2xl hover:bg-[var(--verde)] hover:text-black transition-all shadow-md flex items-center gap-2 w-full md:w-auto justify-center cursor-pointer text-sm"
                  >
                    <QrCode size={18} />
                    <span>Generar QR / Asistencia Rápida</span>
                  </button>
                </div>
              )}
              <StudentAttendanceManager user={user} userProfile={userProfile} />
            </div>
          )}

          {activeTab === "monitor-asistencia" && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo' || userProfile?.rol === 'preceptor') && (
            <div className="animate-fade-in">
              <MonitorAsistenciaTab />
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
              userProfile={userProfile}
              onNavigateToAusencias={(search) => { handleTabChange("ausencias"); setSearchQuery(search || ""); }}
              onNavigateToHorarios={(curso) => { handleTabChange("horarios"); setSelectedCourse(curso); }}
              onOpenNewAbsenceModal={() => setIsModalOpen(true)}
              onOpenProfile={() => setIsProfileModalOpen(true)}
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
              horarios={horarios}
              isAdmin={isAdmin}
              canManage={isAdmin || userProfile?.rol === 'preceptor'}
              onOpenAddTeacher={() => setIsTeacherModalOpen(true)}
              onEditTeacher={(p: Profesor) => { setEditingProfesor(p); setIsTeacherModalOpen(true); }}
              onDeleteTeacher={handleDeleteProfesor}
              onNavigateToAusencias={(search: string) => { setActiveTab("ausencias"); setSearchQuery(search); }}
              onRefreshProfesores={() => getProfesores().then(setProfesores)}
              showToast={showToast}
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
              currentProfesor={currentProfesor}
              userProfile={userProfile}
              isAdmin={isAdmin}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              scheduleQuery={scheduleQuery}
              setScheduleQuery={setScheduleQuery}
              onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              onDeleteHorario={handleDeleteHorario}
              onNavigateToAusencias={(profNombre) => { handleTabChange("ausencias"); setSearchQuery(profNombre); }}
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

          {activeTab === "calendario" && (userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') && (
            <div className="animate-fade-in">
              <CalendarioTab user={user} userProfile={userProfile} showToast={showToast} />
            </div>
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

      <NewAbsenceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {}}
        lockedProfesor={userProfile?.rol === 'profesor' ? currentProfesor : undefined}
        ausencias={ausencias}
        userProfile={userProfile}
        cursos={cursos}
        horarios={horarios}
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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform ${
              confirmDialog.variant === "success"
                ? "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] shadow-lg shadow-[var(--verde)]/10"
                : confirmDialog.variant === "warning"
                ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] shadow-lg shadow-[var(--amarillo)]/10"
                : "bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] shadow-lg shadow-[var(--rojo)]/10"
            }`}>
              {confirmDialog.variant === "success" ? (
                <Check size={32} strokeWidth={3} />
              ) : confirmDialog.variant === "warning" ? (
                <AlertTriangle size={32} />
              ) : (
                <ShieldAlert size={32} />
              )}
            </div>
            <h3 className="text-xl font-black title-font mb-2">
              {confirmDialog.title || "¿Estás seguro?"}
            </h3>
            <p className="text-[var(--text2)] text-sm mb-8 leading-relaxed font-semibold">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
                className="flex-1 p-3.5 rounded-2xl border border-[var(--border)] font-bold text-sm hover:bg-[var(--bg3)] text-[var(--text)] transition-colors cursor-pointer"
              >
                {confirmDialog.cancelText || "Cancelar"}
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }} 
                className={`flex-1 p-3.5 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5 ${
                  confirmDialog.variant === "success"
                    ? "bg-[var(--verde)] text-black shadow-[var(--verde)]/20 hover:brightness-105"
                    : confirmDialog.variant === "warning"
                    ? "bg-[var(--amarillo)] text-black shadow-[var(--amarillo)]/20 hover:brightness-105"
                    : "bg-[var(--rojo)] text-white shadow-[var(--rojo)]/20 hover:brightness-105"
                }`}
              >
                {confirmDialog.variant === "success" && <Check size={16} strokeWidth={3} />}
                {confirmDialog.variant === "danger" && confirmDialog.confirmText === "Rechazar" && <X size={16} strokeWidth={3} />}
                {confirmDialog.variant === "danger" && confirmDialog.confirmText === "Eliminar" && <Trash2 size={16} />}
                <span>{confirmDialog.confirmText || "Confirmar"}</span>
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
    </div>
    </SidebarProvider>
  );
}

