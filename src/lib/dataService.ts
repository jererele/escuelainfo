import { databases, appwriteClient, APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, APPWRITE_BUCKET_ID, storage, account } from "./appwrite";
import { ID, Query } from "appwrite";
import { getSavedSchoolId, DEFAULT_SCHOOL_ID } from "./chubutSchools";

// ─── Logger solo en desarrollo ───────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== "production";
const devLog = (ctx: string, err?: unknown) => {
  if (isDev) {
    // 🛡️ SECURITY AUDIT REF: Security Misconfiguration - Prevenir fuga de metadatos de Appwrite
    const safeError = err instanceof Error ? err.message : "Internal Error Masked";
    console.error(`[EscuelaInfo/${ctx}]`, safeError);
  }
};

// ─── Identificador de Escuela Activa (Multi-Tenant) ─────────────────────────
export const getActiveSchoolId = (overrideSchoolId?: string): string => {
  if (overrideSchoolId && overrideSchoolId.trim()) return overrideSchoolId.trim();
  if (typeof window !== "undefined") {
    return getSavedSchoolId() || DEFAULT_SCHOOL_ID;
  }
  return DEFAULT_SCHOOL_ID;
};

// ─── Sanitización reforzada ──────────────────────────────────────────────────
const sanitize = (text: string, maxLen = 2000): string => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\\/g, "")
    .trim()
    .slice(0, maxLen);
};

// ─── Constantes de colecciones ───────────────────────────────────────────────
const APPWRITE_USERS_COLLECTION_ID   = "usuarios";
const APPWRITE_LOGS_COLLECTION_ID    = "logs";
const APPWRITE_PROFS_COLLECTION_ID   = "profesores";
const APPWRITE_HORARIOS_COLLECTION_ID = "horarios";
const APPWRITE_ALUMNOS_COLLECTION_ID = "alumnos";
const APPWRITE_CURSOS_COLLECTION_ID  = "cursos";
const APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID = "asistencias_alumnos_jornada";
const APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID = "asistencias_alumnos_materia";
const APPWRITE_MESAS_EXAMEN_COLLECTION_ID = "mesas_examen";
const APPWRITE_NOTIFS_COLLECTION_ID  = "notificaciones";

const DEFAULT_LIMIT = 200;

// ─── Caché Client-Side para Optimizar Appwrite ─────────────────────────────────
const CACHE_KEY_PREFIX = "escuelainfo_cache_";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos (evita lecturas excesivas en Appwrite)

