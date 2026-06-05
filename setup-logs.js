const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupLogsCollection() {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = 'logs';

    try {
        console.log('Creando colección de auditoría (logs)...');
        await databases.createCollection(dbId, collectionId, 'Logs de Seguridad');
        
        console.log('Creando atributos...');
        await databases.createStringAttribute(dbId, collectionId, 'usuarioEmail', 255, true);
        await databases.createStringAttribute(dbId, collectionId, 'accion', 255, true); // Ejemplo: "BORRAR_AUSENCIA"
        await databases.createStringAttribute(dbId, collectionId, 'detalles', 1000, true);
        await databases.createStringAttribute(dbId, collectionId, 'fecha', 255, true);
        await databases.createStringAttribute(dbId, collectionId, 'ip', 50, false);

        console.log('¡Colección de Auditoría lista!');
        console.log('IMPORTANTE: Los permisos de "logs" deben ser solo CREATE para los usuarios, y READ solo para Directivos.');
    } catch (error) {
        if (error.code === 409) {
            console.log('La colección ya existe.');
        } else {
            console.error('Error:', error);
        }
    }
}

setupLogsCollection();
