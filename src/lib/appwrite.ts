import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("69dfa4860037cf774dfb");

const account = new Account(client);
const databases = new Databases(client);

// Keep existing exports to maintain compatibility with dataService.ts
export const appwriteClient = client;
export const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

export { client, account, databases };
