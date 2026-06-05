// Script para configurar permisos seguros en todas las colecciones de Appwrite.
// Ejecutar con: node --env-file=.env.setup setup-permissions.js
//
// Efecto: reemplaza "Any → CRUD" por "users (autenticados) → CRUD"
// Esto significa que solo usuarios que iniciaron sesión pueden acceder a los datos.

import { Client, Databases, Permission, Role } from 'node-appwrite';

const ENDPOINT   = process.env.APPWRITE_ENDPOINT   || '';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY    = process.env.APPWRITE_API_KEY    || '';
const DB_ID      = process.env.APPWRITE_DATABASE_ID || '';

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DB_ID) {
  console.error('❌ Faltan variables en .env.setup. Completá el archivo primero.');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

// IDs de las colecciones (deben coincidir con los de Appwrite)
const COLLECTIONS = [
  { id: 'usuarios',   name: 'Usuarios/Perfiles' },
  { id: 'logs',       name: 'Logs de Auditoría' },
  { id: 'profesores', name: 'Profesores' },
  { id: 'horarios',   name: 'Horarios' },
  { id: 'alumnos',    name: 'Alumnos' },
  { id: 'cursos',     name: 'Cursos' },
];

// ID de la colección principal de ausencias (viene del .env.setup)
const AUSENCIAS_COL_ID = process.env.APPWRITE_COLLECTION_ID || '';

if (AUSENCIAS_COL_ID) {
  COLLECTIONS.push({ id: AUSENCIAS_COL_ID, name: 'Ausencias' });
}

// Permisos: solo usuarios autenticados (no "cualquier persona")
const SECURE_PERMISSIONS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

async function updateCollectionPermissions(colId, colName) {
  try {
    // Obtener la colección actual para preservar el nombre y documentSecurity
    const col = await databases.getCollection(DB_ID, colId);
    
    await databases.updateCollection(
      DB_ID,
      colId,
      col.name,           // mantener el nombre original
      SECURE_PERMISSIONS,
      col.documentSecurity ?? false
    );
    console.log(`  ✅ ${colName} (${colId}) → Solo usuarios autenticados`);
  } catch (err) {
    if (err.code === 404) {
      console.warn(`  ⚠️  ${colName} (${colId}) → No encontrada, saltando...`);
    } else {
      console.error(`  ❌ ${colName} (${colId}) → Error: ${err.message}`);
    }
  }
}

async function main() {
  console.log('\n🔐 Configurando permisos seguros en Appwrite...\n');
  console.log(`   Proyecto: ${PROJECT_ID}`);
  console.log(`   Base de datos: ${DB_ID}`);
  console.log(`   Colecciones a actualizar: ${COLLECTIONS.length}\n`);

  for (const col of COLLECTIONS) {
    await updateCollectionPermissions(col.id, col.name);
  }

  console.log(`
✅ ¡Listo! Todas las colecciones actualizadas.

Antes: cualquier persona (sin cuenta) podía leer/escribir datos.
Ahora: solo usuarios con sesión activa pueden acceder.

Si algo falló con el código 404, verificá que el ID de la colección
en .env.setup coincida con el real en la consola de Appwrite.
`);
}

main();
