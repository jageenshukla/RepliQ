import jwt from 'jsonwebtoken';
import { logObj } from './logger';
import fs from 'fs/promises';
import { getDb } from './db';
import { findConnectors } from '../services/connectorService';

export async function generateAppleJwt(bundleId: string): Promise<string | null> {
  try {
    const db = await getDb();
    const query = { type: 'apple', 'config.bundleId': bundleId };
    const connectors = await findConnectors(query);
    const connector = connectors[0];
    if (!connector || !connector.config) {
      logObj.error('Connector not found or missing config', ['apple-jwt']);
      return null;
    }
    const config = connector.config;
    let privateKey;
    try {
      privateKey = await fs.readFile(config.p8FilePath, 'utf-8');
    } catch (fileErr) {
      logObj.error('Failed to read Apple private key file', ['apple-jwt'], { filePath: config.p8FilePath, error: fileErr });
      return null;
    }
    let token;
    try {
      token = jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '20m',
        audience: 'appstoreconnect-v1',
        issuer: config.issuerId,
        header: {
          alg: 'ES256',
          kid: config.keyId,
          typ: 'JWT'
        }
      });
    } catch (jwtErr) {
      logObj.error('JWT signing failed', ['apple-jwt'], { error: jwtErr });
      return null;
    }
    return token;
  } catch (err) {
    logObj.error('Error generating Apple JWT:', ['apple-jwt'], { error: err });
    return null;
  }
}
