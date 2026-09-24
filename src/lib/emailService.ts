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
