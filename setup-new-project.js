const { Client, Databases, Users, ID, Permission, Role } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Read credentials from environment (never hardcode these)
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
const users = new Users(client);

// Let's create a database with a custom ID
const DB_ID = 'escuelainfodb';
const AUSENCIAS_COL_ID = 'ausencias';

async function runSetup() {
    console.log('🚀 Iniciando configuración en el nuevo proyecto de Appwrite...');

    // 1. Crear Base de Datos
    try {
        console.log('Creando base de datos "escuelainfodb"...');
        await databases.create(DB_ID, 'EscuelaInfoDB');
        console.log('✅ Base de datos creada.');
    } catch (e) {
        if (e.code === 409) {
            console.log('✓ La base de datos ya existe.');
        } else {
            console.error('❌ Error al crear la base de datos:', e.message);
            process.exit(1);
        }
    }

    // Helper para colecciones
    const setupCollection = async (id, name, permissions) => {
        try {
            console.log(`\nCreando colección "${id}" (${name})...`);
            await databases.createCollection(DB_ID, id, name, permissions);
            console.log(`✅ Colección "${id}" creada.`);
        } catch (e) {
            if (e.code === 409) {
                console.log(`✓ Colección "${id}" ya existe.`);
            } else {
                throw e;
            }
        }
    };

    // Helper para atributos
    const createAttr = async (promise, name) => {
        try {
            await promise;
            console.log(`  ✓ Atributo "${name}" creado.`);
        } catch (e) {
            if (e.code === 409) {
                console.log(`  ~ Atributo "${name}" ya existe.`);
            } else {
                console.error(`  ✗ Error al crear "${name}":`, e.message);
            }
        }
    };

    // Helper para índices
    const createIndex = async (colId, key, type, attrs) => {
        try {
            await databases.createIndex(DB_ID, colId, key, type, attrs);
            console.log(`  ✓ Índice "${key}" creado.`);
        } catch (e) {
            if (e.code === 409) {
                console.log(`  ~ Índice "${key}" ya existe.`);
            } else {
                console.error(`  ✗ Error al crear índice "${key}":`, e.message);
            }
        }
    };

    // Definición de permisos seguros pero funcionales
    const defaultPermissions = [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
    ];

    // 2. Crear Colecciones
    await setupCollection('usuarios', 'Usuarios del Sistema', defaultPermissions);
    await setupCollection('profesores', 'Lista de Docentes', defaultPermissions);
    await setupCollection('cursos', 'Cursos', defaultPermissions);
    await setupCollection('alumnos', 'Lista de Alumnos', defaultPermissions);
    await setupCollection('horarios', 'Horarios de Clases', defaultPermissions);
    await setupCollection('logs', 'Logs de Seguridad', defaultPermissions);
    await setupCollection('ausencias', 'Ausencias', defaultPermissions);

    // 3. Crear Atributos
    console.log('\n⏳ Creando atributos en las colecciones (esto puede tardar unos segundos)...');
    
    // Usuarios
    await createAttr(databases.createStringAttribute(DB_ID, 'usuarios', 'email', 255, true), 'usuarios.email');
    await createAttr(databases.createStringAttribute(DB_ID, 'usuarios', 'rol', 50, true), 'usuarios.rol');
    await createAttr(databases.createStringAttribute(DB_ID, 'usuarios', 'nombre', 255, true), 'usuarios.nombre');
    await createAttr(databases.createStringAttribute(DB_ID, 'usuarios', 'uid', 255, true), 'usuarios.uid');

    // Profesores
    await createAttr(databases.createStringAttribute(DB_ID, 'profesores', 'nombre', 255, true), 'profesores.nombre');
    await createAttr(databases.createStringAttribute(DB_ID, 'profesores', 'dni', 50, true), 'profesores.dni');
    await createAttr(databases.createStringAttribute(DB_ID, 'profesores', 'materias', 255, false, undefined, true), 'profesores.materias');
    await createAttr(databases.createStringAttribute(DB_ID, 'profesores', 'email', 255, false), 'profesores.email');

    // Cursos
    await createAttr(databases.createStringAttribute(DB_ID, 'cursos', 'nombre', 50, true), 'cursos.nombre');

    // Alumnos
    await createAttr(databases.createStringAttribute(DB_ID, 'alumnos', 'nombre', 255, true), 'alumnos.nombre');
    await createAttr(databases.createStringAttribute(DB_ID, 'alumnos', 'dni', 50, true), 'alumnos.dni');
    await createAttr(databases.createStringAttribute(DB_ID, 'alumnos', 'curso', 50, true), 'alumnos.curso');
    await createAttr(databases.createStringAttribute(DB_ID, 'alumnos', 'email', 255, false), 'alumnos.email');

    // Horarios
    await createAttr(databases.createStringAttribute(DB_ID, 'horarios', 'dia', 20, true), 'horarios.dia');
    await createAttr(databases.createStringAttribute(DB_ID, 'horarios', 'hora', 20, true), 'horarios.hora');
    await createAttr(databases.createStringAttribute(DB_ID, 'horarios', 'materia', 255, true), 'horarios.materia');
    await createAttr(databases.createStringAttribute(DB_ID, 'horarios', 'profesor', 255, true), 'horarios.profesor');
    await createAttr(databases.createStringAttribute(DB_ID, 'horarios', 'curso', 50, true), 'horarios.curso');

    // Logs
    await createAttr(databases.createStringAttribute(DB_ID, 'logs', 'usuarioEmail', 255, true), 'logs.usuarioEmail');
    await createAttr(databases.createStringAttribute(DB_ID, 'logs', 'accion', 255, true), 'logs.accion');
    await createAttr(databases.createStringAttribute(DB_ID, 'logs', 'detalles', 1000, true), 'logs.detalles');
    await createAttr(databases.createStringAttribute(DB_ID, 'logs', 'fecha', 255, true), 'logs.fecha');
    await createAttr(databases.createStringAttribute(DB_ID, 'logs', 'ip', 50, false), 'logs.ip');

    // Ausencias
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'profId', 100, true), 'ausencias.profId');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'profNombre', 255, true), 'ausencias.profNombre');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'tipo', 50, true), 'ausencias.tipo');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'inicio', 100, true), 'ausencias.inicio');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'fin', 100, true), 'ausencias.fin');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'motivo', 500, false), 'ausencias.motivo');
    await createAttr(databases.createBooleanAttribute(DB_ID, 'ausencias', 'cert', false, false), 'ausencias.cert');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'estado', 20, true), 'ausencias.estado');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'fechaReg', 100, true), 'ausencias.fechaReg');
    await createAttr(databases.createStringAttribute(DB_ID, 'ausencias', 'materias', 255, true, undefined, true), 'ausencias.materias');

    // 4. Crear Índices (esperamos 5 segundos para que los atributos terminen de indexarse en Appwrite)
    console.log('\n⏳ Esperando a que Appwrite procese los atributos para crear índices...');
    await new Promise(r => setTimeout(r, 6000));

    console.log('\n🔧 Creando índices...');
    await createIndex('usuarios', 'uid_idx', 'key', ['uid']);
    await createIndex('usuarios', 'email_idx', 'key', ['email']);
    await createIndex('usuarios', 'rol_idx', 'key', ['rol']);

    await createIndex('alumnos', 'email_idx', 'key', ['email']);
    await createIndex('alumnos', 'curso_idx', 'key', ['curso']);

    await createIndex('ausencias', 'inicio_idx', 'key', ['inicio']);
    await createIndex('ausencias', 'estado_idx', 'key', ['estado']);
    await createIndex('ausencias', 'profId_idx', 'key', ['profId']);

    // 5. Crear el Administrador Inicial en Auth y Colección usuarios
    console.log('\n🔑 Configurando usuario administrador...');
    const adminEmail = 'jeree.castroo10@gmail.com';
    const adminPass = 'admin713';
    let adminUid = '';

    try {
        const user = await users.create(ID.unique(), adminEmail, undefined, adminPass, 'Administrador');
        adminUid = user.$id;
        console.log(`✅ Usuario auth creado: ${adminEmail} (UID: ${adminUid})`);
    } catch (e) {
        if (e.code === 409) {
            console.log('✓ El usuario auth ya existe. Buscando su UID...');
            const list = await users.list();
            const existingUser = list.users.find(u => u.email === adminEmail);
            if (existingUser) {
                adminUid = existingUser.$id;
                console.log(`✅ UID encontrado: ${adminUid}`);
            }
        } else {
            console.error('❌ Error al crear usuario en Auth:', e.message);
        }
    }

    if (adminUid) {
        try {
            console.log('Creando perfil de Administrador en la colección "usuarios"...');
            await databases.createDocument(DB_ID, 'usuarios', ID.unique(), {
                uid: adminUid,
                email: adminEmail,
                nombre: 'Administrador',
                rol: 'ad' // 'ad' mapea a 'admin' según dataService.ts
            });
            console.log('✅ Perfil de base de datos creado exitosamente.');
        } catch (e) {
            if (e.code === 409) {
                console.log('✓ El perfil del administrador ya existe.');
            } else {
                console.error('❌ Error al crear perfil del administrador:', e.message);
            }
        }
    }

    // 6. Actualizar Archivos de Entorno (.env.local y .env.setup)
    console.log('\n📝 Actualizando archivos de entorno...');
    const localEnvPath = path.join(__dirname, '.env.local');
    const setupEnvPath = path.join(__dirname, '.env.setup');

    const localEnvContent = `NEXT_PUBLIC_APPWRITE_ENDPOINT=${ENDPOINT}
NEXT_PUBLIC_APPWRITE_PROJECT_ID=${PROJECT_ID}
NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID}
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=${AUSENCIAS_COL_ID}
APPWRITE_API_KEY=${API_KEY}
`;

    const setupEnvContent = `APPWRITE_ENDPOINT=${ENDPOINT}
APPWRITE_PROJECT_ID=${PROJECT_ID}
APPWRITE_API_KEY=${API_KEY}
APPWRITE_DATABASE_ID=${DB_ID}
APPWRITE_COLLECTION_ID=${AUSENCIAS_COL_ID}
`;

    fs.writeFileSync(localEnvPath, localEnvContent, 'utf8');
    fs.writeFileSync(setupEnvPath, setupEnvContent, 'utf8');
    console.log('✅ .env.local y .env.setup actualizados con las nuevas credenciales.');
    console.log('\n🎉 ¡Configuración de base de datos finalizada con éxito! Podés recargar la web ahora.');
}

runSetup();
