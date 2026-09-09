const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/lib/dataService.ts',
  'src/lib/healthCheck.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // databases.createDocument(db, col, doc, data)
  content = content.replace(
    /databases\.createDocument\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)\s*\)/g,
    'databases.createDocument({ databaseId: $1, collectionId: $2, documentId: $3, data: $4 })'
  );

  // databases.updateDocument(db, col, doc, data)
  content = content.replace(
    /databases\.updateDocument\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)\s*\)/g,
    'databases.updateDocument({ databaseId: $1, collectionId: $2, documentId: $3, data: $4 })'
  );

  // databases.deleteDocument(db, col, doc)
  content = content.replace(
    /databases\.deleteDocument\(\s*([^,]+),\s*([^,]+),\s*([^,]+)\s*\)/g,
    'databases.deleteDocument({ databaseId: $1, collectionId: $2, documentId: $3 })'
  );

  // databases.listDocuments(db, col, queries)
  // This one might have queries as an array or variable.
  content = content.replace(
    /databases\.listDocuments\(\s*([^,]+),\s*([^,]+)(?:,\s*(\[[^\]]*\]|[a-zA-Z0-9_]+))?\s*\)/g,
    (match, db, col, queries) => {
      let replacement = `databases.listDocuments({ databaseId: ${db}, collectionId: ${col}`;
      if (queries) {
        replacement += `, queries: ${queries}`;
      }
      replacement += ` })`;
      return replacement;
    }
  );
  
  // databases.listDocuments with multiline queries (e.g. [Query.equal(...)])
  // We'll use a more robust replacement for multiline if needed, but in dataService it's usually inline or broken into new lines
  // Let's do a general multiline match for listDocuments
  // databases.listDocuments( APPWRITE_DB_ID, APPWRITE_COLLECTION_ID, [ ... ] )
  content = content.replace(
    /databases\.listDocuments\(\s*([^,]+),\s*([^,]+),\s*(\[[^]*?\])\s*\)/g,
    'databases.listDocuments({ databaseId: $1, collectionId: $2, queries: $3 })'
  );

  // storage.createFile(bucket, id, file)
  content = content.replace(
    /storage\.createFile\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g,
    'storage.createFile({ bucketId: $1, fileId: $2, file: $3 })'
  );
  
  // storage.getFileView(bucket, id)
  content = content.replace(
    /storage\.getFileView\(\s*([^,]+),\s*([^,)]+)\s*\)/g,
    'storage.getFileView({ bucketId: $1, fileId: $2 })'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
