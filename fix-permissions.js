const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function fixPermissions() {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collections = ['horarios', 'alumnos', 'profesores', 'logs', 'usuarios', 'cursos'];

    for (const colId of collections) {
        try {
            console.log(`Actualizando permisos de la colección: ${colId}...`);
            await databases.updateCollection(dbId, colId, colId, [
                'read("any")',
                'create("any")',
                'update("any")',
                'delete("any")'
            ]);
            console.log(`✅ Permisos de ${colId} actualizados.`);
        } catch (error) {
            console.error(`❌ Error en ${colId}:`, error.message);
        }
    }
}

fixPermissions();
