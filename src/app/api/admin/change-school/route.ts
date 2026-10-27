import { NextResponse } from 'next/server';
import { Client, Databases, Query, ID } from 'node-appwrite';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getSchoolById, DEFAULT_SCHOOL_ID } from '@/lib/chubutSchools';

const fromDbRol = (r?: string | null): string => {
  if (!r) return "";
  const clean = r.trim().toLowerCase();
  const map: Record<string, string> = {
    ad: "admin",
    admin: "admin",
    d: "directivo",
    directivo: "directivo",
    pp: "preceptor",
    preceptor: "preceptor",
    p: "profesor",
    profesor: "profesor",
    a: "alumno",
    alumno: "alumno",
  };
  return map[clean] || clean;
};

export async function POST(request: Request) {
  try {
    const { targetUserId, targetSchoolId, targetUserEmail } = await request.json();

    if (!targetSchoolId || typeof targetSchoolId !== 'string' || !targetSchoolId.trim()) {
      return NextResponse.json({ error: "Debe especificarse el identificador de la escuela asignada." }, { status: 400 });
    }

    if (!targetUserId && !targetUserEmail) {
      return NextResponse.json({ error: "Debe indicarse el identificador o email del usuario a modificar." }, { status: 400 });
    }

    const cleanSchoolId = targetSchoolId.trim();
    const schoolData = getSchoolById(cleanSchoolId);
    if (!schoolData) {
      return NextResponse.json({ error: `La escuela indicada "${cleanSchoolId}" no existe en el catálogo oficial de Chubut.` }, { status: 400 });
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

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`change-school:${clientIp}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Demasiadas operaciones consecutivas. Esperá un minuto." }, { status: 429 });
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const db = new Databases(client);

    // 1. Validar que el operador tenga rol de Administrador
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
    if (operatorRole !== "admin" && operatorRole !== "directivo") {
      return NextResponse.json({ error: "Acceso denegado: solo los Administradores y Directivos tienen autorización institucional para asignar o cambiar la escuela designada." }, { status: 403 });
    }

    // 2. Localizar documento del usuario/docente objetivo en 'usuarios', 'profesores' o 'alumnos'
    let targetDoc: any = null;
    if (targetUserId) {
      try {
        targetDoc = await db.getDocument(dbId, 'usuarios', targetUserId);
      } catch {}
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

    // Búsqueda en la colección 'profesores' si no se encontró en 'usuarios' o para sincronización
    let profDoc: any = null;
    if (targetUserId) {
      try {
        profDoc = await db.getDocument(dbId, 'profesores', targetUserId);
      } catch {}
    }
    if (!profDoc && cleanTargetEmail) {
      try {
        const pList = await db.listDocuments(dbId, 'profesores', [Query.equal('email', cleanTargetEmail)]);
        if (pList.documents.length > 0) {
          profDoc = pList.documents[0];
        }
      } catch {}
    }

    // Búsqueda en la colección 'alumnos'
    let alumDoc: any = null;
    if (targetUserId) {
      try {
        alumDoc = await db.getDocument(dbId, 'alumnos', targetUserId);
      } catch {}
    }
    if (!alumDoc && cleanTargetEmail) {
      try {
        const aList = await db.listDocuments(dbId, 'alumnos', [Query.equal('email', cleanTargetEmail)]);
        if (aList.documents.length > 0) {
          alumDoc = aList.documents[0];
        }
      } catch {}
    }

    if (!targetDoc && !profDoc && !alumDoc) {
      return NextResponse.json({ error: "No se encontró el registro del usuario o docente objetivo para reasignar escuela." }, { status: 404 });
    }

    const prevSchoolId = targetDoc?.schoolId || profDoc?.schoolId || alumDoc?.schoolId || DEFAULT_SCHOOL_ID;
    const targetDisplayName = targetDoc?.nombre || profDoc?.nombre || alumDoc?.nombre || cleanTargetEmail || "Docente";

    // 3. Actualizar la escuela en 'usuarios' si existe
    if (targetDoc) {
      await db.updateDocument(dbId, 'usuarios', targetDoc.$id, {
        schoolId: cleanSchoolId
      });
    }

    // 4. Actualizar la escuela en 'profesores' si existe
    if (profDoc) {
      await db.updateDocument(dbId, 'profesores', profDoc.$id, {
        schoolId: cleanSchoolId
      });
    }
    if (cleanTargetEmail) {
      try {
        const profsList = await db.listDocuments(dbId, 'profesores', [
          Query.equal('email', cleanTargetEmail)
        ]);
        for (const pr of profsList.documents) {
          if (!profDoc || pr.$id !== profDoc.$id) {
            await db.updateDocument(dbId, 'profesores', pr.$id, {
              schoolId: cleanSchoolId
            });
          }
        }
      } catch (err: any) {
        console.warn("[change-school] Advertencia al sincronizar profesores:", err?.message);
      }
    }

    // 5. Actualizar la escuela en 'alumnos' si existe
    if (alumDoc) {
      await db.updateDocument(dbId, 'alumnos', alumDoc.$id, {
        schoolId: cleanSchoolId
      });
    }
    if (cleanTargetEmail) {
      try {
        const alumnosList = await db.listDocuments(dbId, 'alumnos', [
          Query.equal('email', cleanTargetEmail)
        ]);
        for (const al of alumnosList.documents) {
          if (!alumDoc || al.$id !== alumDoc.$id) {
            await db.updateDocument(dbId, 'alumnos', al.$id, {
              schoolId: cleanSchoolId
            });
          }
        }
      } catch (err: any) {
        console.warn("[change-school] Advertencia al sincronizar alumnos:", err?.message);
      }
    }

    // 6. Registro de auditoría institucional
    try {
      await db.createDocument(dbId, 'logs', ID.unique(), {
        usuario: cleanCallerEmail,
        accion: 'REASIGNACION_ESCUELA_USUARIO',
        detalles: `Reasignación por ${operatorRole.toUpperCase()} (${cleanCallerEmail}) a ${targetDisplayName} (${cleanTargetEmail || targetUserId}). De: ${prevSchoolId} -> A: ${schoolData.nombreCompleto} (${cleanSchoolId})`,
        fechaReg: new Date().toISOString(),
        schoolId: cleanSchoolId
      });
    } catch (auditErr: any) {
      console.warn("[change-school] Advertencia al registrar log:", auditErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: `Escuela de ${targetDoc.nombre || cleanTargetEmail} actualizada correctamente a ${schoolData.nombreCompleto}.`,
      schoolId: cleanSchoolId,
      schoolNombre: schoolData.nombreCompleto
    });
  } catch (err: any) {
    console.error("[change-school] Error inesperado:", err);
    return NextResponse.json({ error: err.message || "Error interno al reasignar escuela." }, { status: 500 });
  }
}
