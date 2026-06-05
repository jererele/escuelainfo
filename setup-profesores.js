const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupTeachersCollection() {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = 'profesores';

    try {
        console.log('Creando colección de profesores...');
        await databases.createCollection(dbId, collectionId, 'Lista de Docentes');
        
        console.log('Creando atributos...');
        await databases.createStringAttribute(dbId, collectionId, 'nombre', 255, true);
        await databases.createStringAttribute(dbId, collectionId, 'dni', 50, true);
        await databases.createStringAttribute(dbId, collectionId, 'materias', 255, false, undefined, true); // Array
        await databases.createStringAttribute(dbId, collectionId, 'email', 255, false);

        console.log('¡Colección de Profesores lista!');
    } catch (error) {
        if (error.code === 409) {
            console.log('La colección ya existe.');
        } else {
            console.error('Error:', error);
        }
    }
}

setupTeachersCollection();
