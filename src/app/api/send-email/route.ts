import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: Request) {
  try {
    // 🛡️ SECURITY AUDIT REF: Prevención de Open Mail Relay y Abuso de Recursos
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`send-email:${clientIp}`, 12, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Límite de envíos excedido. Esperá ${rateCheck.retryAfterSeconds} segundos antes de enviar más correos.` },
        { status: 429 }
      );
    }

    // Validación de Same-Origin para mitigar CSRF
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      const originHost = origin.replace(/^https?:\/\//, '').split(':')[0];
      const requestHost = host.split(':')[0];
      if (originHost !== requestHost && originHost !== 'localhost') {
        return NextResponse.json({ error: "Origen de petición no permitido." }, { status: 403 });
      }
    }

    const { to, bcc, replyTo, subject, text, html } = await request.json();

    if ((!to && !bcc) || !subject) {
      return NextResponse.json({ error: "Faltan parámetros de destinatario ('to' o 'bcc') o 'subject'" }, { status: 400 });
    }

    // Sanitizar asunto contra Header Injection (remover saltos de línea)
    const cleanSubject = String(subject).replace(/[\r\n]+/g, ' ').trim().slice(0, 200);

    // Validar destinatario(s)
    if (to && !EMAIL_REGEX.test(String(to).trim())) {
      return NextResponse.json({ error: "El correo destinatario 'to' no tiene un formato válido." }, { status: 400 });
    }

    const rawBccList = Array.isArray(bcc) ? bcc.filter(Boolean) : (bcc ? [bcc] : []);
    const bccList = rawBccList
      .map(e => String(e).trim().toLowerCase())
      .filter(e => EMAIL_REGEX.test(e))
      .slice(0, 300); // Límite máximo de seguridad de 300 destinatarios por lote

    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");

    // Validar configuración
    if (!user || !pass) {
      console.warn("Faltan SMTP_USER o SMTP_PASS en .env.local. Simulación de envío exitoso.");
      console.log(`[EMAIL SIMULADO] Para: ${to || '(CCO)'}, CCO: ${Array.isArray(bcc) ? bcc.length + ' destinatarios' : bcc}, Asunto: ${subject}`);
      return NextResponse.json({ success: true, simulated: true });
    }

    // Configurar el transporter para Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    const mailOptions: any = {
      from: process.env.SMTP_FROM || `"Escuela N° 713 - EscuelaInfo" <${user}>`,
      subject: cleanSubject,
      text: text || "Notificación de EscuelaInfo",
      html: html || `<p>${text || "Notificación de EscuelaInfo"}</p>`,
    };

    if (to) {
      mailOptions.to = to;
      if (bccList.length > 0) {
        mailOptions.bcc = bccList.join(",");
      }
    } else if (bccList.length === 1) {
      // Si hay un único destinatario en CCO, enviarlo como TO directo para máxima entregabilidad
      mailOptions.to = bccList[0];
    } else if (bccList.length > 1) {
      // Múltiples destinatarios en CCO: usar un TO institucional válido
      mailOptions.to = `"Comunidad Educativa N° 713" <${user}>`;
      mailOptions.bcc = bccList.join(",");
    }

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    } else {
      mailOptions.replyTo = user;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("Mensaje enviado exitosamente. ID: %s", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Error al enviar el email:", error);
    return NextResponse.json({ error: "No se pudo enviar el correo", details: error.message }, { status: 500 });
  }
}
