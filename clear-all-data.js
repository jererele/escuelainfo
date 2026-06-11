// Script para vaciar todos los datos de prueba de Appwrite (Alumnos, Profesores, Horarios, Cursos, Logs, Ausencias)
// Y también todas las cuentas de Autenticación (Auth Users), preservando la cuenta de administrador principal.
//
// Ejecutar con: node --env-file=.env.local clear-all-data.js

import { Client, Databases, Users, Query } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DB_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const AUSENCIAS_COL_ID = process.env.APPWRITE_COLLECTION_ID || process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DB_ID) {
  console.error('❌ Faltan variables en la configuración. Asegúrate de tener tu API Key activa.');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const databases = new Databases(client);
const usersService = new Users(client);

const COLLECTIONS = [
  { id: 'alumnos', name: 'Alumnos' },
  { id: 'profesores', name: 'Profesores' },
  { id: 'horarios', name: 'Horarios' },
  { id: 'cursos', name: 'Cursos' },
  { id: 'logs', name: 'Logs de Auditoría' },
];

if (AUSENCIAS_COL_ID) {
  COLLECTIONS.push({ id: AUSENCIAS_COL_ID, name: 'Ausencias' });
}

// Cuenta de administración a preservar para no perder el acceso
const ADMIN_EMAIL = 'jeree.castroo10@gmail.com';

async function clearCollection(colId, colName) {
  try {
    console.log(`\n⏳ Vaciando colección: ${colName} (${colId})...`);
    let hasMore = true;
    let totalDeleted = 0;

    while (hasMore) {
      const response = await databases.listDocuments(DB_ID, colId, [Query.limit(100)]);
      const docs = response.documents;

      if (docs.length === 0) {
        hasMore = false;
        break;
      }

      for (const doc of docs) {
        await databases.deleteDocument(DB_ID, colId, doc.$id);
        totalDeleted++;
      }
      
      if (docs.length < 100) {
        hasMore = false;
      }
    }

    console.log(`✅ Colección ${colName} vaciada. Se eliminaron ${totalDeleted} documentos.`);
  } catch (err) {
    if (err.code === 404) {
      console.warn(`⚠️  Colección ${colName} (${colId}) no encontrada, saltando...`);
    } else {
      console.error(`❌ Error en ${colName}:`, err.message);
    }
  }
}

async function clearUsuarios() {
  const colId = 'usuarios';
  const colName = 'Usuarios/Perfiles';
  try {
    console.log(`\n⏳ Vaciando colección: ${colName} (${colId}) [Preservando Administrador]...`);
    const response = await databases.listDocuments(DB_ID, colId, [Query.limit(100)]);
    let totalDeleted = 0;

    for (const doc of response.documents) {
      if (doc.email && doc.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        console.log(`  ~ Preservando perfil de base de datos del administrador: ${doc.email}`);
        continue;
      }
      await databases.deleteDocument(DB_ID, colId, doc.$id);
      totalDeleted++;
    }

    console.log(`✅ Colección ${colName} procesada. Se eliminaron ${totalDeleted} perfiles de prueba.`);
  } catch (err) {
    if (err.code === 404) {
      console.warn(`⚠️  Colección ${colName} no encontrada, saltando...`);
    } else {
      console.error(`❌ Error en ${colName}:`, err.message);
    }
  }
}

async function clearAuthUsers() {
  try {
    console.log('\n⏳ Vaciando cuentas de Autenticación (Auth Users)...');
    let totalDeleted = 0;
    
    // Obtener los usuarios registrados en Auth (límite máximo 100 por consulta)
    const response = await usersService.list();
    const authUsers = response.users;

    for (const authUser of authUsers) {
      const email = authUser.email || '';
      // Preservar la cuenta principal del admin
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        console.log(`  ~ Preservando cuenta de autenticación del administrador: ${email}`);
        continue;
      }
      
      await usersService.delete(authUser.$id);
      totalDeleted++;
    }
    
    console.log(`✅ Cuentas de Autenticación limpias. Se eliminaron ${totalDeleted} usuarios.`);
  } catch (err) {
    console.error('❌ Error al limpiar cuentas de Autenticación:', err.message);
    console.log('💡 Recuerda marcar "users.read" y "users.write" en los Scopes de tu API Key en la consola.');
  }
}

async function main() {
  console.log('🧹 INICIANDO LIMPIEZA DE DATOS Y CUENTAS DE PRUEBA EN APPWRITE...');
  console.log(`Database ID: ${DB_ID}`);
  
  // 1. Limpiar colecciones de base de datos
  for (const col of COLLECTIONS) {
    await clearCollection(col.id, col.name);
  }

  // 2. Limpiar usuarios en base de datos
  await clearUsuarios();

  // 3. Limpiar cuentas de autenticación (Auth)
  await clearAuthUsers();

  console.log('\n🎉 ¡Limpieza completa! La base de datos y Auth están listos para producción.');
}

main();
