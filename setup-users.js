const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function setupUsersCollection() {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = 'usuarios';

    try {
        console.log('Creando colección de usuarios...');
        await databases.createCollection(dbId, collectionId, 'Usuarios del Sistema');
        
        console.log('Creando atributos...');
        await databases.createStringAttribute(dbId, collectionId, 'email', 255, true);
        await databases.createStringAttribute(dbId, collectionId, 'rol', 50, true);
        await databases.createStringAttribute(dbId, collectionId, 'nombre', 255, true);
        await databases.createStringAttribute(dbId, collectionId, 'uid', 255, true); // Firebase UID

        console.log('¡Colección de Usuarios lista!');
        console.log('IMPORTANTE: Recuerda poner los permisos de esta colección "usuarios" en ANY -> Read/Create en la consola de Appwrite.');
    } catch (error) {
        if (error.code === 409) {
            console.log('La colección ya existe, saltando creación.');
        } else {
            console.error('Error:', error);
        }
    }
}

setupUsersCollection();
