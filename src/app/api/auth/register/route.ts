import { NextResponse } from 'next/server';
import { Client, Users, Databases, ID, Query } from 'node-appwrite';
import { verifyOtpToken, verifyOtp, markTokenUsed, clearOtp } from '@/lib/otpStore';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const {
      email,
      code,
      token,
      tokens,
      nombres,
      apellidos,
      dni,
      telefono,
      password,
    } = await request.json();

    // 1. Validaciones básicas de campos
    if (!email || !code || !password || !nombres || !apellidos || !dni) {
      return NextResponse.json(
        { error: 'Todos los campos marcados como obligatorios deben ser completados.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const cleanDni = dni.toString().replace(/\D/g, '').trim();
    const fullName = `${nombres.trim()} ${apellidos.trim()}`;

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'El formato del correo electrónico no es válido.' }, { status: 400 });
    }

    if (cleanCode.length !== 6) {
      return NextResponse.json({ error: 'El código de verificación debe tener 6 dígitos numéricos.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    // 🛡️ SECURITY AUDIT REF: Protección contra Fuerza Bruta
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`register:ip:${clientIp}`, 10, 10 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos desde esta conexión. Esperá ${Math.ceil(ipCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    const emailCheck = checkRateLimit(`register:email:${cleanEmail}`, 6, 10 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos para este correo. Esperá ${Math.ceil(emailCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    // 2. Validación de Token OTP firmado (soporta lista de tokens por reenvío)
    let tokensList: string[] = [];
    if (Array.isArray(tokens)) {
      tokensList = tokens.filter(t => typeof t === 'string' && t.trim().length > 0);
    } else if (typeof token === 'string' && token.trim()) {
      tokensList = [token.trim()];
    }

    if (tokensList.length === 0) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/escuelainfo_otp_token=([^;]+)/);
      if (match) {
        tokensList = [decodeURIComponent(match[1])];
      }
    }

    let verification: { valid: boolean; token?: string; error?: string } = { valid: false };

    if (tokensList.length > 0) {
      verification = verifyOtpToken(cleanEmail, cleanCode, tokensList);
    }

    // Fallback en memoria local
    if (!verification.valid) {
      const memCheck = verifyOtp(cleanEmail, cleanCode);
      if (memCheck.valid) {
        verification = memCheck;
      }
    }

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Código incorrecto o vencido. Verificá los 6 dígitos recibidos en tu correo.' },
        { status: 400 }
      );
    }

    // 3. Conectar a Appwrite Server SDK con Admin Key
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ error: 'Error de configuración del servidor Appwrite.' }, { status: 500 });
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const users = new Users(client);
    const databases = new Databases(client);

    // 4. Verificar existencia de usuario en Appwrite Auth y colección usuarios
    let targetUserId = '';
    const authList = await users.list([Query.equal('email', cleanEmail)]);
    const profileList = await databases.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanEmail)]);

    if (authList.total > 0 && profileList.total > 0) {
      const existingProfile = profileList.documents[0];
      const rol = existingProfile.rol || '';
      if (rol === 'pe' || rol === 'p_a' || rol === 'p_p' || rol.startsWith('pendiente')) {
        return NextResponse.json(
          { error: 'Tu solicitud de registro ya fue enviada previamente y se encuentra a la espera de aprobación del preceptor.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Ya existe una cuenta activa registrada con este correo electrónico. Por favor iniciá sesión con tu contraseña.' },
        { status: 409 }
      );
    }

    if (authList.total > 0 && profileList.total === 0) {
      // Auto-reparación de cuenta huérfana de intento anterior interrumpido
      targetUserId = authList.users[0].$id;
      try {
        await users.updatePassword(targetUserId, password);
        await users.updateName(targetUserId, fullName);
        await users.updateEmailVerification(targetUserId, true);
      } catch (patchErr: any) {
        console.warn('Advertencia actualizando usuario existente en Auth:', patchErr?.message);
      }
    } else {
      // Crear nuevo usuario en Appwrite Auth
      const newUser = await users.create({
        userId: ID.unique(),
        email: cleanEmail,
        password: password,
        name: fullName,
      });
      targetUserId = newUser.$id;
      try {
        await users.updateEmailVerification(targetUserId, true);
      } catch {}
    }

    // 5. Verificar si corresponde a un Docente pre-registrado
    const teacherDocs = await databases.listDocuments(dbId, 'profesores', [Query.equal('email', cleanEmail)]);
    const isTeacher = teacherDocs.total > 0;

    if (isTeacher) {
      const preTeacher = teacherDocs.documents[0];

      // Actualizar o crear perfil de docente en 'usuarios'
      if (profileList.total > 0) {
        await databases.updateDocument(dbId, 'usuarios', profileList.documents[0].$id, {
          uid: targetUserId,
          nombre: fullName,
          rol: 'p', // Formato compacto institucional
        });
      } else {
        await databases.createDocument(dbId, 'usuarios', ID.unique(), {
          uid: targetUserId,
          email: cleanEmail,
          nombre: fullName,
          rol: 'p',
          cursos: '[]',
        });
      }

      // Actualizar datos del docente
      if (preTeacher?.$id) {
        await databases.updateDocument(dbId, 'profesores', preTeacher.$id, {
          nombre: fullName,
          dni: cleanDni,
        });
      }

      // Log de auditoría
      try {
        await databases.createDocument(dbId, 'logs', ID.unique(), {
          usuarioEmail: cleanEmail,
          accion: 'REGISTRO_DOCENTE_EXITOSO',
          detalles: `Registro de docente completado con verificación de correo. UID: ${targetUserId}`,
          fecha: new Date().toISOString(),
          ip: clientIp,
        });
      } catch {}

      if (verification.token) markTokenUsed(verification.token);
      clearOtp(cleanEmail);
      resetRateLimit(`register:email:${cleanEmail}`);

      const response = NextResponse.json({
        success: true,
        isTeacher: true,
        message: '¡Registro docente completado con éxito! Iniciando sesión...',
      });
      response.cookies.delete('escuelainfo_otp_token');
      return response;
    }

    // 6. Flujo estándar de Alumnos / Usuarios pendientes
    // Validar que el DNI no pertenezca a otro alumno
    const dniCheck = await databases.listDocuments(dbId, 'alumnos', [Query.equal('dni', cleanDni)]);
    if (dniCheck.total > 0 && dniCheck.documents[0].email && dniCheck.documents[0].email !== cleanEmail) {
      return NextResponse.json(
        { error: 'Ya existe un alumno registrado con ese número de DNI en la institución.' },
        { status: 400 }
      );
    }

    // Crear o vincular perfil institucional en 'usuarios'
    if (profileList.total > 0) {
      await databases.updateDocument(dbId, 'usuarios', profileList.documents[0].$id, {
        uid: targetUserId,
        nombre: fullName,
      });
    } else {
      await databases.createDocument(dbId, 'usuarios', ID.unique(), {
        uid: targetUserId,
        email: cleanEmail,
        nombre: fullName,
        rol: 'pe', // Formato compacto para pendiente
        cursos: '[]',
      });
    }

    // Registrar o actualizar datos en la colección 'alumnos'
    if (dniCheck.total > 0) {
      await databases.updateDocument(dbId, 'alumnos', dniCheck.documents[0].$id, {
        nombre: fullName,
        email: cleanEmail,
      });
    } else {
      await databases.createDocument(dbId, 'alumnos', ID.unique(), {
        nombre: fullName,
        dni: cleanDni,
        curso: 'pendiente',
        email: cleanEmail,
      });
    }

    // Log de auditoría
    try {
      await databases.createDocument(dbId, 'logs', ID.unique(), {
        usuarioEmail: cleanEmail,
        accion: 'REGISTRO_PENDIENTE_NUEVO',
        detalles: `Nuevo usuario registrado pendiente de aprobación. DNI: ${cleanDni}, UID: ${targetUserId}`,
        fecha: new Date().toISOString(),
        ip: clientIp,
      });
    } catch {}

    // Invalidar token OTP usado y limpiar límites
    if (verification.token) markTokenUsed(verification.token);
    clearOtp(cleanEmail);
    resetRateLimit(`register:email:${cleanEmail}`);

    const response = NextResponse.json({
      success: true,
      isTeacher: false,
      message: '¡Registro completado! Tu solicitud quedó pendiente de aprobación por el preceptor.',
    });
    response.cookies.delete('escuelainfo_otp_token');
    return response;
  } catch (error: any) {
    console.error('Error en endpoint de registro seguro:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al completar el registro. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