const getCachedData = <T>(key: string, schoolId?: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const sId = getActiveSchoolId(schoolId);
    const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${sId}_${key}`);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data as T;
    }
  } catch {
    return null;
  }
  return null;
};

const setCachedData = (key: string, data: any, schoolId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const sId = getActiveSchoolId(schoolId);
    sessionStorage.setItem(
      `${CACHE_KEY_PREFIX}${sId}_${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
};

export const clearCache = (key: string, schoolId?: string) => {
  if (typeof window === "undefined") return;
  const sId = getActiveSchoolId(schoolId);
  sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${sId}_${key}`);
  sessionStorage.removeItem(CACHE_KEY_PREFIX + key);
};

// ─── Despachador de Eventos en Tiempo Real (Local & Multi-Pestaña) ─────────────
export const notifyRealtimeUpdate = (type: "ausencias" | "horarios" | "notificaciones") => {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(`escuelainfo:${type}-updated`));
    } catch {}
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel("escuelainfo-realtime");
        bc.postMessage({ type, timestamp: Date.now() });
        bc.close();
      } catch {}
    }
  }
};

// ─── DB Simplification Mappings ──────────────────────────────────────────────
const ROL_MAP: Record<string, string> = {
  "a": "alumno",
  "ad": "admin",
  "p": "profesor",
  "pp": "preceptor",
  "d": "directivo",
  "pe": "pendiente",
  "p_a": "pendiente_alumno",
  "p_p": "pendiente_profesor",
  "pe_a": "pendiente_alumno",
  "pe_p": "pendiente_profesor",
  "pe_pp": "pendiente_preceptor",
  "pe_d": "pendiente_directivo",
  "pe_ad": "pendiente_admin",
  "p_pp": "pendiente_preceptor",
  "p_d": "pendiente_directivo",
  "p_ad": "pendiente_admin",
  "pendiente_alumno": "pendiente_alumno",
  "pendiente_profesor": "pendiente_profesor",
  "pendiente_preceptor": "pendiente_preceptor",
  "pendiente_directivo": "pendiente_directivo",
  "pendiente_admin": "pendiente_admin",
  "alumno": "alumno",
  "admin": "admin",
  "profesor": "profesor",
  "preceptor": "preceptor",
  "directivo": "directivo",
  "pp_p": "preceptor_profesor",
  "preceptor_profesor": "preceptor_profesor"
};
const ROL_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(ROL_MAP).map(([k, v]) => [v, k]));

const ESTADO_MAP: Record<string, string> = {
  "ap": "aprobada",
  "pe": "pendiente",
  "re": "rechazada"
};
const ESTADO_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(ESTADO_MAP).map(([k, v]) => [v, k]));

export const toDbRol = (r: string): string => {
  const clean = (r || "").trim().toLowerCase();
  switch (clean) {
    case "admin": return "ad";
    case "directivo": return "d";
    case "preceptor": return "pp";
    case "profesor": return "p";
    case "preceptor_profesor": case "profesor_preceptor": case "pp_p": return "pp_p";
    case "alumno": return "a";
    case "pendiente": return "pe";
    case "pendiente_admin": case "pe_ad": case "p_ad": return "pe_ad";
    case "pendiente_directivo": case "pe_d": case "p_d": return "pe_d";
    case "pendiente_preceptor": case "pe_pp": case "p_pp": return "pe_pp";
    case "pendiente_profesor": case "pe_p": case "p_p": return "pe_p";
    case "pendiente_alumno": case "pe_a": case "p_a": return "pe_a";
    default: return ROL_REVERSE[clean] || clean;
  }
};

export const fromDbRol = (r?: string | null): string => {
  if (!r) return "";
  const clean = r.trim().toLowerCase();
  return ROL_MAP[clean] || clean;
};

export const toDbEstado = (e: string) => ESTADO_REVERSE[e] || e;
export const fromDbEstado = (e: string) => ESTADO_MAP[e] || e;

export const isPendingRole = (rol?: string | null): boolean => {
  if (!rol) return true;
  const clean = rol.trim().toLowerCase();
  return clean === "pe" || clean === "p_a" || clean === "p_p" || clean === "pe_a" || clean === "pe_p" || clean === "pe_pp" || clean === "pe_d" || clean === "pe_ad" || clean === "pendiente" || clean.startsWith("pendiente");
};

export const isAuthorizedRole = (rol?: string | null): boolean => {
  if (!rol) return false;
  const clean = fromDbRol(rol).trim().toLowerCase();
  return !isPendingRole(clean) && ["admin", "directivo", "preceptor", "profesor", "alumno", "preceptor_profesor"].includes(clean);
};

export type UserRole = "admin" | "directivo" | "preceptor" | "profesor" | "alumno" | "preceptor_profesor";

/**
 * Retorna los roles que un operador puede asignar según su propia jerarquía:
 * - Admin: puede asignar todos ("admin", "directivo", "preceptor", "profesor", "alumno", "preceptor_profesor")
 * - Directivo: puede asignar "preceptor", "profesor", "alumno", "preceptor_profesor"
 * - Preceptor: puede asignar "profesor", "alumno"
 * - Profesor, Alumno o sin rol: ninguno ([])
 */
export const getAllowedAssignableRoles = (operatorRole?: string | null): UserRole[] => {
  if (!operatorRole) return [];
  const clean = fromDbRol(operatorRole).trim().toLowerCase();
  if (clean === "admin") {
    return ["admin", "directivo", "preceptor", "profesor", "alumno", "preceptor_profesor"];
  }
  if (clean === "directivo") {
    return ["preceptor", "profesor", "alumno", "preceptor_profesor"];
  }
  if (clean === "preceptor" || clean === "preceptor_profesor") {
    return ["profesor", "alumno"];
  }
  return [];
};

/**
 * Determina si un operador tiene jerarquía para modificar el rol de un usuario objetivo:
 * - Admin: puede modificar a cualquiera (excepto auto-degradar su propia cuenta de admin).
 * - Directivo: puede modificar a usuarios con rol preceptor, profesor, preceptor_profesor o alumno (NO a otros directivos ni admins).
 * - Preceptor o Preceptor y Profesor: puede modificar a usuarios con rol profesor o alumno (NO a otros preceptores, directivos ni admins).
 * - Otros: no pueden modificar ningún rol.
 */
export const canManageUserRole = (operatorRole?: string | null, targetRole?: string | null): boolean => {
  if (!operatorRole) return false;
  const op = fromDbRol(operatorRole).trim().toLowerCase();
  const tgt = fromDbRol(targetRole || "").trim().toLowerCase();

  if (op === "admin") return true;
  if (op === "directivo") {
    return tgt !== "admin" && tgt !== "directivo" && !tgt.includes("admin") && !tgt.includes("directivo");
  }
  if (op === "preceptor" || op === "preceptor_profesor") {
    return (
      tgt !== "admin" &&
      tgt !== "directivo" &&
      tgt !== "preceptor" &&
      tgt !== "preceptor_profesor" &&
      !tgt.includes("admin") &&
      !tgt.includes("directivo") &&
      !tgt.includes("preceptor")
    );
  }
  return false;
};


// ─── MÓDULOS HORARIOS: Almacenado como número entero (1–22) en Appwrite ───────
// Appwrite attribute type: INTEGER (size: 2)
// El campo `hora` en la colección `horarios` guarda el número de módulo.
// Este mapa es la fuente de verdad única para la UI y el formulario (Mañana, Tarde y Vespertino/Nocturna).
export const MODULO_MAP: Record<number, string> = {
  1:  "07:40 - 08:20",
  2:  "08:20 - 09:00",
  3:  "09:10 - 09:50",
  4:  "09:50 - 10:30",
  5:  "10:40 - 11:20",
  6:  "11:20 - 12:00",
  7:  "12:00 - 12:40",
  8:  "12:50 - 13:30",
  9:  "13:30 - 14:10",
  10: "14:20 - 15:00",
  11: "15:00 - 15:40",
  12: "15:50 - 16:30",
  13: "16:30 - 17:10",
  14: "17:20 - 18:00",
  15: "18:00 - 18:40",
  16: "18:40 - 19:20",
  17: "19:30 - 20:10",
  18: "20:10 - 20:50",
  19: "21:00 - 21:40",
  20: "21:40 - 22:20",
  21: "22:25 - 23:05",
  22: "23:05 - 23:45",
};
// Mapa inverso: texto -> número (para guardar en Appwrite)
export const MODULO_REVERSE: Record<string, number> = Object.fromEntries(
  Object.entries(MODULO_MAP).map(([k, v]) => [v, Number(k)])
);
/** Convierte texto de módulo ("07:40 - 08:20") al número compacto para Appwrite */
export const toDbHora = (display: string | number | null | undefined): number => {
  if (display === null || display === undefined) return 1;
  if (typeof display === "number") {
    return display >= 1 && display <= 22 ? display : 1;
  }
  const str = String(display).trim();
  if (MODULO_REVERSE[str]) return MODULO_REVERSE[str];

  // Si ya es un dígito del 1 al 22
  const num = Number(str);
  if (!isNaN(num) && num >= 1 && num <= 22) return num;

  // Matching flexible ignorando espacios (ej: "07:40-08:20")
  const cleanStr = str.replace(/\s+/g, "").toLowerCase();
  for (const [modNum, modStr] of Object.entries(MODULO_MAP)) {
    if (modStr.replace(/\s+/g, "").toLowerCase() === cleanStr) {
      return Number(modNum);
    }
  }

  // Extracción de número si dice "Módulo 3" o "Hora 3"
  const m = str.match(/(\d+)/);
  if (m) {
    const extracted = parseInt(m[1], 10);
    if (extracted >= 1 && extracted <= 22) return extracted;
  }

  return 1;
};

/** Convierte el número compacto guardado en Appwrite al texto legible */
export const fromDbHora = (code: number | string | null | undefined): string => {
  if (code === null || code === undefined) return "Hora a confirmar";
  
  const rawStr = String(code).trim();
  if (!rawStr || rawStr.toLowerCase() === "null" || rawStr.toLowerCase() === "undefined" || rawStr === "0") {
    return "Hora a confirmar";
  }

  // Si es un número del 1 al 22 (código de módulo)
  const num = Number(rawStr);
  if (!isNaN(num) && num >= 1 && num <= 22 && MODULO_MAP[num]) {
    return MODULO_MAP[num];
  }

  // Si ya es un rango horario de texto (ej: "07:40 - 08:20", "14:20 a 15:00")
  if (rawStr.includes(":") || rawStr.includes("-") || rawStr.includes("a")) {
    return rawStr;
  }

  // Si coincide con alguna variación de módulo (ej: "módulo 1", "mod 2")
  const modMatch = rawStr.match(/(\d+)/);
  if (modMatch) {
    const extractedNum = parseInt(modMatch[1], 10);
    if (extractedNum >= 1 && extractedNum <= 22 && MODULO_MAP[extractedNum]) {
      return MODULO_MAP[extractedNum];
    }
  }

  return "Hora a confirmar";
};

// ─── LOGS DE AUDITORÍA: Acciones comprimidas a códigos 2–4 chars ─────────────
// Appwrite attribute type: STRING (size: 6)
// El campo `accion` en la colección `logs` guarda el código compacto.
export const LOG_CODE_MAP: Record<string, string> = {
  // Ausencias
  "C_A":  "Registró una nueva ausencia docente",
  "E_A":  "Eliminó un registro de ausencia",
  "M_EA": "Cambió el estado de una ausencia",
  // Docentes
  "C_D":  "Registró un nuevo docente",
  "M_D":  "Editó los datos de un docente",
  "E_D":  "Eliminó un docente del sistema",
  // Alumnos
  "C_AL": "Inscribió un alumno al sistema",
  "E_AL": "Eliminó un alumno del sistema",
  "M_AL": "Asignó o cambió el curso de un alumno",
  // Cursos
  "C_CU": "Creó un nuevo curso",
  "E_CU": "Eliminó un curso del sistema",
  // Horarios
  "C_H":  "Programó una nueva clase en el horario",
  "E_H":  "Eliminó una clase del horario",
  "RE_H": "Reinició todos los horarios del ciclo lectivo",
  // Mesas de Examen
  "C_M":  "Creó una nueva mesa de examen",
  "E_M":  "Eliminó una mesa de examen",
  // Asistencias
  "C_AJ": "Registró asistencia general (jornada)",
  "C_AM": "Registró asistencia de materia",
  // Usuarios / Acceso
  "AP_C": "Aprobó un colaborador del sistema",
  "AP_A": "Aprobó la matriculación de un alumno",
  "RC_C": "Rechazó una solicitud de acceso",
  "RC_A": "Rechazó la matriculación de un alumno",
  "AU_C": "Autorizó un nuevo colaborador",
  "RV_A": "Revocó el acceso de un usuario",
  "C_ROL": "Cambió el rol de un usuario",
  // Notificaciones
  "EN_N": "Envió una notificación a usuarios",
  "AV_HL": "Envió aviso de hora libre a alumnos",
  // Paridad / Sistema
  "RP_D": "Registró adhesión a paro docente",
  "RE_A": "Reinició todas las ausencias del ciclo lectivo",
  "MI_D": "Ejecutó migración de base de datos",
  "AC_T": "Aceptó los Términos y Condiciones",
};
// Mapa inverso: texto largo -> código compacto (para guardar en Appwrite)
const LOG_CODE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(LOG_CODE_MAP).map(([k, v]) => [v, k])
);
// Mapa de acciones legacy (SNAKE_UPPER) -> código compacto para retrocompatibilidad
const LEGACY_LOG_MAP: Record<string, string> = {
  "BORRAR_AUSENCIA":           "E_A",
  "CAMBIO_ESTADO":             "M_EA",
  "APROBAR_COLABORADOR":       "AP_C",
  "RECHAZAR_SOLICITUD":        "RC_C",
  "APROBAR_ALUMNO":            "AP_A",
  "RECHAZAR_ALUMNO":           "RC_A",
  "AUTORIZAR_COLABORADOR":     "AU_C",
  "REVOCAR_ACCESO":            "RV_A",
  "CAMBIAR_ROL":               "C_ROL",
  "CAMBIO_ROL":                "C_ROL",
  "EDITAR_DOCENTE":            "M_D",
  "REGISTRAR_DOCENTE":         "C_D",
  "ELIMINAR_DOCENTE":          "E_D",
  "ASIGNAR_CURSO_ALUMNO":      "M_AL",
  "ASIGNAR_ALUMNOS_CURSO":     "M_AL",
  "ELIMINAR_ALUMNO":           "E_AL",
  "CREAR_CURSO":               "C_CU",
  "ELIMINAR_CURSO":            "E_CU",
  "PROGRAMAR_CLASE":           "C_H",
  "ELIMINAR_HORARIO":          "E_H",
  "REINICIAR_HORARIOS":        "RE_H",
  "CREAR_MESA_EXAMEN":         "C_M",
  "ELIMINAR_MESA_EXAMEN":      "E_M",
  "REGISTRAR_ASISTENCIA_JORNADA": "C_AJ",
  "REGISTRAR_ASISTENCIA_MATERIA": "C_AM",
  "REGISTRAR_PARO_DOCENTE":    "RP_D",
  "REINICIAR_AUSENCIAS":       "RE_A",
  "MIGRAR_BASE_DATOS":         "MI_D",
  "ACEPTAR_TERMINOS":          "AC_T",
  "ENVIAR_NOTIFICACION":       "EN_N",
  "ENVIAR":                    "EN_N",
  "AVISO_HORA_LIBRE_EMAIL":    "AV_HL",
  "AVISO_HORA_LIBRE":          "AV_HL",
  "AGREGAR_SUSPENSION_EDILICIA": "SUSP_E",
};

export const ACTION_NAME_MAP: Record<string, string> = {
  // Aprobaciones / Accesos
  "AP_A": "Aprobar Alumno",
  "APROBAR_ALUMNO": "Aprobar Alumno",
  "RC_A": "Rechazar Alumno",
  "RECHAZAR_ALUMNO": "Rechazar Alumno",
  "AP_C": "Aprobar Colaborador",
  "APROBAR_COLABORADOR": "Aprobar Colaborador",
  "RC_C": "Rechazar Solicitud",
  "RECHAZAR_SOLICITUD": "Rechazar Solicitud",
  "AU_C": "Autorizar Colaborador",
  "AUTORIZAR_COLABORADOR": "Autorizar Colaborador",
  "RV_A": "Revocar Acceso",
  "REVOCAR_ACCESO": "Revocar Acceso",
  "C_ROL": "Cambio de Rol",
  "CAMBIAR_ROL": "Cambio de Rol",
  "CAMBIO_ROL": "Cambio de Rol",

  // Ausencias y Licencias
  "C_A": "Registrar Ausencia",
  "REGISTRAR_AUSENCIA": "Registrar Ausencia",
  "E_A": "Eliminar Ausencia",
  "BORRAR_AUSENCIA": "Eliminar Ausencia",
  "M_EA": "Cambio de Estado",
  "CAMBIO_ESTADO": "Cambio de Estado",
  "RP_D": "Registrar Paro Docente",
  "REGISTRAR_PARO_DOCENTE": "Registrar Paro Docente",
  "RE_A": "Reiniciar Ausencias",
  "REINICIAR_AUSENCIAS": "Reiniciar Ausencias",
  "AGREGAR_SUSPENSION_EDILICIA": "Suspensión Edilicia",
  "SUSP_E": "Suspensión Edilicia",

  // Docentes
  "C_D": "Registrar Docente",
  "REGISTRAR_DOCENTE": "Registrar Docente",
  "M_D": "Editar Docente",
  "EDITAR_DOCENTE": "Editar Docente",
  "E_D": "Eliminar Docente",
  "ELIMINAR_DOCENTE": "Eliminar Docente",

  // Alumnos y Cursos
  "C_AL": "Inscribir Alumno",
  "REGISTRAR_ALUMNO": "Inscribir Alumno",
  "E_AL": "Eliminar Alumno",
  "ELIMINAR_ALUMNO": "Eliminar Alumno",
  "M_AL": "Asignar Curso",
  "ASIGNAR_CURSO_ALUMNO": "Asignar Curso",
  "ASIGNAR_ALUMNOS_CURSO": "Asignar Curso",
  "C_CU": "Crear Curso",
  "CREAR_CURSO": "Crear Curso",
  "E_CU": "Eliminar Curso",
  "ELIMINAR_CURSO": "Eliminar Curso",

  // Horarios
  "C_H": "Programar Clase",
  "PROGRAMAR_CLASE": "Programar Clase",
  "E_H": "Eliminar Clase",
  "ELIMINAR_HORARIO": "Eliminar Clase",
  "RE_H": "Reiniciar Horarios",
  "REINICIAR_HORARIOS": "Reiniciar Horarios",

  // Mesas de Examen
  "C_M": "Crear Mesa de Examen",
  "CREAR_MESA_EXAMEN": "Crear Mesa de Examen",
  "E_M": "Eliminar Mesa de Examen",
  "ELIMINAR_MESA_EXAMEN": "Eliminar Mesa de Examen",

  // Asistencias
  "C_AJ": "Asistencia General",
  "REGISTRAR_ASISTENCIA_JORNADA": "Asistencia General",
  "C_AM": "Asistencia por Materia",
  "REGISTRAR_ASISTENCIA_MATERIA": "Asistencia por Materia",

  // Notificaciones y Avisos
  "EN_N": "Enviar Notificación",
  "ENVIAR_NOTIFICACION": "Enviar Notificación",
  "ENVIAR": "Enviar Notificación",
  "AV_HL": "Aviso de Hora Libre",
  "AVISO_HORA_LIBRE_EMAIL": "Aviso de Hora Libre",
  "AVISO_HORA_LIBRE": "Aviso de Hora Libre",
  "AVISO_": "Aviso de Hora Libre",

  // Truncados históricos de Appwrite (failsafe slice(0, 6))
  "REGIST": "Registrar Docente",
  "EDITAR": "Editar Registro",
  "ELIMIN": "Eliminar Registro",
  "ASIGNA": "Asignar Curso",
  "PROGRAM": "Programar Horario",
  "REINIC": "Reiniciar Datos",
  "ACEPTA": "Aceptar Términos",
  "SOLICI": "Solicitud de Acceso",

  // Sistema / Legales
  "MI_D": "Migrar Base de Datos",
  "MIGRAR_BASE_DATOS": "Migrar Base de Datos",
  "AC_T": "Aceptar Términos",
  "ACEPTAR_TERMINOS": "Aceptar Términos",
  "LOGIN": "Inicio de Sesión",
  "LOGOUT": "Cierre de Sesión"
};

/**
 * Traduce cualquier código de acción (compacto, truncado o legacy) a un título
 * claro y legible para el usuario (ej: "AP_A" -> "Aprobar Alumno").
 */
export const formatActionLabel = (code: string): string => {
  if (!code) return "Acción Desconocida";
  const trimmed = code.trim();
  if (ACTION_NAME_MAP[trimmed]) return ACTION_NAME_MAP[trimmed];
  const upper = trimmed.toUpperCase();
  if (ACTION_NAME_MAP[upper]) return ACTION_NAME_MAP[upper];
  return trimmed
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Convierte cualquier acción (legacy SNAKE_UPPER o código compacto) al código
 * compacto para almacenar en Appwrite. Máx 6 chars.
 */
export const toDbAccion = (accion: string): string => {
  // Si ya es un código compacto conocido, devolver tal cual
  if (LOG_CODE_MAP[accion]) return accion;
  // Si es legacy, convertir
  if (LEGACY_LOG_MAP[accion]) return LEGACY_LOG_MAP[accion];
  // Si por alguna razón no se reconoce, truncar a 6 chars (failsafe)
  return accion.slice(0, 6);
};

/**
 * Traduce un código compacto de log al texto legible para la UI del Administrador.
 */
export const fromDbAccion = (code: string): string => formatActionLabel(code);

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface Ausencia {
  id?: string;
  profId: string | number;
  profNombre: string;
  tipo: string;
  inicio: string;
  fin: string;
  materias: string[];
  motivo: string;
  cert: boolean;
  certFileId?: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  fechaReg: string;
  schoolId?: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  nombre: string;
  rol: string;
  telefono?: string;
  direccion?: string;
  nombrePendiente?: string;
  cursos?: string[];
  schoolId?: string;
}

export const parseUserCursos = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return val.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

export interface Curso {
  id?: string;
  nombre: string;
  schoolId?: string;
}

export interface Profesor {
  id?: string;
  nombre: string;
  dni: string;
  materias: string[];
  email: string;
  schoolId?: string;
}

export interface Horario {
  id?: string;
  dia: string;
  hora: string;
  materia: string;
  profesor: string;
  curso: string;
  schoolId?: string;
}

export interface Alumno {
  id?: string;
  nombre: string;
  dni: string;
  curso: string;
  email: string;
  schoolId?: string;
}

export interface AsistenciaJornada {
  id?: string;
  alumnoId: string;
  alumnoNombre: string;
  fecha: string;
  estado: "P" | "A" | "M" | "T" | "R" | "J"; // P=Presente, A=Ausente, M=Media Falta, T=Tarde, R=Retiro, J=Justificado
  preceptorId: string;
  schoolId?: string;
}

export interface AsistenciaMateria {
  id?: string;
  alumnoId: string;
  alumnoNombre: string;
  fecha: string;
  materia: string;
  curso: string;
  estado: "P" | "A" | "T"; // P=Presente, A=Ausente, T=Tarde
  profesorId: string;
  schoolId?: string;
}

export interface MesaExamen {
  id?: string;
  fecha: string;
  hora: string;
  materia: string;
  aula: string;
  presidenteId: string;
  presidenteNombre: string;
  vocal1Id?: string;
  vocal1Nombre?: string;
  vocal2Id?: string;
  vocal2Nombre?: string;
  alumnosInscriptos: string[]; // Nombres o DNI/IDs de inscriptos
  estado: "borrador" | "confirmada" | "evaluada";
  schoolId?: string;
}

// ─── HORARIOS ────────────────────────────────────────────────────────────────
export const getHorarios = async (forceRefresh = false, schoolId?: string): Promise<Horario[]> => {
  const sId = getActiveSchoolId(schoolId);
  if (!forceRefresh) {
    const cached = getCachedData<Horario[]>("horarios", sId);
    if (cached && !cached.some(h => h.hora === "Hora a confirmar")) return cached;
  }
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_HORARIOS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.limit(500)]
    });
    const data = response.documents.map(doc => {
      // Map numeric day values to display strings
      let dayName = doc.dia;
      if (doc.dia === "1") dayName = "Lunes";
      else if (doc.dia === "2") dayName = "Martes";
      else if (doc.dia === "3") dayName = "Miércoles";
      else if (doc.dia === "4") dayName = "Jueves";
      else if (doc.dia === "5") dayName = "Viernes";

      return {
        id: doc.$id, dia: dayName,
        // hora: convertir código numérico almacenado en Appwrite a texto legible
        hora: fromDbHora(doc.hora ?? (doc as any).modulo ?? (doc as any).horario),
        materia: doc.materia || "Materia",
        profesor: doc.profesor || "Docente",
        curso: doc.curso || "Curso",
        schoolId: doc.schoolId || sId
      };
    });
    setCachedData("horarios", data, sId);
    return data;
  } catch (err) { devLog("getHorarios", err); return []; }
};

export const saveHorario = async (h: Horario, schoolId?: string) => {
  await requireAuth();
  const sId = h.schoolId || getActiveSchoolId(schoolId);
  clearCache("horarios", sId);
  
  // Map day name to digit string for saving space in database
  let dayCode = h.dia;
  if (h.dia === "Lunes") dayCode = "1";
  else if (h.dia === "Martes") dayCode = "2";
  else if (h.dia === "Miércoles") dayCode = "3";
  else if (h.dia === "Jueves") dayCode = "4";
  else if (h.dia === "Viernes") dayCode = "5";

  // Convertir texto de hora a código numérico de módulo antes de guardar
  const horaCode = toDbHora(h.hora);

  const res = await databases.createDocument({
    databaseId: APPWRITE_DB_ID,
    collectionId: APPWRITE_HORARIOS_COLLECTION_ID,
    documentId: ID.unique(),
    data: {
      dia: dayCode,
      hora: horaCode,   // Appwrite recibe: 1, 2, 3... hasta 16
      materia: sanitize(h.materia, 100),
      profesor: sanitize(h.profesor, 200),
      curso: sanitize(h.curso, 50),
      schoolId: sId
    }
  });
  notifyRealtimeUpdate("horarios");
  return res;
};

export const deleteHorario = async (id: string, schoolId?: string) => {
  await requireAuth();
  clearCache("horarios", schoolId);
  const res = await databases.deleteDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_HORARIOS_COLLECTION_ID, documentId: id });
  notifyRealtimeUpdate("horarios");
  return res;
};

export const subscribeToHorarios = (callback: (data: Horario[]) => void) => {
  let isSubscribed = true;
  let retryTimeout: NodeJS.Timeout | null = null;

  const fetchAll = async (force = true) => {
    try {
      const data = await getHorarios(force);
      if (isSubscribed) {
        callback(data);
      }
    } catch (err) {
      devLog("subscribeToHorarios/fetch", err);
    }
  };

  fetchAll(false);

  // Suscripción Realtime WebSocket con Appwrite
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_HORARIOS_COLLECTION_ID}.documents`,
    () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => {
        if (isSubscribed) fetchAll(true);
      }, 150);
    }
  );

  // Escucha de eventos locales en la misma pestaña
  const handleLocalUpdate = () => {
    if (isSubscribed) fetchAll(true);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:horarios-updated", handleLocalUpdate);
    window.addEventListener("escuelainfo:school-changed", handleLocalUpdate);
  }

  // Canal broadcast entre múltiples pestañas del mismo navegador
  let bc: BroadcastChannel | null = null;
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    try {
      bc = new BroadcastChannel("escuelainfo-realtime");
      bc.onmessage = (event) => {
        if (event.data?.type === "horarios" && isSubscribed) {
          fetchAll(true);
        }
      };
    } catch {}
  }

  // Polling de seguridad (cada 25s) y sincronización al reenfocar la ventana
  const interval = setInterval(() => {
    if (isSubscribed) fetchAll(true);
  }, 25000);

  const handleFocus = () => {
    if (isSubscribed) fetchAll(true);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && isSubscribed) fetchAll(true);
    });
  }

  return () => {
    isSubscribed = false;
    if (retryTimeout) clearTimeout(retryTimeout);
    clearInterval(interval);
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:horarios-updated", handleLocalUpdate);
      window.removeEventListener("escuelainfo:school-changed", handleLocalUpdate);
      window.removeEventListener("focus", handleFocus);
    }
    if (bc) {
      try { bc.close(); } catch {}
    }
  };
};

