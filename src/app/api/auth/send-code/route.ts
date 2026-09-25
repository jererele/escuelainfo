import { NextResponse } from 'next/server';
import { Client, Users, Databases, Query } from 'node-appwrite';
import nodemailer from 'nodemailer';
import { setOtp, generateOtpToken } from '@/lib/otpStore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const { email, type = 'reset' } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Debes proporcionar un correo electrónico válido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 🛡️ SECURITY AUDIT REF: Protección contra Fuerza Bruta y Spam (Rate Limiting)
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`send-code:ip:${clientIp}`, 8, 10 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes desde esta conexión. Por favor esperá ${Math.ceil(ipCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    const emailCheck = checkRateLimit(`send-code:email:${cleanEmail}`, 3, 10 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { error: `Se superó el límite de códigos enviados a esta casilla. Por favor esperá ${Math.ceil(emailCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    // 1. Verificar existencia del usuario en Appwrite
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ error: 'Error de configuración del servidor Appwrite.' }, { status: 500 });
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const users = new Users(client);

    const databases = new Databases(client);
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    let userFound = false;
    let hasCompleteProfile = false;
    try {
      const list = await users.list([Query.equal('email', cleanEmail)]);
      if (list.total > 0) {
        userFound = true;
        // Comprobar si existe perfil en la colección usuarios
        const uDocs = await databases.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanEmail)]);
        if (uDocs.total > 0) {
          hasCompleteProfile = true;
        }
      }
    } catch (e: any) {
      console.error('Error buscando usuario en Appwrite:', e?.message);
    }

    // Solo bloquear si el usuario existe y además tiene su perfil formalmente creado
    if (type === 'register' && userFound && hasCompleteProfile) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este correo. Por favor iniciá sesión con tu contraseña.' },
        { status: 409 }
      );
    }

    if (type === 'reset' && !userFound) {
      return NextResponse.json(
        { error: 'No se encontró ninguna cuenta registrada con este correo electrónico.' },
        { status: 404 }
      );
    }

    // 2. Generar código numérico de 6 dígitos y token criptográfico firmado
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(cleanEmail, code, 10);
    const token = generateOtpToken(cleanEmail, code, 10);

    // Guardar también en la base de datos Appwrite como respaldo persistente si existe
    try {
      const uDocs = await databases.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanEmail)]);
      if (uDocs.total > 0) {
        const expiresAt = Date.now() + 10 * 60 * 1000;
        await databases.updateDocument(dbId, 'usuarios', uDocs.documents[0].$id, {
          otpCode: `${code}:${expiresAt}`,
        });
      }
    } catch (e: any) {
      console.warn('No se pudo guardar otpCode en documento de usuario:', e?.message);
    }

    // 3. Preparar y enviar el correo con Nodemailer
    const smtpUser = process.env.SMTP_USER?.replace(/['"\s]/g, '');
    const smtpPass = process.env.SMTP_PASS?.replace(/['"\s]/g, '');

    const isRegister = type === 'register';
    const emailSubtitle = isRegister ? 'Escuela N° 713 · Validación de Correo' : 'Escuela N° 713 · Seguridad';
    const emailTitle = isRegister ? 'Código de Registro Institucional' : 'Código de Verificación';
    const emailText = isRegister
      ? 'Recibimos una solicitud para crear tu cuenta en la plataforma escolar EscuelaInfo. Utilizá el siguiente código de seguridad de 6 dígitos para validar tu correo electrónico y completar tu registro:'
      : 'Recibimos una solicitud para modificar la contraseña de tu cuenta institucional. Utilizá el siguiente código de seguridad de 6 dígitos para confirmar tu identidad:';
    const emailInstructions = isRegister
      ? 'Ingresá este código en el formulario de registro para verificar tu casilla y activar tu cuenta.'
      : 'Ingresá este código en la pantalla donde estabas realizando el trámite para establecer tu nueva clave.';
    const emailSubject = isRegister
      ? `Tu código de verificación de EscuelaInfo: ${code}`
      : `Código de restablecimiento de contraseña: ${code} · EscuelaInfo`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&display=swap');
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; margin: 0; padding: 32px 16px; }
          .container { max-width: 500px; margin: 0 auto; background-color: #111e30; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 28px; padding: 36px 28px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .logo { font-size: 24px; font-weight: 900; color: #f8fafc; margin-bottom: 8px; }
          .logo span { color: #10B981; }
          .subtitle { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
          .text { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; }
          .code-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px dashed #10B981; border-radius: 24px; padding: 24px 28px; margin: 24px auto; display: inline-block; }
          .code { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 44px; font-weight: 800; letter-spacing: 12px; padding-left: 12px; color: #10B981; margin: 0; font-variant-numeric: tabular-nums; line-height: 1.2; }
          .expiry { font-size: 12px; color: #f59e0b; font-weight: 700; margin-top: 10px; }
          .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Escuela<span>Info</span></div>
          <div class="subtitle">${emailSubtitle}</div>
          <div class="title">${emailTitle}</div>
          <div class="text">
            ${emailText}
          </div>
          <div class="code-box">
            <div class="code" style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 44px; font-weight: 800; letter-spacing: 12px; padding-left: 12px; color: #10B981; margin: 0; font-variant-numeric: tabular-nums; line-height: 1.2;">${code}</div>
            <div class="expiry">Válido durante 10 minutos</div>
          </div>
          <div class="text" style="font-size: 12px; color: #94a3b8;">
            ${emailInstructions}
            <br><br>
            <span style="color: #64748b; font-size: 11px;">(Si solicitaste más de un código por reenvío, podés utilizar cualquiera de los recibidos recientemente).</span>
          </div>
          <div class="footer">
            Si vos no solicitaste este código, podés ignorar este correo de forma segura.<br>
            © ${new Date().getFullYear()} Escuela N° 713 &quot;Juan Abdala Chayep&quot; · Esquel, Chubut.
          </div>
        </div>
      </body>
      </html>
    `;

    if (!smtpUser || !smtpPass) {
      console.log(`[CÓDIGO OTP SIMULADO] Email: ${cleanEmail} (${type}) -> Código: ${code}`);
      const res = NextResponse.json({
        success: true,
        message: 'Código de verificación generado (Modo simulación por falta de SMTP_USER/SMTP_PASS).',
        simulated: true,
        code, // Permite continuar en desarrollo o si faltan las credenciales en Vercel
        token,
      });
      res.cookies.set('escuelainfo_otp_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60,
        path: '/',
      });
      return res;
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
      from: process.env.SMTP_FROM || `"Escuela N° 713 (EscuelaInfo)" <${smtpUser}>`,
      to: cleanEmail,
      subject: emailSubject,
      text: `${emailTitle}: ${code}. Válido por 10 minutos. Si solicitaste múltiples envíos, cualquiera de los códigos recientes es válido.`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'Priority': 'Urgent',
        'X-Mailer': 'EscuelaInfo Official Authentication System',
      },
    });

    const res = NextResponse.json({
      success: true,
      message: `Enviamos un código de 6 dígitos a ${cleanEmail}. Revisá tu bandeja de entrada o spam.`,
      token,
    });
    res.cookies.set('escuelainfo_otp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    });
    return res;
  } catch (error: any) {
    console.error('Error enviando código de verificación:', error);
    return NextResponse.json(
      { error: 'No se pudo enviar el correo de verificación. Intentá más tarde.', details: error.message },
      { status: 500 }
    );
  }
}
