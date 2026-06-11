const { Client, Databases, ID } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    console.error('Faltan credenciales de Appwrite en .env.local');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function rebuild() {
    console.log('--- INICIANDO RECONSTRUCCIÓN COMPLETA DE LA BASE DE DATOS ---');
    try {
        // 1. Crear nueva base de datos
        console.log('Creando nueva base de datos...');
        const newDb = await databases.create(ID.unique(), 'EscuelaInfo_Prod');
        const dbId = newDb.$id;
        console.log(`✅ Nueva base de datos creada: ${dbId}`);

        // Helper para crear colecciones
        const createCol = async (id, name) => {
            console.log(`Creando colección: ${id} (${name})...`);
            await databases.createCollection(dbId, id, name);
        };

        // Helper para atributos
        const createString = async (colId, key, size, required = false, array = false) => {
            await databases.createStringAttribute(dbId, colId, key, size, required, undefined, array);
        };
        const createBoolean = async (colId, key, required = false) => {
            await databases.createBooleanAttribute(dbId, colId, key, required);
        };

        // Helper para índices
        const createIndex = async (colId, key, type, attrs) => {
            await databases.createIndex(dbId, colId, key, type, attrs);
        };

        // 2. Usuarios
        await createCol('usuarios', 'Usuarios del Sistema');
        await createString('usuarios', 'email', 255, true);
        await createString('usuarios', 'rol', 50, true);
        await createString('usuarios', 'nombre', 255, true);
        await createString('usuarios', 'uid', 255, true);
        // Esperar un poco a que los atributos estén disponibles antes de crear índices
        await new Promise(r => setTimeout(r, 2000));
        try { await createIndex('usuarios', 'uid_idx', 'key', ['uid']); } catch (e) { console.log('Idx err', e.message); }
        try { await createIndex('usuarios', 'email_idx', 'key', ['email']); } catch (e) { console.log('Idx err', e.message); }
        try { await createIndex('usuarios', 'rol_idx', 'key', ['rol']); } catch (e) { console.log('Idx err', e.message); }

        // 3. Profesores
        await createCol('profesores', 'Profesores');
        await createString('profesores', 'nombre', 255, true);
        await createString('profesores', 'dni', 50, true);
        await createString('profesores', 'email', 255, false);
        await createString('profesores', 'materias', 255, true, true);
        
        // 4. Cursos
        await createCol('cursos', 'Cursos');
        await createString('cursos', 'nombre', 255, true);

        // 5. Alumnos
        await createCol('alumnos', 'Lista de Alumnos');
        await createString('alumnos', 'nombre', 255, true);
        await createString('alumnos', 'dni', 50, true);
        await createString('alumnos', 'curso', 50, true);
        await createString('alumnos', 'email', 255, false);
        await new Promise(r => setTimeout(r, 2000));
        try { await createIndex('alumnos', 'email_idx', 'key', ['email']); } catch (e) { console.log('Idx err', e.message); }
        try { await createIndex('alumnos', 'curso_idx', 'key', ['curso']); } catch (e) { console.log('Idx err', e.message); }

        // 6. Horarios
        await createCol('horarios', 'Horarios de Clases');
        await createString('horarios', 'dia', 20, true);
        await createString('horarios', 'hora', 20, true);
        await createString('horarios', 'materia', 255, true);
        await createString('horarios', 'profesor', 255, true);
        await createString('horarios', 'curso', 50, true);

        // 7. Logs
        await createCol('logs', 'Auditoria');
        await createString('logs', 'usuarioEmail', 255, true);
        await createString('logs', 'accion', 100, true);
        await createString('logs', 'detalles', 1000, false);
        await createString('logs', 'fecha', 100, true);
        
        // 8. Ausencias (CollectionID dinámico en el .env.local, pero podemos usar un ID fijo para simplificar)
        const newAusenciasColId = 'ausencias';
        await createCol(newAusenciasColId, 'Ausencias');
        await createString(newAusenciasColId, 'profId', 100, true);
        await createString(newAusenciasColId, 'profNombre', 255, true);
        await createString(newAusenciasColId, 'tipo', 50, true);
        await createString(newAusenciasColId, 'inicio', 100, true);
        await createString(newAusenciasColId, 'fin', 100, true);
        await createString(newAusenciasColId, 'motivo', 500, false);
        await createBoolean(newAusenciasColId, 'cert', false);
        await createString(newAusenciasColId, 'estado', 20, true);
        await createString(newAusenciasColId, 'fechaReg', 100, true);
        await createString(newAusenciasColId, 'materias', 255, true, true);
        await new Promise(r => setTimeout(r, 2000));
        try { await createIndex(newAusenciasColId, 'inicio_idx', 'key', ['inicio']); } catch (e) { console.log('Idx err', e.message); }
        try { await createIndex(newAusenciasColId, 'estado_idx', 'key', ['estado']); } catch (e) { console.log('Idx err', e.message); }
        try { await createIndex(newAusenciasColId, 'profId_idx', 'key', ['profId']); } catch (e) { console.log('Idx err', e.message); }

        console.log('\n--- ACTUALIZANDO .env.local ---');
        // Update .env.local with new DB_ID and COL_ID
        const envPath = path.join(__dirname, '.env.local');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        envContent = envContent.replace(
            /NEXT_PUBLIC_APPWRITE_DATABASE_ID=.*/,
            `NEXT_PUBLIC_APPWRITE_DATABASE_ID=${dbId}`
        );
        envContent = envContent.replace(
            /NEXT_PUBLIC_APPWRITE_COLLECTION_ID=.*/,
            `NEXT_PUBLIC_APPWRITE_COLLECTION_ID=${newAusenciasColId}`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env.local actualizado con los nuevos IDs.');

        console.log('\n✅ RECONSTRUCCIÓN FINALIZADA. AVISO: DEBES CONFIGURAR LOS PERMISOS EN LA CONSOLA LUEGO.');

    } catch (e) {
        console.error('❌ ERROR FATAL DURANTE LA RECONSTRUCCIÓN:', e);
    }
}

rebuild();
