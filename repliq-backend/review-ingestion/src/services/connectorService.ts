
import { Db, ObjectId } from 'mongodb';
import { Connector, ConnectorSchema } from '../models/Connector';
import { getDb } from '../utils/db';
import { logObj } from '../utils/logger';

// Find a connector by bundleId and type
export async function findConnectorByBundleId(bundleId: string, type: string = 'apple', db?: Db) {
  const database = db || await getDb();
  // Debug: print all connectors
  const allConnectors = await database.collection('connectors').find({}).toArray();
  logObj.debug('[DEBUG] All connectors:', ['connector-service'], { allConnectors });
  logObj.debug('[DEBUG] Query:', ['connector-service'], { bundleId, type });
  return database.collection('connectors').findOne({ 'config.bundleId': bundleId, type });
}


export async function insertConnector(connector: unknown, db?: Db) {
  const database = db || await getDb();
  // Throws if invalid
  const parsed = ConnectorSchema.parse(connector);
  return database.collection('connectors').insertOne(parsed);
}


export async function findConnectorById(id: string, db?: Db) {
  const database = db || await getDb();
  return database.collection('connectors').findOne({ _id: new ObjectId(id) });
}


export async function findConnectors(filter = {}, db?: Db) {
  const database = db || await getDb();
  return database.collection('connectors').find(filter).toArray();
}
