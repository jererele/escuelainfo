"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { account } from "@/lib/appwrite";
import {
  saveAusencia,
  Ausencia,
  getProfesores,
  Profesor,
  UserProfile,
  logAction,
  uploadCertificateFile,
  deleteCertificateFile,
  getAusencias,
  calculateAbsenceDays,
  Curso,
  Horario,
  getCursos,
  getHorarios,
  getAlumnos
} from "@/lib/dataService";
import { sendAbsenceNoticeEmail, getAffectedCoursesFromAusencia } from "@/lib/emailService";
import { notify } from "@/lib/notify";
import {
  X,
  AlertCircle,
  Search,
  ChevronDown,
  Upload,
  Check,
  Clock,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  Building2,
  ShieldAlert,
  Info
} from "lucide-react";

export type StaffRole = "profesor" | "preceptor" | "directivo";

export interface RoleRule {
  maxDias: number | null;
  periodo: "año" | "evento" | "especial";
  limiteTexto: string;
  unidad: string;
  topeMensual?: string;
  anticipacion?: string;
  normativaChubut: string;
  alertaEspecial?: string;
}

export interface ArticuloLicencia {
  codigo: string;
  detalle: string;
  reglas: Record<StaffRole, RoleRule>;
}

interface NewAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lockedProfesor?: Profesor;
  ausencias?: Ausencia[];
  userProfile?: UserProfile | null;
  cursos?: Curso[];
  horarios?: Horario[];
}

