import { MongoClient, Db } from 'mongodb';
import { logObj } from './logger';

const uri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/repliq?authSource=admin';
const dbName = 'repliq';

let client: MongoClient | null = null;

export async function getDb(): Promise<Db> {
  if (!client) {
    logObj.info(`[MongoDB] Connecting to: ${uri}`, ['db']);
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}
