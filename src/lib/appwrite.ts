import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6a2af00d002d86d3dd20");

const account = new Account(client);
const databases = new Databases(client);

// Keep existing exports to maintain compatibility with dataService.ts
export const appwriteClient = client;
export const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';
export const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'ausencias';

export { client, account, databases };
