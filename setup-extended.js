const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupExtendedCollections() {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    try {
        // Colección de Horarios
        console.log('Creando colección de horarios...');
        await databases.createCollection(dbId, 'horarios', 'Horarios de Clases');
        await databases.createStringAttribute(dbId, 'horarios', 'dia', 20, true);
        await databases.createStringAttribute(dbId, 'horarios', 'hora', 20, true);
        await databases.createStringAttribute(dbId, 'horarios', 'materia', 255, true);
        await databases.createStringAttribute(dbId, 'horarios', 'profesor', 255, true);
        await databases.createStringAttribute(dbId, 'horarios', 'curso', 50, true);

        // Colección de Alumnos
        console.log('Creando colección de alumnos...');
        await databases.createCollection(dbId, 'alumnos', 'Lista de Alumnos');
        await databases.createStringAttribute(dbId, 'alumnos', 'nombre', 255, true);
        await databases.createStringAttribute(dbId, 'alumnos', 'dni', 50, true);
        await databases.createStringAttribute(dbId, 'alumnos', 'curso', 50, true);
        await databases.createStringAttribute(dbId, 'alumnos', 'email', 255, false);

        console.log('¡Estructura extendida lista!');
    } catch (error) {
        console.log('Aviso: Algunas colecciones ya podrían existir.');
    }
}

setupExtendedCollections();
