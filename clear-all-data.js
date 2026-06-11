// Script para vaciar todos los datos de prueba de Appwrite (Alumnos, Profesores, Horarios, Cursos, Logs, Ausencias)
// Preservando la cuenta de administrador principal.
//
// Ejecutar con: node --env-file=.env.setup clear-all-data.js

import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DB_ID = process.env.APPWRITE_DATABASE_ID || '';
const AUSENCIAS_COL_ID = process.env.APPWRITE_COLLECTION_ID || '';

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DB_ID) {
  console.error('❌ Faltan variables en .env.setup. Asegúrate de configurar una API Key activa primero.');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

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
    
    // Obtener documentos de la colección (límite 100 por lote)
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
      
      // Si la respuesta tiene menos de 100, terminamos
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
        console.log(`  ~ Preservando perfil de administrador: ${doc.email}`);
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

async function main() {
  console.log('🧹 INICIANDO LIMPIEZA DE DATOS DE PRUEBA EN APPWRITE...');
  console.log(`Database ID: ${DB_ID}`);
  
  // Limpiar las colecciones normales
  for (const col of COLLECTIONS) {
    await clearCollection(col.id, col.name);
  }

  // Limpiar usuarios con filtro especial
  await clearUsuarios();

  console.log('\n🎉 ¡Limpieza completa! La base de datos está lista para producción.');
}

main();
