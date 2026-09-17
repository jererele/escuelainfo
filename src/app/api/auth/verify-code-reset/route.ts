import { NextResponse } from 'next/server';
import { Client, Users, Databases, ID, Query } from 'node-appwrite';
import { verifyOtp } from '@/lib/otpStore';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Debes completar el correo, el código de 6 dígitos y la nueva contraseña.' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Validar código con nuestro gestor OTP
    const verification = verifyOtp(cleanEmail, cleanCode);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || 'Código incorrecto o expirado.' }, { status: 400 });
    }

    // 2. Conectar a Appwrite Server SDK con Admin Key
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

    // 3. Buscar el usuario por email
    const list = await users.list([Query.equal('email', cleanEmail)]);
    if (list.total === 0 || !list.users[0]) {
      return NextResponse.json({ error: 'No se encontró la cuenta de usuario para actualizar la contraseña.' }, { status: 404 });
    }

    const targetUser = list.users[0];

    // 4. Actualizar la contraseña en el servicio de Auth de Appwrite
    await users.updatePassword(targetUser.$id, newPassword);

    // 5. Registrar log de auditoría
    try {
      await databases.createDocument(dbId, 'logs', ID.unique(), {
        usuarioEmail: cleanEmail,
        accion: 'CAMBIO_PASSWORD_OTP',
        detalles: 'Contraseña actualizada con éxito mediante código de verificación por correo.',
        fecha: new Date().toISOString(),
        ip: 'API_ROUTE',
      });
    } catch (logErr) {
      console.warn('No se pudo registrar el log de auditoría de cambio de password:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: '¡Tu contraseña ha sido actualizada con éxito! Ya podés ingresar.',
    });
  } catch (error: any) {
    console.error('Error al verificar código y actualizar contraseña:', error);
    return NextResponse.json(
      { error: error?.message || 'Ocurrió un error al actualizar la contraseña. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
