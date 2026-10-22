const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const DEFAULT_SCHOOL_ID = 'esc-713-esquel';

const COLLECTIONS = [
  'usuarios',
  'profesores',
  'cursos',
  'alumnos',
  'horarios',
  'ausencias',
  'mesas_examen',
  'asistencias_alumnos_jornada',
  'asistencias_alumnos_materia',
  'notificaciones',
  'logs'
];

async function migrateDocuments() {
  console.log(`🚀 Asignando schoolId='${DEFAULT_SCHOOL_ID}' a todos los documentos existentes sin escuela...`);

  for (const colId of COLLECTIONS) {
    try {
      console.log(`\n⏳ Procesando colección '${colId}'...`);
      let offset = 0;
      let hasMore = true;
      let updatedCount = 0;

      while (hasMore) {
        const res = await databases.listDocuments(dbId, colId, [
          Query.limit(100),
          Query.offset(offset)
        ]);

        if (res.documents.length === 0) {
          hasMore = false;
          break;
        }

        for (const doc of res.documents) {
          if (!doc.schoolId) {
            try {
              // Limpiar metadatos de Appwrite antes de actualizar
              const data = { schoolId: DEFAULT_SCHOOL_ID };
              await databases.updateDocument(dbId, colId, doc.$id, data);
              updatedCount++;
            } catch (err) {
              console.error(`  ✗ Error actualizando doc ${doc.$id} en '${colId}':`, err.message);
            }
          }
        }

        offset += res.documents.length;
        if (offset >= res.total) {
          hasMore = false;
        }
      }

      console.log(`✅ Colección '${colId}': ${updatedCount} documentos actualizados con schoolId='${DEFAULT_SCHOOL_ID}'`);
    } catch (err) {
      console.error(`❌ Error en colección '${colId}':`, err.message);
    }
  }

  console.log('\n🎉 ¡Migración de documentos completada con éxito!');
}

migrateDocuments();
