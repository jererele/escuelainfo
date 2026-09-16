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
      from: process.env.SMTP_FROM || `"EscuelaInfo" <${process.env.SMTP_USER}>`,
      subject,
      text: text || "Notificación de EscuelaInfo",
      html: html || `<p>${text || "Notificación de EscuelaInfo"}</p>`,
    };

    if (to) mailOptions.to = to;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(",") : bcc;
    if (replyTo) mailOptions.replyTo = replyTo;

    const info = await transporter.sendMail(mailOptions);
    console.log("Mensaje enviado: %s", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Error al enviar el email:", error);
    return NextResponse.json({ error: "No se pudo enviar el correo", details: error.message }, { status: 500 });
  }
}
