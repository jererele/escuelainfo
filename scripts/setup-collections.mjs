/**
 * EscuelaInfo — Appwrite Collection Setup Script
 * Crea las 3 colecciones faltantes con atributos y permisos.
 * Idempotente: si la colección ya existe, la omite sin error.
 * 
 * Ejecutar: node scripts/setup-collections.mjs
 */

import { Client, Databases, ID, Permission, Role } from "node-appwrite";

// ─── Config ──────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT  || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6a2af00d002d86d3dd20";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "escuelainfodb";
const API_KEY    = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error("❌ APPWRITE_API_KEY no encontrada en el entorno.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

// ─── Permisos estándar ────────────────────────────────────────────────────────
const STD_PERMISSIONS = [
  Permission.read(Role.users()),
  Permission.write(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

// ─── Helper: crear colección de forma idempotente ────────────────────────────
async function ensureCollection(collectionId, name) {
  try {
    await db.getCollection(DATABASE_ID, collectionId);
    console.log(`  ✓ Ya existe: ${name} (${collectionId})`);
    return false; // ya existía
  } catch (e) {
    if (e.code === 404) {
      await db.createCollection(DATABASE_ID, collectionId, name, STD_PERMISSIONS);
      console.log(`  + Creada: ${name} (${collectionId})`);
      return true; // recién creada
    }
    throw e;
  }
}

// ─── Helper: crear atributo string de forma idempotente ──────────────────────
async function addStr(collectionId, key, size = 255, required = false, defaultVal = null, array = false) {
  try {
    await db.createStringAttribute(DATABASE_ID, collectionId, key, size, required, defaultVal, array);
  } catch (e) {
    if (e.code === 409) return; // ya existe
    throw e;
  }
}

// ─── Esperar a que los atributos estén disponibles ───────────────────────────
async function waitForAttributes(collectionId, ms = 2500) {
  console.log(`  ⏳ Esperando ${ms}ms para que Appwrite indexe los atributos de ${collectionId}...`);
  await new Promise(r => setTimeout(r, ms));
}

// ─── DEFINICIÓN DE COLECCIONES ────────────────────────────────────────────────

async function createMesasExamen() {
  console.log("\n[1/3] Mesas de Examen...");
  const created = await ensureCollection("mesas_examen", "Mesas de Examen");
  if (!created) return;

  await addStr("mesas_examen", "fecha",             20,  true);
  await addStr("mesas_examen", "hora",              10,  true);
  await addStr("mesas_examen", "materia",           150, true);
  await addStr("mesas_examen", "aula",              80,  true);
  await addStr("mesas_examen", "presidenteId",      50,  true);
  await addStr("mesas_examen", "presidenteNombre",  120, true);
  await addStr("mesas_examen", "vocal1Id",          50,  false);
  await addStr("mesas_examen", "vocal1Nombre",      120, false);
  await addStr("mesas_examen", "vocal2Id",          50,  false);
  await addStr("mesas_examen", "vocal2Nombre",      120, false);
  await addStr("mesas_examen", "alumnosInscriptos", 2000, false);
  await addStr("mesas_examen", "estado",            20,  false, "borrador");

  console.log("  ✓ Atributos de mesas_examen creados.");
}

async function createAsistenciasJornada() {
  console.log("\n[2/3] Asistencias Jornada (Preceptores)...");
  const created = await ensureCollection("asistencias_alumnos_jornada", "Asistencias Alumnos Jornada");
  if (!created) return;

  await addStr("asistencias_alumnos_jornada", "alumnoId",     50,  true);
  await addStr("asistencias_alumnos_jornada", "alumnoNombre", 150, false);
  await addStr("asistencias_alumnos_jornada", "fecha",        20,  true);
  await addStr("asistencias_alumnos_jornada", "estado",       5,   true);
  await addStr("asistencias_alumnos_jornada", "preceptorId",  50,  false);

  console.log("  ✓ Atributos de asistencias_alumnos_jornada creados.");
}

async function createAsistenciasMateria() {
  console.log("\n[3/3] Asistencias Materia (Profesores)...");
  const created = await ensureCollection("asistencias_alumnos_materia", "Asistencias Alumnos Materia");
  if (!created) return;

  await addStr("asistencias_alumnos_materia", "alumnoId",       50,  true);
  await addStr("asistencias_alumnos_materia", "alumnoNombre",   150, false);
  await addStr("asistencias_alumnos_materia", "fecha",          20,  true);
  await addStr("asistencias_alumnos_materia", "materia",        150, true);
  await addStr("asistencias_alumnos_materia", "curso",          50,  true);
  await addStr("asistencias_alumnos_materia", "estado",         5,   true);
  await addStr("asistencias_alumnos_materia", "profesorId",     50,  false);

  console.log("  ✓ Atributos de asistencias_alumnos_materia creados.");
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log(" EscuelaInfo — Appwrite Collection Setup");
  console.log(`  Endpoint:   ${ENDPOINT}`);
  console.log(`  Project:    ${PROJECT_ID}`);
  console.log(`  Database:   ${DATABASE_ID}`);
  console.log("═══════════════════════════════════════════════");

  try {
    await createMesasExamen();
    await waitForAttributes("mesas_examen");

    await createAsistenciasJornada();
    await waitForAttributes("asistencias_alumnos_jornada");

    await createAsistenciasMateria();
    await waitForAttributes("asistencias_alumnos_materia");

    console.log("\n✅ Setup completo. Las 3 colecciones están listas en Appwrite.");
    console.log("   Reiniciá el servidor de desarrollo para limpiar el caché.\n");
  } catch (err) {
    console.error("\n❌ Error durante el setup:", err.message);
    console.error("   Código HTTP:", err.code);
    process.exit(1);
  }
}

main();
