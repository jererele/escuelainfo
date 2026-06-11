/**
 * configure-env.js
 * Corre este script en cualquier computadora del equipo para generar
 * los archivos .env.local y .env.setup necesarios para trabajar.
 *
 * Uso:
 *   node configure-env.js
 *
 * El script te va a pedir la API Key de Appwrite por consola.
 * Pedísela al administrador del proyecto (no la subas a GitHub nunca).
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENDPOINT   = 'https://cloud.appwrite.io/v1';
const PROJECT_ID = '6a2af00d002d86d3dd20';
const DB_ID      = 'escuelainfodb';
const COL_ID     = 'ausencias';
// NOTA: La API Key se pide por consola para no exponerla en el código.

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('🔑 Pegá la API Key de Appwrite y presioná Enter: ', (apiKey) => {
  rl.close();
  apiKey = apiKey.trim();

  if (!apiKey || !apiKey.startsWith('standard_')) {
    console.error('❌ La API Key parece inválida. Debe empezar con "standard_".');
    process.exit(1);
  }

  const localEnv = `NEXT_PUBLIC_APPWRITE_ENDPOINT=${ENDPOINT}\nNEXT_PUBLIC_APPWRITE_PROJECT_ID=${PROJECT_ID}\nNEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID}\nNEXT_PUBLIC_APPWRITE_COLLECTION_ID=${COL_ID}\nAPPWRITE_API_KEY=${apiKey}\n`;
  const setupEnv = `APPWRITE_ENDPOINT=${ENDPOINT}\nAPPWRITE_PROJECT_ID=${PROJECT_ID}\nAPPWRITE_API_KEY=${apiKey}\nAPPWRITE_DATABASE_ID=${DB_ID}\nAPPWRITE_COLLECTION_ID=${COL_ID}\n`;

  fs.writeFileSync(path.join(__dirname, '.env.local'), localEnv, 'utf8');
  fs.writeFileSync(path.join(__dirname, '.env.setup'), setupEnv, 'utf8');

  console.log('✅ .env.local y .env.setup generados correctamente.');
  console.log('   Ahora podés correr: npm run dev');
});