// ─── ALUMNOS ─────────────────────────────────────────────────────────────────
export const getAlumnos = async (forceRefresh = false, schoolId?: string): Promise<Alumno[]> => {
  const sId = getActiveSchoolId(schoolId);
  if (!forceRefresh) {
    const cached = getCachedData<Alumno[]>("alumnos", sId);
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ALUMNOS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    });
    const data = response.documents.map(doc => ({
      id: doc.$id, nombre: doc.nombre, dni: doc.dni, curso: doc.curso, email: doc.email, schoolId: doc.schoolId || sId
    }));
    setCachedData("alumnos", data, sId);
    return data;
  } catch (err) { devLog("getAlumnos", err); return []; }
};

export const saveAlumno = async (a: Alumno, schoolId?: string) => {
  await requireAuth();
  const sId = a.schoolId || getActiveSchoolId(schoolId);
  clearCache("alumnos", sId);
  return await databases.createDocument({
    databaseId: APPWRITE_DB_ID,
    collectionId: APPWRITE_ALUMNOS_COLLECTION_ID,
    documentId: ID.unique(),
    data: {
      nombre: sanitize(a.nombre, 200),
      dni: sanitize(a.dni, 20),
      curso: sanitize(a.curso, 100),
      email: sanitize(a.email, 200),
      schoolId: sId,
    }
  });
};

export const deleteAlumno = async (id: string, schoolId?: string) => {
  await requireAuth();
  clearCache("alumnos", schoolId);
  return await databases.deleteDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_ALUMNOS_COLLECTION_ID, documentId: id });
};

export const updateAlumno = async (id: string, data: Partial<Alumno>, schoolId?: string) => {
  await requireAuth();
  clearCache("alumnos", schoolId);
  const updateData = { ...data };
  if (updateData.nombre) updateData.nombre = sanitize(updateData.nombre, 200);
  if (updateData.dni) updateData.dni = sanitize(updateData.dni, 20);
  if (updateData.curso) updateData.curso = sanitize(updateData.curso, 100);
  if (updateData.email) updateData.email = sanitize(updateData.email, 200);
  if (updateData.schoolId) updateData.schoolId = sanitize(updateData.schoolId, 100);
  return await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_ALUMNOS_COLLECTION_ID, documentId: id, data: updateData });
};

export const checkAlumnoDNI = async (dni: string, schoolId?: string): Promise<boolean> => {
  try {
    const sId = getActiveSchoolId(schoolId);
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ALUMNOS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.equal("dni", sanitize(dni, 20))]
    });
    return response.documents.length > 0;
  } catch { return false; }
};

// 🛡️ SECURITY AUDIT REF: Prevención de Descarga Masiva (Information Leakage)
// Consulta únicamente el registro del alumno solicitado sin descargar todo el padrón escolar al navegador.
export const getAlumnoByEmail = async (email: string, schoolId?: string): Promise<Alumno | null> => {
  if (!email || !email.trim()) return null;
  try {
    const sId = getActiveSchoolId(schoolId);
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ALUMNOS_COLLECTION_ID,
      queries: [Query.equal("email", sanitize(email, 200)), Query.equal("schoolId", sId), Query.limit(1)]
    });
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return { id: doc.$id, nombre: doc.nombre, dni: doc.dni, curso: doc.curso, email: doc.email, schoolId: doc.schoolId || sId };
    }
    // Fallback sin filtrar escuela si aún no tenía schoolId asignado
    const fallbackResponse = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ALUMNOS_COLLECTION_ID,
      queries: [Query.equal("email", sanitize(email, 200)), Query.limit(1)]
    });
    if (fallbackResponse.documents.length > 0) {
      const doc = fallbackResponse.documents[0];
      return { id: doc.$id, nombre: doc.nombre, dni: doc.dni, curso: doc.curso, email: doc.email, schoolId: doc.schoolId || DEFAULT_SCHOOL_ID };
    }
    return null;
  } catch { return null; }
};

export const checkProfesorDNI = async (dni: string, schoolId?: string): Promise<boolean> => {
  if (!dni || !dni.trim()) return false;
  try {
    const sId = getActiveSchoolId(schoolId);
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_PROFS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.equal("dni", sanitize(dni, 20))]
    });
    return response.documents.length > 0;
  } catch { return false; }
};

// 🛡️ SECURITY AUDIT REF: Prevención de Descarga Masiva (Information Leakage)
// En lugar de obtener todos los profesores y filtrar en cliente, consultamos 1 solo registro.
export const getProfesorByEmail = async (email: string, schoolId?: string): Promise<Profesor | null> => {
  try {
    const sId = getActiveSchoolId(schoolId);
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_PROFS_COLLECTION_ID,
      queries: [Query.equal("email", sanitize(email, 200)), Query.equal("schoolId", sId), Query.limit(1)]
    });
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return { id: doc.$id, nombre: doc.nombre, dni: doc.dni, materias: doc.materias, email: doc.email, schoolId: doc.schoolId || sId };
    }
    // Fallback sin filtro estricto de escuela
    const fallbackResponse = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_PROFS_COLLECTION_ID,
      queries: [Query.equal("email", sanitize(email, 200)), Query.limit(1)]
    });
    if (fallbackResponse.documents.length > 0) {
      const doc = fallbackResponse.documents[0];
      return { id: doc.$id, nombre: doc.nombre, dni: doc.dni, materias: doc.materias, email: doc.email, schoolId: doc.schoolId || DEFAULT_SCHOOL_ID };
    }
    return null;
  } catch { return null; }
};

// ─── PROFESORES ──────────────────────────────────────────────────────────────
export const getProfesores = async (forceRefresh = false, schoolId?: string): Promise<Profesor[]> => {
  const sId = getActiveSchoolId(schoolId);
  if (!forceRefresh) {
    const cached = getCachedData<Profesor[]>("profesores", sId);
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_PROFS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    });
    const data = response.documents.map(doc => ({
      id: doc.$id, nombre: doc.nombre, dni: doc.dni, materias: doc.materias, email: doc.email, schoolId: doc.schoolId || sId
    }));
    setCachedData("profesores", data, sId);
    return data;
  } catch (err) { devLog("getProfesores", err); return []; }
};

export const saveProfesor = async (p: Profesor, schoolId?: string) => {
  await requireAuth();
  const sId = p.schoolId || getActiveSchoolId(schoolId);
  clearCache("profesores", sId);
  return await databases.createDocument({
    databaseId: APPWRITE_DB_ID,
    collectionId: APPWRITE_PROFS_COLLECTION_ID,
    documentId: ID.unique(),
    data: {
      nombre: sanitize(p.nombre, 200),
      dni: sanitize(p.dni, 20),
      materias: p.materias.map(m => sanitize(m, 100)),
      email: sanitize(p.email, 200),
      schoolId: sId,
    }
  });
};

export const deleteProfesor = async (id: string, schoolId?: string) => {
  await requireAuth();
  clearCache("profesores", schoolId);
  return await databases.deleteDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_PROFS_COLLECTION_ID, documentId: id });
};

export const updateProfesor = async (id: string, data: Partial<Profesor>, schoolId?: string) => {
  await requireAuth();
  clearCache("profesores", schoolId);
  const updateData = { ...data };
  if (updateData.materias) {
    updateData.materias = updateData.materias.map(m => sanitize(m, 100));
  }
  if (updateData.nombre) updateData.nombre = sanitize(updateData.nombre, 200);
  if (updateData.dni) updateData.dni = sanitize(updateData.dni, 20);
  if (updateData.email) updateData.email = sanitize(updateData.email, 200);
  if (updateData.schoolId) updateData.schoolId = sanitize(updateData.schoolId, 100);
  return await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_PROFS_COLLECTION_ID, documentId: id, data: updateData });
};

// ─── AUDITORÍA ───────────────────────────────────────────────────────────────
export const logAction = async (usuarioEmail: string, accion: string, detalles: string, schoolId?: string) => {
  const sId = getActiveSchoolId(schoolId);
  clearCache("logs", sId);
  try {
    // Comprimir acción a código compacto antes de guardar en Appwrite
    const accionCode = toDbAccion(accion);
    await databases.createDocument({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_LOGS_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        usuarioEmail: sanitize(usuarioEmail, 200),
        accion: sanitize(accionCode, 6),
        detalles: sanitize(detalles, 500),
        fecha: new Date().toISOString(),
        schoolId: sId,
      }
    });
  } catch (err) { devLog("logAction", err); }
};

