import { databases, appwriteClient, APPWRITE_DB_ID, APPWRITE_COLLECTION_ID } from "./appwrite";
import { ID, Query } from "appwrite";

// ─── Logger solo en desarrollo ───────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== "production";
const devLog = (ctx: string, err?: unknown) => {
  if (isDev) console.error(`[EscuelaInfo/${ctx}]`, err ?? "");
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

const DEFAULT_LIMIT = 200;

// ─── Caché Client-Side para Optimizar Appwrite ─────────────────────────────────
const CACHE_KEY_PREFIX = "escuelainfo_cache_";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos (evita lecturas excesivas en Appwrite)

const getCachedData = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY_PREFIX + key);
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

const setCachedData = (key: string, data: any) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CACHE_KEY_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
};

export const clearCache = (key: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CACHE_KEY_PREFIX + key);
};

// ─── DB Simplification Mappings ──────────────────────────────────────────────
const ROL_MAP: Record<string, string> = {
  "a": "alumno",
  "ad": "admin",
  "p": "profesor",
  "pp": "preceptor",
  "d": "directivo",
  "p_a": "pendiente_alumno",
  "p_p": "pendiente_profesor"
};
const ROL_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(ROL_MAP).map(([k, v]) => [v, k]));

const ESTADO_MAP: Record<string, string> = {
  "ap": "aprobada",
  "pe": "pendiente",
  "re": "rechazada"
};
const ESTADO_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(ESTADO_MAP).map(([k, v]) => [v, k]));

export const toDbRol = (r: string) => ROL_REVERSE[r] || r;
export const fromDbRol = (r: string) => ROL_MAP[r] || r;
export const toDbEstado = (e: string) => ESTADO_REVERSE[e] || e;
export const fromDbEstado = (e: string) => ESTADO_MAP[e] || e;

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
  estado: "pendiente" | "aprobada" | "rechazada";
  fechaReg: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  nombre: string;
  rol: string;
  telefono?: string;
  direccion?: string;
}

export interface Curso {
  id?: string;
  nombre: string;
}

export interface Profesor {
  id?: string;
  nombre: string;
  dni: string;
  materias: string[];
  email: string;
}

export interface Horario {
  id?: string;
  dia: string;
  hora: string;
  materia: string;
  profesor: string;
  curso: string;
}

export interface Alumno {
  id?: string;
  nombre: string;
  dni: string;
  curso: string;
  email: string;
}

// ─── HORARIOS ────────────────────────────────────────────────────────────────
export const getHorarios = async (forceRefresh = false): Promise<Horario[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Horario[]>("horarios");
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_HORARIOS_COLLECTION_ID,
      [Query.limit(DEFAULT_LIMIT)]
    );
    const data = response.documents.map(doc => {
      // Map numeric day values to display strings
      let dayName = doc.dia;
      if (doc.dia === "1") dayName = "Lunes";
      else if (doc.dia === "2") dayName = "Martes";
      else if (doc.dia === "3") dayName = "Miércoles";
      else if (doc.dia === "4") dayName = "Jueves";
      else if (doc.dia === "5") dayName = "Viernes";

      return {
        id: doc.$id, dia: dayName, hora: doc.hora,
        materia: doc.materia, profesor: doc.profesor, curso: doc.curso
      };
    });
    setCachedData("horarios", data);
    return data;
  } catch (err) { devLog("getHorarios", err); return []; }
};

export const saveHorario = async (h: Horario) => {
  clearCache("horarios");
  
  // Map day name to digit string for saving space in database
  let dayCode = h.dia;
  if (h.dia === "Lunes") dayCode = "1";
  else if (h.dia === "Martes") dayCode = "2";
  else if (h.dia === "Miércoles") dayCode = "3";
  else if (h.dia === "Jueves") dayCode = "4";
  else if (h.dia === "Viernes") dayCode = "5";

  return await databases.createDocument(
    APPWRITE_DB_ID, APPWRITE_HORARIOS_COLLECTION_ID, ID.unique(), {
      dia: dayCode,
      hora: h.hora,
      materia: h.materia,
      profesor: h.profesor,
      curso: h.curso
    }
  );
};

