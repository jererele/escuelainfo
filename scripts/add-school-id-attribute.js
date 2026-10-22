const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

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

async function addSchoolIdAttributes() {
  console.log(`🚀 Agregando atributo 'schoolId' a las colecciones de la base de datos: ${dbId}...`);

  for (const colId of COLLECTIONS) {
    try {
      console.log(`\n⏳ Creando atributo 'schoolId' en '${colId}'...`);
      // size: 100, required: false, default: 'esc-713-esquel'
      await databases.createStringAttribute(dbId, colId, 'schoolId', 100, false, 'esc-713-esquel');
      console.log(`✅ Atributo 'schoolId' creado con éxito en '${colId}'`);
    } catch (err) {
      if (err.code === 409 || err.type === 'attribute_already_exists') {
        console.log(`~ 'schoolId' ya existía en '${colId}'`);
      } else {
        console.error(`❌ Error en '${colId}':`, err.message);
      }
    }
  }

  console.log('\n⏳ Esperando 5 segundos para que Appwrite termine de indexar los atributos...');
  await new Promise(r => setTimeout(r, 5000));

  for (const colId of COLLECTIONS) {
    try {
      console.log(`⏳ Creando índice 'schoolId_idx' en '${colId}'...`);
      await databases.createIndex(dbId, colId, 'schoolId_idx', 'key', ['schoolId']);
      console.log(`✅ Índice 'schoolId_idx' creado en '${colId}'`);
    } catch (err) {
      if (err.code === 409 || err.type === 'index_already_exists') {
        console.log(`~ Índice 'schoolId_idx' ya existía en '${colId}'`);
      } else {
        console.error(`~ No se pudo crear índice en '${colId}' (${err.message})`);
      }
    }
  }

  console.log('\n🎉 ¡Proceso finalizado! Todas las colecciones tienen soporte para particionamiento por escuela.');
}

addSchoolIdAttributes();