export const getLogs = async (forceRefresh = false, schoolId?: string) => {
  const sId = getActiveSchoolId(schoolId);
  if (!forceRefresh) {
    const cached = getCachedData<any[]>("logs", sId);
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_LOGS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.orderDesc("fecha"), Query.limit(100)]
    });
    const data = response.documents;
    setCachedData("logs", data, sId);
    return data;
  } catch (err) { devLog("getLogs", err); return []; }
};

// ─── USUARIOS / PERFILES ─────────────────────────────────────────────────────
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const response = await databases.listDocuments({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_USERS_COLLECTION_ID, queries: [Query.equal("uid", uid)] });
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return { 
        ...doc, 
        id: doc.$id, 
        rol: fromDbRol(doc.rol),
        cursos: parseUserCursos(doc.cursos),
        schoolId: doc.schoolId || DEFAULT_SCHOOL_ID
      } as unknown as UserProfile;
    }
    return null;
  } catch (err) { devLog("getUserProfile", err); return null; }
};

export const getUserProfileByEmail = async (email: string, schoolId?: string): Promise<UserProfile | null> => {
  try {
    const queries = [Query.equal("email", sanitize(email, 200))];
    if (schoolId) queries.push(Query.equal("schoolId", schoolId));
    const response = await databases.listDocuments({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_USERS_COLLECTION_ID, queries });
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return { 
        ...doc, 
        id: doc.$id, 
        rol: fromDbRol(doc.rol),
        cursos: parseUserCursos(doc.cursos),
        schoolId: doc.schoolId || DEFAULT_SCHOOL_ID
      } as unknown as UserProfile;
    }
    return null;
  } catch { return null; }
};

export const getUsuarios = async (forceRefresh = false, schoolId?: string): Promise<UserProfile[]> => {
  const sId = getActiveSchoolId(schoolId);
  if (!forceRefresh) {
    const cached = getCachedData<UserProfile[]>("usuarios", sId);
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_USERS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    });
    const data = response.documents.map(doc => ({
      id: doc.$id, 
      uid: doc.uid, 
      email: doc.email, 
      nombre: doc.nombre, 
      rol: fromDbRol(doc.rol),
      cursos: parseUserCursos(doc.cursos),
      schoolId: doc.schoolId || sId
    })) as unknown as UserProfile[];
    setCachedData("usuarios", data, sId);
    return data;
  } catch (err) { devLog("getUsuarios", err); return []; }
};

export const updateUserProfile = async (id: string, data: Partial<UserProfile>, schoolId?: string) => {
  await requireAuth();
  clearCache("usuarios", schoolId);
  const updateData: any = { ...data };
  if (updateData.rol) updateData.rol = toDbRol(updateData.rol);
  if (updateData.nombre) updateData.nombre = sanitize(updateData.nombre, 200);
  if (updateData.email) updateData.email = sanitize(updateData.email, 200);
  if (updateData.uid) updateData.uid = sanitize(updateData.uid, 50);
  if (updateData.schoolId) updateData.schoolId = sanitize(updateData.schoolId, 100);
  if (updateData.nombrePendiente !== undefined) {
    updateData.nombrePendiente = updateData.nombrePendiente ? sanitize(updateData.nombrePendiente, 200) : "";
  }
  if (updateData.cursos !== undefined) {
    updateData.cursos = Array.isArray(updateData.cursos) ? JSON.stringify(updateData.cursos) : (updateData.cursos || "[]");
  }
  return await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_USERS_COLLECTION_ID, documentId: id, data: updateData });
};

export const syncUserEmailChange = async (oldEmail: string, newEmail: string, rol: string) => {
  const normRol = fromDbRol(rol);
  if (normRol === "profesor" || normRol === "preceptor_profesor") {
    try {
      const response = await databases.listDocuments({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_PROFS_COLLECTION_ID, queries: [Query.equal("email", sanitize(oldEmail, 200))] });
      for (const doc of response.documents) {
        await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_PROFS_COLLECTION_ID, documentId: doc.$id, data: { email: sanitize(newEmail, 200) } });
      }
      clearCache("profesores");
    } catch (err) {
      devLog("syncUserEmailChange/profesor", err);
    }
  }

  if (normRol === "alumno") {
    try {
      const response = await databases.listDocuments({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_ALUMNOS_COLLECTION_ID, queries: [Query.equal("email", sanitize(oldEmail, 200))] });
      for (const doc of response.documents) {
        await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_ALUMNOS_COLLECTION_ID, documentId: doc.$id, data: { email: sanitize(newEmail, 200) } });
      }
      clearCache("alumnos");
    } catch (err) {
      devLog("syncUserEmailChange/alumno", err);
    }
  }
};

export const deleteUserProfile = async (id: string) => {
  clearCache("usuarios");
  return await databases.deleteDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_USERS_COLLECTION_ID, documentId: id });
};

// 🛡️ SECURITY AUDIT REF: Invocación autenticada mediante JWT para rechazo y revocación de usuarios
export const rejectUserApi = async (userId?: string, email?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    let authHeader = "";
    try {
      const jwtRes = await account.createJWT();
      if (jwtRes?.jwt) {
        authHeader = `Bearer ${jwtRes.jwt}`;
      }
    } catch (jwtErr) {
      console.warn("[rejectUserApi] No se pudo obtener JWT de sesión:", jwtErr);
    }

    const res = await fetch("/api/admin/reject-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {})
      },
      body: JSON.stringify({ userId, email })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error || "No se pudo rechazar o revocar el usuario." };
    }
    clearCache("usuarios");
    clearCache("alumnos");
    clearCache("profesores");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al comunicarse con el servidor institucional." };
  }
};

// 🛡️ SECURITY AUDIT REF: Solicitud de código OTP enviado al Administrador Principal para autorizar administradores
export const requestAdminOtpApi = async (
  targetUserEmail: string,
  targetUserName?: string
): Promise<{ success: boolean; token?: string; error?: string; message?: string; simulated?: boolean; code?: string }> => {
  try {
    let authHeader = "";
    try {
      const jwtRes = await account.createJWT();
      if (jwtRes?.jwt) {
        authHeader = `Bearer ${jwtRes.jwt}`;
      }
    } catch (jwtErr) {
      console.warn("[requestAdminOtpApi] No se pudo obtener JWT:", jwtErr);
    }

    const res = await fetch("/api/admin/send-admin-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {})
      },
      body: JSON.stringify({
        targetUserEmail,
        targetUserName
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "No se pudo enviar el código de verificación." };
    }
    return {
      success: true,
      token: data.token,
      message: data.message,
      simulated: data.simulated,
      code: data.code
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al comunicarse con el servidor institucional." };
  }
};

// 🛡️ SECURITY AUDIT REF: Invocación autenticada mediante JWT para modificación de rol institucional
export const changeUserRoleApi = async (
  targetUserId: string,
  targetUserEmail: string,
  newRole: string,
  selectedCurso?: string,
  preceptorCursos?: string[],
  adminOtpCode?: string,
  adminOtpToken?: string,
  targetUserName?: string
): Promise<{ success: boolean; error?: string; targetUserId?: string; newRole?: string }> => {
  try {
    let authHeader = "";
    try {
      const jwtRes = await account.createJWT();
      if (jwtRes?.jwt) {
        authHeader = `Bearer ${jwtRes.jwt}`;
      }
    } catch (jwtErr) {
      console.warn("[changeUserRoleApi] No se pudo obtener JWT de sesión:", jwtErr);
    }

    const res = await fetch("/api/admin/change-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {})
      },
      body: JSON.stringify({
        targetUserId,
        targetUserEmail,
        newRole,
        selectedCurso,
        preceptorCursos,
        adminOtpCode,
        adminOtpToken,
        targetUserName
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error || "No se pudo actualizar el rol institucional." };
    }
    clearCache("usuarios");
    clearCache("alumnos");
    clearCache("profesores");
    return { success: true, targetUserId: data.targetUserId, newRole: data.newRole };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al comunicarse con el servidor institucional." };
  }
};

export const createUserProfile = async (profile: UserProfile, schoolId?: string) => {
  await requireAuth();
  const sId = profile.schoolId || getActiveSchoolId(schoolId);
  clearCache("usuarios", sId);
  try {
    const dataToSave: any = { 
      uid: sanitize(profile.uid, 50),
      nombre: sanitize(profile.nombre, 200),
      email: sanitize(profile.email, 200),
      rol: toDbRol(profile.rol),
      cursos: Array.isArray(profile.cursos) ? JSON.stringify(profile.cursos) : "[]",
      schoolId: sId,
    };
    await databases.createDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_USERS_COLLECTION_ID, documentId: ID.unique(), data: dataToSave });
  } catch (err) { devLog("createUserProfile", err); throw err; }
};

export const promoteUserToRole = async (
  email: string, 
  rol: UserProfile["rol"],
  adminOtpCode?: string,
  adminOtpToken?: string
) => {
  // 🛡️ SECURITY AUDIT REF: Broken Access Control (Prevención de Escalada de Privilegios)
  try {
    const session = await account.get();
    if (!session) throw new Error("SECURITY_BLOCK: Unauthenticated role manipulation attempt.");
  } catch {
    throw new Error("SECURITY_BLOCK: Unauthenticated role manipulation attempt.");
  }

  const cleanEmail = email.toLowerCase().trim();

  // Si se promueve a Administrador, es MANDATORIO validar con la API del servidor y el OTP del Administrador Principal
  if (rol === "admin") {
    const res = await changeUserRoleApi("", cleanEmail, "admin", undefined, undefined, adminOtpCode, adminOtpToken);
    if (!res.success) {
      throw new Error(res.error || "No se pudo verificar el código de autorización de Administrador.");
    }
    clearCache("usuarios");
    return;
  }

  // 1. Check if user profile already exists
  const existingProfile = await getUserProfileByEmail(cleanEmail);
  const targetSchoolId = existingProfile?.schoolId || getActiveSchoolId();
  clearCache("usuarios", targetSchoolId);
  if (existingProfile?.id) {
    await updateUserProfile(existingProfile.id, { rol }, targetSchoolId);
  } else {
    await createUserProfile({
      uid: "PENDING_" + ID.unique(),
      email: cleanEmail,
      nombre: "Pendiente",
      rol,
      schoolId: targetSchoolId
    }, targetSchoolId);
  }

  // 2. If promoted to a non-student role, remove from student list
  if (rol !== "alumno" && rol !== "pendiente_alumno") {
    clearCache("alumnos", targetSchoolId);
    try {
      const response = await databases.listDocuments({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_ALUMNOS_COLLECTION_ID, queries: [Query.equal("email", cleanEmail), Query.equal("schoolId", targetSchoolId)] });
      for (const doc of response.documents) {
        await databases.deleteDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_ALUMNOS_COLLECTION_ID, documentId: doc.$id });
      }
    } catch (err) {
      devLog("promoteUserToRole - deleteAlumno", err);
    }
  }
};

// ─── AUSENCIAS ───────────────────────────────────────────────────────────────

/**
 * Calcula de manera precisa e inclusiva los días corridos de una ausencia.
 */
export const calculateAbsenceDays = (inicioStr: string, finStr?: string): number => {
  if (!inicioStr) return 0;
  const endStr = finStr || inicioStr;
  const parts1 = inicioStr.split("-").map(Number);
  const parts2 = endStr.split("-").map(Number);
  if (parts1.length < 3 || parts2.length < 3) return 1;
  const date1 = new Date(parts1[0], parts1[1] - 1, parts1[2]);
  const date2 = new Date(parts2[0], parts2[1] - 1, parts2[2]);
  const diffTime = date2.getTime() - date1.getTime();
  if (diffTime < 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const getAusencias = async (bypassCache = false, schoolId?: string): Promise<Ausencia[]> => {
  const sId = getActiveSchoolId(schoolId);
  if (!bypassCache) {
    const cached = getCachedData<Ausencia[]>("ausencias_list", sId);
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_COLLECTION_ID,
      queries: [
        Query.equal("schoolId", sId),
        Query.orderDesc("inicio"),
        Query.limit(250)
      ]
    });
    const list = response.documents.map(doc => ({
      id: doc.$id,
      profId: doc.profId,
      profNombre: doc.profNombre,
      tipo: doc.tipo,
      inicio: doc.inicio,
      fin: doc.fin,
      materias: doc.materias,
      motivo: doc.motivo,
      cert: doc.cert,
      certFileId: doc.certFileId,
      estado: fromDbEstado(doc.estado),
      fechaReg: doc.fechaReg,
      schoolId: doc.schoolId || sId,
    })) as Ausencia[];
    setCachedData("ausencias_list", list, sId);
    return list;
  } catch (err) {
    devLog("getAusencias", err);
    return [];
  }
};

