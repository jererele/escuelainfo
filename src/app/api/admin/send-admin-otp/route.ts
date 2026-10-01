import { NextResponse } from 'next/server';
import { Client, Account, Databases, Query } from 'node-appwrite';
import nodemailer from 'nodemailer';
import { setOtp, generateOtpToken } from '@/lib/otpStore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const MASTER_ADMIN_EMAIL = 'jeree.castroo10@gmail.com';

export async function POST(request: Request) {
  try {
    const { targetUserEmail, targetUserName = '' } = await request.json();

    if (!targetUserEmail || typeof targetUserEmail !== 'string') {
      return NextResponse.json(
        { error: 'Debes proporcionar el correo electrónico del usuario a promover.' },
        { status: 400 }
      );
    }

    const cleanTargetEmail = targetUserEmail.trim().toLowerCase();

    // 1. Verificación de identidad y sesión del operador solicitante mediante JWT
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ error: 'Configuración incompleta en el servidor Appwrite.' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
      return NextResponse.json(
        { error: 'Petición no autorizada: falta token de sesión institucional (JWT).' },
        { status: 401 }
      );
    }

    let callerEmail = '';
    let callerName = '';
    try {
      const authClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
      const authAccount = new Account(authClient);
      const sessionUser = await authAccount.get();
      callerEmail = (sessionUser.email || '').toLowerCase().trim();
      callerName = sessionUser.name || callerEmail;
    } catch {
      return NextResponse.json(
        { error: 'Sesión institucional inválida o expirada. Por favor vuelva a iniciar sesión.' },
        { status: 401 }
      );
    }

    // 2. Validar que el operador sea administrador o directivo en la base de datos
    const serverClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const db = new Databases(serverClient);
    const callerDocs = await db.listDocuments(dbId, 'usuarios', [Query.equal('email', callerEmail)]);
    if (callerDocs.total === 0) {
      return NextResponse.json(
        { error: 'No se encontraron permisos registrados para el operador solicitante.' },
        { status: 403 }
      );
    }
    const callerRole = (callerDocs.documents[0].rol || '').toLowerCase().trim();
    const isAllowedCaller = callerRole === 'admin' || callerRole === 'ad';
    if (!isAllowedCaller) {
      return NextResponse.json(
        { error: 'Solo un Administrador activo tiene autorización para solicitar el código de asignación de Administrador.' },
        { status: 403 }
      );
    }

    // 3. Rate limiting (anti-spam / anti-bombing)
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`send-admin-otp:ip:${clientIp}`, 6, 10 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes desde esta IP. Por favor esperá ${Math.ceil(ipCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    const emailCheck = checkRateLimit(`send-admin-otp:target:${cleanTargetEmail}`, 4, 10 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes de código para este usuario. Esperá ${Math.ceil(emailCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    // 4. Generar código numérico seguro de 6 dígitos y token criptográfico firmado
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(MASTER_ADMIN_EMAIL, code, 10);
    const token = generateOtpToken(MASTER_ADMIN_EMAIL, code, 10);

    // 5. Preparar correo de notificación y autorización
    const smtpUser = process.env.SMTP_USER?.replace(/['"\s]/g, '');
    const smtpPass = process.env.SMTP_PASS?.replace(/['"\s]/g, '');

    const emailSubject = `Código de Autorización: ${code} · Asignación de Administrador en EscuelaInfo`;
    const formattedDate = new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date());

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&display=swap');
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; margin: 0; padding: 32px 16px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #111e30; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 28px; padding: 36px 28px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
          .shield-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; color: #f8fafc; margin-bottom: 8px; }
          .logo span { color: #10B981; }
          .title { font-size: 22px; font-weight: 900; color: #ffffff; margin-bottom: 12px; line-height: 1.3; }
          .warning-box { background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; padding: 14px 16px; margin: 20px 0; text-align: left; }
          .warning-title { font-size: 13px; font-weight: 800; color: #f87171; margin-bottom: 4px; }
          .warning-text { font-size: 12px; color: #cbd5e1; line-height: 1.5; margin: 0; }
          .info-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; margin: 18px 0; text-align: left; }
          .info-row { background: #0c1626; border-radius: 10px; }
          .info-label { padding: 10px 14px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; width: 40%; border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
          .info-val { padding: 10px 14px; font-size: 13px; font-weight: 700; color: #f1f5f9; border-top-right-radius: 10px; border-bottom-right-radius: 10px; word-break: break-all; }
          .code-box { background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%); border: 2px dashed #ef4444; border-radius: 24px; padding: 22px 28px; margin: 24px auto; display: inline-block; }
          .code { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 46px; font-weight: 900; letter-spacing: 12px; padding-left: 12px; color: #f87171; margin: 0; font-variant-numeric: tabular-nums; line-height: 1.1; }
          .expiry { font-size: 12px; color: #fbbf24; font-weight: 700; margin-top: 10px; }
          .footer { font-size: 11px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="shield-badge">🛡️ Seguridad Institucional Máxima</div>
          <div class="logo">Escuela<span>Info</span></div>
          <div class="title">Autorización para Asignar Administrador</div>
          
          <div class="warning-box">
            <div class="warning-title">⚠️ Acción de Alto Privilegio Solicitada</div>
            <p class="warning-text">
              Se ha iniciado una solicitud para otorgar rol de <strong>Administrador (Acceso Total)</strong> en la plataforma.
              Solo vos como titular podés validar este ascenso ingresando el código a continuación.
            </p>
          </div>

          <table class="info-table">
            <tr class="info-row">
              <td class="info-label">Usuario a Promover</td>
              <td class="info-val">${targetUserName ? `${targetUserName} (${cleanTargetEmail})` : cleanTargetEmail}</td>
            </tr>
            <tr class="info-row">
              <td class="info-label">Solicitado por</td>
              <td class="info-val">${callerName} (${callerEmail})</td>
            </tr>
            <tr class="info-row">
              <td class="info-label">Fecha y Hora</td>
              <td class="info-val">${formattedDate}</td>
            </tr>
          </table>

          <div class="code-box">
            <div class="code">${code}</div>
            <div class="expiry">Válido durante 10 minutos</div>
          </div>

          <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 12px;">
            Ingresá este código en la ventana de confirmación del panel de control para autorizar la designación de administrador.
            <br><strong style="color: #f87171;">Si vos no autorizaste ni reconocés esta solicitud, no compartas este código bajo ninguna circunstancia.</strong>
          </div>

          <div class="footer">
            Mensaje automático de seguridad emitido por el sistema institucional EscuelaInfo.<br>
            © ${new Date().getFullYear()} Escuela N° 713 &quot;Juan Abdala Chayep&quot; · Esquel, Chubut.
          </div>
        </div>
      </body>
      </html>
    `;

    // 6. Enviar vía SMTP o simular si estamos en desarrollo
    if (!smtpUser || !smtpPass) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[CRITICAL] Missing SMTP_USER or SMTP_PASS in production environment.');
        return NextResponse.json(
          { error: 'El servicio de correo no está configurado en el servidor de producción. Contacte al soporte.' },
          { status: 503 }
        );
      }

      console.log(`[CÓDIGO OTP ADMIN SIMULADO DEV] Destino: ${MASTER_ADMIN_EMAIL} | Target: ${cleanTargetEmail} | Código: ${code}`);
      return NextResponse.json({
        success: true,
        message: `Código de verificación generado (Simulado en entorno de desarrollo para ${MASTER_ADMIN_EMAIL}).`,
        simulated: true,
        code,
        token,
        targetEmail: MASTER_ADMIN_EMAIL,
      });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Escuela N° 713 (Seguridad)" <${smtpUser}>`,
      to: MASTER_ADMIN_EMAIL,
      subject: emailSubject,
      text: `Código de Autorización de Administrador: ${code}. Solicitado para: ${cleanTargetEmail} por ${callerEmail}. Válido por 10 minutos.`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'Priority': 'Urgent',
        'X-Mailer': 'EscuelaInfo Master Security System',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Enviamos un código de 6 dígitos a ${MASTER_ADMIN_EMAIL}. Revisá tu bandeja de entrada o spam.`,
      token,
      targetEmail: MASTER_ADMIN_EMAIL,
    });
  } catch (error: any) {
    console.error('Error al enviar código OTP de administrador:', error);
    return NextResponse.json(
      { error: 'No se pudo enviar el correo de verificación. Intentá más tarde.', details: error.message },
      { status: 500 }
    );
  }
}
