
import { MongoClient, Db } from 'mongodb';
import { createLoggerWithTags } from './logger';
const logger = createLoggerWithTags(['mongo', 'db']);

const uri = process.env.MONGODB_URI || 'mongodb://admin:securepassword123@localhost:27017/repliq?authSource=admin';
const dbName = 'repliq';

// Attach the singleton client to getDb for testability
export async function getDb(): Promise<Db> {
  if (!getDb.client) {
    logger.info(`[MongoDB] Connecting to: ${uri}`);
    getDb.client = new MongoClient(uri);
    await getDb.client.connect();
  }
  return getDb.client.db(dbName);
}

getDb.client = null as MongoClient | null;

export function __resetClient() {
  getDb.client = null;
}

export async function checkMongoHealth(): Promise<boolean> {
  try {
    const db = await getDb();
    // The ping command is cheap and does not require auth
    await db.command({ ping: 1 });
    return true;
  } catch (err) {
    logger.error('[MongoDB] Health check failed:', { error: err });
    return false;
  }
}
