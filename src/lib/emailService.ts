/**
 * Servicio de envío de notificaciones y correos institucionales
 */

export interface ApprovalEmailParams {
  to: string;
  nombre: string;
  rol: "alumno" | "profesor" | "preceptor" | "directivo" | "admin" | string;
  curso?: string;
  appUrl?: string;
}

/**
 * Envía un correo electrónico automático informando al usuario que su solicitud
 * de registro fue aprobada por la institución y ya puede iniciar sesión.
 */
export const sendApprovalEmail = async (params: ApprovalEmailParams): Promise<boolean> => {
  if (!params.to) return false;

  const roleLabels: Record<string, string> = {
    alumno: "Alumno / Estudiante",
    profesor: "Profesor / Docente",
    preceptor: "Preceptor",
    directivo: "Directivo",
    admin: "Administrador",
  };
  const roleTitle = roleLabels[params.rol] || params.rol;

  const origin =
    params.appUrl ||
    (typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://escuela713.com");

  const subject = `¡Tu solicitud de acceso fue aprobada! - Escuela N° 713`;

  let detailParagraph = "";
  if (params.rol === "alumno") {
    detailParagraph =
      params.curso && params.curso !== "pendiente"
        ? `Tu cuenta fue matriculada oficialmente en la división: <strong>${params.curso}</strong>.`
        : `Tu cuenta de alumno fue aprobada. Podés ingresar para verificar tus horarios, materias y avisos escolares.`;
  } else if (params.rol === "profesor") {
    detailParagraph = `Tu cuenta docente fue activada. Podés ingresar para gestionar tus materias, consultar horarios y registrar asistencias de clase.`;
  } else if (params.rol === "preceptor") {
    detailParagraph = `Tu cuenta de preceptor fue habilitada con acceso al control de asistencias diarias y administración de cursos.`;
  } else {
    detailParagraph = `Tu cuenta fue habilitada en el sistema institucional con el rol: <strong>${roleTitle}</strong>.`;
  }

  const plainText = `Hola ${params.nombre || "Usuario"},\n\n` +
    `Te informamos que tu solicitud de acceso a la plataforma EscuelaInfo (Escuela N° 713) fue aprobada con el rol: ${roleTitle}.\n` +
    (params.curso && params.curso !== "pendiente" ? `División / Curso: ${params.curso}\n` : "") +
    `Ya podés iniciar sesión en: ${origin}\n\n` +
    `Escuela N° 713 "Juan Abdala Chayep" - Esquel, Chubut`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Solicitud Aprobada - Escuela N° 713</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 32px 16px; color: #f8fafc;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #1e293b; border-radius: 24px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Encabezado Institucional -->
        <tr>
          <td style="padding: 32px 32px 20px 32px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%); border-bottom: 1px solid #334155;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #10b981; margin-bottom: 8px;">
              Escuela N° 713 &quot;Juan Abdala Chayep&quot;
            </div>
            <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -0.02em;">
              ¡Tu solicitud de acceso fue aprobada!
            </h1>
          </td>
        </tr>

        <!-- Cuerpo del Mensaje -->
        <tr>
          <td style="padding: 32px;">
            <p style="font-size: 16px; font-weight: 600; color: #f8fafc; margin: 0 0 16px 0;">
              Hola, <strong style="color: #10b981;">${params.nombre || "Usuario"}</strong>
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px 0;">
              Te informamos que el equipo de conducción de la institución ha revisado y <strong>aprobado tu solicitud de ingreso</strong> a la plataforma escolar <strong>EscuelaInfo</strong>.
            </p>

            <!-- Tarjeta de Datos -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 20px;">
                  <div style="margin-bottom: 12px;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Rol Asignado</span>
                    <span style="font-size: 15px; font-weight: 800; color: #10b981;">${roleTitle}</span>
                  </div>
                  ${
                    params.curso && params.curso !== "pendiente"
                      ? `<div style="margin-bottom: 12px;">
                          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">División / Curso Asignado</span>
                          <span style="font-size: 14px; font-weight: 700; color: #ffffff; font-family: monospace;">${params.curso}</span>
                        </div>`
                      : ""
                  }
                  <div>
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Detalle de Acceso</span>
                    <span style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">${detailParagraph}</span>
                  </div>
                </td>
              </tr>
            </table>

            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 28px 0;">
              Ya podés ingresar al portal con tu correo electrónico registrado (<strong>${params.to}</strong>) para acceder a todas las funciones del sistema.
            </p>

            <!-- Botón de Acción -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${origin}" target="_blank" style="display: inline-block; background-color: #10b981; color: #022c22; font-size: 14px; font-weight: 900; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.05em;">
                Ingresar a la Plataforma
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
              Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:<br>
              <a href="${origin}" style="color: #10b981; text-decoration: underline;">${origin}</a>
            </p>
          </td>
        </tr>

        <!-- Pie de página -->
        <tr>
          <td style="padding: 24px 32px; background-color: #0b1120; border-top: 1px solid #1e293b; text-align: center;">
            <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">
              Escuela Provincial de Educación Técnica N° 713 &quot;Juan Abdala Chayep&quot;
            </p>
            <p style="font-size: 11px; color: #475569; margin: 0;">
              Esquel, Chubut · Sistema EscuelaInfo
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: params.to,
        subject,
        text: plainText,
        html,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[sendApprovalEmail] Error al enviar correo de aprobación:", err);
    return false;
  }
};

