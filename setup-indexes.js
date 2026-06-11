// Script para crear los índices necesarios en Appwrite.
// Ejecutar con: node setup-indexes.js
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function createIndex(collectionId, key, type, attributes) {
    try {
        await databases.createIndex(dbId, collectionId, key, type, attributes);
        console.log(`  ✓ Índice "${key}" creado en "${collectionId}"`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`  ~ Índice "${key}" ya existe en "${collectionId}"`);
        } else {
            console.error(`  ✗ Error en "${key}" (${collectionId}):`, e.message);
        }
    }
}

async function setupIndexes() {
    console.log('🔧 Creando índices necesarios...\n');

    // Colección usuarios
    await createIndex('usuarios', 'uid_idx',   'key', ['uid']);
    await createIndex('usuarios', 'email_idx', 'key', ['email']);
    await createIndex('usuarios', 'rol_idx',   'key', ['rol']);

    // Colección alumnos
    await createIndex('alumnos', 'email_idx', 'key', ['email']);
    await createIndex('alumnos', 'curso_idx', 'key', ['curso']);

    // Colección ausencias (usa el collection ID de .env)
    const ausenciasCol = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;
    if (ausenciasCol) {
        await createIndex(ausenciasCol, 'inicio_idx',  'key', ['inicio']);
        await createIndex(ausenciasCol, 'estado_idx',  'key', ['estado']);
        await createIndex(ausenciasCol, 'profId_idx',  'key', ['profId']);
    }

    console.log('\n✅ ¡Índices listos! Recargá la web en unos segundos.');
}

setupIndexes();
