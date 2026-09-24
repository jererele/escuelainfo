import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, bcc, replyTo, subject, text, html } = await request.json();

    if ((!to && !bcc) || !subject) {
      return NextResponse.json({ error: "Faltan parámetros de destinatario ('to' o 'bcc') o 'subject'" }, { status: 400 });
    }

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
      subject,
      text: text || "Notificación de EscuelaInfo",
      html: html || `<p>${text || "Notificación de EscuelaInfo"}</p>`,
    };

    const bccList = Array.isArray(bcc) ? bcc.filter(Boolean) : (bcc ? [bcc] : []);

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
