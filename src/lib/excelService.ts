import * as XLSX from "xlsx";
import { Alumno, Profesor, MesaExamen } from "./dataService";

export interface ParsedStudentRow {
  nombre: string;
  dni: string;
  curso: string;
  email?: string;
  status: "valid" | "warning" | "error";
  statusMessage?: string;
}

export interface ParsedTeacherRow {
  nombre: string;
  dni: string;
  email: string;
  materias: string[];
  status: "valid" | "warning" | "error";
  statusMessage?: string;
}

/**
 * Genera y descarga una plantilla modelo en formato Excel (.xlsx)
 * con encabezados oficiales y filas de ejemplo.
 */
export const downloadStudentImportTemplate = () => {
  const wsData = [
    ["Nombre y Apellido", "DNI", "Curso / División", "Email (Opcional)"],
    ["Álvarez, Lucas Agustín", "48123456", "4to 1ra", "lucas.alvarez@escuela713.edu.ar"],
    ["Benítez, Sofía Valentina", "48234567", "4to 1ra", "sofia.benitez@escuela713.edu.ar"],
    ["Castro, Mateo Tomás", "48345678", "5to 2da", "mateo.castro@escuela713.edu.ar"],
    ["Díaz, Martina Belén", "48456789", "6to 1ra", "martina.diaz@escuela713.edu.ar"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ancho de columnas amigable
  ws["!cols"] = [
    { wch: 32 }, // Nombre
    { wch: 16 }, // DNI
    { wch: 20 }, // Curso
    { wch: 38 }, // Email
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alumnos_Plantilla");

  XLSX.writeFile(wb, "Plantilla_Oficial_Alumnos_Escuela713.xlsx");
};

export const downloadTeacherImportTemplate = () => {
  const wsData = [
    ["Nombre y Apellido", "DNI", "Email Institucional", "Materias (Separadas por coma)"],
    ["García, Martín Alejandro", "28999888", "martin.garcia@escuela713.edu.ar", "Matemática, Álgebra"],
    ["Rodríguez, Laura Elena", "30111222", "laura.rodriguez@escuela713.edu.ar", "Historia, Geografía"],
    ["Fernández, Carlos Daniel", "25333444", "carlos.fernandez@escuela713.edu.ar", "Física, Química"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 32 },
    { wch: 16 },
    { wch: 36 },
    { wch: 45 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Docentes_Plantilla");

  XLSX.writeFile(wb, "Plantilla_Oficial_Docentes_Escuela713.xlsx");
};

/**
 * Normaliza nombres de encabezados para detección automática de columnas.
 */
const cleanHeader = (val: any): string => {
  if (!val) return "";
  return String(val)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

/**
 * Lee un archivo .xlsx, .xls o .csv y devuelve filas estructuradas y validadas.
 */
export const parseStudentExcelFile = async (
  file: File,
  existingDnis: Set<string>
): Promise<ParsedStudentRow[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rawRows.length < 2) return [];

  const headers = rawRows[0].map(cleanHeader);

  // Mapeo automático de columnas
  let nameIdx = headers.findIndex(h => h.includes("nombre") || h.includes("apellido") || h.includes("estudiante") || h.includes("alumno"));
  let dniIdx = headers.findIndex(h => h.includes("dni") || h.includes("documento") || h.includes("cedula") || h.includes("identificacion"));
  let cursoIdx = headers.findIndex(h => h.includes("curso") || h.includes("division") || h.includes("ano") || h.includes("seccion"));
  let emailIdx = headers.findIndex(h => h.includes("email") || h.includes("correo") || h.includes("mail"));

  // Failsafes por posición si no coinciden los encabezados
  if (nameIdx === -1 && rawRows[0].length >= 1) nameIdx = 0;
  if (dniIdx === -1 && rawRows[0].length >= 2) dniIdx = 1;
  if (cursoIdx === -1 && rawRows[0].length >= 3) cursoIdx = 2;
  if (emailIdx === -1 && rawRows[0].length >= 4) emailIdx = 3;

  const result: ParsedStudentRow[] = [];
  const dnisInCurrentFile = new Set<string>();

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === "")) {
      continue;
    }

    const nombre = String(row[nameIdx] || "").trim();
    let dni = String(row[dniIdx] || "").replace(/[^0-9]/g, "").trim();
    const curso = String(row[cursoIdx] || "").trim();
    const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : "";

    let status: "valid" | "warning" | "error" = "valid";
    let statusMessage = "Listo para importar";

    if (!nombre) {
      status = "error";
      statusMessage = "Falta el nombre del estudiante";
    } else if (!dni) {
      status = "error";
      statusMessage = "Falta el DNI";
    } else if (dni.length < 6 || dni.length > 9) {
      status = "warning";
      statusMessage = `DNI inusual (${dni.length} dígitos)`;
    } else if (dnisInCurrentFile.has(dni)) {
      status = "warning";
      statusMessage = "DNI duplicado en el mismo archivo";
    } else if (existingDnis.has(dni)) {
      status = "warning";
      statusMessage = "El DNI ya existe en la base de datos (se actualizará)";
    }

    if (!curso && status === "valid") {
      status = "warning";
      statusMessage = "Sin curso asignado (quedará pendiente)";
    }

    if (dni) {
      dnisInCurrentFile.add(dni);
    }

    result.push({
      nombre,
      dni,
      curso: curso || "pendiente",
      email,
      status,
      statusMessage,
    });
  }

  return result;
};

export const parseTeacherExcelFile = async (
  file: File,
  existingDnis: Set<string>
): Promise<ParsedTeacherRow[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rawRows.length < 2) return [];

  const headers = rawRows[0].map(cleanHeader);

  let nameIdx = headers.findIndex(h => h.includes("nombre") || h.includes("apellido") || h.includes("profesor") || h.includes("docente"));
  let dniIdx = headers.findIndex(h => h.includes("dni") || h.includes("documento"));
  let emailIdx = headers.findIndex(h => h.includes("email") || h.includes("correo") || h.includes("mail"));
  let materiasIdx = headers.findIndex(h => h.includes("materia") || h.includes("asignatura") || h.includes("catedra"));

  if (nameIdx === -1 && rawRows[0].length >= 1) nameIdx = 0;
  if (dniIdx === -1 && rawRows[0].length >= 2) dniIdx = 1;
  if (emailIdx === -1 && rawRows[0].length >= 3) emailIdx = 2;
  if (materiasIdx === -1 && rawRows[0].length >= 4) materiasIdx = 3;

  const result: ParsedTeacherRow[] = [];
  const dnisInCurrentFile = new Set<string>();

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === "")) {
      continue;
    }

    const nombre = String(row[nameIdx] || "").trim();
    const dni = String(row[dniIdx] || "").replace(/[^0-9]/g, "").trim();
    const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : "";
    const rawMaterias = materiasIdx !== -1 && row[materiasIdx] ? String(row[materiasIdx]) : "";
    const materias = rawMaterias
      .split(/[,;\n]/)
      .map(m => m.trim())
      .filter(Boolean);

    let status: "valid" | "warning" | "error" = "valid";
    let statusMessage = "Listo para importar";

    if (!nombre) {
      status = "error";
      statusMessage = "Falta el nombre del docente";
    } else if (!dni) {
      status = "error";
      statusMessage = "Falta el DNI";
    } else if (dni.length < 6 || dni.length > 9) {
      status = "warning";
      statusMessage = `DNI inusual (${dni.length} dígitos)`;
    } else if (dnisInCurrentFile.has(dni)) {
      status = "warning";
      statusMessage = "DNI duplicado en el mismo archivo";
    } else if (existingDnis.has(dni)) {
      status = "warning";
      statusMessage = "El DNI ya existe en el cuerpo docente";
    }

    if (dni) {
      dnisInCurrentFile.add(dni);
    }

    result.push({
      nombre,
      dni,
      email,
      materias,
      status,
      statusMessage,
    });
  }

  return result;
};

