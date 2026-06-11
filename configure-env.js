const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://cloud.appwrite.io/v1';
const PROJECT_ID = '6a2af00d002d86d3dd20';
const DB_ID = 'escuelainfodb';
const AUSENCIAS_COL_ID = 'ausencias';

// Read API Key from command-line arguments to keep it secure
const API_KEY = process.argv[2];

if (!API_KEY) {
    console.error('❌ Error: Debes pasar la API Key de Appwrite como argumento.');
    console.log('Uso: node configure-env.js <TU_API_KEY>');
    process.exit(1);
}

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

console.log('✅ Entorno local (.env.local y .env.setup) configurado con éxito.');