export const saveAusencia = async (ausencia: Ausencia, schoolId?: string) => {
  await requireAuth();
  const sId = ausencia.schoolId || getActiveSchoolId(schoolId);
  try {
    clearCache("ausencias_list", sId);
    const response = await databases.createDocument({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        profId: String(ausencia.profId),
        profNombre: sanitize(ausencia.profNombre, 200),
        tipo: sanitize(ausencia.tipo, 80),
        inicio: ausencia.inicio,
        fin: ausencia.fin || ausencia.inicio,
        materias: ausencia.materias.map(m => sanitize(m, 100)),
        motivo: sanitize(ausencia.motivo, 500),
        cert: ausencia.cert,
        certFileId: ausencia.certFileId || "",
        estado: toDbEstado(ausencia.estado),
        fechaReg: new Date().toISOString(),
        schoolId: sId,
      }
    });
    notifyRealtimeUpdate("ausencias");

    // Notificación en tiempo real para el equipo de conducción de esta escuela
    saveNotificacion({
      tipo: "inasistencia_docente",
      titulo: `Aviso de Inasistencia: ${ausencia.profNombre}`,
      mensaje: `El docente ${ausencia.profNombre} registró inasistencia (${ausencia.inicio === ausencia.fin ? ausencia.inicio : `del ${ausencia.inicio} al ${ausencia.fin}`}). Materias: ${ausencia.materias.join(", ")}.`,
      destinatarioRol: "directivo",
      metadata: {
        profId: String(ausencia.profId),
        profNombre: ausencia.profNombre,
        inicio: ausencia.inicio,
        fin: ausencia.fin || ausencia.inicio,
        materias: ausencia.materias,
      }
    }, sId).catch(() => {});

    return response.$id;
  } catch (err) { devLog("saveAusencia", err); throw err; }
};