// ——— Catálogo estatutario enriquecido de licencias por Rol (Chubut Ley VIII N° 20 / Dto. 508/2026 / Res. 517/90) ———
export const ARTICULOS_LICENCIA: ArticuloLicencia[] = [
  {
    codigo: "Art. 14",
    detalle: "Familiar Enfermo",
    reglas: {
      profesor: {
        maxDias: 20,
        periodo: "año",
        limiteTexto: "Máx. 20 d/año (100%) + 10 d. (50%)",
        unidad: "Horas Cátedra curriculares",
        anticipacion: "Hasta 45 min del inicio de turno en SAE",
        normativaChubut: "Ley VIII N° 20 y Dto. 508/2026: 20 días con 100% de haberes; hasta 10 adicionales al 50%. Requiere DDJJ de familiar a cargo de 1° grado."
      },
      preceptor: {
        maxDias: 20,
        periodo: "año",
        limiteTexto: "Máx. 20 d/año (100%) + 10 d. (50%)",
        unidad: "Cargo Completo de Planta (Turno 4.5 hs)",
        anticipacion: "Hasta 45 min del inicio de turno en SAE",
        normativaChubut: "Ley VIII N° 20 y Dto. 508/2026: 20 días al 100% (+10 d. al 50%). Justifica la totalidad de la jornada del turno de preceptoría."
      },
      directivo: {
        maxDias: 20,
        periodo: "año",
        limiteTexto: "Máx. 20 d/año (100%) + 10 d. (50%)",
        unidad: "Conducción Escolar",
        alertaEspecial: "Requiere designar inmediatamente a Vicedirección a cargo de la Dirección y elevar comunicación formal a Supervisión de Región.",
        normativaChubut: "Ley VIII N° 20 y Dto. 508/2026: Notificación prioritaria a Supervisión Técnica de Región."
      }
    }
  },
  {
    codigo: "Art. 15",
    detalle: "Razones Particulares",
    reglas: {
      profesor: {
        maxDias: 6,
        periodo: "año",
        limiteTexto: "Máx. 6 d/año (Tope: 2 d/mes)",
        topeMensual: "Máx. 2 días por mes calendario",
        anticipacion: "Mínimo 48 hs hábiles previas",
        unidad: "Horas Cátedra curriculares (Horas Libres si no hay suplente)",
        normativaChubut: "Ley VIII N° 20: Con goce íntegro de haberes. No acumulable de un año a otro. Sujeto a aprobación directiva."
      },
      preceptor: {
        maxDias: 6,
        periodo: "año",
        limiteTexto: "Máx. 6 d/año (Tope: 1-2 d/mes)",
        topeMensual: "Máx. 1 día/mes (2 con causa justificada)",
        anticipacion: "Mínimo 48 hs hábiles previas",
        unidad: "Cargo Continuo de Turno (4.5 hs)",
        alertaEspecial: "Restricción de cobertura: No puede usufructuarse por más de 1 preceptor por turno para garantizar el cuidado y disciplina de los alumnos.",
        normativaChubut: "Ley VIII N° 20: Con goce de haberes. Requiere redistribución previa de divisiones por Jefatura de Preceptores o Vicedirección."
      },
      directivo: {
        maxDias: 6,
        periodo: "año",
        limiteTexto: "Máx. 6 d/año (Tope: 1 d/mes)",
        topeMensual: "Máx. 1 día por mes calendario",
        anticipacion: "Elevación formal previa a Supervisión de Región",
        unidad: "Conducción Institucional",
        alertaEspecial: "PROHIBICIÓN EN PERÍODOS CRÍTICOS (Res. 517/90): Prohibido en los 20 días previos al cierre o 20 días posteriores al inicio del ciclo lectivo, y en turnos de exámenes generales. Debe convalidarse por Supervisión con reemplazante a cargo.",
        normativaChubut: "Ley VIII N° 20 y Res. 517/90: Con goce de sueldo. Aprobación exclusiva de Supervisión Escolar de Región."
      }
    }
  },
  {
    codigo: "Art. 16",
    detalle: "Donación de Sangre",
    reglas: {
      profesor: {
        maxDias: 1,
        periodo: "evento",
        limiteTexto: "1 día por donación",
        unidad: "Clases del día",
        anticipacion: "24 hs previas",
        normativaChubut: "Ley Nac. 22.990 y Ley VIII N° 20: 1 día por hecho con certificado oficial del banco de sangre o centro de hemoterapia."
      },
      preceptor: {
        maxDias: 1,
        periodo: "evento",
        limiteTexto: "1 día por donación",
        unidad: "Turno completo (4.5 hs)",
        anticipacion: "24 hs previas",
        normativaChubut: "Ley Nac. 22.990: Justifica la jornada completa del turno de preceptoría con constancia de centro de hemoterapia."
      },
      directivo: {
        maxDias: 1,
        periodo: "evento",
        limiteTexto: "1 día por donación",
        unidad: "Jornada directiva",
        normativaChubut: "Ley Nac. 22.990: Justifica la jornada con certificado oficial. Despacho a cargo de Vicedirección."
      }
    }
  },
  {
    codigo: "Art. 17",
    detalle: "Mudanza",
    reglas: {
      profesor: {
        maxDias: 2,
        periodo: "año",
        limiteTexto: "Máx. 2 días hábiles/año",
        unidad: "Clases del día",
        anticipacion: "48 hs previas",
        normativaChubut: "Ley VIII N° 20: 2 días hábiles por año calendario. Acreditar cambio de domicilio en DNI o contrato de alquiler."
      },
      preceptor: {
        maxDias: 2,
        periodo: "año",
        limiteTexto: "Máx. 2 días hábiles/año",
        unidad: "Turno continuo (4.5 hs)",
        anticipacion: "48 hs previas",
        normativaChubut: "Ley VIII N° 20: 2 días hábiles anuales. Acreditar cambio de domicilio o contrato de locación."
      },
      directivo: {
        maxDias: 2,
        periodo: "año",
        limiteTexto: "Máx. 2 días hábiles/año",
        unidad: "Jornada de conducción",
        normativaChubut: "Ley VIII N° 20: 2 días hábiles anuales con acreditación fehaciente de cambio de domicilio."
      }
    }
  },
  {
    codigo: "Art. 18",
    detalle: "Examen Universitario",
    reglas: {
      profesor: {
        maxDias: 10,
        periodo: "año",
        limiteTexto: "Máx. 10 d/año (Hasta 3 d/examen)",
        topeMensual: "Hasta 3 días por turno de examen",
        anticipacion: "48 hs hábiles previas",
        unidad: "Horas Cátedra y clases curriculares de la fecha",
        normativaChubut: "Ley VIII N° 20: Con goce de haberes en carreras universitarias o terciarias oficiales. Presentar constancia de examen rendido en 48 hs."
      },
      preceptor: {
        maxDias: 10,
        periodo: "año",
        limiteTexto: "Máx. 10 d/año (Hasta 3 d/examen)",
        topeMensual: "Hasta 3 días por examen",
        anticipacion: "48 hs hábiles previas",
        unidad: "Turno institucional continuo completo de 4.5 hs del día del examen",
        normativaChubut: "Ley VIII N° 20: Con goce de sueldo. Justifica la jornada completa del turno. Constancia oficial de examen rendido en 48 hs."
      },
      directivo: {
        maxDias: 10,
        periodo: "año",
        limiteTexto: "Máx. 10 d/año (Hasta 3 d/examen)",
        anticipacion: "48 hs hábiles previas",
        unidad: "Jornada de conducción escolar",
        alertaEspecial: "Delegación formal previa de expedientes y firma escolar en Vicedirección o Secretaría.",
        normativaChubut: "Ley VIII N° 20: Con goce de haberes. Constancia de examen rendido dentro de las 48 hs hábiles."
      }
    }
  },
  {
    codigo: "Art. 19",
    detalle: "Fallecimiento Familiar Directo",
    reglas: {
      profesor: {
        maxDias: 5,
        periodo: "evento",
        limiteTexto: "5 días hábiles",
        unidad: "Clases del período de duelo (padres, hijos, cónyuge, hermanos)",
        normativaChubut: "Ley VIII N° 20: 5 días hábiles a partir del deceso. Presentar acta de defunción en legajo escolar dentro de 30 días."
      },
      preceptor: {
        maxDias: 5,
        periodo: "evento",
        limiteTexto: "5 días hábiles",
        unidad: "Jornada institucional continua (Turno 4.5 hs)",
        normativaChubut: "Ley VIII N° 20: 5 días hábiles continuos por duelo directo. Certificado de defunción en legajo escolar dentro de 30 días."
      },
      directivo: {
        maxDias: 5,
        periodo: "evento",
        limiteTexto: "5 días hábiles",
        unidad: "Conducción institucional",
        alertaEspecial: "Asunción inmediata del Vicedirector a cargo de la Dirección y notificación urgente a Supervisión de Región.",
        normativaChubut: "Ley VIII N° 20: 5 días hábiles. Cobertura jerárquica reglamentaria por Vicedirección."
      }
    }
  },
  {
    codigo: "Art. 20",
    detalle: "Fallecimiento Familiar Indirecto",
    reglas: {
      profesor: {
        maxDias: 2,
        periodo: "evento",
        limiteTexto: "2 días hábiles",
        unidad: "Jornada de funciones (abuelos, nietos, tíos carnales, suegros, cuñados, yernos, nueras)",
        normativaChubut: "Ley VIII N° 20: 2 días hábiles a partir del hecho con presentación de certificado de defunción."
      },
      preceptor: {
        maxDias: 2,
        periodo: "evento",
        limiteTexto: "2 días hábiles",
        unidad: "Turno continuo (4.5 hs)",
        normativaChubut: "Ley VIII N° 20: 2 días hábiles a partir del deceso con acta o constancia médica."
      },
      directivo: {
        maxDias: 2,
        periodo: "evento",
        limiteTexto: "2 días hábiles",
        unidad: "Jornada directiva",
        normativaChubut: "Ley VIII N° 20: 2 días hábiles. Reemplazo formal por Vicedirección."
      }
    }
  },
  {
    codigo: "Art. 21",
    detalle: "Casamiento",
    reglas: {
      profesor: {
        maxDias: 10,
        periodo: "evento",
        limiteTexto: "10 días corridos",
        anticipacion: "15 días de anticipación",
        unidad: "Días corridos desde el enlace civil o unión convivencial",
        normativaChubut: "Ley VIII N° 20: 10 días corridos con goce de haberes. Presentar acta o libreta de matrimonio dentro de 30 días."
      },
      preceptor: {
        maxDias: 10,
        periodo: "evento",
        limiteTexto: "10 días corridos",
        anticipacion: "15 días de anticipación",
        unidad: "Cargo institucional continuo",
        normativaChubut: "Ley VIII N° 20: 10 días corridos con goce de sueldo a partir del casamiento civil o unión convivencial registrada."
      },
      directivo: {
        maxDias: 10,
        periodo: "evento",
        limiteTexto: "10 días corridos",
        anticipacion: "15 días de anticipación con elevación a Supervisión",
        unidad: "Conducción escolar",
        alertaEspecial: "Elevar con antelación formal a Supervisión de Región para designar Director a cargo reglamentario.",
        normativaChubut: "Ley VIII N° 20: 10 días corridos. Reemplazo formal de conducción escolar por Vicedirección."
      }
    }
  },
  {
    codigo: "Art. 43",
    detalle: "Licencia Gremial",
    reglas: {
      profesor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Según acuerdo sindical y mandato gremial",
        unidad: "Horas Cátedra",
        normativaChubut: "Estatuto Docente y Ley 23.551 de Asociaciones Sindicales. Acreditar constancia del gremio (ATECh / SITRAED)."
      },
      preceptor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Según acuerdo sindical y mandato gremial",
        unidad: "Cargo institucional continuo",
        normativaChubut: "Estatuto Docente y Ley 23.551. Acreditación de representación sindical."
      },
      directivo: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Según acuerdo sindical y mandato gremial",
        unidad: "Conducción escolar",
        normativaChubut: "Estatuto Docente y Ley 23.551 con comunicación a Supervisión de Región."
      }
    }
  },
  {
    codigo: "Art. 50",
    detalle: "Enfermedad Corta Duración",
    reglas: {
      profesor: {
        maxDias: 30,
        periodo: "año",
        limiteTexto: "Máx. 30 d/año (20 d. 100% + 10 d. 50%)",
        anticipacion: "Aviso obligatorio en SAE hasta 45 min del inicio del turno",
        unidad: "Módulos y materias curriculares de la jornada",
        normativaChubut: "Decreto 508/2026: Días 1 a 20 con 100% de haberes; días 21 a 30 con 50% de haberes. Certificado médico oficial en 48 hs hábiles ante DGRM."
      },
      preceptor: {
        maxDias: 30,
        periodo: "año",
        limiteTexto: "Máx. 30 d/año (20 d. 100% + 10 d. 50%)",
        anticipacion: "Aviso en SAE antes de los primeros 45 min del turno escolar",
        unidad: "Cargo Institucional Continuo de Planta (Turno 4.5 hs)",
        normativaChubut: "Decreto 508/2026: Días 1 a 20 al 100%; días 21 a 30 al 50% de haberes. Afecta el turno escolar completo. Certificado médico en 48 hs ante DGRM."
      },
      directivo: {
        maxDias: 30,
        periodo: "año",
        limiteTexto: "Máx. 30 d/año (20 d. 100% + 10 d. 50%)",
        anticipacion: "Aviso prioritario en SAE y notificación inmediata a Supervisión",
        unidad: "Conducción institucional del establecimiento",
        alertaEspecial: "Asunción formal inmediata del Vicedirector a cargo de la Dirección para asegurar la continuidad legal y administrativa escolar.",
        normativaChubut: "Decreto 508/2026: Días 1 a 20 al 100%; días 21 a 30 al 50%. Elevación a Supervisión Técnica de Región y DGRM."
      }
    }
  },
  {
    codigo: "Art. 51",
    detalle: "Enfermedad Larga Duración",
    reglas: {
      profesor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Hasta 2 años c/goce según Junta DGRM",
        unidad: "Horas Cátedra",
        normativaChubut: "Ley VIII N° 20 y Dto. 508/2026: Requiere junta médica y dictamen vinculante de la DGRM."
      },
      preceptor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Hasta 2 años c/goce según Junta DGRM",
        unidad: "Cargo institucional continuo",
        normativaChubut: "Ley VIII N° 20 y Dto. 508/2026: Dictamen vinculante de la DGRM."
      },
      directivo: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Hasta 2 años c/goce según Junta DGRM",
        unidad: "Conducción escolar",
        normativaChubut: "Ley VIII N° 20 y Dto. 508/2026: Dictamen vinculante de la DGRM con elevación a Supervisión."
      }
    }
  },
  {
    codigo: "Art. 55",
    detalle: "Maternidad / Paternidad",
    reglas: {
      profesor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "180 días maternidad / 15 días paternidad",
        unidad: "Horas Cátedra",
        normativaChubut: "Régimen unificado de licencias y protección de la familia de la Provincia del Chubut."
      },
      preceptor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "180 días maternidad / 15 días paternidad",
        unidad: "Cargo institucional continuo",
        normativaChubut: "Régimen unificado de licencias y protección de la familia de la Provincia del Chubut."
      },
      directivo: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "180 días maternidad / 15 días paternidad",
        unidad: "Conducción escolar",
        normativaChubut: "Régimen unificado de licencias y protección de la familia de la Provincia del Chubut."
      }
    }
  },
  {
    codigo: "Otro",
    detalle: "Otro Tipo de Artículo",
    reglas: {
      profesor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Según normativa ministerial",
        unidad: "Funciones escolares",
        normativaChubut: "Sujeto a encuadre reglamentario del Ministerio de Educación de Chubut."
      },
      preceptor: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Según normativa ministerial",
        unidad: "Funciones de preceptoría",
        normativaChubut: "Sujeto a encuadre reglamentario del Ministerio de Educación de Chubut."
      },
      directivo: {
        maxDias: null,
        periodo: "especial",
        limiteTexto: "Según resolución de Supervisión",
        unidad: "Conducción institucional",
        normativaChubut: "Sujeto a disposición ministerial o de Supervisión de Región."
      }
    }
  }
];

