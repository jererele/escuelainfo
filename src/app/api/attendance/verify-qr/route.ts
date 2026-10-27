import { NextResponse } from 'next/server';
import { Client, Account, Databases, ID, Query } from 'node-appwrite';
import { verifyQrToken } from '@/lib/otpStore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: "No se proporcionó ningún token QR válido." }, { status: 400 });
    }

    // Rate limiting para evitar ataques de fuerza bruta
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`scan-qr:${clientIp}`, 20, 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: "Demasiados escaneos en poco tiempo. Por favor esperá un momento." }, { status: 429 });
    }

    // 1. Validar la firma criptográfica y tiempo de validez del token
    const tokenResult = verifyQrToken(token.trim(), 40000);
    if (!tokenResult.valid || !tokenResult.payload) {
      return NextResponse.json({ error: tokenResult.error || "El código QR es inválido o ha expirado." }, { status: 400 });
    }

    const { m: mode, s: materia, p: issuerId } = tokenResult.payload;

    // 2. Autenticar al alumno que escanea mediante JWT
    const authHeader = request.headers.get('authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
      return NextResponse.json({ error: "No autenticado: debes tener una sesión iniciada de alumno para registrar tu presente." }, { status: 401 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6a2af00d002d86d3dd20";
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    const authClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
    const authAccount = new Account(authClient);
    let sessionUser;
    try {
      sessionUser = await authAccount.get();
    } catch {
      return NextResponse.json({ error: "Sesión de alumno inválida o expirada. Por favor iniciá sesión nuevamente." }, { status: 401 });
    }

    if (!sessionUser || !sessionUser.email) {
      return NextResponse.json({ error: "No se pudo identificar la cuenta del alumno." }, { status: 401 });
    }

    const studentEmail = sessionUser.email.toLowerCase().trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Configuración incompleta en el servidor Appwrite." }, { status: 500 });
    }

    const adminClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const db = new Databases(adminClient);

    // 3. Obtener el legajo del alumno (búsqueda resiliente con vinculación automática)
    let alumno: any = null;
    const alumnoDocs = await db.listDocuments(dbId, 'alumnos', [Query.equal('email', studentEmail), Query.limit(1)]);
    
    if (alumnoDocs.total > 0 && alumnoDocs.documents[0]) {
      alumno = alumnoDocs.documents[0];
    } else {
      // Fallback 1: Búsqueda insensible a mayúsculas/minúsculas en el padrón
      const allAlumnos = await db.listDocuments(dbId, 'alumnos', [Query.limit(200)]);
      alumno = allAlumnos.documents.find(
        (a: any) => a.email && a.email.toLowerCase().trim() === studentEmail
      );

      // Fallback 2: Buscar en la colección de usuarios por UID o email y vincular
      if (!alumno) {
        let userDoc: any = null;
        try {
          const userDocs = await db.listDocuments(dbId, 'usuarios', [
            Query.equal('email', studentEmail),
            Query.limit(1)
          ]);
          if (userDocs.total > 0) userDoc = userDocs.documents[0];
        } catch {}

        if (!userDoc && sessionUser.$id) {
          try {
            const userDocs = await db.listDocuments(dbId, 'usuarios', [
              Query.equal('uid', sessionUser.$id),
              Query.limit(1)
            ]);
            if (userDocs.total > 0) userDoc = userDocs.documents[0];
          } catch {}
        }

        if (userDoc) {
          // Intentar coincidir por DNI o por nombre en alumnos
          const matchByDni = userDoc.dni ? allAlumnos.documents.find((a: any) => a.dni && a.dni === userDoc.dni) : null;
          const matchByName = allAlumnos.documents.find((a: any) => a.nombre && a.nombre.toLowerCase().trim() === (userDoc.nombre || sessionUser.name || '').toLowerCase().trim());
          const matchedAlumno = matchByDni || matchByName;

          if (matchedAlumno) {
            alumno = matchedAlumno;
            // Actualizar su correo en alumnos para futuras consultas inmediatas
            try {
              await db.updateDocument(dbId, 'alumnos', matchedAlumno.$id, {
                email: studentEmail
              });
            } catch {}
          } else {
            // Auto-provisionar legajo del alumno con base en su usuario verificado
            try {
              alumno = await db.createDocument(dbId, 'alumnos', ID.unique(), {
                nombre: userDoc.nombre || sessionUser.name || "Alumno",
                dni: userDoc.dni || "",
                curso: userDoc.curso || "6to ETP - Doble Turno",
                email: studentEmail,
                schoolId: userDoc.schoolId || "esc-713-esquel"
              });
            } catch {}
          }
        }
      }
    }

    if (!alumno) {
      return NextResponse.json({ error: "No se encontró tu legajo de alumno registrado en la institución." }, { status: 404 });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const studentSchoolId = alumno.schoolId || "esc-713-esquel";

    // 4. Registrar Asistencia (actualizando de Ausente a Presente si ya existía registro)
    if (mode === "jornada") {
      let existingDoc: any = null;
      const existingById = await db.listDocuments(dbId, 'asistencias_alumnos_jornada', [
        Query.equal('alumnoId', alumno.$id),
        Query.equal('fecha', todayDate),
        Query.limit(1)
      ]);

      if (existingById.total > 0) {
        existingDoc = existingById.documents[0];
      } else if (alumno.dni) {
        const existingByDni = await db.listDocuments(dbId, 'asistencias_alumnos_jornada', [
          Query.equal('alumnoId', alumno.dni),
          Query.equal('fecha', todayDate),
          Query.limit(1)
        ]);
        if (existingByDni.total > 0) existingDoc = existingByDni.documents[0];
      }

      if (existingDoc) {
        if (existingDoc.estado === "P") {
          return NextResponse.json({
            success: true,
            alreadyRecorded: true,
            mode: "jornada",
            studentName: alumno.nombre,
            message: "Tu asistencia de hoy ya se encontraba registrada como Presente."
          });
        }
        // Si estaba Ausente u otro estado, cambiar a Presente por QR
        await db.updateDocument(dbId, 'asistencias_alumnos_jornada', existingDoc.$id, {
          estado: "P",
          preceptorId: String(issuerId || "QR_SISTEMA").slice(0, 50),
          schoolId: studentSchoolId
        });
      } else {
        await db.createDocument(dbId, 'asistencias_alumnos_jornada', ID.unique(), {
          alumnoId: alumno.$id,
          alumnoNombre: alumno.nombre || sessionUser.name || "Alumno",
          fecha: todayDate,
          estado: "P",
          preceptorId: String(issuerId || "QR_SISTEMA").slice(0, 50),
          schoolId: studentSchoolId
        });
      }

      // Log compacto
      try {
        await db.createDocument(dbId, 'logs', ID.unique(), {
          usuarioEmail: studentEmail,
          accion: 'C_AJ',
          detalles: `Presente por QR Jornada (${todayDate})`,
          fecha: new Date().toISOString(),
          schoolId: studentSchoolId
        });
      } catch {}

    } else if (mode === "materia") {
      const cleanMateria = String(materia || "Materia");
      let existingDoc: any = null;
      const existingById = await db.listDocuments(dbId, 'asistencias_alumnos_materia', [
        Query.equal('alumnoId', alumno.$id),
        Query.equal('fecha', todayDate),
        Query.equal('materia', cleanMateria),
        Query.limit(1)
      ]);

      if (existingById.total > 0) {
        existingDoc = existingById.documents[0];
      } else if (alumno.dni) {
        const existingByDni = await db.listDocuments(dbId, 'asistencias_alumnos_materia', [
          Query.equal('alumnoId', alumno.dni),
          Query.equal('fecha', todayDate),
          Query.equal('materia', cleanMateria),
          Query.limit(1)
        ]);
        if (existingByDni.total > 0) existingDoc = existingByDni.documents[0];
      }

      // Sincronización obligatoria con asistencias_alumnos_jornada:
      // Al validar presencia con el docente en clase, el alumno está presente en la institución,
      // por lo que debe quedar VALIDADO ("P") en la planilla de asistencia y en el monitor diario.
      try {
        let existingJornada: any = null;
        const jById = await db.listDocuments(dbId, 'asistencias_alumnos_jornada', [
          Query.equal('alumnoId', alumno.$id),
          Query.equal('fecha', todayDate),
          Query.limit(1)
        ]);
        if (jById.total > 0) {
          existingJornada = jById.documents[0];
        } else if (alumno.dni) {
          const jByDni = await db.listDocuments(dbId, 'asistencias_alumnos_jornada', [
            Query.equal('alumnoId', alumno.dni),
            Query.equal('fecha', todayDate),
            Query.limit(1)
          ]);
          if (jByDni.total > 0) existingJornada = jByDni.documents[0];
        }

        if (existingJornada) {
          if (existingJornada.estado !== "P") {
            await db.updateDocument(dbId, 'asistencias_alumnos_jornada', existingJornada.$id, {
              estado: "P",
              preceptorId: String(issuerId || "QR_DOCENTE").slice(0, 50),
              schoolId: studentSchoolId
            });
          }
        } else {
          await db.createDocument(dbId, 'asistencias_alumnos_jornada', ID.unique(), {
            alumnoId: alumno.$id,
            alumnoNombre: alumno.nombre || sessionUser.name || "Alumno",
            fecha: todayDate,
            estado: "P",
            preceptorId: String(issuerId || "QR_DOCENTE").slice(0, 50),
            schoolId: studentSchoolId
          });
        }
      } catch (errJornada) {
        console.warn("[verify-qr] No se pudo sincronizar presencia en jornada:", errJornada);
      }

      if (existingDoc) {
        if (existingDoc.estado === "P") {
          return NextResponse.json({
            success: true,
            alreadyRecorded: true,
            mode: "materia",
            materia: cleanMateria,
            studentName: alumno.nombre,
            message: `Tu presente para ${cleanMateria} ya se encontraba registrado.`
          });
        }
        await db.updateDocument(dbId, 'asistencias_alumnos_materia', existingDoc.$id, {
          estado: "P",
          profesorId: String(issuerId || "QR_SISTEMA").slice(0, 50),
          schoolId: studentSchoolId
        });
      } else {
        await db.createDocument(dbId, 'asistencias_alumnos_materia', ID.unique(), {
          alumnoId: alumno.$id,
          alumnoNombre: alumno.nombre || sessionUser.name || "Alumno",
          fecha: todayDate,
          materia: cleanMateria.slice(0, 100),
          curso: (alumno.curso || "Curso").slice(0, 50),
          estado: "P",
          profesorId: String(issuerId || "QR_SISTEMA").slice(0, 50),
          schoolId: studentSchoolId
        });
      }

      try {
        await db.createDocument(dbId, 'logs', ID.unique(), {
          usuarioEmail: studentEmail,
          accion: 'C_AM',
          detalles: `Presente por QR Materia: ${cleanMateria}`,
          fecha: new Date().toISOString(),
          schoolId: studentSchoolId
        });
      } catch {}
    } else {
      return NextResponse.json({ error: "Modalidad de asistencia no soportada." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      mode,
      studentName: alumno.nombre,
      materia: mode === "materia" ? materia : undefined,
      date: todayDate,
      message: "¡Presente registrado exitosamente!"
    });
  } catch (error: any) {
    console.error("[verify-qr] Error al procesar asistencia:", error);
    return NextResponse.json({ error: error.message || "Error al procesar el código de asistencia" }, { status: 500 });
  }
}