export const deleteHorario = async (id: string) => {
  clearCache("horarios");
  return await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_HORARIOS_COLLECTION_ID, id);
};

// ─── ALUMNOS ─────────────────────────────────────────────────────────────────
export const getAlumnos = async (forceRefresh = false): Promise<Alumno[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Alumno[]>("alumnos");
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID,
      [Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    );
    const data = response.documents.map(doc => ({
      id: doc.$id, nombre: doc.nombre, dni: doc.dni, curso: doc.curso, email: doc.email
    }));
    setCachedData("alumnos", data);
    return data;
  } catch (err) { devLog("getAlumnos", err); return []; }
};

export const saveAlumno = async (a: Alumno) => {
  clearCache("alumnos");
  return await databases.createDocument(
    APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID, ID.unique(), {
      nombre: sanitize(a.nombre, 200),
      dni: sanitize(a.dni, 20),
      curso: sanitize(a.curso, 100),
      email: sanitize(a.email, 200),
    }
  );
};

export const deleteAlumno = async (id: string) => {
  clearCache("alumnos");
  return await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID, id);
};

export const updateAlumno = async (id: string, data: Partial<Alumno>) => {
  clearCache("alumnos");
  return await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID, id, data);
};

export const checkAlumnoDNI = async (dni: string): Promise<boolean> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID,
      [Query.equal("dni", sanitize(dni, 20))]
    );
    return response.documents.length > 0;
  } catch { return false; }
};

export const checkProfesorDNI = async (dni: string): Promise<boolean> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_PROFS_COLLECTION_ID,
      [Query.equal("dni", sanitize(dni, 20))]
    );
    return response.documents.length > 0;
  } catch { return false; }
};

// ─── PROFESORES ──────────────────────────────────────────────────────────────
export const getProfesores = async (forceRefresh = false): Promise<Profesor[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Profesor[]>("profesores");
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_PROFS_COLLECTION_ID,
      [Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    );
    const data = response.documents.map(doc => ({
      id: doc.$id, nombre: doc.nombre, dni: doc.dni, materias: doc.materias, email: doc.email
    }));
    setCachedData("profesores", data);
    return data;
  } catch (err) { devLog("getProfesores", err); return []; }
};

export const saveProfesor = async (p: Profesor) => {
  clearCache("profesores");
  return await databases.createDocument(
    APPWRITE_DB_ID, APPWRITE_PROFS_COLLECTION_ID, ID.unique(), {
      nombre: sanitize(p.nombre, 200),
      dni: sanitize(p.dni, 20),
      materias: p.materias.map(m => sanitize(m, 100)),
      email: sanitize(p.email, 200),
    }
  );
};

export const deleteProfesor = async (id: string) => {
  clearCache("profesores");
  return await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_PROFS_COLLECTION_ID, id);
};

export const updateProfesor = async (id: string, data: Partial<Profesor>) => {
  clearCache("profesores");
  const updateData = { ...data };
  if (updateData.materias) {
    updateData.materias = updateData.materias.map(m => sanitize(m, 100));
  }
  if (updateData.nombre) updateData.nombre = sanitize(updateData.nombre, 200);
  if (updateData.dni) updateData.dni = sanitize(updateData.dni, 20);
  if (updateData.email) updateData.email = sanitize(updateData.email, 200);
  return await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_PROFS_COLLECTION_ID, id, updateData);
};

// ─── AUDITORÍA ───────────────────────────────────────────────────────────────
export const logAction = async (usuarioEmail: string, accion: string, detalles: string) => {
  clearCache("logs");
  try {
    await databases.createDocument(
      APPWRITE_DB_ID, APPWRITE_LOGS_COLLECTION_ID, ID.unique(),
      {
        usuarioEmail: sanitize(usuarioEmail, 200),
        accion: sanitize(accion, 100),
        detalles: sanitize(detalles, 500),
        fecha: new Date().toISOString()
      }
    );
  } catch (err) { devLog("logAction", err); }
};