export default function NewAbsenceModal({
  isOpen,
  onClose,
  onSuccess,
  lockedProfesor,
  ausencias,
  userProfile,
  cursos,
  horarios
}: NewAbsenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [selectedProfId, setSelectedProfId] = useState("");
  const [allAusencias, setAllAusencias] = useState<Ausencia[]>(ausencias || []);
  const [allCursos, setAllCursos] = useState<Curso[]>(cursos || []);
  const [allHorarios, setAllHorarios] = useState<Horario[]>(horarios || []);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedArticulo, setSelectedArticulo] = useState<ArticuloLicencia | null>(null);
  const [error, setError] = useState("");

  // Rol del personal para la licencia: profesor | preceptor | directivo
  const [selectedRole, setSelectedRole] = useState<StaffRole>("profesor");

  const [formData, setFormData] = useState({
    tipo: "Licencia Médica",
    inicio: "",
    fin: "",
    materias: "",
    motivo: "",
    cert: false
  });

  interface Feriado {
    fecha: string;
    tipo: string;
    nombre: string;
  }

  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // — Estados para el buscador de artículos —
  const [articuloQuery, setArticuloQuery] = useState("");
  const [showArticuloDropdown, setShowArticuloDropdown] = useState(false);
  const articuloRef = useRef<HTMLDivElement>(null);
  const mobileArticuloRef = useRef<HTMLDivElement>(null);

  // Sincronizar ausencias recibidas por props o cargar de base de datos
  useEffect(() => {
    if (ausencias && ausencias.length > 0) {
      setAllAusencias(ausencias);
    } else if (isOpen) {
      getAusencias().then(setAllAusencias).catch(() => {});
    }
  }, [isOpen, ausencias]);

  // Sincronizar cursos y horarios
  useEffect(() => {
    if (cursos && cursos.length > 0) {
      setAllCursos(cursos);
    } else if (isOpen) {
      getCursos().then(setAllCursos).catch(() => {});
    }
  }, [isOpen, cursos]);

  useEffect(() => {
    if (horarios && horarios.length > 0) {
      setAllHorarios(horarios);
    } else if (isOpen) {
      getHorarios().then(setAllHorarios).catch(() => {});
    }
  }, [isOpen, horarios]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCourse("");
    }
  }, [isOpen]);

  // Inicializar rol según el perfil del usuario o si viene un profesor bloqueado
  useEffect(() => {
    if (isOpen) {
      if (lockedProfesor) {
        setSelectedRole("profesor");
      } else if (userProfile?.rol === "preceptor") {
        setSelectedRole("preceptor");
      } else if (userProfile?.rol === "directivo") {
        setSelectedRole("directivo");
      } else if (userProfile?.rol === "profesor") {
        setSelectedRole("profesor");
      }
    }
  }, [isOpen, lockedProfesor, userProfile]);

  // Cerrar dropdown al hacer click fuera o presionar Escape (optimizado)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        (articuloRef.current && !articuloRef.current.contains(target)) &&
        (mobileArticuloRef.current && !mobileArticuloRef.current.contains(target))
      ) {
        setShowArticuloDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowArticuloDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Fetch inicial cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      if (lockedProfesor) {
        setSelectedProfId(lockedProfesor.id!);
        setFormData(prev => ({ ...prev, materias: lockedProfesor.materias.join(", ") }));
      } else {
        getProfesores().then(setProfesores);
      }
      setArticuloQuery("");
      setShowArticuloDropdown(false);

      fetch("/api/feriados")
        .then((res) => {
          if (!res.ok) throw new Error("Error loading holidays");
          return res.json();
        })
        .then(async (data) => {
          let feriadosNacionales = Array.isArray(data) ? data : [];
          try {
            const { getSuspensiones } = await import("@/lib/dataService");
            const suspensiones = await getSuspensiones();
            const suspensionesFeriados = suspensiones.map(s => ({
              fecha: s.fecha,
              tipo: "Suspensión Institucional",
              nombre: s.motivo
            }));
            setFeriados([...feriadosNacionales, ...suspensionesFeriados]);
          } catch {
            setFeriados(feriadosNacionales);
          }
        })
        .catch((err) => console.error("Error al cargar feriados:", err));
    }
  }, [isOpen, lockedProfesor]);

  // Escape key close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey, { passive: true });
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Docente o Personal activo seleccionado
  const activeProfesor = useMemo<Profesor | null>(() => {
    if (lockedProfesor) return lockedProfesor;
    if (selectedProfId) {
      return profesores.find(p => String(p.id) === String(selectedProfId)) || null;
    }
    return null;
  }, [lockedProfesor, selectedProfId, profesores]);

  // Cursos en los que dicta clases el docente activo
  const activeProfesorCourses = useMemo(() => {
    if (!activeProfesor) return [];
    const profName = activeProfesor.nombre.trim().toLowerCase();
    const coursesSet = new Set<string>();

    allHorarios.forEach(h => {
      if ((h.profesor || "").trim().toLowerCase() === profName && h.curso) {
        coursesSet.add(h.curso.trim());
      }
    });

    return Array.from(coursesSet).sort();
  }, [activeProfesor, allHorarios]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Ausencias activas del año en curso para el personal seleccionado
  const staffAbsencesThisYear = useMemo(() => {
    if (!activeProfesor) return [];
    const targetId = String(activeProfesor.id);
    const targetNombre = activeProfesor.nombre.trim().toLowerCase();

    return allAusencias.filter(a => {
      const matchesProf =
        (a.profId && String(a.profId) === targetId) ||
        (a.profNombre && a.profNombre.trim().toLowerCase() === targetNombre);
      if (!matchesProf) return false;
      if (a.estado === "rechazada") return false;

      const aYear = a.inicio
        ? parseInt(a.inicio.slice(0, 4), 10)
        : (a.fechaReg ? new Date(a.fechaReg).getFullYear() : currentYear);
      return aYear === currentYear;
    });
  }, [activeProfesor, allAusencias, currentYear]);

  // Detector robusto de coincidencia entre ausencia y artículo
  const matchAbsenceToArticulo = useCallback((a: Ausencia, art: ArticuloLicencia): boolean => {
    const motivo = (a.motivo || "").toLowerCase();
    const codLower = art.codigo.toLowerCase();
    const codNum = art.codigo.replace(/\D+/g, "");
    const detLower = art.detalle.toLowerCase();

    if (motivo.includes(codLower)) return true;
    if (codNum && (motivo.includes(`art. ${codNum}`) || motivo.includes(`art ${codNum}`) || motivo.includes(`artículo ${codNum}`))) {
      return true;
    }
    if (detLower && motivo.includes(detLower)) return true;

    if (art.codigo === "Art. 50" && (a.tipo === "Licencia Médica" || a.tipo === "Artículo")) {
      if (motivo.includes("art. 51") || motivo.includes("larga")) return false;
      if (motivo.includes("art. 14") || motivo.includes("familiar")) return false;
      if (motivo.includes("art. 50") || motivo.includes("corta") || motivo.includes("común")) return true;
    }

    return false;
  }, []);

  // Función reactiva que computa el cupo exacto y días restantes según el ROL seleccionado
  const getArticleQuota = useCallback((art: ArticuloLicencia, role: StaffRole = selectedRole) => {
    const rule = art.reglas[role];

    if (!activeProfesor) {
      return {
        rule,
        diasUsados: 0,
        vecesUsadas: 0,
        diasRestantes: rule.maxDias,
        agotado: false,
        badgeText: rule.limiteTexto,
        badgeColor: "neutral" as const,
      };
    }

    const matching = staffAbsencesThisYear.filter(a => matchAbsenceToArticulo(a, art));
    let diasUsados = 0;
    matching.forEach(a => {
      diasUsados += calculateAbsenceDays(a.inicio, a.fin);
    });
    const vecesUsadas = matching.length;

    if (rule.maxDias !== null && rule.periodo === "año") {
      const diasRestantes = Math.max(0, rule.maxDias - diasUsados);
      const agotado = diasRestantes === 0;
      const badgeText = agotado
        ? `0 de ${rule.maxDias} d. (Agotado)`
        : `Quedan ${diasRestantes} de ${rule.maxDias} d.`;
      const badgeColor = agotado
        ? ("danger" as const)
        : diasRestantes <= 2
        ? ("warning" as const)
        : ("success" as const);

      return {
        rule,
        diasUsados,
        vecesUsadas,
        diasRestantes,
        agotado,
        badgeText,
        badgeColor,
      };
    }

    if (rule.periodo === "evento" && rule.maxDias !== null) {
      const badgeText = vecesUsadas > 0
        ? `Máx. ${rule.maxDias} d/vez (${vecesUsadas} pedida${vecesUsadas > 1 ? "s" : ""})`
        : rule.limiteTexto;
      return {
        rule,
        diasUsados,
        vecesUsadas,
        diasRestantes: null,
        agotado: false,
        badgeText,
        badgeColor: "info" as const,
      };
    }

    const badgeText = diasUsados > 0
      ? `${rule.limiteTexto} (${diasUsados} d. tomados)`
      : rule.limiteTexto;

    return {
      rule,
      diasUsados,
      vecesUsadas,
      diasRestantes: null,
      agotado: false,
      badgeText,
      badgeColor: "neutral" as const,
    };
  }, [activeProfesor, selectedRole, staffAbsencesThisYear, matchAbsenceToArticulo]);

  // Artículo activo deducido a partir de la selección o búsqueda
  const activeSelectedArticulo = useMemo(() => {
    if (selectedArticulo) return selectedArticulo;
    if (!formData.motivo && !articuloQuery) return null;
    const searchStr = `${formData.motivo} ${articuloQuery}`.toLowerCase();
    return ARTICULOS_LICENCIA.find(a => searchStr.includes(a.codigo.toLowerCase())) || null;
  }, [selectedArticulo, formData.motivo, articuloQuery]);

  // Duración en días corridos solicitados con las fechas ingresadas
  const requestedDays = useMemo(() => {
    if (!formData.inicio) return 0;
    return calculateAbsenceDays(formData.inicio, formData.fin || formData.inicio);
  }, [formData.inicio, formData.fin]);

  const currentHoliday = useMemo(() => {
    if (!formData.inicio || !formData.fin) return null;
    return feriados.find(f => f.fecha >= formData.inicio && f.fecha <= formData.fin) || null;
  }, [formData.inicio, formData.fin, feriados]);

  const articulosFiltrados = useMemo(() => {
    const q = articuloQuery.trim().toLowerCase();
    if (!q) return ARTICULOS_LICENCIA;
    return ARTICULOS_LICENCIA.filter(a =>
      `${a.codigo} ${a.detalle}`.toLowerCase().includes(q)
    );
  }, [articuloQuery]);

  // ✅ OPTIMIZACIONES CON USECALLBACK:
  const handleSelectArticulo = useCallback((art: ArticuloLicencia) => {
    setSelectedArticulo(art);
    const quota = getArticleQuota(art, selectedRole);
    const label = quota.diasRestantes !== null
      ? `${art.codigo} - ${art.detalle} (${quota.badgeText})`
      : (quota.rule.limiteTexto ? `${art.codigo} - ${art.detalle} (${quota.rule.limiteTexto})` : `${art.codigo} - ${art.detalle}`);

    setFormData(prev => ({ ...prev, motivo: label }));
    setArticuloQuery(`${art.codigo} - ${art.detalle}`);
    setShowArticuloDropdown(false);
  }, [getArticleQuota, selectedRole]);

  const handleProfChange = useCallback((id: string) => {
    setSelectedProfId(id);
    setSelectedCourse("");
    const prof = profesores.find(p => String(p.id) === String(id));
    if (prof) {
      setFormData(prev => ({ ...prev, materias: (prof.materias || []).join(", ") }));
    }
  }, [profesores]);

  const handleCourseChange = useCallback((courseName: string) => {
    setSelectedCourse(courseName);
    if (!activeProfesor) return;

    if (!courseName) {
      setFormData(prev => ({
        ...prev,
        materias: (activeProfesor.materias || []).join(", ")
      }));
    } else {
      const profName = activeProfesor.nombre.trim().toLowerCase();
      const courseNorm = courseName.trim().toLowerCase();
      const courseSubjects = Array.from(new Set(
        allHorarios
          .filter(h => (h.profesor || "").trim().toLowerCase() === profName && (h.curso || "").trim().toLowerCase() === courseNorm)
          .map(h => h.materia.trim())
      ));

      const subjectsStr = courseSubjects.length > 0
        ? courseSubjects.join(", ")
        : (activeProfesor.materias || []).join(", ");

      setFormData(prev => ({
        ...prev,
        materias: `${subjectsStr} (${courseName})`
      }));
    }
  }, [activeProfesor, allHorarios]);

  const handleTipoChange = useCallback((tipo: string) => {
    setFormData(prev => ({ ...prev, tipo }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleCertToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, cert: checked }));
  }, []);

  const handleFieldChange = useCallback((field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedProfId) { setError("Seleccioná un docente o personal antes de continuar."); return; }

    if (currentHoliday) {
      setError(`No se puede registrar ausencias que contengan un día feriado: ${currentHoliday.nombre}`);
      return;
    }

    setLoading(true);
    const prof = lockedProfesor || profesores.find(p => p.id === selectedProfId);
    
    let uploadedFileId = "";
    if (formData.cert && selectedFile) {
      try {
        uploadedFileId = await uploadCertificateFile(selectedFile);
      } catch (err: any) {
        console.error("Error detallado al subir archivo a Appwrite:", err);
        const code = err?.code || err?.status || "Desconocido";
        const type = err?.type || "UnknownError";
        const msg = err?.message || "Error sin mensaje";
        setError(`Error al subir certificado (Código: ${code} - ${type}). Detalle: ${msg}`);
        setLoading(false);
        return;
      }
    }

    try {
      let finalMaterias = formData.materias.split(",").map(m => m.trim()).filter(Boolean);
      if (selectedCourse && finalMaterias.length > 0) {
        finalMaterias = finalMaterias.map(m => m.includes("(") ? m : `${m} (${selectedCourse})`);
      } else if (selectedCourse && finalMaterias.length === 0) {
        finalMaterias = [selectedRole === "preceptor" ? `Guardia (${selectedCourse})` : `Clases (${selectedCourse})`];
      }

      const newAusencia: Ausencia = {
        profId: selectedProfId,
        profNombre: prof?.nombre || "Desconocido",
        tipo: formData.tipo,
        inicio: formData.inicio,
        fin: formData.fin,
        materias: finalMaterias,
        motivo: formData.motivo,
        cert: formData.cert,
        certFileId: uploadedFileId,
        estado: "pendiente",
        fechaReg: new Date().toISOString()
      };

      const saveAction = async () => {
        await saveAusencia(newAusencia);

        let userEmail = "desconocido";
        try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
        await logAction(
          userEmail, "REGISTRAR_AUSENCIA",
          `Personal: ${newAusencia.profNombre} (${selectedRole}), Tipo: ${newAusencia.tipo}, Fechas: ${newAusencia.inicio} a ${newAusencia.fin}`
        );

        // Notificar a directivos por email
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: "skbcraft.info@gmail.com",
              subject: `Nueva solicitud de licencia [${selectedRole.toUpperCase()}]: ${newAusencia.profNombre}`,
              text: `El agente ${newAusencia.profNombre} (${selectedRole}) ha solicitado una licencia (${newAusencia.tipo}) desde el ${newAusencia.inicio} al ${newAusencia.fin}.\nMotivo: ${newAusencia.motivo}\n\nPor favor, revise el panel de ausencias para autorizar o elevar la solicitud.`
            })
          });
        } catch (err) {
          console.error("No se pudo notificar a directivos por email", err);
        }

        // Si la licencia ingresa con estado aprobada (ej. cargada por directivo), notificar a los alumnos
        if (newAusencia.estado === "aprobada") {
          try {
            const affectedCourses = getAffectedCoursesFromAusencia(newAusencia, horarios);
            if (affectedCourses.length > 0) {
              const allStudents = await getAlumnos();
              const cleanTargetCourses = affectedCourses.map(c => c.toLowerCase().trim());
              const targetStudents = allStudents.filter(a =>
                cleanTargetCourses.includes((a.curso || "").toLowerCase().trim())
              );
              const studentEmails = Array.from(
                new Set(targetStudents.map(s => s.email?.trim().toLowerCase()).filter(Boolean) as string[])
              );

              if (studentEmails.length > 0) {
                sendAbsenceNoticeEmail({
                  profesor: newAusencia.profNombre,
                  tipo: newAusencia.tipo,
                  inicio: newAusencia.inicio,
                  fin: newAusencia.fin,
                  materias: newAusencia.materias,
                  cursos: affectedCourses,
                  motivo: newAusencia.motivo,
                  studentEmails,
                }).catch(err => console.error("Error al notificar alumnos por mail:", err));
              }
            }
          } catch (err) {
            console.error("Error al despachar aviso a alumnos en NewAbsenceModal:", err);
          }
        }
      };

      await notify.promise(saveAction(), {
        loading: "Registrando solicitud de licencia...",
        success: "¡Licencia solicitada exitosamente!",
        error: (err: any) => err?.message || "Error al registrar la licencia"
      });

      onSuccess();
      onClose();
    } catch (saveErr: any) {
      console.error("Error detallado al guardar documento en Appwrite:", saveErr);
      const code = saveErr?.code || saveErr?.status || "Desconocido";
      const type = saveErr?.type || "UnknownError";
      const msg = saveErr?.message || "Error sin detalle";
      
      if (uploadedFileId) {
        await deleteCertificateFile(uploadedFileId);
      }
      setError(`Error al guardar el registro (Código: ${code} - ${type}). Detalle: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ==========================================
          VISTA DESKTOP (PC) -> Con animaciones, blurs y estilo Glass
          ========================================== */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="glass w-full max-w-xl rounded-[28px] border border-[var(--border)] flex flex-col max-h-[92vh] overflow-hidden shadow-2xl animate-zoom-in will-change-gpu">
          <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)] flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="title-font font-black text-xl">Registrar Licencia / Ausencia</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] flex items-center gap-1">
                  {selectedRole === "profesor" && <GraduationCap size={11} className="text-[var(--verde)]" />}
                  {selectedRole === "preceptor" && <Clock size={11} className="text-[var(--azul,#0284c7)]" />}
                  {selectedRole === "directivo" && <Building2 size={11} className="text-purple-400" />}
                  <span>{selectedRole === "profesor" ? "Docente" : selectedRole === "preceptor" ? "Preceptoría" : "Equipo Directivo"}</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text3)] mt-0.5">Régimen Estatutario de la Educación de Chubut (Ley VIII N° 20 / Dto. 508/2026)</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold flex-shrink-0 animate-fade-in">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}

          {currentHoliday && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-bold flex-shrink-0 animate-fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <span>El rango seleccionado contiene un día feriado: <span className="underline">{currentHoliday.nombre}</span> ({currentHoliday.tipo})</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
            {/* SELECTOR DE ROL ESTATUTARIO (Solo si no viene un profesor bloqueado) */}
            {!lockedProfesor && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">
                  Tipo de Personal / Cargo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("profesor")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedRole === "profesor"
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] font-black shadow-xs scale-[1.01]"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    <GraduationCap size={15} className="shrink-0" />
                    <span>Profesor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("preceptor")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedRole === "preceptor"
                        ? "bg-[var(--azul-bg,#0ea5e920)] text-[var(--azul,#0284c7)] border-[var(--azul-border,#0ea5e940)] font-black shadow-xs scale-[1.01]"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    <Clock size={15} className="shrink-0" />
                    <span>Preceptor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("directivo")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedRole === "directivo"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/40 font-black shadow-xs scale-[1.01]"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    <Building2 size={15} className="shrink-0" />
                    <span>Directivo</span>
                  </button>
                </div>
                {/* Nota informativa de marco legal según el rol */}
                <div className="p-2.5 rounded-xl bg-[var(--bg3)]/60 border border-[var(--border)] text-[11px] text-[var(--text3)] flex items-start gap-2">
                  <Info size={14} className="shrink-0 text-[var(--text2)] mt-0.5" />
                  <div>
                    {selectedRole === "profesor" && (
                      <span><strong>Docente Frente a Curso:</strong> Afecta módulos y horas cátedra curriculares. Genera horas libres si no hay suplencia institucional.</span>
                    )}
                    {selectedRole === "preceptor" && (
                      <span><strong>Cargo de Preceptoría (POD):</strong> Cargo continuo indivisible de 4.5 horas por turno. Sujeto a cobertura (no más de 1 preceptor ausente por turno).</span>
                    )}
                    {selectedRole === "directivo" && (
                      <span><strong>Equipo de Conducción:</strong> Elevación reglamentaria a Supervisión Técnica de Región. Prohibido en los 20 días previos al cierre o 20 posteriores al inicio de ciclo (Res. 517/90).</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!lockedProfesor ? (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">
                  {selectedRole === "profesor" ? "Seleccionar Profesor" : selectedRole === "preceptor" ? "Seleccionar Preceptor / Agente" : "Seleccionar Directivo"}
                </label>
                <select required
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all font-bold cursor-pointer"
                  value={selectedProfId} onChange={(e) => handleProfChange(e.target.value)}>
                  <option value="">Elegir {selectedRole === "profesor" ? "docente" : selectedRole === "preceptor" ? "preceptor" : "directivo"}...</option>
                  {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Docente</label>
                <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 font-bold text-[var(--text)] cursor-not-allowed opacity-80 flex items-center justify-between">
                  <span>{lockedProfesor.nombre}</span>
                  <span className="text-[10px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] px-2 py-0.5 rounded-md border border-[var(--verde-border)]">Docente Frente a Curso</span>
                </div>
              </div>
            )}

            {/* Selector de Curso Afectado (para profesor o preceptor) */}
            {(selectedRole === "profesor" || selectedRole === "preceptor") && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)] flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-[var(--verde)]" />
                    <span>Curso Afectado</span>
                  </label>
                  {selectedCourse ? (
                    <span className="text-[10px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] px-2 py-0.5 rounded-md border border-[var(--verde-border)]">
                      {selectedCourse}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--text3)] uppercase">
                      Todos los cursos
                    </span>
                  )}
                </div>
                <select
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all font-bold cursor-pointer text-sm text-[var(--text)]"
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  <option value="">
                    {selectedRole === "profesor"
                      ? "Todos los cursos del docente (Jornada / Horario Completo)"
                      : "Todos los cursos a cargo"}
                  </option>
                  {activeProfesorCourses.length > 0 && (
                    <optgroup label="Cursos con Clases Asignadas al Docente">
                      {activeProfesorCourses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Todos los Cursos de la Escuela">
                    {allCursos
                      .filter(c => !activeProfesorCourses.includes(c.nombre))
                      .map(c => (
                        <option key={c.id || c.nombre} value={c.nombre}>{c.nombre}</option>
                      ))}
                  </optgroup>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Tipo de Ausencia</label>
              <div className="grid grid-cols-4 gap-2">
                {["Licencia Médica", "Artículo", "Capacitación", "Otro"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTipoChange(t)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 text-center cursor-pointer ${
                      formData.tipo === t
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm font-black scale-[1.02]"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {formData.tipo === "Artículo" && (
              <div className="relative space-y-2 animate-fade-in z-20" ref={articuloRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Buscar Artículo de Licencia</label>
                  <span className="text-[10px] font-bold text-[var(--text3)] uppercase">Cupos para: {selectedRole}</span>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ej: Art. 14 (Familiar), Art. 15 (Razones Particulares), Art. 50..."
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl pl-9 pr-10 py-3 outline-none focus:border-[var(--verde)] transition-all font-semibold text-sm text-[var(--text)]"
                    value={articuloQuery}
                    onChange={(e) => {
                      setArticuloQuery(e.target.value);
                      setShowArticuloDropdown(true);
                      if (!e.target.value) handleFieldChange("motivo", "");
                    }}
                    onFocus={() => setShowArticuloDropdown(true)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowArticuloDropdown(prev => !prev);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors p-1 cursor-pointer"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${showArticuloDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showArticuloDropdown && articulosFiltrados.length > 0 && (
                    <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden animate-fade-in max-h-64 overflow-y-auto custom-scrollbar">
                      {articulosFiltrados.map((art) => {
                        const quota = getArticleQuota(art, selectedRole);
                        return (
                          <button
                            key={art.codigo}
                            type="button"
                            onClick={() => handleSelectArticulo(art)}
                            className="w-full text-left px-4 py-3 hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] transition-colors border-b border-[var(--border)] last:border-none flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-[var(--text)] group-hover:text-[var(--verde)]">{art.codigo}</span>
                                <span className="text-[var(--text3)]">·</span>
                                <span className="text-xs font-semibold text-[var(--text2)] group-hover:text-[var(--verde)] truncate">{art.detalle}</span>
                              </div>
                              <p className="text-[10px] text-[var(--text3)] truncate mt-0.5">{quota.rule.unidad}</p>
                            </div>
                            {quota.badgeText && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 border ${
                                quota.badgeColor === "danger"
                                  ? "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]"
                                  : quota.badgeColor === "warning"
                                  ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]"
                                  : quota.badgeColor === "success"
                                  ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]"
                                  : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]"
                              }`}>
                                {quota.badgeColor === "danger" && <AlertTriangle size={10} className="shrink-0" />}
                                {quota.badgeColor === "success" && <Check size={10} className="shrink-0" />}
                                {quota.badgeColor === "warning" && <Clock size={10} className="shrink-0" />}
                                <span>{quota.badgeText}</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showArticuloDropdown && articulosFiltrados.length === 0 && (
                    <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-xl p-4 text-center animate-fade-in">
                      <p className="text-xs text-[var(--text3)] font-semibold">No se encontraron artículos para «{articuloQuery}»</p>
                    </div>
                  )}
                </div>

                {/* TARJETA INTERACTIVA DE CUPO, REGLAMENTACIÓN Y DÍAS RESTANTES (DESKTOP) */}
                {activeSelectedArticulo && (() => {
                  const quota = getArticleQuota(activeSelectedArticulo, selectedRole);
                  const rule = quota.rule;
                  const willExceed = quota.diasRestantes !== null && requestedDays > 0 && requestedDays > quota.diasRestantes;
                  const daysRemainingAfter = quota.diasRestantes !== null && requestedDays > 0
                    ? Math.max(0, quota.diasRestantes - requestedDays)
                    : quota.diasRestantes;

                  return (
                    <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 space-y-3.5 animate-fade-in shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-lg text-xs font-black shrink-0">
                            {activeSelectedArticulo.codigo}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-sm text-[var(--text)]">
                              {activeSelectedArticulo.detalle}
                            </h4>
                            <span className="text-[10px] font-bold text-[var(--text3)] uppercase">
                              Aplicado a: {selectedRole === "profesor" ? "Profesor (Horas Cátedra)" : selectedRole === "preceptor" ? "Preceptor (Turno Completo 4.5h)" : "Directivo (Conducción)"}
                            </span>
                          </div>
                        </div>
                        {quota.badgeText && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border shrink-0 ${
                            quota.badgeColor === "danger"
                              ? "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]"
                              : quota.badgeColor === "warning"
                              ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]"
                              : quota.badgeColor === "success"
                              ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]"
                              : "bg-[var(--bg)] text-[var(--text2)] border-[var(--border)]"
                          }`}>
                            {quota.badgeColor === "danger" ? (
                              <AlertTriangle size={13} strokeWidth={2.5} />
                            ) : quota.badgeColor === "warning" ? (
                              <Clock size={13} strokeWidth={2.5} />
                            ) : (
                              <Check size={13} strokeWidth={2.5} />
                            )}
                            <span>{quota.badgeText}</span>
                          </span>
                        )}
                      </div>

                      {/* Detalles específicos del rol */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[var(--border)]/50">
                        <div className="flex flex-col">
                          <span className="text-[var(--text3)] font-bold uppercase text-[9px]">Unidad de Afectación</span>
                          <span className="font-semibold text-[var(--text)]">{rule.unidad}</span>
                        </div>
                        {(rule.topeMensual || rule.anticipacion) && (
                          <div className="flex flex-col">
                            <span className="text-[var(--text3)] font-bold uppercase text-[9px]">Restricción / Anticipación</span>
                            <span className="font-semibold text-[var(--text)]">{rule.topeMensual || rule.anticipacion}</span>
                          </div>
                        )}
                      </div>

                      {/* Alerta Estatutaria Especial si aplica (ej. Directivo Res. 517/90 o Preceptor simultaneidad) */}
                      {rule.alertaEspecial && (
                        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-semibold flex items-start gap-2 animate-fade-in">
                          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                          <div>{rule.alertaEspecial}</div>
                        </div>
                      )}

                      {/* Barra de progreso de cupos anuales */}
                      {rule.maxDias !== null && rule.periodo === "año" && (
                        <div className="space-y-1.5 pt-1 border-t border-[var(--border)]/50">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-[var(--text3)]">
                              Consumido en {currentYear}: <strong className="text-[var(--text)]">{quota.diasUsados}</strong> de {rule.maxDias} días
                            </span>
                            <span className={quota.diasRestantes === 0 ? "text-[var(--rojo)] font-black" : "text-[var(--verde)] font-black"}>
                              {quota.diasRestantes} días disponibles
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                quota.diasRestantes === 0
                                  ? "bg-[var(--rojo)]"
                                  : (quota.diasRestantes !== null && quota.diasRestantes <= 2)
                                  ? "bg-[var(--amarillo)]"
                                  : "bg-[var(--verde)]"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((quota.diasUsados / rule.maxDias) * 100))}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Nota estatutaria oficial Chubut */}
                      <div className="text-[10px] text-[var(--text3)] italic bg-[var(--bg)]/50 p-2 rounded-lg border border-[var(--border)]">
                        <strong>Normativa Chubut:</strong> {rule.normativaChubut}
                      </div>

                      {/* Retroalimentación en vivo con las fechas seleccionadas */}
                      {requestedDays > 0 && rule.maxDias !== null && rule.periodo === "año" && (
                        willExceed ? (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] text-xs font-bold animate-fade-in">
                            <AlertTriangle size={15} className="shrink-0" />
                            <span>Atención: Solicitás {requestedDays} días pero solo te quedan {quota.diasRestantes} días disponibles para este artículo este año.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] text-xs font-bold animate-fade-in">
                            <Check size={14} className="shrink-0" />
                            <span>Solicitud de {requestedDays} día{requestedDays > 1 ? "s" : ""}. Te quedarán {daysRemainingAfter} día{daysRemainingAfter === 1 ? "" : "s"} restantes en {currentYear}.</span>
                          </div>
                        )
                      )}
                    </div>
                  );
                })()}

                <p className="text-[10px] font-semibold text-[var(--text3)] ml-1">
                  El contador computa automáticamente las licencias del ciclo en curso del personal según su rol estatutario.
                </p>
              </div>
            )}

            <div className="space-y-3 z-10">
              <label className="flex items-center gap-3 cursor-pointer select-none py-3.5 px-4 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl w-full hover:bg-[var(--bg4)]/40 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-[var(--border)] bg-[var(--bg)] checked:bg-[var(--verde)] checked:border-[var(--verde)] transition-all cursor-pointer accent-[var(--verde)]"
                  checked={formData.cert}
                  onChange={handleCertToggle}
                />
                <span className="text-sm font-bold text-[var(--text2)]">¿Adjuntar Certificado Médico / Justificativo?</span>
              </label>

              {formData.cert && (
                <div className="animate-fade-in">
                  <label className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border)] hover:border-[var(--verde-border)] bg-[var(--bg3)] hover:bg-[var(--verde-bg)]/10 rounded-2xl cursor-pointer transition-all duration-300 p-4 text-center">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <div className="mx-auto w-10 h-10 rounded-full bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] group-hover:scale-110 transition-transform">
                          <Check size={18} />
                        </div>
                        <p className="text-xs font-bold text-[var(--text)] truncate max-w-[280px] mt-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-[9px] font-semibold text-[var(--text3)] uppercase tracking-wider">
                          Hacé clic para cambiar el archivo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="mx-auto w-10 h-10 rounded-full bg-[var(--bg4)] border border-[var(--border)] flex items-center justify-center text-[var(--text2)] group-hover:scale-110 group-hover:border-[var(--verde-border)] group-hover:text-[var(--verde)] transition-all">
                          <Upload size={18} />
                        </div>
                        <p className="text-xs font-bold text-[var(--text2)] group-hover:text-[var(--text)] transition-colors mt-1">
                          Subir certificado (Imagen o PDF)
                        </p>
                        <p className="text-[9px] text-[var(--text3)]">
                          Arrastrá el archivo o hacé clic para explorar
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="absence-desde-desktop"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text2)] cursor-pointer select-none"
                  onClick={() => { try { (document.getElementById("absence-desde-desktop") as HTMLInputElement)?.showPicker?.(); } catch {} }}
                >
                  Desde
                </label>
                <input required type="date"
                  id="absence-desde-desktop"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all cursor-pointer"
                  value={formData.inicio} 
                  onChange={(e) => handleFieldChange("inicio", e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="absence-hasta-desktop"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text2)] cursor-pointer select-none"
                  onClick={() => { try { (document.getElementById("absence-hasta-desktop") as HTMLInputElement)?.showPicker?.(); } catch {} }}
                >
                  Hasta
                </label>
                <input required type="date"
                  id="absence-hasta-desktop"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all cursor-pointer"
                  value={formData.fin} 
                  onChange={(e) => handleFieldChange("fin", e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">
                  {selectedRole === "profesor" ? "Materias Afectadas" : selectedRole === "preceptor" ? "Turno / Cursos Afectados" : "Función / Despacho a Cargo"}
                </label>
                {selectedCourse && (
                  <span className="text-[10px] text-[var(--verde)] font-bold">
                    Filtrado para {selectedCourse}
                  </span>
                )}
              </div>
              <input type="text"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all"
                placeholder={
                  selectedRole === "profesor"
                    ? selectedCourse ? `Materias de ${selectedCourse}` : "Se autocompleta según el profesor"
                    : selectedRole === "preceptor"
                    ? "Ej: Turno Mañana (1° y 2° año) - Guardia cubierta"
                    : "Ej: Dirección Escolar - Vicedirección a cargo"
                }
                value={formData.materias} onChange={(e) => handleFieldChange("materias", e.target.value)} />
            </div>

            <div className="pt-2 flex gap-4 border-t border-[var(--border)]">
              <button type="button" onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] transition-all font-bold active:scale-95 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={loading || !!currentHoliday}
                className="flex-1 px-6 py-3 rounded-xl bg-[var(--verde)] text-black font-bold shadow-[0_4px_15px_-4px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer">
                {loading ? "Guardando..." : "Confirmar Registro"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ==========================================
          VISTA MÓVIL -> Sin animaciones, sin blurs, plano, optimizado para 120Hz
          ========================================== */}
      <div
        className="flex md:hidden fixed inset-0 z-50 bg-[var(--bg)] flex-col"
        style={{ willChange: "auto" }}
      >
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)] flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-[var(--text)]">Registrar Ausencia</h2>
            <span className="text-[10px] font-bold text-[var(--text3)] uppercase">
              {selectedRole === "profesor" ? "Docente" : selectedRole === "preceptor" ? "Preceptor" : "Directivo"} · Chubut
            </span>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg3)] text-[var(--text)]">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] p-3 rounded-lg text-xs font-semibold flex-shrink-0">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {currentHoliday && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] p-3 rounded-lg text-xs font-bold flex-shrink-0">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span className="flex-1">El rango contiene feriado: {currentHoliday.nombre} ({currentHoliday.tipo})</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {!lockedProfesor && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-black uppercase text-[var(--text2)]">Rol Estatutario</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole("profesor")}
                  className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${
                    selectedRole === "profesor"
                      ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] font-black"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]"
                  }`}
                >
                  <GraduationCap size={13} />
                  <span>Profesor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("preceptor")}
                  className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${
                    selectedRole === "preceptor"
                      ? "bg-[var(--azul-bg,#0ea5e920)] text-[var(--azul,#0284c7)] border-[var(--azul-border,#0ea5e940)] font-black"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]"
                  }`}
                >
                  <Clock size={13} />
                  <span>Preceptor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("directivo")}
                  className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${
                    selectedRole === "directivo"
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/40 font-black"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]"
                  }`}
                >
                  <Building2 size={13} />
                  <span>Directivo</span>
                </button>
              </div>
            </div>
          )}

          {!lockedProfesor ? (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-black uppercase text-[var(--text2)]">
                {selectedRole === "profesor" ? "Docente" : selectedRole === "preceptor" ? "Preceptor / Personal" : "Directivo"}
              </label>
              <select required
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-3 outline-none text-sm font-bold text-[var(--text)]"
                value={selectedProfId} onChange={(e) => handleProfChange(e.target.value)}>
                <option value="">Elegir {selectedRole === "profesor" ? "docente" : selectedRole === "preceptor" ? "preceptor" : "directivo"}...</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-black uppercase text-[var(--text2)]">Docente</label>
              <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-3 font-bold text-sm text-[var(--text2)] opacity-80">
                {lockedProfesor.nombre}
              </div>
            </div>
          )}

          {/* Selector de Curso Afectado Móvil */}
          {(selectedRole === "profesor" || selectedRole === "preceptor") && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-[var(--text2)] flex items-center gap-1">
                  <GraduationCap size={12} className="text-[var(--verde)]" />
                  <span>Curso Afectado</span>
                </label>
                {selectedCourse && (
                  <span className="text-[9px] font-black uppercase text-[var(--verde)] bg-[var(--verde-bg)] px-1.5 py-0.5 rounded border border-[var(--verde-border)]">
                    {selectedCourse}
                  </span>
                )}
              </div>
              <select
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-3 outline-none text-sm font-bold text-[var(--text)]"
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                <option value="">
                  {selectedRole === "profesor"
                    ? "Todos los cursos del docente"
                    : "Todos los cursos a cargo"}
                </option>
                {activeProfesorCourses.length > 0 && (
                  <optgroup label="Cursos del Docente">
                    {activeProfesorCourses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Otros Cursos">
                  {allCursos
                    .filter(c => !activeProfesorCourses.includes(c.nombre))
                    .map(c => (
                      <option key={c.id || c.nombre} value={c.nombre}>{c.nombre}</option>
                    ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-black uppercase text-[var(--text2)]">Tipo de Ausencia</label>
            <div className="grid grid-cols-2 gap-1.5">
              {["Licencia Médica", "Artículo", "Capacitación", "Otro"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTipoChange(t)}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-center ${
                    formData.tipo === t
                      ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] font-black"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {formData.tipo === "Artículo" && (
            <div className="relative flex flex-col gap-1" ref={mobileArticuloRef}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-[var(--text2)]">Artículo de Licencia</label>
                <span className="text-[9px] font-bold text-[var(--text3)] uppercase">Rol: {selectedRole}</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Art. 14, 15, 50..."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-3 outline-none text-sm font-semibold text-[var(--text)]"
                  value={articuloQuery}
                  onChange={(e) => {
                    setArticuloQuery(e.target.value);
                    setShowArticuloDropdown(true);
                    if (!e.target.value) handleFieldChange("motivo", "");
                  }}
                  onFocus={() => setShowArticuloDropdown(true)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowArticuloDropdown(prev => !prev);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] p-1"
                >
                  <ChevronDown size={16} />
                </button>

                {showArticuloDropdown && articulosFiltrados.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {articulosFiltrados.map((art) => {
                      const quota = getArticleQuota(art, selectedRole);
                      return (
                        <button
                          key={art.codigo}
                          type="button"
                          onClick={() => handleSelectArticulo(art)}
                          className="w-full text-left p-3 hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] border-b border-[var(--border)] last:border-none flex items-center justify-between text-xs"
                        >
                          <div className="truncate mr-2">
                            <span className="font-bold text-[var(--text)]">{art.codigo} - {art.detalle}</span>
                          </div>
                          {quota.badgeText && (
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                              quota.badgeColor === "danger"
                                  ? "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]"
                                  : quota.badgeColor === "warning"
                                  ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]"
                                  : quota.badgeColor === "success"
                                  ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]"
                                  : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]"
                            }`}>
                              {quota.badgeText}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TARJETA INTERACTIVA DE CUPO Y DÍAS RESTANTES (MÓVIL) */}
              {activeSelectedArticulo && (() => {
                const quota = getArticleQuota(activeSelectedArticulo, selectedRole);
                const rule = quota.rule;
                const willExceed = quota.diasRestantes !== null && requestedDays > 0 && requestedDays > quota.diasRestantes;
                const daysRemainingAfter = quota.diasRestantes !== null && requestedDays > 0
                  ? Math.max(0, quota.diasRestantes - requestedDays)
                  : quota.diasRestantes;

                return (
                  <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-3 space-y-2 mt-1 animate-fade-in">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-black text-[var(--text)]">{activeSelectedArticulo.codigo} - {activeSelectedArticulo.detalle}</span>
                      {quota.badgeText && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                          quota.badgeColor === "danger"
                            ? "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]"
                            : quota.badgeColor === "warning"
                            ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]"
                            : quota.badgeColor === "success"
                            ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]"
                            : "bg-[var(--bg)] text-[var(--text2)] border-[var(--border)]"
                        }`}>
                          {quota.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-[var(--text3)] flex justify-between font-semibold">
                      <span>{rule.unidad}</span>
                      {rule.topeMensual && <span>{rule.topeMensual}</span>}
                    </div>

                    {rule.alertaEspecial && (
                      <div className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg font-medium flex items-start gap-1">
                        <ShieldAlert size={13} className="shrink-0 mt-0.5" />
                        <span>{rule.alertaEspecial}</span>
                      </div>
                    )}

                    {rule.maxDias !== null && rule.periodo === "año" && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-[var(--text3)]">
                          <span>Usados: {quota.diasUsados}/{rule.maxDias}</span>
                          <span className={quota.diasRestantes === 0 ? "text-[var(--rojo)]" : "text-[var(--verde)]"}>
                            {quota.diasRestantes} libres
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              quota.diasRestantes === 0
                                ? "bg-[var(--rojo)]"
                                : (quota.diasRestantes !== null && quota.diasRestantes <= 2)
                                ? "bg-[var(--amarillo)]"
                                : "bg-[var(--verde)]"
                            }`}
                            style={{ width: `${Math.min(100, Math.round((quota.diasUsados / rule.maxDias) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {requestedDays > 0 && rule.maxDias !== null && rule.periodo === "año" && (
                      willExceed ? (
                        <div className="text-[10px] font-bold text-[var(--rojo)] bg-[var(--rojo-bg)] border border-[var(--rojo-border)] p-2 rounded-lg flex items-center gap-1.5">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>Excede cupo (quedan {quota.diasRestantes} d., solicitás {requestedDays} d.)</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-[var(--verde)] bg-[var(--verde-bg)] border border-[var(--verde-border)] p-2 rounded-lg flex items-center gap-1.5">
                          <Check size={12} className="shrink-0" />
                          <span>Solicitás {requestedDays} d. (Quedarán {daysRemainingAfter} d.)</span>
                        </div>
                      )
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 py-3 px-3 bg-[var(--bg3)] border border-[var(--border)] rounded-lg w-full">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[var(--border)] bg-[var(--bg)] accent-[var(--verde)]"
                checked={formData.cert}
                onChange={handleCertToggle}
              />
              <span className="text-xs font-bold text-[var(--text)]">¿Adjuntar Certificado?</span>
            </label>

            {formData.cert && (
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full p-4 border border-dashed border-[var(--border)] bg-[var(--bg3)] rounded-lg text-center">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[var(--verde)] shrink-0" />
                      <span className="text-xs font-bold text-[var(--text)] truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[var(--text2)]">
                      <Upload size={16} />
                      <span className="text-xs font-bold">Subir Imagen o PDF</span>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label 
                htmlFor="absence-desde-mobile"
                className="text-[11px] font-black uppercase text-[var(--text2)] cursor-pointer select-none"
                onClick={() => { try { (document.getElementById("absence-desde-mobile") as HTMLInputElement)?.showPicker?.(); } catch {} }}
              >
                Desde
              </label>
              <input required type="date"
                id="absence-desde-mobile"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-2.5 outline-none text-sm cursor-pointer"
                value={formData.inicio} 
                onChange={(e) => handleFieldChange("inicio", e.target.value)}
                onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label 
                htmlFor="absence-hasta-mobile"
                className="text-[11px] font-black uppercase text-[var(--text2)] cursor-pointer select-none"
                onClick={() => { try { (document.getElementById("absence-hasta-mobile") as HTMLInputElement)?.showPicker?.(); } catch {} }}
              >
                Hasta
              </label>
              <input required type="date"
                id="absence-hasta-mobile"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-2.5 outline-none text-sm cursor-pointer"
                value={formData.fin} 
                onChange={(e) => handleFieldChange("fin", e.target.value)}
                onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-[var(--text2)]">
                {selectedRole === "profesor" ? "Materias Afectadas" : selectedRole === "preceptor" ? "Turno / Cursos Afectados" : "Función / Despacho a Cargo"}
              </label>
              {selectedCourse && (
                <span className="text-[9px] text-[var(--verde)] font-bold">
                  {selectedCourse}
                </span>
              )}
            </div>
            <input type="text"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg p-2.5 outline-none text-sm"
              placeholder={
                selectedRole === "profesor"
                  ? selectedCourse ? `Materias de ${selectedCourse}` : "Se autocompleta con el profesor"
                  : selectedRole === "preceptor"
                  ? "Ej: Turno Mañana (1° y 2° año)"
                  : "Ej: Dirección - Vicedirección a cargo"
              }
              value={formData.materias} onChange={(e) => handleFieldChange("materias", e.target.value)} />
          </div>

          <div className="pt-2 flex gap-2 border-t border-[var(--border)] mt-auto">
            <button type="button" onClick={onClose}
              className="flex-1 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg2)] text-xs font-bold">Cancelar</button>
            <button type="submit" disabled={loading || !!currentHoliday}
              className="flex-1 p-3 rounded-lg bg-[var(--verde)] text-black text-xs font-bold disabled:opacity-50">
              {loading ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
