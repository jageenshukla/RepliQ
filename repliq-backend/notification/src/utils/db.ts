import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://admin:securepassword123@localhost:27017/repliq?authSource=admin';
const dbName = 'repliq';

let client: MongoClient | null = null;

export async function getDb(): Promise<Db> {
  if (!client) {
    console.log(`[MongoDB] Connecting to: ${uri}`);
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}
