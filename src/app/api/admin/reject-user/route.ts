import { NextResponse } from 'next/server';
import { Client, Databases, Users, Query } from 'node-appwrite';

export async function POST(request: Request) {
  try {
    const { userId, email, callerEmail } = await request.json();

    if (!userId && !email) {
      return NextResponse.json({ error: "Falta userId o email" }, { status: 400 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ error: "Configuración incompleta en el servidor Appwrite" }, { status: 500 });
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const db = new Databases(client);
    const usersService = new Users(client);

    const cleanEmail = email ? String(email).toLowerCase().trim() : "";
    let userUid = "";

    // 1. Eliminar de la colección 'usuarios'
    if (userId) {
      try {
        const userDoc = await db.getDocument(dbId, 'usuarios', userId);
        if (userDoc && userDoc.uid) userUid = userDoc.uid;
        await db.deleteDocument(dbId, 'usuarios', userId);
      } catch (err: any) {
        // Si no se encontró por ID, buscar por email
        if (cleanEmail) {
          try {
            const list = await db.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanEmail)]);
            for (const doc of list.documents) {
              if (doc.uid) userUid = doc.uid;
              await db.deleteDocument(dbId, 'usuarios', doc.$id);
            }
          } catch {}
        }
      }
    } else if (cleanEmail) {
      try {
        const list = await db.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanEmail)]);
        for (const doc of list.documents) {
          if (doc.uid) userUid = doc.uid;
          await db.deleteDocument(dbId, 'usuarios', doc.$id);
        }
      } catch {}
    }

    // 2. Eliminar de la colección 'alumnos' si existía
    if (cleanEmail) {
      try {
        const listAlumnos = await db.listDocuments(dbId, 'alumnos', [Query.equal('email', cleanEmail)]);
        for (const doc of listAlumnos.documents) {
          await db.deleteDocument(dbId, 'alumnos', doc.$id);
        }
      } catch {}
    }

    // 3. Eliminar de la colección 'profesores' si existía
    if (cleanEmail) {
      try {
        const listProfs = await db.listDocuments(dbId, 'profesores', [Query.equal('email', cleanEmail)]);
        for (const doc of listProfs.documents) {
          await db.deleteDocument(dbId, 'profesores', doc.$id);
        }
      } catch {}
    }

    // 4. Eliminar cuenta de autenticación de Appwrite si se conoce su UID
    if (userUid && !userUid.startsWith('PENDING_')) {
      try {
        await usersService.delete(userUid);
      } catch {}
    } else if (cleanEmail) {
      try {
        const authList = await usersService.list([Query.equal('email', cleanEmail)]);
        for (const authUser of authList.users) {
          await usersService.delete(authUser.$id);
        }
      } catch {}
    }

    // 5. Registrar en logs de auditoría
    try {
      await db.createDocument(dbId, 'logs', 'unique()', {
        usuarioEmail: callerEmail || 'admin',
        accion: 'RC_C', // Código compacto de 'Rechazó una solicitud de acceso'
        detalles: `Rechazó y eliminó solicitud de: ${cleanEmail || userId}`,
        fecha: new Date().toISOString()
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[reject-user] Error al rechazar usuario:", error);
    return NextResponse.json({ error: error.message || "Error al rechazar usuario" }, { status: 500 });
  }
}
