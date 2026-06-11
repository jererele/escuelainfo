const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function check() {
  console.log('DB ID:', dbId);

  // 1. List all collections
  try {
    const cols = await db.listCollections(dbId);
    console.log('\n--- COLLECTIONS ---');
    cols.collections.forEach(c => {
      console.log(' ID:', c.$id, '| Name:', c.name, '| Enabled:', c.enabled);
    });
  } catch(e) {
    console.error('listCollections FAILED:', e.message, e.code);
  }

  // 2. Try simple query on usuarios WITHOUT filters
  console.log('\n--- QUERY usuarios (sin filtros) ---');
  try {
    const r = await db.listDocuments(dbId, 'usuarios', []);
    console.log('OK - total docs:', r.total);
  } catch(e) {
    console.error('FAILED:', e.message, '| code:', e.code, '| type:', e.type);
  }

  // 3. Try query on usuarios WITH uid filter
  console.log('\n--- QUERY usuarios (uid filter) ---');
  try {
    const { Query } = require('node-appwrite');
    const r = await db.listDocuments(dbId, 'usuarios', [Query.equal('uid', 'test')]);
    console.log('OK - total docs:', r.total);
  } catch(e) {
    console.error('FAILED:', e.message, '| code:', e.code, '| type:', e.type);
  }
}

check();
