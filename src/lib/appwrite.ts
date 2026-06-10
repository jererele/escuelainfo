import { Client, Account, Databases } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "69dfa4860037cf774dfb";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);

// Keep existing exports to maintain compatibility with dataService.ts
export const appwriteClient = client;
export const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

export { client, account, databases };