export interface AbsenceNoticeParams {
  profesor: string;
  tipo: string;
  inicio: string;
  fin: string;
  materias: string[];
  cursos: string[];
  motivo?: string;
  studentEmails: string[];
  appUrl?: string;
}

/**
 * Determina los cursos afectados por una licencia o ausencia docente,
 * extrayendo divisiones de las materias seleccionadas (ej: "Matemática (6to ETP)")
 * o correlacionando el nombre del docente con la grilla oficial de horarios.
 */
export const getAffectedCoursesFromAusencia = (
  ausencia: { profNombre?: string; materias?: string[] },
  horarios: { curso?: string; materia?: string; profesor?: string }[] = []
): string[] => {
  const courses = new Set<string>();

  // 1. Extraer cursos entre paréntesis en materias (ej: "67 master (6to ETP - Doble Turno)")
  (ausencia.materias || []).forEach(m => {
    const match = m.match(/\(([^)]+)\)$/);
    if (match && match[1]) {
      courses.add(match[1].trim());
    }
  });

  // 2. Correlacionar con horarios del profesor
  if (ausencia.profNombre && horarios.length > 0) {
    const profLower = ausencia.profNombre.toLowerCase().trim();
    const cleanMaterias = (ausencia.materias || []).map(m => m.replace(/\s*\([^)]*\)/g, "").toLowerCase().trim());

    horarios.forEach(h => {
      if ((h.profesor || "").toLowerCase().trim() === profLower) {
        if (cleanMaterias.length === 0 || cleanMaterias.includes((h.materia || "").toLowerCase().trim())) {
          if (h.curso) courses.add(h.curso.trim());
        }
      }
    });
  }

  return Array.from(courses);
};

/**
 * Envía un correo institucional a los alumnos de los cursos afectados por
 * una ausencia docente, licencia o adhesión a paro comunicando las horas libres.
 */