export const subscribeToAusencias = (callback: (data: Ausencia[]) => void) => {
  let isSubscribed = true;
  let retryTimeout: NodeJS.Timeout | null = null;

  const fetchAll = async () => {
    try {
      const sId = getActiveSchoolId();
      const response = await databases.listDocuments({
        databaseId: APPWRITE_DB_ID,
        collectionId: APPWRITE_COLLECTION_ID,
        queries: [
          Query.equal("schoolId", sId),
          Query.orderDesc("inicio"),
          Query.limit(300)
        ]
      });

      const ausencias = response.documents.map(doc => ({
        id: doc.$id,
        profId: doc.profId,
        profNombre: doc.profNombre,
        tipo: doc.tipo,
        inicio: doc.inicio,
        fin: doc.fin || doc.inicio,
        materias: doc.materias,
        motivo: doc.motivo,
        cert: doc.cert,
        certFileId: doc.certFileId,
        estado: fromDbEstado(doc.estado),
        fechaReg: doc.fechaReg,
        schoolId: doc.schoolId || sId,
      })) as Ausencia[];

      if (isSubscribed) {
        setCachedData("ausencias_list", ausencias, sId);
        callback(ausencias);
      }
    } catch (err) {
      devLog("subscribeToAusencias/fetch", err);
    }
  };

  fetchAll();

  // Suscripción Realtime WebSocket con Appwrite
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_COLLECTION_ID}.documents`,
    () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => {
        if (isSubscribed) fetchAll();
      }, 150);
    }
  );

  // Escucha de eventos locales en la misma pestaña y cambio de escuela activa
  const handleLocalUpdate = () => {
    if (isSubscribed) fetchAll();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:ausencias-updated", handleLocalUpdate);
    window.addEventListener("escuelainfo:school-changed", handleLocalUpdate);
  }

  // Canal broadcast entre múltiples pestañas del mismo navegador
  let bc: BroadcastChannel | null = null;
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    try {
      bc = new BroadcastChannel("escuelainfo-realtime");
      bc.onmessage = (event) => {
        if (event.data?.type === "ausencias" && isSubscribed) {
          fetchAll();
        }
      };
    } catch {}
  }

  // Polling de seguridad de alta frecuencia (cada 15s) y sincronización al reenfocar
  const interval = setInterval(() => {
    if (isSubscribed) fetchAll();
  }, 15000);

  const handleFocus = () => {
    if (isSubscribed) fetchAll();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && isSubscribed) fetchAll();
    });
  }

  return () => {
    isSubscribed = false;
    if (retryTimeout) clearTimeout(retryTimeout);
    clearInterval(interval);
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:ausencias-updated", handleLocalUpdate);
      window.removeEventListener("escuelainfo:school-changed", handleLocalUpdate);
      window.removeEventListener("focus", handleFocus);
    }
    if (bc) {
      try { bc.close(); } catch {}
    }
  };
};

export const subscribeToMesasExamen = (callback: (data: MesaExamen[]) => void) => {
  const fetchAll = () => getMesasExamen(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_MESAS_EXAMEN_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  const handleSchool = () => fetchAll();
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:school-changed", handleSchool);
  }
  return () => {
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:school-changed", handleSchool);
    }
  };
};

export const subscribeToUsuarios = (callback: (data: UserProfile[]) => void) => {
  const fetchAll = () => getUsuarios(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_USERS_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  const handleSchool = () => fetchAll();
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:school-changed", handleSchool);
  }
  return () => {
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:school-changed", handleSchool);
    }
  };
};

export const subscribeToAlumnos = (callback: (data: Alumno[]) => void) => {
  const fetchAll = () => getAlumnos(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_ALUMNOS_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  const handleSchool = () => fetchAll();
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:school-changed", handleSchool);
  }
  return () => {
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:school-changed", handleSchool);
    }
  };
};

export const subscribeToProfesores = (callback: (data: Profesor[]) => void) => {
  const fetchAll = () => getProfesores(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_PROFS_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  const handleSchool = () => fetchAll();
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:school-changed", handleSchool);
  }
  return () => {
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:school-changed", handleSchool);
    }
  };
};

export const subscribeToCursos = (callback: (data: Curso[]) => void) => {
  const fetchAll = () => getCursos(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_CURSOS_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  const handleSchool = () => fetchAll();
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:school-changed", handleSchool);
  }
  return () => {
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:school-changed", handleSchool);
    }
  };
};

export const updateAusenciaStatus = async (id: string, estado: "pendiente" | "aprobada" | "rechazada", schoolId?: string) => {
  // 🛡️ SECURITY AUDIT REF: Broken Access Control (Manipulación de Estado)
  try {
    const session = await account.get();
    if (!session) throw new Error("SECURITY_BLOCK: Unauthenticated status update attempt.");
  } catch {
    throw new Error("SECURITY_BLOCK: Unauthenticated status update attempt.");
  }

  try {
    clearCache("ausencias_list", schoolId);
    await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_COLLECTION_ID, documentId: id, data: { estado: toDbEstado(estado) } });
    notifyRealtimeUpdate("ausencias");
  } catch (err) { devLog("updateAusenciaStatus", err); throw err; }
};

export const deleteAusencia = async (id: string, schoolId?: string) => {
  // 🛡️ SECURITY AUDIT REF: Broken Access Control (Borrados no autorizados)
  try {
    const session = await account.get();
    if (!session) throw new Error("SECURITY_BLOCK: Unauthenticated delete attempt.");
  } catch {
    throw new Error("SECURITY_BLOCK: Unauthenticated delete attempt.");
  }

  try {
    clearCache("ausencias_list", schoolId);
    const res = await databases.deleteDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_COLLECTION_ID, documentId: id });
    notifyRealtimeUpdate("ausencias");
    return res;
  } catch (err) { devLog("deleteAusencia", err); throw err; }
};

// ─── CURSOS ──────────────────────────────────────────────────────────────────
export const getCursos = async (forceRefresh = false, schoolId?: string): Promise<Curso[]> => {
  const sId = getActiveSchoolId(schoolId);
  if (!forceRefresh) {
    const cached = getCachedData<Curso[]>("cursos", sId);
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_CURSOS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    });
    const data = response.documents.map(doc => ({ id: doc.$id, nombre: doc.nombre, schoolId: doc.schoolId || sId })) as Curso[];
    setCachedData("cursos", data, sId);
    return data;
  } catch (err) { devLog("getCursos", err); return []; }
};

export const saveCurso = async (curso: Omit<Curso, "id"> & { schoolId?: string }, schoolId?: string) => {
  await requireAuth();
  const sId = curso.schoolId || getActiveSchoolId(schoolId);
  clearCache("cursos", sId);
  try {
    await databases.createDocument({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_CURSOS_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        nombre: sanitize(curso.nombre, 100),
        schoolId: sId,
      }
    });
  } catch (err) { devLog("saveCurso", err); throw err; }
};

export const updateCurso = async (id: string, nuevoNombre: string, nombreAnterior?: string, schoolId?: string) => {
  await requireAuth();
  const sId = getActiveSchoolId(schoolId);
  clearCache("cursos", sId);
  const cleanNuevo = sanitize(nuevoNombre, 100);
  try {
    await databases.updateDocument({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_CURSOS_COLLECTION_ID,
      documentId: id,
      data: { nombre: cleanNuevo }
    });

    // Cascada dentro de la misma escuela: si cambió el nombre, sincronizar en alumnos, horarios y usuarios (preceptores)
    if (nombreAnterior && nombreAnterior.trim() !== cleanNuevo) {
      const cleanAnterior = nombreAnterior.trim();

      // 1. Alumnos
      try {
        const als = await databases.listDocuments({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_ALUMNOS_COLLECTION_ID,
          queries: [Query.equal("schoolId", sId), Query.equal("curso", cleanAnterior), Query.limit(DEFAULT_LIMIT)]
        });
        clearCache("alumnos", sId);
        for (const doc of als.documents) {
          await databases.updateDocument({
            databaseId: APPWRITE_DB_ID,
            collectionId: APPWRITE_ALUMNOS_COLLECTION_ID,
            documentId: doc.$id,
            data: { curso: cleanNuevo }
          });
        }
      } catch (err) {
        devLog("updateCurso/syncAlumnos", err);
      }

      // 2. Horarios
      try {
        const hrs = await databases.listDocuments({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_HORARIOS_COLLECTION_ID,
          queries: [Query.equal("schoolId", sId), Query.equal("curso", cleanAnterior), Query.limit(DEFAULT_LIMIT)]
        });
        clearCache("horarios", sId);
        for (const doc of hrs.documents) {
          await databases.updateDocument({
            databaseId: APPWRITE_DB_ID,
            collectionId: APPWRITE_HORARIOS_COLLECTION_ID,
            documentId: doc.$id,
            data: { curso: cleanNuevo }
          });
        }
      } catch (err) {
        devLog("updateCurso/syncHorarios", err);
      }

      // 3. Preceptores (campo cursos array o JSON)
      try {
        const users = await databases.listDocuments({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_USERS_COLLECTION_ID,
          queries: [Query.equal("schoolId", sId), Query.limit(200)]
        });
        clearCache("usuarios", sId);
        for (const doc of users.documents) {
          const userCursos = parseUserCursos(doc.cursos);
          if (userCursos.includes(cleanAnterior)) {
            const updated = userCursos.map(c => c === cleanAnterior ? cleanNuevo : c);
            await databases.updateDocument({
              databaseId: APPWRITE_DB_ID,
              collectionId: APPWRITE_USERS_COLLECTION_ID,
              documentId: doc.$id,
              data: { cursos: updated }
            });
          }
        }
      } catch (err) {
        devLog("updateCurso/syncPreceptores", err);
      }
    }
  } catch (err) {
    devLog("updateCurso", err);
    throw err;
  }
};

export const deleteCurso = async (id: string, schoolId?: string) => {
  await requireAuth();
  clearCache("cursos", schoolId);
  try {
    await databases.deleteDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_CURSOS_COLLECTION_ID, documentId: id });
  } catch (err) { devLog("deleteCurso", err); throw err; }
};

export const checkCursoExists = async (nombre: string, schoolId?: string): Promise<boolean> => {
  try {
    const sId = getActiveSchoolId(schoolId);
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_CURSOS_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.equal("nombre", sanitize(nombre, 100))]
    });
    return response.documents.length > 0;
  } catch { return false; }
};

// ─── Migración de datos a formato compacto ───────────────────────────────────

// ??? SECURITY AUDIT REF: Global Session Enforcer
const requireAuth = async () => {
  try {
    const session = await account.get();
    if (!session) throw new Error("SECURITY_BLOCK: Unauthenticated operation.");
    return session;
  } catch {
    throw new Error("SECURITY_BLOCK: Unauthenticated operation.");
  }
};

export interface MigrationResult {
  usuariosMigrated: number;
  ausenciasMigrated: number;
  errors: string[];
}

export const migrateToCompactFormat = async (): Promise<MigrationResult> => {
  const result: MigrationResult = { usuariosMigrated: 0, ausenciasMigrated: 0, errors: [] };

  // 1. Migrar roles en colección usuarios
  try {
    const allUsers = await databases.listDocuments({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_USERS_COLLECTION_ID, queries: [Query.limit(500)] });

    for (const doc of allUsers.documents) {
      const currentRol: string = doc.rol || "";
      // Solo migrar si el valor NO es ya compacto (no está en ROL_MAP keys)
      const isAlreadyCompact = Object.keys(ROL_MAP).includes(currentRol);
      if (!isAlreadyCompact && currentRol) {
        const compact = ROL_REVERSE[currentRol];
        if (compact && compact !== currentRol) {
          try {
            await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_USERS_COLLECTION_ID, documentId: doc.$id, data: { rol: compact } });
            result.usuariosMigrated++;
          } catch (err) {
            result.errors.push(`Usuario ${doc.$id} (${currentRol}): ${String(err)}`);
          }
        }
      }
    }
  } catch (err) {
    result.errors.push(`Error leyendo usuarios: ${String(err)}`);
  }

  // 2. Migrar estados en colección ausencias
  try {
    const allAusencias = await databases.listDocuments({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_COLLECTION_ID, queries: [Query.limit(500)] });

    for (const doc of allAusencias.documents) {
      const currentEstado: string = doc.estado || "";
      const isAlreadyCompact = Object.keys(ESTADO_MAP).includes(currentEstado);
      if (!isAlreadyCompact && currentEstado) {
        const compact = ESTADO_REVERSE[currentEstado];
        if (compact && compact !== currentEstado) {
          try {
            await databases.updateDocument({ databaseId: APPWRITE_DB_ID, collectionId: APPWRITE_COLLECTION_ID, documentId: doc.$id, data: { estado: compact } });
            result.ausenciasMigrated++;
          } catch (err) {
            result.errors.push(`Ausencia ${doc.$id} (${currentEstado}): ${String(err)}`);
          }
        }
      }
    }
  } catch (err) {
    result.errors.push(`Error leyendo ausencias: ${String(err)}`);
  }

  // Limpiar caché tras la migración
  clearCache("usuarios");
  clearCache("ausencias");

  return result;
};

// ─── LOCALSTORAGE HELPERS PARA FALLBACK ──────────────────────────────────────
const getLocalStorageData = <T>(key: string, defaultVal: T, schoolId?: string): T => {
  if (typeof window === "undefined") return defaultVal;
  try {
    const sId = getActiveSchoolId(schoolId);
    const val = localStorage.getItem(`escuelainfo_db_${sId}_${key}`);
    if (val) return JSON.parse(val);
    if (sId === DEFAULT_SCHOOL_ID) {
      const legacyVal = localStorage.getItem("escuelainfo_db_" + key);
      if (legacyVal) return JSON.parse(legacyVal);
    }
    return defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalStorageData = (key: string, data: any, schoolId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const sId = getActiveSchoolId(schoolId);
    localStorage.setItem(`escuelainfo_db_${sId}_${key}`, JSON.stringify(data));
    if (sId === DEFAULT_SCHOOL_ID) {
      localStorage.setItem("escuelainfo_db_" + key, JSON.stringify(data));
    }
  } catch {}
};

// ─── NUEVO: ASISTENCIAS JORNADA (PRECEPTOR) ──────────────────────────────────
export const getAsistenciasJornada = async (fecha: string, schoolId?: string): Promise<AsistenciaJornada[]> => {
  const sId = getActiveSchoolId(schoolId);
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
      queries: [
        Query.equal("schoolId", sId),
        Query.equal("fecha", fecha),
        Query.limit(DEFAULT_LIMIT)
      ]
    });
    return response.documents.map(doc => ({
      id: doc.$id,
      alumnoId: doc.alumnoId,
      alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha,
      estado: doc.estado as any,
      preceptorId: doc.preceptorId,
      schoolId: doc.schoolId || sId,
    }));
  } catch (err: any) {
    devLog("getAsistenciasJornada (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaJornada[]>("asistencias_jornada", [], sId);
    return local.filter(a => a.fecha === fecha);
  }
};

export const getAllAsistenciasJornada = async (limit = 1000, schoolId?: string): Promise<AsistenciaJornada[]> => {
  const sId = getActiveSchoolId(schoolId);
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
      queries: [
        Query.equal("schoolId", sId),
        Query.limit(limit),
        Query.orderDesc("fecha")
      ]
    });
    return response.documents.map(doc => ({
      id: doc.$id,
      alumnoId: doc.alumnoId,
      alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha,
      estado: doc.estado as any,
      preceptorId: doc.preceptorId,
      schoolId: doc.schoolId || sId,
    }));
  } catch (err: any) {
    devLog("getAllAsistenciasJornada (LocalStorage fallback)", err);
    return getLocalStorageData<AsistenciaJornada[]>("asistencias_jornada", [], sId);
  }
};

export const saveAsistenciasJornada = async (asistencias: AsistenciaJornada[], schoolId?: string) => {
  await requireAuth();
  const defaultSchool = getActiveSchoolId(schoolId);
  for (const a of asistencias) {
    const sId = a.schoolId || defaultSchool;
    try {
      if (a.id && !a.id.startsWith("LOCAL_")) {
        await databases.updateDocument({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
          documentId: a.id,
          data: {
            alumnoId: sanitize(a.alumnoId, 50),
            alumnoNombre: sanitize(a.alumnoNombre, 200),
            fecha: sanitize(a.fecha, 20),
            estado: a.estado,
            preceptorId: sanitize(a.preceptorId, 50),
            schoolId: sId,
          }
        });
      } else {
        // Buscar si ya existe un registro para este alumno y fecha para actualizarlo
        const existingDocs = await databases.listDocuments({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
          queries: [
            Query.equal("schoolId", sId),
            Query.equal("alumnoId", sanitize(a.alumnoId, 50)),
            Query.equal("fecha", sanitize(a.fecha, 20)),
            Query.limit(1)
          ]
        });

        if (existingDocs.total > 0 && existingDocs.documents[0]) {
          await databases.updateDocument({
            databaseId: APPWRITE_DB_ID,
            collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
            documentId: existingDocs.documents[0].$id,
            data: {
              alumnoNombre: sanitize(a.alumnoNombre, 200),
              estado: a.estado,
              preceptorId: sanitize(a.preceptorId, 50),
              schoolId: sId,
            }
          });
          a.id = existingDocs.documents[0].$id;
        } else {
          const created = await databases.createDocument({
            databaseId: APPWRITE_DB_ID,
            collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
            documentId: ID.unique(),
            data: {
              alumnoId: sanitize(a.alumnoId, 50),
              alumnoNombre: sanitize(a.alumnoNombre, 200),
              fecha: sanitize(a.fecha, 20),
              estado: a.estado,
              preceptorId: sanitize(a.preceptorId, 50),
              schoolId: sId,
            }
          });
          a.id = created.$id;
        }
      }
    } catch (err: any) {
      devLog("saveAsistenciaJornada/item (LocalStorage fallback)", err);
      const local = getLocalStorageData<AsistenciaJornada[]>("asistencias_jornada", [], sId);
      const existingIdx = local.findIndex(item => (a.id && item.id === a.id) || (item.alumnoId === a.alumnoId && item.fecha === a.fecha));
      if (existingIdx !== -1) {
        local[existingIdx] = { ...local[existingIdx], ...a, id: local[existingIdx].id, schoolId: sId };
      } else {
        const newRecord = { ...a, id: a.id || ("LOCAL_" + Math.random().toString(36).substr(2, 9)), schoolId: sId };
        local.push(newRecord);
        a.id = newRecord.id;
      }
      setLocalStorageData("asistencias_jornada", local, sId);
    }
  }
};

// ─── NUEVO: ASISTENCIAS MATERIA (PROFESOR) ───────────────────────────────────
export const getAsistenciasMateria = async (fecha: string, materia: string, curso: string, schoolId?: string): Promise<AsistenciaMateria[]> => {
  const sId = getActiveSchoolId(schoolId);
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID,
      queries: [
        Query.equal("schoolId", sId),
        Query.equal("fecha", fecha),
        Query.equal("materia", materia),
        Query.equal("curso", curso),
        Query.limit(DEFAULT_LIMIT)
      ]
    });
    return response.documents.map(doc => ({
      id: doc.$id,
      alumnoId: doc.alumnoId,
      alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha,
      materia: doc.materia,
      curso: doc.curso,
      estado: doc.estado as any,
      profesorId: doc.profesorId,
      schoolId: doc.schoolId || sId,
    }));
  } catch (err: any) {
    devLog("getAsistenciasMateria (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaMateria[]>("asistencias_materia", [], sId);
    return local.filter(a => a.fecha === fecha && a.materia === materia && a.curso === curso);
  }
};

export const saveAsistenciasMateria = async (asistencias: AsistenciaMateria[], schoolId?: string) => {
  await requireAuth();
  const defaultSchool = getActiveSchoolId(schoolId);
  for (const a of asistencias) {
    const sId = a.schoolId || defaultSchool;
    try {
      if (a.id && !a.id.startsWith("LOCAL_")) {
        await databases.updateDocument({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID,
          documentId: a.id,
          data: {
            alumnoId: sanitize(a.alumnoId, 50),
            alumnoNombre: sanitize(a.alumnoNombre, 200),
            fecha: sanitize(a.fecha, 20),
            materia: sanitize(a.materia, 100),
            curso: sanitize(a.curso, 50),
            estado: a.estado,
            profesorId: sanitize(a.profesorId, 50),
            schoolId: sId,
          }
        });
      } else {
        await databases.createDocument({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID,
          documentId: ID.unique(),
          data: {
            alumnoId: sanitize(a.alumnoId, 50),
            alumnoNombre: sanitize(a.alumnoNombre, 200),
            fecha: sanitize(a.fecha, 20),
            materia: sanitize(a.materia, 100),
            curso: sanitize(a.curso, 50),
            estado: a.estado,
            profesorId: sanitize(a.profesorId, 50),
            schoolId: sId,
          }
        });
      }
    } catch (err: any) {
      devLog("saveAsistenciasMateria/item (LocalStorage fallback)", err);
      const local = getLocalStorageData<AsistenciaMateria[]>("asistencias_materia", [], sId);
      if (a.id) {
        const idx = local.findIndex(item => item.id === a.id);
        if (idx !== -1) {
          local[idx] = { ...a, schoolId: sId };
        } else {
          local.push({ ...a, schoolId: sId });
        }
      } else {
        const newRecord = { ...a, id: "LOCAL_" + Math.random().toString(36).substr(2, 9), schoolId: sId };
        local.push(newRecord);
        a.id = newRecord.id;
      }
      setLocalStorageData("asistencias_materia", local, sId);
    }
  }
};

// ─── NUEVO: GET ALUMNO HISTORIAL (VISTA ALUMNO) ──────────────────────────────
export const getAlumnoHistorialAsistencia = async (
  alumnoId: string, 
  schoolId?: string, 
  secondaryId?: string
): Promise<{ jornada: AsistenciaJornada[], materia: AsistenciaMateria[] }> => {
  const sId = getActiveSchoolId(schoolId);
  let jornada: AsistenciaJornada[] = [];
  let materia: AsistenciaMateria[] = [];

  try {
    const queries = [
      Query.equal("schoolId", sId),
      Query.equal("alumnoId", alumnoId),
      Query.limit(DEFAULT_LIMIT)
    ];
    const resJornada = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
      queries
    });
    jornada = resJornada.documents.map(doc => ({
      id: doc.$id, alumnoId: doc.alumnoId, alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha, estado: doc.estado as any, preceptorId: doc.preceptorId,
      schoolId: doc.schoolId || sId,
    }));

    if (secondaryId && secondaryId !== alumnoId) {
      try {
        const resSec = await databases.listDocuments({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
          queries: [
            Query.equal("schoolId", sId),
            Query.equal("alumnoId", secondaryId),
            Query.limit(DEFAULT_LIMIT)
          ]
        });
        resSec.documents.forEach(doc => {
          if (!jornada.some(j => j.id === doc.$id || j.fecha === doc.fecha)) {
            jornada.push({
              id: doc.$id, alumnoId: doc.alumnoId, alumnoNombre: doc.alumnoNombre,
              fecha: doc.fecha, estado: doc.estado as any, preceptorId: doc.preceptorId,
              schoolId: doc.schoolId || sId,
            });
          }
        });
      } catch {}
    }
  } catch (err) {
    devLog("getAlumnoHistorialAsistencia/jornada (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaJornada[]>("asistencias_jornada", [], sId);
    jornada = local.filter(a => a.alumnoId === alumnoId || (secondaryId && a.alumnoId === secondaryId));
  }

  try {
    const resMateria = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID,
      queries: [
        Query.equal("schoolId", sId),
        Query.equal("alumnoId", alumnoId),
        Query.limit(DEFAULT_LIMIT)
      ]
    });
    materia = resMateria.documents.map(doc => ({
      id: doc.$id, alumnoId: doc.alumnoId, alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha, materia: doc.materia, curso: doc.curso,
      estado: doc.estado as any, profesorId: doc.profesorId,
      schoolId: doc.schoolId || sId,
    }));

    if (secondaryId && secondaryId !== alumnoId) {
      try {
        const resSec = await databases.listDocuments({
          databaseId: APPWRITE_DB_ID,
          collectionId: APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID,
          queries: [
            Query.equal("schoolId", sId),
            Query.equal("alumnoId", secondaryId),
            Query.limit(DEFAULT_LIMIT)
          ]
        });
        resSec.documents.forEach(doc => {
          if (!materia.some(m => m.id === doc.$id || (m.fecha === doc.fecha && m.materia === doc.materia))) {
            materia.push({
              id: doc.$id, alumnoId: doc.alumnoId, alumnoNombre: doc.alumnoNombre,
              fecha: doc.fecha, materia: doc.materia, curso: doc.curso,
              estado: doc.estado as any, profesorId: doc.profesorId,
              schoolId: doc.schoolId || sId,
            });
          }
        });
      } catch {}
    }
  } catch (err) {
    devLog("getAlumnoHistorialAsistencia/materia (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaMateria[]>("asistencias_materia", [], sId);
    materia = local.filter(a => a.alumnoId === alumnoId || (secondaryId && a.alumnoId === secondaryId));
  }

  return { jornada, materia };
};

/**
 * ⚡ Consolidación Automática de Inasistencias en la Base de Datos
 * Asienta oficialmente a todos los alumnos que no validaron su presente en días escolares
 */
export const consolidateAbsences = async (params?: { targetDate?: string; targetCurso?: string; schoolId?: string }) => {
  try {
    const sId = getActiveSchoolId(params?.schoolId);
    let jwt = "";
    try {
      const jwtRes = await account.createJWT();
      jwt = jwtRes.jwt;
    } catch {}

    const res = await fetch("/api/attendance/consolidate-absences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { "Authorization": `Bearer ${jwt}` } : {})
      },
      body: JSON.stringify({
        targetDate: params?.targetDate,
        targetCurso: params?.targetCurso,
        schoolId: sId
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al consolidar inasistencias");
    return data;
  } catch (err: any) {
    devLog("consolidateAbsences", err);
    throw err;
  }
};

// ─── NUEVO: GESTIÓN DE MESAS DE EXAMEN ────────────────────────────────────────
export const getMesasExamen = async (forceRefresh = false, schoolId?: string): Promise<MesaExamen[]> => {
  const sId = getActiveSchoolId(schoolId);
  let appwriteItems: MesaExamen[] = [];
  try {
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_MESAS_EXAMEN_COLLECTION_ID,
      queries: [Query.equal("schoolId", sId), Query.orderAsc("fecha"), Query.limit(DEFAULT_LIMIT)]
    });
    appwriteItems = response.documents.map(doc => ({
      id: doc.$id,
      fecha: doc.fecha || "",
      hora: doc.hora || "",
      materia: doc.materia || "",
      aula: doc.aula || "",
      presidenteId: doc.presidenteId || "",
      presidenteNombre: doc.presidenteNombre || "Presidente",
      vocal1Id: doc.vocal1Id || undefined,
      vocal1Nombre: doc.vocal1Nombre || undefined,
      vocal2Id: doc.vocal2Id || undefined,
      vocal2Nombre: doc.vocal2Nombre || undefined,
      alumnosInscriptos: Array.isArray(doc.alumnosInscriptos) ? doc.alumnosInscriptos : [],
      estado: (doc.estado as any) || "borrador",
      schoolId: doc.schoolId || sId,
    }));
  } catch (err: any) {
    devLog("getMesasExamen (LocalStorage fallback)", err);
  }

  // Merge with localStorage so that any locally saved mesas are ALWAYS visible and never lost
  const localItems = getLocalStorageData<MesaExamen[]>("mesas_examen", [], sId);
  const combinedMap = new Map<string, MesaExamen>();

  // Add Appwrite items first
  appwriteItems.forEach(item => {
    if (item.id) combinedMap.set(item.id, item);
  });

  // Add local items (offline or local fallback) if not already present from Appwrite
  localItems.forEach(item => {
    if (item.id && !combinedMap.has(item.id)) {
      combinedMap.set(item.id, item);
    }
  });

  const finalMesas = Array.from(combinedMap.values());
  finalMesas.sort((a, b) => {
    const dateCmp = (a.fecha || "").localeCompare(b.fecha || "");
    if (dateCmp !== 0) return dateCmp;
    return (a.hora || "").localeCompare(b.hora || "");
  });

  return finalMesas;
};

export const saveMesaExamen = async (m: MesaExamen, schoolId?: string) => {
  await requireAuth();
  const sId = m.schoolId || getActiveSchoolId(schoolId);
  const local = getLocalStorageData<MesaExamen[]>("mesas_examen", [], sId);
  let assignedId = m.id;

  const payload = {
    fecha: sanitize(m.fecha, 20),
    hora: sanitize(m.hora, 10),
    materia: sanitize(m.materia, 100),
    aula: sanitize(m.aula, 50),
    presidenteId: sanitize(m.presidenteId, 50),
    presidenteNombre: sanitize(m.presidenteNombre, 200),
    vocal1Id: sanitize(m.vocal1Id || "", 50),
    vocal1Nombre: sanitize(m.vocal1Nombre || "", 200),
    vocal2Id: sanitize(m.vocal2Id || "", 50),
    vocal2Nombre: sanitize(m.vocal2Nombre || "", 200),
    alumnosInscriptos: (m.alumnosInscriptos || []).map(a => sanitize(a, 100)),
    estado: m.estado || "borrador",
    schoolId: sId,
  };

  try {
    if (m.id && !m.id.startsWith("LOCAL_")) {
      const res = await databases.updateDocument({
        databaseId: APPWRITE_DB_ID,
        collectionId: APPWRITE_MESAS_EXAMEN_COLLECTION_ID,
        documentId: m.id,
        data: payload
      });
      assignedId = res.$id;
    } else {
      const res = await databases.createDocument({
        databaseId: APPWRITE_DB_ID,
        collectionId: APPWRITE_MESAS_EXAMEN_COLLECTION_ID,
        documentId: ID.unique(),
        data: payload
      });
      assignedId = res.$id;
    }
  } catch (err: any) {
    devLog("saveMesaExamen (LocalStorage fallback)", err);
    if (!assignedId) {
      assignedId = "LOCAL_" + Math.random().toString(36).substr(2, 9);
    }
  }

  // Always update local storage so it's guaranteed to be available instantly
  const savedItem: MesaExamen = { ...m, ...payload, id: assignedId, schoolId: sId };
  const existingIdx = local.findIndex(item => item.id === assignedId || (m.id && item.id === m.id));
  if (existingIdx !== -1) {
    local[existingIdx] = savedItem;
  } else {
    local.unshift(savedItem);
  }
  setLocalStorageData("mesas_examen", local, sId);

  return { $id: assignedId, ...savedItem };
};

export const deleteMesaExamen = async (id: string, schoolId?: string) => {
  await requireAuth();
  const sId = getActiveSchoolId(schoolId);
  try {
    if (!id.startsWith("LOCAL_")) {
      await databases.deleteDocument({
        databaseId: APPWRITE_DB_ID,
        collectionId: APPWRITE_MESAS_EXAMEN_COLLECTION_ID,
        documentId: id
      });
    }
  } catch (err: any) {
    devLog("deleteMesaExamen (LocalStorage fallback)", err);
  } finally {
    const local = getLocalStorageData<MesaExamen[]>("mesas_examen", [], sId);
    const filtered = local.filter(m => m.id !== id);
    setLocalStorageData("mesas_examen", filtered, sId);
  }
};

// ─── STORAGE CERTIFICADOS ───────────────────────────────────────────────────
export const uploadCertificateFile = async (file: File): Promise<string> => {
  try {
    // 🛡️ SECURITY AUDIT REF: Storage & File Upload Vulnerability Protection
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error("SECURITY_BLOCK: Invalid file type. Only JPG, PNG, WEBP, or PDF are allowed.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("SECURITY_BLOCK: File size exceeds the 5MB limit.");
    }

    // 🛡️ SECURITY AUDIT REF: Broken Access Control Protection
    // BLOCKED: Automatically creating anonymous sessions allows attackers to upload unrestricted files.
    // Must strictly validate an authenticated user exists before allowing storage operations.
    const user = await account.get();
    if (!user) {
       throw new Error("SECURITY_BLOCK: Unauthorized. Anonymous uploads are strictly forbidden.");
    }

    const response = await storage.createFile({ bucketId: APPWRITE_BUCKET_ID, fileId: ID.unique(), file: file });
    return response.$id;
  } catch (err: any) {
    // 🛡️ SECURITY AUDIT REF: Security Misconfiguration - Obfuscate internal error details
    devLog("uploadCertificateFile_Error", "Upload blocked or failed.");
    throw new Error("Ocurrió un error de seguridad al subir el archivo.");
  }
};

export const deleteCertificateFile = async (fileId: string): Promise<boolean> => {
  try {
    await storage.deleteFile(APPWRITE_BUCKET_ID, fileId);
    return true;
  } catch (err) {
    devLog("deleteCertificateFile", err);
    return false;
  }
};

export const getCertificateFileUrl = (fileId: string): string => {
  if (!fileId) return "";
  try {
    const res = storage.getFileView({ bucketId: APPWRITE_BUCKET_ID, fileId: fileId });
    return typeof res === "string" ? res : (res as any).href || String(res);
  } catch (err) {
    devLog("getCertificateFileUrl", err);
    return "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUSPENSIONES EDILICIAS
// ─────────────────────────────────────────────────────────────────────────────

export interface SuspensionEdilicia {
  id: string;
  fecha: string; // YYYY-MM-DD
  motivo: string;
  schoolId?: string;
}

export const getSuspensiones = async (schoolId?: string): Promise<SuspensionEdilicia[]> => {
  const sId = getActiveSchoolId(schoolId);
  return getLocalStorageData<SuspensionEdilicia[]>("suspensiones_edilicias", [], sId);
};

export const saveSuspension = async (suspension: SuspensionEdilicia, schoolId?: string) => {
  const sId = suspension.schoolId || getActiveSchoolId(schoolId);
  const current = getLocalStorageData<SuspensionEdilicia[]>("suspensiones_edilicias", [], sId);
  current.push({ ...suspension, schoolId: sId });
  setLocalStorageData("suspensiones_edilicias", current, sId);
};

export const deleteSuspension = async (id: string, schoolId?: string) => {
  const sId = getActiveSchoolId(schoolId);
  let current = getLocalStorageData<SuspensionEdilicia[]>("suspensiones_edilicias", [], sId);
  current = current.filter(s => s.id !== id);
  setLocalStorageData("suspensiones_edilicias", current, sId);
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICACIONES INTERNAS DEL SISTEMA (EN TIEMPO REAL CON APPWRITE Y WEBSOCKETS)
// ─────────────────────────────────────────────────────────────────────────────

export type NotificacionTipo = 
  | "licencia_preceptor_aprobada" 
  | "cobertura_asignada" 
  | "aviso_general" 
  | "inasistencia_docente" 
  | "nuevo_usuario_pendiente" 
  | "rol_actualizado";

export interface NotificacionSistema {
  id: string;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  destinatarioRol?: "directivo" | "admin" | "preceptor" | "profesor" | "preceptor_profesor" | "alumno" | "todos";
  destinatarioEmail?: string;
  destinatarioId?: string;
  leida: boolean;
  fecha: string;
  metadata?: Record<string, any>;
  schoolId?: string;
}

/**
 * Consulta síncrona en memoria/localStorage para carga instantánea de UI.
 */
export const getCachedNotificaciones = (userEmail?: string, userRole?: string, schoolId?: string): NotificacionSistema[] => {
  const sId = getActiveSchoolId(schoolId);
  const all = getLocalStorageData<NotificacionSistema[]>("notificaciones_sistema", [], sId);
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const cleanRole = fromDbRol(userRole || "").trim().toLowerCase();
  const isPreceptorUser = cleanRole === "preceptor" || cleanRole === "preceptor_profesor";
  const isProfesorUser = cleanRole === "profesor" || cleanRole === "preceptor_profesor";

  return all.filter((n) => {
    // 🛡️ REGLA DE PRIVACIDAD ESTRICTA (Ley 25.326 de Protección de Datos Personales):
    // Los alumnos nunca deben recibir alertas de licencias, inasistencias docentes o gestión de personal
    if (cleanRole === "alumno") {
      if (
        n.tipo === "inasistencia_docente" ||
        n.tipo === "licencia_preceptor_aprobada" ||
        n.tipo === "cobertura_asignada" ||
        n.tipo === "nuevo_usuario_pendiente"
      ) {
        return false;
      }
      if ((!n.destinatarioRol || n.destinatarioRol === "todos") && n.tipo !== "aviso_general") {
        return false;
      }
    }

    if (n.destinatarioEmail && cleanEmail && n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
    if (n.destinatarioEmail && cleanEmail && n.destinatarioEmail.trim().toLowerCase() !== cleanEmail) return false;
    if (!n.destinatarioRol || n.destinatarioRol === "todos") return true;
    if (n.destinatarioRol === "directivo" && (cleanRole === "directivo" || cleanRole === "admin")) return true;
    if (n.destinatarioRol === "admin" && cleanRole === "admin") return true;
    if (n.destinatarioRol === "preceptor" && isPreceptorUser) {
      if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
    }
    if (n.destinatarioRol === "profesor" && isProfesorUser) {
      if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
    }
    if (n.destinatarioRol === "preceptor_profesor" && cleanRole === "preceptor_profesor") {
      if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
    }
    if (n.destinatarioRol === "alumno" && cleanRole === "alumno") {
      if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
    }
    return false;
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

/**
 * Obtiene las notificaciones activas desde Appwrite Databases con fallback a caché local.
 */
export const getNotificaciones = async (userEmail?: string, userRole?: string, schoolId?: string): Promise<NotificacionSistema[]> => {
  const sId = getActiveSchoolId(schoolId);
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const cleanRole = fromDbRol(userRole || "").trim().toLowerCase();
  const isPreceptorUser = cleanRole === "preceptor" || cleanRole === "preceptor_profesor";
  const isProfesorUser = cleanRole === "profesor" || cleanRole === "preceptor_profesor";

  try {
    const res = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_NOTIFS_COLLECTION_ID,
      queries: [
        Query.equal("schoolId", sId),
        Query.orderDesc("fecha"),
        Query.limit(100)
      ]
    });

    const notifs: NotificacionSistema[] = res.documents.map((doc: any) => ({
      id: doc.$id,
      tipo: doc.tipo as NotificacionTipo,
      titulo: doc.titulo,
      mensaje: doc.mensaje,
      destinatarioRol: doc.destinatarioRol,
      destinatarioEmail: doc.destinatarioEmail,
      destinatarioId: doc.destinatarioId,
      leida: !!doc.leida,
      fecha: doc.fecha,
      metadata: doc.metadata ? (typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata) : undefined,
      schoolId: doc.schoolId || sId,
    }));

    const filtered = notifs.filter((n) => {
      // 🛡️ REGLA DE PRIVACIDAD ESTRICTA (Ley 25.326 de Protección de Datos Personales):
      // Los alumnos nunca deben recibir alertas de licencias, inasistencias docentes o gestión de personal
      if (cleanRole === "alumno") {
        if (
          n.tipo === "inasistencia_docente" ||
          n.tipo === "licencia_preceptor_aprobada" ||
          n.tipo === "cobertura_asignada" ||
          n.tipo === "nuevo_usuario_pendiente"
        ) {
          return false;
        }
        if ((!n.destinatarioRol || n.destinatarioRol === "todos") && n.tipo !== "aviso_general") {
          return false;
        }
      }

      if (n.destinatarioEmail && cleanEmail && n.destinatarioEmail.trim().toLowerCase() === cleanEmail) {
        return true;
      }
      if (n.destinatarioEmail && cleanEmail && n.destinatarioEmail.trim().toLowerCase() !== cleanEmail) {
        return false;
      }
      if (!n.destinatarioRol || n.destinatarioRol === "todos") {
        return true;
      }
      if (n.destinatarioRol === "directivo" && (cleanRole === "directivo" || cleanRole === "admin")) {
        return true;
      }
      if (n.destinatarioRol === "admin" && cleanRole === "admin") {
        return true;
      }
      if (n.destinatarioRol === "preceptor" && isPreceptorUser) {
        if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
      }
      if (n.destinatarioRol === "profesor" && isProfesorUser) {
        if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
      }
      if (n.destinatarioRol === "preceptor_profesor" && cleanRole === "preceptor_profesor") {
        if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
      }
      if (n.destinatarioRol === "alumno" && cleanRole === "alumno") {
        if (!n.destinatarioEmail || n.destinatarioEmail.trim().toLowerCase() === cleanEmail) return true;
      }
      return false;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    setLocalStorageData("notificaciones_sistema", filtered, sId);
    return filtered;
  } catch (err) {
    devLog("getNotificaciones", err);
    return getCachedNotificaciones(userEmail, userRole, sId);
  }
};

/**
 * Guarda una nueva notificación en la base de datos de Appwrite y la difunde en tiempo real.
 */
export const saveNotificacion = async (
  notif: Omit<NotificacionSistema, "id" | "fecha" | "leida">,
  schoolId?: string
): Promise<NotificacionSistema> => {
  const sId = (notif as any).schoolId || getActiveSchoolId(schoolId);
  const newNotif: NotificacionSistema = {
    ...notif,
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    leida: false,
    fecha: new Date().toISOString(),
    schoolId: sId,
  };

  try {
    const doc = await databases.createDocument({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_NOTIFS_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        tipo: notif.tipo,
        titulo: sanitize(notif.titulo, 250),
        mensaje: sanitize(notif.mensaje, 1000),
        destinatarioRol: notif.destinatarioRol || "todos",
        destinatarioEmail: notif.destinatarioEmail ? notif.destinatarioEmail.trim().toLowerCase() : "",
        destinatarioId: notif.destinatarioId || "",
        leida: false,
        fecha: newNotif.fecha,
        metadata: notif.metadata ? JSON.stringify(notif.metadata) : "",
        schoolId: sId,
      }
    });
    newNotif.id = doc.$id;
  } catch (err) {
    devLog("saveNotificacion/appwrite", err);
  }

  // Actualizar backup en caché local
  const all = getLocalStorageData<NotificacionSistema[]>("notificaciones_sistema", [], sId);
  all.unshift(newNotif);
  setLocalStorageData("notificaciones_sistema", all, sId);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("escuelainfo:notificaciones-updated", { detail: newNotif }));
      const bc = new BroadcastChannel("escuelainfo-realtime");
      bc.postMessage({ type: "notificaciones", notif: newNotif, timestamp: Date.now() });
      bc.close();
    } catch {}
  }

  return newNotif;
};

/**
 * Suscripción en Tiempo Real con Appwrite WebSockets para notificaciones instantáneas.
 */
export const subscribeToNotificaciones = (
  userEmail: string | undefined,
  userRole: string | undefined,
  callback: (data: NotificacionSistema[], newArrival?: NotificacionSistema) => void,
  schoolId?: string
) => {
  let isSubscribed = true;
  let retryTimeout: NodeJS.Timeout | null = null;

  // Entrega inmediata desde caché para visualización instantánea sin latencia
  const initialCache = getCachedNotificaciones(userEmail, userRole, schoolId);
  if (initialCache.length > 0) {
    callback(initialCache);
  }

  const fetchNotifs = async (newArrival?: NotificacionSistema) => {
    try {
      const data = await getNotificaciones(userEmail, userRole, schoolId);
      if (isSubscribed) {
        // Solo propagar newArrival si superó la validación y autorización para este usuario
        const validArrival = newArrival && data.some(n => n.id === newArrival.id) ? newArrival : undefined;
        callback(data, validArrival);
      }
    } catch (err) {
      devLog("subscribeToNotificaciones/fetch", err);
    }
  };

  fetchNotifs();

  // Suscripción WebSocket oficial de Appwrite Realtime
  const unsubscribeAppwrite = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_NOTIFS_COLLECTION_ID}.documents`,
    (response: any) => {
      let incoming: NotificacionSistema | undefined;
      if (response?.payload) {
        const doc = response.payload;
        incoming = {
          id: doc.$id,
          tipo: doc.tipo as NotificacionTipo,
          titulo: doc.titulo,
          mensaje: doc.mensaje,
          destinatarioRol: doc.destinatarioRol,
          destinatarioEmail: doc.destinatarioEmail,
          destinatarioId: doc.destinatarioId,
          leida: !!doc.leida,
          fecha: doc.fecha,
          metadata: doc.metadata ? (typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata) : undefined,
          schoolId: doc.schoolId || getActiveSchoolId(schoolId),
        };
      }
      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => {
        if (isSubscribed) fetchNotifs(incoming);
      }, 250);
    }
  );

  // Evento local en la misma pestaña y cambio de escuela activa
  const handleLocal = (e: Event) => {
    const customEvent = e as CustomEvent<NotificacionSistema>;
    if (isSubscribed) fetchNotifs(customEvent.detail);
  };
  const handleSchoolChange = () => {
    if (isSubscribed) fetchNotifs();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("escuelainfo:notificaciones-updated", handleLocal);
    window.addEventListener("escuelainfo:school-changed", handleSchoolChange);
  }

  // BroadcastChannel entre pestañas abiertas
  let bc: BroadcastChannel | null = null;
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    try {
      bc = new BroadcastChannel("escuelainfo-realtime");
      bc.onmessage = (event) => {
        if (event.data?.type === "notificaciones" && isSubscribed) {
          fetchNotifs(event.data.notif);
        }
      };
    } catch {}
  }

  // Polling de seguridad de alta resiliencia cada 10 segundos
  const interval = setInterval(() => {
    if (isSubscribed) fetchNotifs();
  }, 10000);

  // Sincronización al regresar a la ventana
  const handleFocus = () => {
    if (isSubscribed) fetchNotifs();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && isSubscribed) fetchNotifs();
    });
  }

  return () => {
    isSubscribed = false;
    if (retryTimeout) clearTimeout(retryTimeout);
    clearInterval(interval);
    unsubscribeAppwrite();
    if (typeof window !== "undefined") {
      window.removeEventListener("escuelainfo:notificaciones-updated", handleLocal);
      window.removeEventListener("escuelainfo:school-changed", handleSchoolChange);
      window.removeEventListener("focus", handleFocus);
    }
    if (bc) {
      try { bc.close(); } catch {}
    }
  };
};

