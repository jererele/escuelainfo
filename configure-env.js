const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://cloud.appwrite.io/v1';
const PROJECT_ID = '6a2af00d002d86d3dd20';
const DB_ID = 'escuelainfodb';
const AUSENCIAS_COL_ID = 'ausencias';
const API_KEY = 'standard_3bcdc539c1a8313e03b5f4cedc374c7161bfef8a64ae2a24f9e7d821e8655c47fdb6708e179572685c5072efd2058e1a041fb34fd2f29f600db6ccedc95fbf01d1f53873defdd197c91e1cf1888b7830f42eaf987995564c001ff18dccefdb05a9eef985f87eba7937092bc1907b3c57715a8df157fd62e1ba59187b89c286f4';

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