export const sendAbsenceNoticeEmail = async (params: AbsenceNoticeParams): Promise<boolean> => {
  const cleanEmails = Array.from(new Set((params.studentEmails || []).filter(Boolean)));
  if (cleanEmails.length === 0) return false;

  const origin =
    params.appUrl ||
    (typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://escuela713.com");

  const cleanCursos = params.cursos.filter(Boolean).join(", ") || "tu curso";
  const cleanMaterias = params.materias
    .filter(Boolean)
    .map(m => m.replace(/\s*\([^)]*\)/g, "").trim())
    .join(", ") || "Materias curriculares";

  const isOneDay = params.inicio === params.fin;
  const fechaTexto = isOneDay ? `el día ${params.inicio}` : `desde el ${params.inicio} hasta el ${params.fin}`;

  const subject = `Aviso Institucional: Inasistencia Docente (${cleanCursos}) - Escuela N° 713`;

  const plainText = `Aviso Institucional - Escuela N° 713 "Juan Abdala Chayep"\n\n` +
    `Estimados estudiantes de ${cleanCursos}:\n\n` +
    `Les informamos que el/la docente ${params.profesor} no concurrirá a dictar clases ${fechaTexto} (${params.tipo}).\n\n` +
    `Materias afectadas: ${cleanMaterias}.\n` +
    `Los módulos correspondientes se computan como Hora Libre o según las pautas de su preceptoría.\n\n` +
    `Pueden consultar la grilla horaria actualizada en tiempo real en: ${origin}\n\n` +
    `Escuela N° 713 "Juan Abdala Chayep" - Esquel, Chubut`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Inasistencia Docente - Escuela N° 713</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 32px 16px; color: #f8fafc;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #1e293b; border-radius: 24px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Encabezado Institucional -->
        <tr>
          <td style="padding: 32px 32px 20px 32px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%); border-bottom: 1px solid #334155;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #ef4444; margin-bottom: 8px;">
              Aviso Escolar Oficial · Escuela N° 713
            </div>
            <h1 style="font-size: 22px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -0.02em;">
              Inasistencia Docente / Hora Libre
            </h1>
          </td>
        </tr>

        <!-- Cuerpo del Mensaje -->
        <tr>
          <td style="padding: 32px;">
            <p style="font-size: 15px; font-weight: 600; color: #f8fafc; margin: 0 0 16px 0;">
              Atención estudiantes de <strong style="color: #38bdf8;">${cleanCursos}</strong>:
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px 0;">
              Se informa que el/la docente <strong style="color: #ffffff;">${params.profesor}</strong> no dictará clases <strong>${fechaTexto}</strong> debido a: <strong>${params.tipo}</strong>.
            </p>

            <!-- Ficha de Datos -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 20px;">
                  <div style="margin-bottom: 12px;">
                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Docente</span>
                    <span style="font-size: 14px; font-weight: 800; color: #ffffff;">${params.profesor}</span>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Materia(s) Afectada(s)</span>
                    <span style="font-size: 13px; font-weight: 700; color: #f59e0b;">${cleanMaterias}</span>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Período</span>
                    <span style="font-size: 13px; font-weight: 700; color: #10b981;">${fechaTexto}</span>
                  </div>
                  <div>
                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Situación de las Horas</span>
                    <span style="font-size: 13px; color: #ef4444; font-weight: 700;">Hora Libre / Sin actividad presencial de la materia</span>
                  </div>
                </td>
              </tr>
            </table>

            <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
              Los estudiantes deben consultar con su preceptoría ante cualquier ajuste de horario de ingreso o egreso.
            </p>

            <!-- Botón de Acción -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${origin}" target="_blank" style="display: inline-block; background-color: #10b981; color: #022c22; font-size: 13px; font-weight: 900; text-decoration: none; padding: 12px 28px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                Consultar Horarios en EscuelaInfo
              </a>
            </div>
          </td>
        </tr>

        <!-- Pie de página -->
        <tr>
          <td style="padding: 20px 32px; background-color: #0b1120; border-top: 1px solid #1e293b; text-align: center;">
            <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">
              Escuela Provincial de Educación Técnica N° 713 &quot;Juan Abdala Chayep&quot;
            </p>
            <p style="font-size: 10px; color: #475569; margin: 0;">
              Esquel, Chubut · Comunicado Oficial Automático
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bcc: cleanEmails,
        subject,
        text: plainText,
        html,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[sendAbsenceNoticeEmail] Error al despachar aviso:", err);
    return false;
  }
};
