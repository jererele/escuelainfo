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
