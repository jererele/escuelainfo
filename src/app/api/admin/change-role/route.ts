import { NextResponse } from 'next/server';
import { Client, Databases, Users, Query, ID } from 'node-appwrite';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Mapeos compactos institucionales
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
  "directivo": "directivo"
};

const fromDbRol = (r?: string | null): string => {
  if (!r) return "";
  const clean = r.trim().toLowerCase();
  return ROL_MAP[clean] || clean;
};

const toDbRol = (r: string): string => {
  const clean = (r || "").trim().toLowerCase();
  switch (clean) {
    case "admin": return "ad";
    case "directivo": return "d";
    case "preceptor": return "pp";
    case "profesor": return "p";
    case "alumno": return "a";
    case "pendiente": return "pe";
    case "pendiente_admin": case "pe_ad": case "p_ad": return "pe_ad";
    case "pendiente_directivo": case "pe_d": case "p_d": return "pe_d";
    case "pendiente_preceptor": case "pe_pp": case "p_pp": return "pe_pp";
    case "pendiente_profesor": case "pe_p": case "p_p": return "pe_p";
    case "pendiente_alumno": case "pe_a": case "p_a": return "pe_a";
    default: return clean;
  }
};

const canManageUserRole = (operatorRole?: string | null, targetRole?: string | null): boolean => {
  if (!operatorRole) return false;
  const op = fromDbRol(operatorRole).trim().toLowerCase();
  const tgt = fromDbRol(targetRole || "").trim().toLowerCase();

  if (op === "admin") return true;
  if (op === "directivo") {
    return tgt !== "admin" && tgt !== "directivo" && !tgt.includes("admin") && !tgt.includes("directivo");
  }
  if (op === "preceptor") {
    return (
      tgt !== "admin" &&
      tgt !== "directivo" &&
      tgt !== "preceptor" &&
      !tgt.includes("admin") &&
      !tgt.includes("directivo") &&
      !tgt.includes("preceptor")
    );
  }
  return false;
};

const getAllowedAssignableRoles = (operatorRole?: string | null): string[] => {
  if (!operatorRole) return [];
  const clean = fromDbRol(operatorRole).trim().toLowerCase();
  if (clean === "admin") {
    return ["admin", "directivo", "preceptor", "profesor", "alumno"];
  }
  if (clean === "directivo") {
    return ["preceptor", "profesor", "alumno"];
  }
  if (clean === "preceptor") {
    return ["profesor", "alumno"];
  }
  return [];
};

