const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const API_KEY    = process.env.APPWRITE_API_KEY || '';

if (!PROJECT_ID || !API_KEY) {
    console.error('❌ Faltan credenciales en .env.local. Corré node configure-env.js primero.');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const DB_ID = 'escuelainfodb';

async function waitAndCreate() {
    console.log('⏳ Esperando a que todos los atributos estén disponibles...');
    
    const collectionsToCheck = ['usuarios', 'alumnos', 'ausencias'];
    let allReady = false;
    
    for (let i = 0; i < 120; i++) {
        let pending = 0;
        for (const col of collectionsToCheck) {
            const data = await databases.getCollection(DB_ID, col);
            const processing = data.attributes.filter(a => a.status !== 'available');
            pending += processing.length;
        }
        
        if (pending === 0) {
            allReady = true;
            console.log('✅ Todos los atributos están disponibles.');
            break;
        }
        
        console.log(`⏳ Hay ${pending} atributos procesándose. Esperando 5 segundos más... (Intento ${i+1}/120)`);
        await new Promise(r => setTimeout(r, 5000));
    }

    if (!allReady) {
        console.error('❌ Los atributos tardaron demasiado en procesarse. Abortando.');
        process.exit(1);
    }

    // Crear Índices
    console.log('\n🔧 Creando índices...');
    const createIndex = async (colId, key, type, attrs) => {
        try {
            await databases.createIndex(DB_ID, colId, key, type, attrs);
            console.log(`  ✓ Índice "${key}" creado en "${colId}".`);
        } catch (e) {
            if (e.code === 409) {
                console.log(`  ~ Índice "${key}" ya existe en "${colId}".`);
            } else {
                console.error(`  ✗ Error al crear índice "${key}" en "${colId}":`, e.message);
            }
        }
    };

    await createIndex('usuarios', 'uid_idx', 'key', ['uid']);
    await createIndex('usuarios', 'email_idx', 'key', ['email']);
    await createIndex('usuarios', 'rol_idx', 'key', ['rol']);

    await createIndex('alumnos', 'email_idx', 'key', ['email']);
    await createIndex('alumnos', 'curso_idx', 'key', ['curso']);

    await createIndex('ausencias', 'inicio_idx', 'key', ['inicio']);
    await createIndex('ausencias', 'estado_idx', 'key', ['estado']);
    await createIndex('ausencias', 'profId_idx', 'key', ['profId']);

    // Crear Perfil Administrador
    console.log('\n🔑 Configurando perfil administrador...');
    const adminEmail = 'jeree.castroo10@gmail.com';
    const adminUid = '6a2af0b6000e27291019'; // The UID from the previous run

    try {
        await databases.createDocument(DB_ID, 'usuarios', ID.unique(), {
            uid: adminUid,
            email: adminEmail,
            nombre: 'Administrador',
            rol: 'ad'
        });
        console.log('✅ Perfil del administrador creado en la colección "usuarios".');
    } catch (e) {
        if (e.code === 409) {
            console.log('✓ El perfil del administrador ya existe.');
        } else {
            console.error('❌ Error al crear perfil del administrador:', e.message);
        }
    }
}

waitAndCreate();
