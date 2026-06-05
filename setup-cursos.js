const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupCursosCollection() {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    try {
        console.log('Creando colección de cursos...');
        await databases.createCollection(dbId, 'cursos', 'Cursos de la institución');
        await databases.createStringAttribute(dbId, 'cursos', 'nombre', 50, true);
        console.log('¡Colección de cursos creada con éxito!');
    } catch (error) {
        console.error('Error al configurar cursos (o ya existe):', error.message || error);
    }
}

setupCursosCollection();
