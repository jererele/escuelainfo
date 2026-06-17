import { databases, appwriteClient, APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, APPWRITE_BUCKET_ID, storage } from "./appwrite";
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
const APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID = "asistencias_alumnos_jornada";
const APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID = "asistencias_alumnos_materia";
const APPWRITE_MESAS_EXAMEN_COLLECTION_ID = "mesas_examen";

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
  certFileId?: string;
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

export interface AsistenciaJornada {
  id?: string;
  alumnoId: string;
  alumnoNombre: string;
  fecha: string;
  estado: "P" | "A" | "M" | "T"; // P=Presente, A=Ausente, M=Media Falta, T=Tarde
  preceptorId: string;
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

export const promoteUserToRole = async (email: string, rol: UserProfile["rol"]) => {
  clearCache("usuarios");
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check if user profile already exists
  const existingProfile = await getUserProfileByEmail(cleanEmail);
  if (existingProfile?.id) {
    await updateUserProfile(existingProfile.id, { rol });
  } else {
    await createUserProfile({
      uid: "PENDING_" + ID.unique(),
      email: cleanEmail,
      nombre: "Pendiente",
      rol
    });
  }

  // 2. If promoted to a non-student role, remove from student list
  if (rol !== "alumno" && rol !== "pendiente_alumno") {
    clearCache("alumnos");
    try {
      const response = await databases.listDocuments(
        APPWRITE_DB_ID,
        APPWRITE_ALUMNOS_COLLECTION_ID,
        [Query.equal("email", cleanEmail)]
      );
      for (const doc of response.documents) {
        await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_ALUMNOS_COLLECTION_ID, doc.$id);
      }
    } catch (err) {
      devLog("promoteUserToRole - deleteAlumno", err);
    }
  }
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
        certFileId: ausencia.certFileId || "",
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
        cert: doc.cert, certFileId: doc.certFileId, estado: fromDbEstado(doc.estado), fechaReg: doc.fechaReg
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

export const subscribeToMesasExamen = (callback: (data: MesaExamen[]) => void) => {
  const fetchAll = () => getMesasExamen(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_MESAS_EXAMEN_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  return () => unsubscribe();
};

export const subscribeToUsuarios = (callback: (data: UserProfile[]) => void) => {
  const fetchAll = () => getUsuarios(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_USERS_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  return () => unsubscribe();
};

export const subscribeToAlumnos = (callback: (data: Alumno[]) => void) => {
  const fetchAll = () => getAlumnos(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_ALUMNOS_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  return () => unsubscribe();
};

export const subscribeToProfesores = (callback: (data: Profesor[]) => void) => {
  const fetchAll = () => getProfesores(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_PROFS_COLLECTION_ID}.documents`,
    () => fetchAll()
  );
  return () => unsubscribe();
};

export const subscribeToCursos = (callback: (data: Curso[]) => void) => {
  const fetchAll = () => getCursos(true).then(callback);
  fetchAll();
  const unsubscribe = appwriteClient.subscribe(
    `databases.${APPWRITE_DB_ID}.collections.${APPWRITE_CURSOS_COLLECTION_ID}.documents`,
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

// ─── LOCALSTORAGE HELPERS PARA FALLBACK ──────────────────────────────────────
const getLocalStorageData = <T>(key: string, defaultVal: T): T => {
  if (typeof window === "undefined") return defaultVal;
  try {
    const val = localStorage.getItem("escuelainfo_db_" + key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalStorageData = (key: string, data: any) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("escuelainfo_db_" + key, JSON.stringify(data));
  } catch {}
};

// ─── NUEVO: ASISTENCIAS JORNADA (PRECEPTOR) ──────────────────────────────────
export const getAsistenciasJornada = async (fecha: string): Promise<AsistenciaJornada[]> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
      [Query.equal("fecha", fecha), Query.limit(DEFAULT_LIMIT)]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      alumnoId: doc.alumnoId,
      alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha,
      estado: doc.estado as any,
      preceptorId: doc.preceptorId
    }));
  } catch (err: any) {
    devLog("getAsistenciasJornada (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaJornada[]>("asistencias_jornada", []);
    return local.filter(a => a.fecha === fecha);
  }
};

export const saveAsistenciasJornada = async (asistencias: AsistenciaJornada[]) => {
  for (const a of asistencias) {
    try {
      if (a.id && !a.id.startsWith("LOCAL_")) {
        await databases.updateDocument(
          APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID, a.id,
          {
            alumnoId: a.alumnoId,
            alumnoNombre: a.alumnoNombre,
            fecha: a.fecha,
            estado: a.estado,
            preceptorId: a.preceptorId
          }
        );
      } else {
        await databases.createDocument(
          APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID, ID.unique(),
          {
            alumnoId: a.alumnoId,
            alumnoNombre: a.alumnoNombre,
            fecha: a.fecha,
            estado: a.estado,
            preceptorId: a.preceptorId
          }
        );
      }
    } catch (err: any) {
      devLog("saveAsistenciaJornada/item (LocalStorage fallback)", err);
      const local = getLocalStorageData<AsistenciaJornada[]>("asistencias_jornada", []);
      if (a.id) {
        const idx = local.findIndex(item => item.id === a.id);
        if (idx !== -1) {
          local[idx] = a;
        } else {
          local.push(a);
        }
      } else {
        const newRecord = { ...a, id: "LOCAL_" + Math.random().toString(36).substr(2, 9) };
        local.push(newRecord);
        a.id = newRecord.id;
      }
      setLocalStorageData("asistencias_jornada", local);
    }
  }
};

// ─── NUEVO: ASISTENCIAS MATERIA (PROFESOR) ───────────────────────────────────
export const getAsistenciasMateria = async (fecha: string, materia: string, curso: string): Promise<AsistenciaMateria[]> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID,
      [Query.equal("fecha", fecha), Query.equal("materia", materia), Query.equal("curso", curso), Query.limit(DEFAULT_LIMIT)]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      alumnoId: doc.alumnoId,
      alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha,
      materia: doc.materia,
      curso: doc.curso,
      estado: doc.estado as any,
      profesorId: doc.profesorId
    }));
  } catch (err: any) {
    devLog("getAsistenciasMateria (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaMateria[]>("asistencias_materia", []);
    return local.filter(a => a.fecha === fecha && a.materia === materia && a.curso === curso);
  }
};

export const saveAsistenciasMateria = async (asistencias: AsistenciaMateria[]) => {
  for (const a of asistencias) {
    try {
      if (a.id && !a.id.startsWith("LOCAL_")) {
        await databases.updateDocument(
          APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID, a.id,
          {
            alumnoId: a.alumnoId,
            alumnoNombre: a.alumnoNombre,
            fecha: a.fecha,
            materia: a.materia,
            curso: a.curso,
            estado: a.estado,
            profesorId: a.profesorId
          }
        );
      } else {
        await databases.createDocument(
          APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID, ID.unique(),
          {
            alumnoId: a.alumnoId,
            alumnoNombre: a.alumnoNombre,
            fecha: a.fecha,
            materia: a.materia,
            curso: a.curso,
            estado: a.estado,
            profesorId: a.profesorId
          }
        );
      }
    } catch (err: any) {
      devLog("saveAsistenciasMateria/item (LocalStorage fallback)", err);
      const local = getLocalStorageData<AsistenciaMateria[]>("asistencias_materia", []);
      if (a.id) {
        const idx = local.findIndex(item => item.id === a.id);
        if (idx !== -1) {
          local[idx] = a;
        } else {
          local.push(a);
        }
      } else {
        const newRecord = { ...a, id: "LOCAL_" + Math.random().toString(36).substr(2, 9) };
        local.push(newRecord);
        a.id = newRecord.id;
      }
      setLocalStorageData("asistencias_materia", local);
    }
  }
};

// ─── NUEVO: GET ALUMNO HISTORIAL (VISTA ALUMNO) ──────────────────────────────
export const getAlumnoHistorialAsistencia = async (alumnoId: string): Promise<{ jornada: AsistenciaJornada[], materia: AsistenciaMateria[] }> => {
  let jornada: AsistenciaJornada[] = [];
  let materia: AsistenciaMateria[] = [];

  try {
    const resJornada = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_JORNADA_COLLECTION_ID,
      [Query.equal("alumnoId", alumnoId), Query.limit(DEFAULT_LIMIT)]
    );
    jornada = resJornada.documents.map(doc => ({
      id: doc.$id, alumnoId: doc.alumnoId, alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha, estado: doc.estado as any, preceptorId: doc.preceptorId
    }));
  } catch (err) {
    devLog("getAlumnoHistorialAsistencia/jornada (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaJornada[]>("asistencias_jornada", []);
    jornada = local.filter(a => a.alumnoId === alumnoId);
  }

  try {
    const resMateria = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_ASISTENCIAS_MATERIA_COLLECTION_ID,
      [Query.equal("alumnoId", alumnoId), Query.limit(DEFAULT_LIMIT)]
    );
    materia = resMateria.documents.map(doc => ({
      id: doc.$id, alumnoId: doc.alumnoId, alumnoNombre: doc.alumnoNombre,
      fecha: doc.fecha, materia: doc.materia, curso: doc.curso,
      estado: doc.estado as any, profesorId: doc.profesorId
    }));
  } catch (err) {
    devLog("getAlumnoHistorialAsistencia/materia (LocalStorage fallback)", err);
    const local = getLocalStorageData<AsistenciaMateria[]>("asistencias_materia", []);
    materia = local.filter(a => a.alumnoId === alumnoId);
  }

  return { jornada, materia };
};

// ─── NUEVO: GESTIÓN DE MESAS DE EXAMEN ────────────────────────────────────────
export const getMesasExamen = async (forceRefresh = false): Promise<MesaExamen[]> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DB_ID, APPWRITE_MESAS_EXAMEN_COLLECTION_ID,
      [Query.orderAsc("fecha"), Query.limit(DEFAULT_LIMIT)]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      fecha: doc.fecha,
      hora: doc.hora,
      materia: doc.materia,
      aula: doc.aula,
      presidenteId: doc.presidenteId,
      presidenteNombre: doc.presidenteNombre,
      vocal1Id: doc.vocal1Id,
      vocal1Nombre: doc.vocal1Nombre,
      vocal2Id: doc.vocal2Id,
      vocal2Nombre: doc.vocal2Nombre,
      alumnosInscriptos: doc.alumnosInscriptos,
      estado: doc.estado as any
    }));
  } catch (err: any) {
    devLog("getMesasExamen (LocalStorage fallback)", err);
    return getLocalStorageData<MesaExamen[]>("mesas_examen", []);
  }
};

export const saveMesaExamen = async (m: MesaExamen) => {
  try {
    const payload = {
      fecha: m.fecha,
      hora: m.hora,
      materia: m.materia,
      aula: m.aula,
      presidenteId: m.presidenteId,
      presidenteNombre: m.presidenteNombre,
      vocal1Id: m.vocal1Id || "",
      vocal1Nombre: m.vocal1Nombre || "",
      vocal2Id: m.vocal2Id || "",
      vocal2Nombre: m.vocal2Nombre || "",
      alumnosInscriptos: m.alumnosInscriptos || [],
      estado: m.estado
    };

    if (m.id && !m.id.startsWith("LOCAL_")) {
      return await databases.updateDocument(
        APPWRITE_DB_ID, APPWRITE_MESAS_EXAMEN_COLLECTION_ID, m.id, payload
      );
    } else {
      return await databases.createDocument(
        APPWRITE_DB_ID, APPWRITE_MESAS_EXAMEN_COLLECTION_ID, ID.unique(), payload
      );
    }
  } catch (err: any) {
    devLog("saveMesaExamen (LocalStorage fallback)", err);
    const local = getLocalStorageData<MesaExamen[]>("mesas_examen", []);
    if (m.id) {
      const idx = local.findIndex(item => item.id === m.id);
      if (idx !== -1) {
        local[idx] = m;
      } else {
        local.push(m);
      }
    } else {
      const newRecord = { ...m, id: "LOCAL_" + Math.random().toString(36).substr(2, 9) };
      local.push(newRecord);
      m.id = newRecord.id;
    }
    setLocalStorageData("mesas_examen", local);
    return { $id: m.id };
  }
};

export const deleteMesaExamen = async (id: string) => {
  try {
    if (!id.startsWith("LOCAL_")) {
      await databases.deleteDocument(APPWRITE_DB_ID, APPWRITE_MESAS_EXAMEN_COLLECTION_ID, id);
    }
  } catch (err: any) {
    devLog("deleteMesaExamen (LocalStorage fallback)", err);
  } finally {
    const local = getLocalStorageData<MesaExamen[]>("mesas_examen", []);
    const filtered = local.filter(m => m.id !== id);
    setLocalStorageData("mesas_examen", filtered);
  }
};

// ─── STORAGE CERTIFICADOS ───────────────────────────────────────────────────
export const uploadCertificateFile = async (file: File): Promise<string> => {
  try {
    const response = await storage.createFile(
      APPWRITE_BUCKET_ID,
      ID.unique(),
      file
    );
    return response.$id;
  } catch (err: any) {
    console.error("[dataService] uploadCertificateFile failed:", {
      code: err?.code,
      type: err?.type,
      message: err?.message,
      status: err?.status
    });
    devLog("uploadCertificateFile", err);
    throw err;
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
    const res = storage.getFileView(APPWRITE_BUCKET_ID, fileId);
    return typeof res === "string" ? res : (res as any).href || String(res);
  } catch (err) {
    devLog("getCertificateFileUrl", err);
    return "";
  }
};