/**
 * Marca una notificación individual como leída en Appwrite y en local.
 */
export const markNotificacionAsRead = async (id: string, schoolId?: string) => {
  const sId = getActiveSchoolId(schoolId);
  try {
    if (!id.startsWith("notif_")) {
      await databases.updateDocument({
        databaseId: APPWRITE_DB_ID,
        collectionId: APPWRITE_NOTIFS_COLLECTION_ID,
        documentId: id,
        data: { leida: true }
      });
    }
  } catch (err) {
    devLog("markNotificacionAsRead", err);
  }

  const all = getLocalStorageData<NotificacionSistema[]>("notificaciones_sistema", [], sId);
  const updated = all.map(n => n.id === id ? { ...n, leida: true } : n);
  setLocalStorageData("notificaciones_sistema", updated, sId);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("escuelainfo:notificaciones-updated"));
      const bc = new BroadcastChannel("escuelainfo-realtime");
      bc.postMessage({ type: "notificaciones", timestamp: Date.now(), schoolId: sId });
      bc.close();
    } catch {}
  }
};

/**
 * Marca todas las notificaciones del usuario como leídas.
 */
export const markAllNotificacionesAsRead = async (userEmail?: string, userRole?: string, schoolId?: string) => {
  const sId = getActiveSchoolId(schoolId);
  try {
    const current = await getNotificaciones(userEmail, userRole, sId);
    const unread = current.filter(n => !n.leida);

    Promise.all(
      unread.map(n => {
        if (!n.id.startsWith("notif_")) {
          return databases.updateDocument({
            databaseId: APPWRITE_DB_ID,
            collectionId: APPWRITE_NOTIFS_COLLECTION_ID,
            documentId: n.id,
            data: { leida: true }
          }).catch(() => {});
        }
        return Promise.resolve();
      })
    ).catch(() => {});
  } catch {}

  const all = getLocalStorageData<NotificacionSistema[]>("notificaciones_sistema", [], sId);
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const cleanRole = fromDbRol(userRole || "").trim().toLowerCase();

  const updated = all.map(n => {
    let belongs = false;
    if (n.destinatarioEmail && cleanEmail && n.destinatarioEmail.trim().toLowerCase() === cleanEmail) belongs = true;
    if (!n.destinatarioRol || n.destinatarioRol === "todos") belongs = true;
    if (n.destinatarioRol === "directivo" && (cleanRole === "directivo" || cleanRole === "admin")) belongs = true;
    if (n.destinatarioRol === "admin" && cleanRole === "admin") belongs = true;
    if (n.destinatarioRol === "preceptor" && (cleanRole === "preceptor" || cleanRole === "preceptor_profesor")) belongs = true;
    if (n.destinatarioRol === "profesor" && (cleanRole === "profesor" || cleanRole === "preceptor_profesor")) belongs = true;
    if (n.destinatarioRol === "preceptor_profesor" && cleanRole === "preceptor_profesor") belongs = true;
    if (n.destinatarioRol === "alumno" && cleanRole === "alumno") belongs = true;
    if (belongs) return { ...n, leida: true };
    return n;
  });

  setLocalStorageData("notificaciones_sistema", updated, sId);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("escuelainfo:notificaciones-updated"));
      const bc = new BroadcastChannel("escuelainfo-realtime");
      bc.postMessage({ type: "notificaciones", timestamp: Date.now(), schoolId: sId });
      bc.close();
    } catch {}
  }
};

/**
 * Elimina una notificación del sistema.
 */
export const deleteNotificacion = async (id: string, schoolId?: string) => {
  const sId = getActiveSchoolId(schoolId);
  try {
    if (!id.startsWith("notif_")) {
      await databases.deleteDocument({
        databaseId: APPWRITE_DB_ID,
        collectionId: APPWRITE_NOTIFS_COLLECTION_ID,
        documentId: id
      });
    }
  } catch (err) {
    devLog("deleteNotificacion", err);
  }

  const all = getLocalStorageData<NotificacionSistema[]>("notificaciones_sistema", [], sId);
  const updated = all.filter(n => n.id !== id);
  setLocalStorageData("notificaciones_sistema", updated, sId);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("escuelainfo:notificaciones-updated"));
      const bc = new BroadcastChannel("escuelainfo-realtime");
      bc.postMessage({ type: "notificaciones", timestamp: Date.now(), schoolId: sId });
      bc.close();
    } catch {}
  }
};
