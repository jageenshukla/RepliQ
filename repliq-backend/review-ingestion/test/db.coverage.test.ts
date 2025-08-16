
import * as dbUtil from '../src/utils/db';
import { MongoClient } from 'mongodb';

jest.mock('mongodb', () => {
  const mDb = { db: jest.fn().mockReturnValue('mockdb') };
  const mClient = { connect: jest.fn(), db: jest.fn().mockReturnValue('mockdb') };
  return { MongoClient: jest.fn(() => mClient) };
});

describe('db util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbUtil as any).client = null;
  });

  it('should connect and return db instance if not connected', async () => {
    const db = await dbUtil.getDb();
    expect(db).toBe('mockdb');
  });

  it('should reuse existing client', async () => {
    (dbUtil as any).client = { db: jest.fn().mockReturnValue('mockdb') };
    const db = await dbUtil.getDb();
    expect(db).toBe('mockdb');
  });
});