export async function POST(request: Request) {
  try {
    const { targetUserId, targetUserEmail, newRole, selectedCurso, preceptorCursos } = await request.json();

    if (!newRole) {
      return NextResponse.json({ error: "Debe especificarse el nuevo rol institucional." }, { status: 400 });
    }

    if (!targetUserId && !targetUserEmail) {
      return NextResponse.json({ error: "Debe indicarse el identificador o email del usuario a modificar." }, { status: 400 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ error: "Configuración incompleta en el servidor Appwrite" }, { status: 500 });
    }

    // 🛡️ SECURITY AUDIT: Verificación estricta de identidad mediante JWT de sesión
    const authHeader = request.headers.get('authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
      return NextResponse.json({ error: "Petición no autorizada: falta token de sesión institucional (JWT)." }, { status: 401 });
    }

    let cleanCallerEmail = "";
    let callerSessionUserId = "";
    try {
      const authClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
      const authAccount = new (await import('node-appwrite')).Account(authClient);
      const sessionUser = await authAccount.get();
      cleanCallerEmail = (sessionUser.email || "").toLowerCase().trim();
      callerSessionUserId = sessionUser.$id || "";
    } catch {
      return NextResponse.json({ error: "Sesión institucional inválida o expirada. Por favor vuelva a iniciar sesión." }, { status: 401 });
    }

    if (!cleanCallerEmail) {
      return NextResponse.json({ error: "No se pudo verificar la identidad del operador solicitante." }, { status: 401 });
    }

    // Rate limiting para prevenir cambios automáticos no autorizados
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`change-role:${clientIp}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Demasiadas operaciones consecutivas. Esperá un minuto." }, { status: 429 });
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const db = new Databases(client);

    // 1. Obtener datos del operador solicitante en la base de datos
    let callerDoc: any = null;
    const callerDocs = await db.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanCallerEmail)]);
    if (callerDocs.total > 0 && callerDocs.documents[0]) {
      callerDoc = callerDocs.documents[0];
    } else if (callerSessionUserId) {
      try {
        const byUid = await db.listDocuments(dbId, 'usuarios', [Query.equal('uid', callerSessionUserId)]);
        if (byUid.total > 0 && byUid.documents[0]) {
          callerDoc = byUid.documents[0];
        }
      } catch {}
    }

    if (!callerDoc) {
      return NextResponse.json({ error: "El operador solicitante no está registrado en el sistema." }, { status: 403 });
    }

    const operatorRole = fromDbRol(callerDoc.rol);
    const cleanNewRole = fromDbRol(newRole).trim().toLowerCase();

    // 2. Obtener documento del usuario objetivo
    let targetDoc: any = null;
    if (targetUserId) {
      try {
        targetDoc = await db.getDocument(dbId, 'usuarios', targetUserId);
      } catch {
        // Intentar fallback por email o uid
      }
    }

    const cleanTargetEmail = (targetUserEmail || targetDoc?.email || "").toLowerCase().trim();
    if (!targetDoc && cleanTargetEmail) {
      const list = await db.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanTargetEmail)]);
      if (list.documents.length > 0) {
        targetDoc = list.documents[0];
      }
    }

    if (!targetDoc && targetUserId) {
      try {
        const listByUid = await db.listDocuments(dbId, 'usuarios', [Query.equal('uid', targetUserId)]);
        if (listByUid.documents.length > 0) {
          targetDoc = listByUid.documents[0];
        }
      } catch {}
    }

    if (!targetDoc) {
      return NextResponse.json({ error: "No se encontró el registro del usuario objetivo." }, { status: 404 });
    }

    const targetCurrentRole = fromDbRol(targetDoc.rol);

    // 3. Validar salvaguardas jerárquicas
    // Salvaguarda: Los preceptores bajo ninguna circunstancia pueden asignar el rol de preceptor
    if (operatorRole === "preceptor" && cleanNewRole === "preceptor") {
      return NextResponse.json({ error: "Los preceptores no tienen permisos para asignar el rol de preceptor." }, { status: 403 });
    }

    // Validar jerarquía sobre el usuario destino
    if (!canManageUserRole(operatorRole, targetCurrentRole)) {
      return NextResponse.json({ error: `Tu rango de ${operatorRole} no tiene permisos jerárquicos sobre usuarios con rol ${targetCurrentRole}.` }, { status: 403 });
    }

    // Validar que el rol a asignar esté dentro de los permitidos para su jerarquía
    const allowedRoles = getAllowedAssignableRoles(operatorRole);
    if (!allowedRoles.includes(cleanNewRole)) {
      return NextResponse.json({ error: `Tu rango de ${operatorRole} no puede otorgar la jerarquía de ${cleanNewRole}.` }, { status: 403 });
    }

    // Salvaguarda: No auto-degradar la propia cuenta de Administrador
    const isSelfAccount = (targetDoc.$id === callerDoc.$id) || (cleanTargetEmail && cleanTargetEmail === cleanCallerEmail);
    if (isSelfAccount && targetCurrentRole === "admin" && cleanNewRole !== "admin") {
      return NextResponse.json({ error: "No podés modificar o quitarte tu propio rol de Administrador." }, { status: 400 });
    }

    // 4. Actualizar registro en la colección 'usuarios'
    const updateData: Record<string, any> = {
      rol: toDbRol(cleanNewRole)
    };

    if (cleanNewRole === "preceptor") {
      updateData.cursos = Array.isArray(preceptorCursos) ? JSON.stringify(preceptorCursos) : (preceptorCursos || "[]");
    } else {
      updateData.cursos = "[]";
    }

    await db.updateDocument(dbId, 'usuarios', targetDoc.$id, updateData);

    // 5. Sincronización con colección 'alumnos'
    if (cleanTargetEmail) {
      try {
        const alumnosList = await db.listDocuments(dbId, 'alumnos', [Query.equal('email', cleanTargetEmail)]);
        
        if (cleanNewRole === "alumno") {
          if (alumnosList.total > 0) {
            const alumnoDoc = alumnosList.documents[0];
            if (selectedCurso) {
              await db.updateDocument(dbId, 'alumnos', alumnoDoc.$id, {
                curso: selectedCurso
              });
            }
          } else {
            await db.createDocument(dbId, 'alumnos', ID.unique(), {
              nombre: targetDoc.nombre || "Alumno",
              dni: "",
              curso: selectedCurso || "pendiente",
              email: cleanTargetEmail
            });
          }
        } else {
          // Si el nuevo rol no es alumno, eliminar de la colección de alumnos si existía
          for (const doc of alumnosList.documents) {
            await db.deleteDocument(dbId, 'alumnos', doc.$id);
          }
        }
      } catch (err: any) {
        console.warn("[change-role] Advertencia al sincronizar alumnos:", err?.message);
      }
    }

    // 6. Sincronización con colección 'profesores'
    if (cleanTargetEmail) {
      try {
        const profsList = await db.listDocuments(dbId, 'profesores', [Query.equal('email', cleanTargetEmail)]);
        
        if (cleanNewRole === "profesor") {
          if (profsList.total === 0) {
            await db.createDocument(dbId, 'profesores', ID.unique(), {
              nombre: targetDoc.nombre || "Profesor",
              dni: "",
              materias: [],
              email: cleanTargetEmail
            });
          }
        } else if (cleanNewRole === "alumno") {
          // Si pasó a alumno, asegurar que no quede registrado como profesor
          for (const doc of profsList.documents) {
            await db.deleteDocument(dbId, 'profesores', doc.$id);
          }
        }
      } catch (err: any) {
        console.warn("[change-role] Advertencia al sincronizar profesores:", err?.message);
      }
    }

    // 7. Registro de auditoría institucional en 'logs'
    try {
      const roleLabels: Record<string, string> = {
        admin: "Administrador",
        directivo: "Directivo",
        preceptor: "Preceptor",
        profesor: "Profesor",
        alumno: "Alumno",
      };
      const oldLabel = roleLabels[targetCurrentRole] || targetCurrentRole;
      const newLabel = roleLabels[cleanNewRole] || cleanNewRole;

      const extraDetails = cleanNewRole === "alumno" && selectedCurso
        ? ` (Curso: ${selectedCurso})`
        : cleanNewRole === "preceptor" && Array.isArray(preceptorCursos) && preceptorCursos.length > 0
        ? ` (Cursos: ${preceptorCursos.join(", ")})`
        : "";

      await db.createDocument(dbId, 'logs', ID.unique(), {
        usuarioEmail: cleanCallerEmail || 'admin',
        accion: 'C_ROL',
        detalles: `${cleanTargetEmail}: de ${oldLabel} a ${newLabel}${extraDetails}`,
        fecha: new Date().toISOString(),
        ip: clientIp || "Desconocida"
      });
    } catch (logErr: any) {
      console.warn("[change-role] Advertencia al registrar log:", logErr?.message);
    }

    return NextResponse.json({
      success: true,
      targetUserId: targetDoc.$id,
      targetEmail: cleanTargetEmail,
      oldRole: targetCurrentRole,
      newRole: cleanNewRole
    });
  } catch (error: any) {
    console.error("[change-role] Error no controlado al cambiar rol:", error);
    return NextResponse.json({ error: error.message || "Error al procesar el cambio de rol institucional." }, { status: 500 });
  }
}
