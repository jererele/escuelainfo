import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, bcc, replyTo, subject, text, html } = await request.json();

    if ((!to && !bcc) || !subject) {
      return NextResponse.json({ error: "Faltan parámetros de destinatario ('to' o 'bcc') o 'subject'" }, { status: 400 });
    }

    // Configurar el transporter usando variables de entorno
    // Para Gmail: host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });

    // Validar configuración
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("Faltan SMTP_USER o SMTP_PASS en .env.local. Simulación de envío exitoso.");
      console.log(`[EMAIL SIMULADO] Para: ${to || '(CCO)'}, CCO: ${Array.isArray(bcc) ? bcc.length + ' destinatarios' : bcc}, Asunto: ${subject}`);
      return NextResponse.json({ success: true, simulated: true });
    }

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
