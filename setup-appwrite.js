// Script de configuración inicial de Appwrite.
// Ejecutar UNA SOLA VEZ con: node --env-file=.env.setup setup-appwrite.js
//
// Crear un archivo .env.setup (NO commitear) con:
//   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
//   APPWRITE_PROJECT_ID=tu_project_id
//   APPWRITE_API_KEY=tu_api_key_de_admin
//   APPWRITE_DATABASE_ID=tu_database_id
//   APPWRITE_COLLECTION_ID=tu_collection_id

import { Client, Databases } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

const ENDPOINT   = process.env.APPWRITE_ENDPOINT   || '';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY    = process.env.APPWRITE_API_KEY    || '';
const DB_ID      = process.env.APPWRITE_DATABASE_ID || '';
const COL_ID     = process.env.APPWRITE_COLLECTION_ID || '';

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DB_ID || !COL_ID) {
  console.error('❌ Faltan variables de entorno. Creá el archivo .env.setup con las credenciales.');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const databases = new Databases(client);

async function setupAppwriteDatabase() {
  try {
    console.log(`✅ Usando Base de datos: ${DB_ID}`);
    console.log(`✅ Usando Colección: ${COL_ID}`);
    console.log('⏳ Creando atributos...');

    const createAttr = async (promise, name) => {
      try {
        await promise;
        console.log(`  ✓ ${name}`);
      } catch (e) {
        if (e.type === 'attribute_already_exists') {
          console.log(`  ~ ${name} (ya existía)`);
        } else {
          console.error(`  ✗ ${name}:`, e.message);
        }
      }
    };

    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'profId',     100, true),  'profId');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'profNombre', 255, true),  'profNombre');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'tipo',        50, true),  'tipo');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'inicio',     100, true),  'inicio');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'fin',        100, true),  'fin');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'motivo',     500, false), 'motivo');
    await createAttr(databases.createBooleanAttribute(DB_ID, COL_ID, 'cert', false, false, false), 'cert');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'estado',      20, true),  'estado');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'fechaReg',   100, true),  'fechaReg');
    await createAttr(databases.createStringAttribute(DB_ID, COL_ID, 'materias',   255, true, undefined, true), 'materias');

    // Guardar variables públicas en .env.local (sin la API Key)
    const envContent =
`NEXT_PUBLIC_APPWRITE_ENDPOINT=${ENDPOINT}
NEXT_PUBLIC_APPWRITE_PROJECT_ID=${PROJECT_ID}
NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID}
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=${COL_ID}
`;
    fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent, { flag: 'w' });
    console.log('\n✅ .env.local actualizado (sin credenciales de admin).');
    console.log('\n🎉 ¡Listo! Revisá los permisos de cada colección en la consola de Appwrite.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupAppwriteDatabase();