export const getLogs = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCachedData<any[]>("logs");
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_LOGS_COLLECTION_ID,
      [Query.orderDesc("fecha"), Query.limit(100)]
    );
    const data = response.documents;
    setCachedData("logs", data);
    return data;
  } catch (err) { devLog("getLogs", err); return []; }
};

// ─── USUARIOS / PERFILES ─────────────────────────────────────────────────────
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID,
      [Query.equal("uid", uid)]
    );
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return { ...doc, id: doc.$id, rol: fromDbRol(doc.rol) } as unknown as UserProfile;
    }
    return null;
  } catch (err) { devLog("getUserProfile", err); return null; }
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID,
      [Query.equal("email", sanitize(email, 200))]
    );
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return { ...doc, id: doc.$id, rol: fromDbRol(doc.rol) } as unknown as UserProfile;
    }
    return null;
  } catch { return null; }
};

export const getUsuarios = async (forceRefresh = false): Promise<UserProfile[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<UserProfile[]>("usuarios");
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID,
      [Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    );
    const data = response.documents.map(doc => ({
      id: doc.$id, uid: doc.uid, email: doc.email, nombre: doc.nombre, rol: fromDbRol(doc.rol)
    })) as unknown as UserProfile[];
    setCachedData("usuarios", data);
    return data;
  } catch (err) { devLog("getUsuarios", err); return []; }
};

export const updateUserProfile = async (id: string, data: Partial<UserProfile>) => {
  clearCache("usuarios");
  const updateData = { ...data };
  if (updateData.rol) updateData.rol = toDbRol(updateData.rol);
  return await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID, id, updateData);
};

export const syncUserEmailChange = async (oldEmail: string, newEmail: string, rol: string) => {
  if (rol === "profesor") {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DB_ID, APPWRITE_PROFS_COLLECTION_ID,
        [Query.equal("email", sanitize(oldEmail, 200))]
      );
      for (const doc of response.documents) {
        await databases.updateDocument(
          APPWRITE_DB_ID, APPWRITE_PROFS_COLLECTION_ID, doc.$id, { email: sanitize(newEmail, 200) }
        );
      }
      clearCache("profesores");
    } catch (err) {
      devLog("syncUserEmailChange/profesor", err);
    }
  }

  if (rol === "alumno") {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID,
        [Query.equal("email", sanitize(oldEmail, 200))]
      );
      for (const doc of response.documents) {
        await databases.updateDocument(
          APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID, doc.$id, { email: sanitize(newEmail, 200) }
        );
      }
      clearCache("alumnos");
    } catch (err) {
      devLog("syncUserEmailChange/alumno", err);
    }
  }
};

export const deleteUserProfile = async (id: string) => {
  clearCache("usuarios");
  return await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID, id);
};

export const createUserProfile = async (profile: UserProfile) => {
  clearCache("usuarios");
  try {
    const dataToSave = { ...profile, rol: toDbRol(profile.rol) };
    await databases.createDocument(
      APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID, ID.unique(), dataToSave
    );
  } catch (err) { devLog("createUserProfile", err); throw err; }
};

// ─── AUSENCIAS ───────────────────────────────────────────────────────────────
export const saveAusencia = async (ausencia: Ausencia) => {
  try {
    const response = await databases.createDocument(
      APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, ID.unique(),
      {
        profId: String(ausencia.profId),
        profNombre: sanitize(ausencia.profNombre, 200),
        tipo: sanitize(ausencia.tipo, 80),
        inicio: ausencia.inicio,
        fin: ausencia.fin,
        materias: ausencia.materias.map(m => sanitize(m, 100)),
        motivo: sanitize(ausencia.motivo, 500),
        cert: ausencia.cert,
        estado: toDbEstado(ausencia.estado),
        fechaReg: new Date().toISOString()
      }
    );
    return response.$id;
  } catch (err) { devLog("saveAusencia", err); throw err; }
};

