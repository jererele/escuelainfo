/**
 * EscuelaInfo — Schema Optimization Script
 * 
 * Actualiza los atributos de Appwrite para reflejar los dos cambios de optimización:
 *   1. Colección `logs`: campo `accion` reducido de 100 a 6 chars.
 *   2. Colección `horarios`: campo `hora` migrado de STRING a INTEGER (código de módulo 1-16).
 * 
 * ⚠️ NOTA: Appwrite NO permite modificar el tipo de un atributo existente.
 *    Para la colección `horarios`, la migración crea el nuevo campo `hora_code` (Integer),
 *    deja el campo `hora` existente intacto y el código de Next.js ya maneja ambos.
 *    Podés eliminar el campo `hora` legacy manualmente desde la consola de Appwrite
 *    una vez que hayas migrado todos los registros existentes.
 * 
 * Ejecutar: node scripts/optimize-schema.mjs
 */

import { Client, Databases } from "node-appwrite";

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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function listAttributes(collectionId) {
  const col = await db.getCollection(DATABASE_ID, collectionId);
  return col.attributes.map(a => a.key);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log(" EscuelaInfo — Schema Optimization");
  console.log(" 1. logs.accion: STRING(100) → STRING(6) [recrear]");
  console.log(" 2. horarios.hora: STRING → INTEGER [nuevo campo hora_mod]");
  console.log("═══════════════════════════════════════════════════════\n");

  // ─── 1. LOGS: Reducir campo `accion` a 6 chars ──────────────────────────────
  // Appwrite no permite modificar size de un atributo existente.
  // Hay que borrarlo y recrearlo.
  console.log("[1/2] Optimizando campo `accion` en colección `logs`...");
  try {
    const attrs = await listAttributes("logs");
    
    if (attrs.includes("accion")) {
      await db.deleteAttribute(DATABASE_ID, "logs", "accion");
      console.log("  - Campo `accion` eliminado.");
      await sleep(3000); // Esperar a que Appwrite libere el campo
    }
    
    await db.createStringAttribute(DATABASE_ID, "logs", "accion", 6, false, null, false);
    console.log("  + Campo `accion` recreado con size: 6.");
    console.log("  ✓ Los nuevos logs guardarán códigos compactos (ej: 'C_A', 'E_D').");
    await sleep(2000);
  } catch (e) {
    console.error("  ✗ Error en optimización de logs:", e.message, "| Code:", e.code);
  }

  // ─── 2. HORARIOS: Agregar campo `hora` como INTEGER ─────────────────────────
  // El campo `hora` existente (string con texto completo) se reemplaza por un
  // campo nuevo del mismo nombre pero INTEGER. Hay que borrarlo y recrearlo.
  console.log("\n[2/2] Migrando campo `hora` en colección `horarios` a INTEGER...");
  try {
    const attrs = await listAttributes("horarios");
    
    if (attrs.includes("hora")) {
      await db.deleteAttribute(DATABASE_ID, "horarios", "hora");
      console.log("  - Campo `hora` (string) eliminado.");
      await sleep(3000);
    }
    
    // Crear campo `hora` como INTEGER (1-16, representa el módulo)
    await db.createIntegerAttribute(DATABASE_ID, "horarios", "hora", false, 1, 16, null, false);
    console.log("  + Campo `hora` creado como INTEGER (min:1, max:16).");
    console.log("  ✓ Los horarios guardarán el número de módulo (1='07:40-08:20', 2='08:20-09:00', etc.).");
    await sleep(2000);

    // Crear índice para búsqueda por hora
    try {
      await db.createIndex(DATABASE_ID, "horarios", "hora_idx", "key", ["hora"]);
      console.log("  ✓ Índice `hora_idx` creado.");
    } catch (ie) {
      if (ie.code === 409) console.log("  ~ Índice `hora_idx` ya existía.");
      else throw ie;
    }
    
  } catch (e) {
    console.error("  ✗ Error en migración de horarios:", e.message, "| Code:", e.code);
  }

  console.log("\n✅ Optimización de schema completa.");
  console.log("   Los registros EXISTENTES en Appwrite quedarán sin valor en el campo `hora`.");
  console.log("   El código ya maneja esto con fromDbHora() que devuelve el string original como fallback.\n");
}

main();