/**
 * Exporta el padrón oficial de estudiantes a un archivo Excel formateado.
 */
export const exportStudentsToExcel = (alumnos: Alumno[], cursoFilter?: string) => {
  const filtered = cursoFilter && cursoFilter !== "todos"
    ? alumnos.filter(a => a.curso === cursoFilter)
    : alumnos;

  const headerRows = [
    ["REPÚBLICA ARGENTINA - PROVINCIA DEL CHUBUT"],
    ["MINISTERIO DE EDUCACIÓN - ESCUELA N° 713 'JUAN ABDALA CHAYEP'"],
    ["CUE: 2600214-00 | PADRÓN OFICIAL DE ESTUDIANTES"],
    [`CURSO / DIVISIÓN: ${cursoFilter && cursoFilter !== "todos" ? cursoFilter : "TODOS LOS CURSOS"} | TOTAL: ${filtered.length} ALUMNOS`],
    [`FECHA DE EMISIÓN: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`],
    [],
    ["N°", "Apellido y Nombre", "DNI", "Curso / División", "Correo Electrónico Institucional"]
  ];

  const dataRows = filtered.map((a, idx) => [
    idx + 1,
    a.nombre,
    a.dni,
    a.curso || "Pendiente",
    a.email || "Sin asignar"
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 34 },
    { wch: 16 },
    { wch: 20 },
    { wch: 38 },
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = cursoFilter && cursoFilter !== "todos" ? cursoFilter.replace(/[\/\\?*[\]]/g, "_") : "Padron_Completo";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `Padron_Alumnos_Escuela713_${cursoFilter && cursoFilter !== "todos" ? cursoFilter.replace(/\s+/g, "_") : "Completo"}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Exporta el cronograma o acta de Mesas de Examen a un archivo Excel oficial.
 */
export const exportExamBoardToExcel = (mesas: MesaExamen[], title = "Cronograma_Mesas_Examen") => {
  const headerRows = [
    ["PROVINCIA DEL CHUBUT - MINISTERIO DE EDUCACIÓN"],
    ["ESCUELA N° 713 'JUAN ABDALA CHAYEP' - ESQUEL"],
    ["CRONOGRAMA OFICIAL DE TRIBUNALES Y MESAS DE EXAMEN"],
    [`FECHA DE EMISIÓN: ${new Date().toLocaleDateString("es-AR")}`],
    [],
    ["Fecha", "Hora", "Espacio Curricular / Materia", "Aula", "Presidente de Mesa", "Vocal 1", "Vocal 2", "Inscriptos", "Estado"]
  ];

  const dataRows = mesas.map((m) => [
    m.fecha,
    m.hora,
    m.materia,
    m.aula || "A confirmar",
    m.presidenteNombre || "Presidente",
    m.vocal1Nombre || "Sin asignar",
    m.vocal2Nombre || "Sin asignar",
    (m.alumnosInscriptos || []).length,
    m.estado.toUpperCase()
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);

  ws["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 12 },
    { wch: 28 },
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mesas_Examen");
  XLSX.writeFile(wb, `${title}_Escuela713_${new Date().toISOString().split("T")[0]}.xlsx`);
};
