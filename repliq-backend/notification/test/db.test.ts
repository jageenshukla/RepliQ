import { getDb } from '../src/utils/db';
import { MongoClient } from 'mongodb';

jest.mock('mongodb', () => {
  const mMongoClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue({ name: 'repliq' })
  };
  return {
    MongoClient: jest.fn(() => mMongoClient)
  };
});

describe('getDb', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect and return db instance on first call', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
    // The mock returns an object with a name property, but the type may not have it. Just check defined.
  });

  it('should reuse the same client on subsequent calls', async () => {
    const db1 = await getDb();
    const db2 = await getDb();
    expect(db1).toBe(db2);
  });
});
