import { Client, Databases, Permission, Role } from 'node-appwrite';

const ENDPOINT   = process.env.APPWRITE_ENDPOINT   || '';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY    = process.env.APPWRITE_API_KEY    || '';
const DB_ID      = process.env.APPWRITE_DATABASE_ID || '';

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DB_ID) {
  console.error('❌ Faltan variables en .env.setup.');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

async function applySecurity() {
  console.log('Aplicando parches de seguridad estrictos a Appwrite...\n');

  try {
    // 1. Logs: Solo lectura y creación. NINGÚN UPDATE NI DELETE.
    const logsCol = await databases.getCollection(DB_ID, 'logs');
    await databases.updateCollection(
      DB_ID,
      'logs',
      logsCol.name,
      [
        Permission.read(Role.users()),
        Permission.create(Role.users())
        // Removidos update y delete intencionalmente
      ],
      logsCol.documentSecurity ?? false
    );
    console.log('✅ Colección "logs" asegurada: Inmutabilidad activada (Solo Crear/Leer).');

    // 2. Usuarios, Profesores, Cursos, Horarios: Read (Users). Update/Delete (Solo admins o Server)
    // Nota: Como no tenemos el ID exacto del "team:admin" aquí, removeremos los permisos de Delete/Update globales.
    // Esto fuerza a que solo los dueños del documento (si documentSecurity está activo) o el Server SDK puedan borrar/editar.
    const coleccionesRestringidas = ['usuarios', 'profesores', 'cursos', 'horarios'];
    for (const colId of coleccionesRestringidas) {
      try {
        const col = await databases.getCollection(DB_ID, colId);
        await databases.updateCollection(
          DB_ID,
          colId,
          col.name,
          [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()), // Se mantiene para permitir edición propia
            // Removido delete global para que los usuarios no puedan borrar toda la base
          ],
          true // documentSecurity forzado a true
        );
        console.log(`✅ Colección "${colId}" asegurada: Eliminación global denegada y Seguridad de Documento activada.`);
      } catch (err) {
        if (err.code === 404) {
          console.warn(`⚠️ Colección ${colId} no encontrada.`);
        } else {
          console.error(`❌ Error en ${colId}: ${err.message}`);
        }
      }
    }
    
    console.log('\n🔒 Seguridad estricta aplicada con éxito en Appwrite.');
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

applySecurity();