export const subscribeToAusencias = (callback: (data: Ausencia[]) => void) => {
  const fetchAll = () =>
    databases.listDocuments(APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, [
      Query.orderDesc("inicio"),
      Query.limit(100)
    ]).then(response => {
      const ausencias = response.documents.map(doc => ({
        id: doc.$id, profId: doc.profId, profNombre: doc.profNombre,
        tipo: doc.tipo, inicio: doc.inicio, fin: doc.fin,
        materias: doc.materias, motivo: doc.motivo,
        cert: doc.cert, estado: fromDbEstado(doc.estado), fechaReg: doc.fechaReg
      })) as Ausencia[];
      callback(ausencias);
    }).catch(err => devLog("subscribeToAusencias/fetch", err));

  fetchAll();

  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_COLLECTION_ID}.documents`,
    () => fetchAll()
  );

  return () => unsubscribe();
};

export const updateAusenciaStatus = async (id: string, estado: "pendiente" | "aprobada" | "rechazada") => {
  try {
    await databases.updateDocument(
      APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, id, { estado: toDbEstado(estado) }
    );
  } catch (err) { devLog("updateAusenciaStatus", err); throw err; }
};

export const deleteAusencia = async (id: string) => {
  try {
    await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, id);
  } catch (err) { devLog("deleteAusencia", err); throw err; }
};

// ─── CURSOS ──────────────────────────────────────────────────────────────────
export const getCursos = async (forceRefresh = false): Promise<Curso[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Curso[]>("cursos");
    if (cached) return cached;
  }
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_CURSOS_COLLECTION_ID,
      [Query.orderAsc("nombre"), Query.limit(DEFAULT_LIMIT)]
    );
    const data = response.documents.map(doc => ({ id: doc.$id, nombre: doc.nombre })) as Curso[];
    setCachedData("cursos", data);
    return data;
  } catch (err) { devLog("getCursos", err); return []; }
};

export const saveCurso = async (curso: Omit<Curso, "id">) => {
  clearCache("cursos");
  try {
    await databases.createDocument(
      APPWRITE_DB_ID, APPWRITE_CURSOS_COLLECTION_ID, ID.unique(),
      { nombre: sanitize(curso.nombre, 100) }
    );
  } catch (err) { devLog("saveCurso", err); throw err; }
};

export const deleteCurso = async (id: string) => {
  clearCache("cursos");
  try {
    await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_CURSOS_COLLECTION_ID, id);
  } catch (err) { devLog("deleteCurso", err); throw err; }
};

export const checkCursoExists = async (nombre: string): Promise<boolean> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_CURSOS_COLLECTION_ID,
      [Query.equal("nombre", sanitize(nombre, 100))]
    );
    return response.documents.length > 0;
  } catch { return false; }
};

// ─── Migración de datos a formato compacto ───────────────────────────────────
export interface MigrationResult {
  usuariosMigrated: number;
  ausenciasMigrated: number;
  errors: string[];
}

export const migrateToCompactFormat = async (): Promise<MigrationResult> => {
  const result: MigrationResult = { usuariosMigrated: 0, ausenciasMigrated: 0, errors: [] };

  // 1. Migrar roles en colección usuarios
  try {
    const allUsers = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID,
      [Query.limit(500)]
    );

    for (const doc of allUsers.documents) {
      const currentRol: string = doc.rol || "";
      // Solo migrar si el valor NO es ya compacto (no está en ROL_MAP keys)
      const isAlreadyCompact = Object.keys(ROL_MAP).includes(currentRol);
      if (!isAlreadyCompact && currentRol) {
        const compact = ROL_REVERSE[currentRol];
        if (compact && compact !== currentRol) {
          try {
            await databases.updateDocument(
              APPWRITE_DB_ID, APPWRITE_USERS_COLLECTION_ID, doc.$id,
              { rol: compact }
            );
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
    const allAusencias = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_COLLECTION_ID,
      [Query.limit(500)]
    );

    for (const doc of allAusencias.documents) {
      const currentEstado: string = doc.estado || "";
      const isAlreadyCompact = Object.keys(ESTADO_MAP).includes(currentEstado);
      if (!isAlreadyCompact && currentEstado) {
        const compact = ESTADO_REVERSE[currentEstado];
        if (compact && compact !== currentEstado) {
          try {
            await databases.updateDocument(
              APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, doc.$id,
              { estado: compact }
            );
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
