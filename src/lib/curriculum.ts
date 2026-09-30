/**
 * Plan de Estudios Oficial Institucional
 * Escuela N° 713 "Juan Abdala Chayep" - Educación Secundaria y Técnica
 *
 * Estructurado por Ciclo Básico y Especialidades / Orientaciones Oficiales
 * para erradicar errores de tipeo y estandarizar materias en toda la plataforma.
 */

export interface PlanCategory {
  id: string;
  name: string;
  shortName: string;
  ciclo: "Ciclo Básico" | "Ciclo Superior" | "Formación General";
  materias: string[];
}

export const PLAN_DE_ESTUDIOS: PlanCategory[] = [
  {
    id: "ciclo_basico",
    name: "Ciclo Básico (1° a 3° Año)",
    shortName: "Ciclo Básico",
    ciclo: "Ciclo Básico",
    materias: [
      "Matemática I",
      "Matemática II",
      "Matemática III",
      "Lengua y Literatura I",
      "Lengua y Literatura II",
      "Lengua y Literatura III",
      "Ciencias Naturales / Biología",
      "Fisicoquímica",
      "Historia I",
      "Historia II",
      "Historia III",
      "Geografía I",
      "Geografía II",
      "Geografía III",
      "Construcción de Ciudadanía / Formación Ética",
      "Lengua Extranjera: Inglés I",
      "Lengua Extranjera: Inglés II",
      "Lengua Extranjera: Inglés III",
      "Educación Física I",
      "Educación Física II",
      "Educación Física III",
      "Educación Artística: Artes Visuales",
      "Educación Artística: Música",
      "Educación Tecnológica",
      "Taller: Dibujo Técnico / Sistemas de Representación",
      "Taller: Ajuste Mecánico",
      "Taller: Electricidad",
      "Taller: Carpintería",
      "Taller: Hojalatería y Metales",
      "Tecnologías de la Información y Conectividad (TIC)"
    ]
  },
  {
    id: "informatica",
    name: "Especialidad Informática Profesional y Personal",
    shortName: "Informática",
    ciclo: "Ciclo Superior",
    materias: [
      "Programación I",
      "Programación II",
      "Programación III",
      "Programación Web",
      "Algoritmos y Estructuras de Datos",
      "Bases de Datos",
      "Redes Informáticas y Teleinformática",
      "Sistemas Operativos",
      "Hardware y Mantenimiento de Equipos",
      "Arquitectura de Computadoras",
      "Laboratorio de Desarrollo de Software",
      "Seguridad Informática",
      "Asistencia al Usuario y Soporte Técnico",
      "Prácticas Profesionalizantes: Informática"
    ]
  },
  {
    id: "electromecanica",
    name: "Especialidad Electromecánica",
    shortName: "Electromecánica",
    ciclo: "Ciclo Superior",
    materias: [
      "Mecánica Técnica y Mecanismos",
      "Resistencia y Ensayo de Materiales",
      "Electrotecnia I",
      "Electrotecnia II",
      "Máquinas Eléctricas y Ensayos",
      "Instalaciones Eléctricas Industriales",
      "Sistemas de Control y Automatización (PLC)",
      "Termodinámica y Máquinas Térmicas",
      "Taller: Mecanizado y Tornería (CNC)",
      "Taller: Soldadura y Construcciones Metálicas",
      "Taller: Mantenimiento Electromecánico",
      "Prácticas Profesionalizantes: Electromecánica"
    ]
  },
  {
    id: "construcciones",
    name: "Especialidad Construcciones (Maestro Mayor de Obras)",
    shortName: "Construcciones",
    ciclo: "Ciclo Superior",
    materias: [
      "Construcciones y Materiales I",
      "Construcciones y Materiales II",
      "Estructuras Resistentes: Hormigón Armado",
      "Estructuras Metálicas y de Madera",
      "Instalaciones de Edificios I (Sanitarias y Gas)",
      "Instalaciones de Edificios II (Electricidad y Climatización)",
      "Cómputo, Presupuesto y Tasaciones",
      "Proyecto y Dirección de Obras",
      "Topografía y Replanteo",
      "Prácticas Profesionalizantes: Construcciones"
    ]
  },
  {
    id: "gestion",
    name: "Orientación Economía y Gestión de las Organizaciones",
    shortName: "Economía y Gestión",
    ciclo: "Ciclo Superior",
    materias: [
      "Teoría y Gestión de las Organizaciones I (TGO)",
      "Teoría y Gestión de las Organizaciones II",
      "Sistema de Información Contable I (SIC)",
      "Sistema de Información Contable II",
      "Sistema de Información Contable III",
      "Economía y Desarrollo Regional",
      "Administración Financiera y Costos",
      "Derecho y Legislación Laboral e Impositiva",
      "Gestión de Recursos Humanos",
      "Prácticas Profesionalizantes: Gestión"
    ]
  },
  {
    id: "formacion_general",
    name: "Formación Científico-Tecnológica y Humanística (Ciclo Superior)",
    shortName: "Formación General",
    ciclo: "Formación General",
    materias: [
      "Matemática Aplicada / Análisis Matemático",
      "Literatura y Medios de Comunicación",
      "Física Aplicada",
      "Química Aplicada",
      "Filosofía y Ciudadanía",
      "Metodología de la Investigación",
      "Seguridad e Higiene Laboral y Medio Ambiente",
      "Marco Jurídico de las Actividades Técnicas",
      "Emprendedurismo y Gestión de Proyectos",
      "Inglés Técnico"
    ]
  }
];

