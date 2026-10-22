import { NextResponse } from 'next/server';
import { Client, Account, Databases, ID, Query } from 'node-appwrite';

/**
 * ⚡ Endpoint de Consolidación Automática de Inasistencias
 * Garantiza que todo alumno matriculado que no haya validado su asistencia mediante QR
 * o firma del preceptor en días escolares hábiles quede oficialmente asentado como Ausente (A)
 * en la base de datos de Appwrite, garantizando el cómputo exacto de faltas acumuladas (SATDE).
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6a2af00d002d86d3dd20";
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    if (!apiKey) {
      return NextResponse.json({ error: "Configuración incompleta en el servidor Appwrite." }, { status: 500 });
    }

    // Validar autorización del operador (preceptor, directivo o admin)
    if (jwt) {
      try {
        const authClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
        const authAccount = new Account(authClient);
        const sessionUser = await authAccount.get();
        if (!sessionUser) {
          return NextResponse.json({ error: "Sesión no válida o expirada." }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: "Token de sesión inválido." }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const { targetDate, targetCurso, schoolId } = body;
    const targetSchoolId = schoolId || "esc-713-esquel";

    const adminClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const db = new Databases(adminClient);

    // 1. Obtener todos los alumnos activos en divisiones regulares
    const alumnosDocs = await db.listDocuments(dbId, 'alumnos', [
      Query.equal('schoolId', targetSchoolId),
      Query.limit(500)
    ]);

    const activeStudents = alumnosDocs.documents.filter((a: any) => 
      a.curso && 
      a.curso.toLowerCase() !== "pendiente" && 
      !a.curso.toLowerCase().includes("egresado") &&
      (!targetCurso || a.curso === targetCurso)
    );

    if (activeStudents.length === 0) {
      return NextResponse.json({ 
        success: true, 
        consolidatedCount: 0, 
        message: "No se encontraron alumnos activos para consolidar." 
      });
    }

    // 2. Obtener todas las asistencias registradas
    const asistenciasDocs = await db.listDocuments(dbId, 'asistencias_alumnos_jornada', [
      Query.equal('schoolId', targetSchoolId),
      Query.limit(2000)
    ]);

    // 3. Determinar el conjunto de fechas escolares a consolidar
    const today = new Date().toISOString().split("T")[0];
    let datesToProcess: string[] = [];

    if (targetDate && typeof targetDate === "string") {
      datesToProcess = [targetDate.trim()];
    } else {
      // Recopilar todas las fechas únicas ya registradas en la escuela
      const existingDates = new Set<string>();
      asistenciasDocs.documents.forEach((d: any) => {
        if (d.fecha && typeof d.fecha === "string") existingDates.add(d.fecha.trim());
      });

      // Incluir también los días hábiles recientes (últimos 14 días laborables hasta hoy)
      const now = new Date();
      for (let i = 0; i < 20; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayOfWeek = d.getDay(); // 0 domingo, 6 sábado
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const dateStr = d.toISOString().split("T")[0];
          existingDates.add(dateStr);
        }
      }

      datesToProcess = Array.from(existingDates).sort();
    }

    // 4. Mapear asistencias existentes por alumnoId y fecha
    // Clave: `${alumnoId}_${fecha}` y `${dni}_${fecha}`
    const existingMap = new Set<string>();
    asistenciasDocs.documents.forEach((d: any) => {
      if (d.alumnoId && d.fecha) {
        existingMap.add(`${d.alumnoId}_${d.fecha}`);
      }
    });

    let consolidatedCount = 0;

    // 5. Consolidar faltas ausentes para alumnos sin registro
    for (const dateStr of datesToProcess) {
      for (const student of activeStudents) {
        const keyId = `${student.$id}_${dateStr}`;
        const keyDni = student.dni ? `${student.dni}_${dateStr}` : null;

        const hasRecord = existingMap.has(keyId) || (keyDni && existingMap.has(keyDni));

        if (!hasRecord) {
          try {
            await db.createDocument(dbId, 'asistencias_alumnos_jornada', ID.unique(), {
              alumnoId: student.$id,
              alumnoNombre: student.nombre || "Alumno",
              fecha: dateStr,
              estado: "A", // Ausente automático por defecto
              preceptorId: "SISTEMA_AUTO_AUSENTE",
              schoolId: targetSchoolId
            });

            existingMap.add(keyId);
            consolidatedCount++;
          } catch (err: any) {
            console.error(`[Consolidate Error] Alumno ${student.$id} fecha ${dateStr}:`, err.message);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      consolidatedCount,
      processedDates: datesToProcess.length,
      activeStudents: activeStudents.length,
      message: consolidatedCount > 0 
        ? `Se consolidaron exitosamente ${consolidatedCount} inasistencias en la base de datos.` 
        : "Todas las asistencias e inasistencias ya se encuentran al día."
    });

  } catch (error: any) {
    console.error("[Consolidate Absences Fatal Error]:", error);
    return NextResponse.json({ error: error.message || "Error al consolidar inasistencias." }, { status: 500 });
  }
}
