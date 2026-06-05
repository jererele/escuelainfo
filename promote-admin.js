const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function promoteToAdmin() {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = 'usuarios';
    const targetEmail = 'jeree.castroo10@gmail.com';

    try {
        console.log(`Buscando usuario: ${targetEmail}...`);
        const response = await databases.listDocuments(dbId, collectionId, [
            Query.equal('email', targetEmail)
        ]);

        if (response.documents.length === 0) {
            console.error('Error: No se encontró ningún perfil con ese email. Asegúrate de haber iniciado sesión al menos una vez en la web primero.');
            return;
        }

        const docId = response.documents[0].$id;
        console.log(`Usuario encontrado (ID: ${docId}). Ascendiendo a Admin...`);

        await databases.updateDocument(dbId, collectionId, docId, {
            rol: 'admin'
        });

        console.log('¡ÉXITO! Ahora eres Admin. Refresca la web para ver los cambios.');
    } catch (error) {
        console.error('Error durante el ascenso:', error);
    }
}

promoteToAdmin();