/**
 * Padrón plano ordenado alfabéticamente de todas las materias oficiales
 */
export const ALL_OFFICIAL_SUBJECTS: string[] = Array.from(
  new Set(PLAN_DE_ESTUDIOS.flatMap(cat => cat.materias))
).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

/**
 * Obtener las materias de una categoría por su ID
 */
export const getSubjectsByCategory = (categoryId: string): string[] => {
  const cat = PLAN_DE_ESTUDIOS.find(c => c.id === categoryId);
  return cat ? cat.materias : [];
};

/**
 * Encontrar la categoría o especialidad a la que pertenece una materia
 */
export const findCategoryForSubject = (subjectName: string): PlanCategory | undefined => {
  const norm = (subjectName || "").trim().toLowerCase();
  return PLAN_DE_ESTUDIOS.find(cat =>
    cat.materias.some(m => m.toLowerCase() === norm)
  );
};

// ─── DEFINICIÓN OFICIAL DE ORIENTACIONES, AÑOS Y DIVISIONES ─────────────────
export interface OrientacionItem {
  id: string;
  name: string;
  shortName: string;
  anios: string[]; // ["1°", "2°", "3°"] o ["4°", "5°", "6°", "7°"]
  tipo: "Ciclo Básico" | "Técnica" | "Secundaria Orientada";
  colorBadge: string;
}

export const ORIENTACIONES_OFICIALES: OrientacionItem[] = [
  {
    id: "ciclo_basico",
    name: "Ciclo Básico Común",
    shortName: "Ciclo Básico",
    anios: ["1°", "2°", "3°"],
    tipo: "Ciclo Básico",
    colorBadge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
  },
  {
    id: "informatica",
    name: "Técnica en Informática Profesional y Personal",
    shortName: "Informática",
    anios: ["4°", "5°", "6°", "7°"],
    tipo: "Técnica",
    colorBadge: "bg-blue-500/15 text-blue-400 border-blue-500/30"
  },
  {
    id: "electromecanica",
    name: "Técnica en Electromecánica",
    shortName: "Electromecánica",
    anios: ["4°", "5°", "6°", "7°"],
    tipo: "Técnica",
    colorBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30"
  },
  {
    id: "construcciones",
    name: "Técnica en Construcciones (Maestro Mayor de Obras)",
    shortName: "Construcciones",
    anios: ["4°", "5°", "6°", "7°"],
    tipo: "Técnica",
    colorBadge: "bg-orange-500/15 text-orange-400 border-orange-500/30"
  },
  {
    id: "gestion",
    name: "Secundaria en Economía y Gestión de las Organizaciones",
    shortName: "Economía y Gestión",
    anios: ["4°", "5°", "6°"],
    tipo: "Secundaria Orientada",
    colorBadge: "bg-purple-500/15 text-purple-400 border-purple-500/30"
  }
];

export const DIVISIONES_OFICIALES = [
  "1ra",
  "2da",
  "3ra",
  "4ta",
  "5ta",
  "6ta",
  "Única",
  "A",
  "B",
  "C",
  "D"
];

export const TURNOS_OFICIALES = [
  "Mañana",
  "Tarde",
  "Doble Turno"
] as const;

/**
 * Formatea el nombre estándar de un curso combinando Año, División, Orientación y Turno.
 * Ej: "4° 1ra - Informática (Mañana)" o "1° 2da - Ciclo Básico (Mañana)"
 */
export const formatOfficialCourseName = (
  anio: string,
  division: string,
  orientacionShortName?: string,
  turno?: string
): string => {
  const parts: string[] = [];
  if (anio && division) {
    parts.push(`${anio} ${division}`);
  } else if (anio) {
    parts.push(anio);
  } else if (division) {
    parts.push(division);
  }

  if (orientacionShortName && orientacionShortName !== "General") {
    parts.push(`- ${orientacionShortName}`);
  }

  let formatted = parts.join(" ");
  if (turno) {
    formatted += ` (${turno})`;
  }

  return formatted.trim();
};

/**
 * Descompone de manera inteligente un nombre de curso en año, división y orientación
 */
export const parseCourseNameComponents = (courseName: string): {
  anio?: string;
  division?: string;
  orientacion?: string;
  turno?: string;
} => {
  const clean = (courseName || "").trim();
  if (!clean) return {};

  const turnoMatch = clean.match(/\((Mañana|Tarde|Doble Turno)\)/i) || clean.match(/-\s*(Mañana|Tarde|Doble Turno)/i);
  const turno = turnoMatch ? turnoMatch[1] : undefined;

  // Extraer año (ej: 1°, 2°, 3°, 4°, 5°, 6°, 7° o 1ro, 2do...)
  const anioMatch = clean.match(/([1-7])(?:°|ro|do|to|mo|vo|no)?/i);
  const anio = anioMatch ? `${anioMatch[1]}°` : undefined;

  // Extraer división (ej: 1ra, 2da, A, B, C...)
  const divMatch = clean.match(/([1-6](?:ra|da|ta)|Única|[A-D])\b/i);
  const division = divMatch ? divMatch[1] : undefined;

  // Detectar orientación
  let orientacion: string | undefined;
  for (const ori of ORIENTACIONES_OFICIALES) {
    if (
      clean.toLowerCase().includes(ori.shortName.toLowerCase()) ||
      clean.toLowerCase().includes(ori.id.toLowerCase())
    ) {
      orientacion = ori.shortName;
      break;
    }
  }

  return { anio, division, orientacion, turno };
};
