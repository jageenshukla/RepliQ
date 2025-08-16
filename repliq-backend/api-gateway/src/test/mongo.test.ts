

describe('mongo utils', () => {
  let checkMongoHealth: () => Promise<boolean>;
  let getDb: (() => Promise<any>) & { client: any };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    ({ checkMongoHealth, getDb } = require('../utils/mongo'));
    getDb.client = null;
  });

  it('should return true if ping succeeds', async () => {
    const result = await checkMongoHealth();
    expect(result).toBe(true);
  });

  it('should return false if ping throws', async () => {
    jest.resetModules();
    jest.doMock('mongodb', () => {
      const mDb = { command: jest.fn().mockRejectedValue(new Error('fail')), db: jest.fn().mockReturnValue({}) };
      const mClient = { connect: jest.fn(), db: jest.fn().mockReturnValue(mDb) };
      return { MongoClient: jest.fn(() => mClient) };
    });
    const { checkMongoHealth, getDb } = require('../utils/mongo');
    getDb.client = null;
    jest.spyOn(global.console, 'error').mockImplementation(() => {});
    const result = await checkMongoHealth();
    expect(result).toBe(false);
  });
});

jest.mock('mongodb', () => {
  const mDb = { command: jest.fn().mockResolvedValue({}), db: jest.fn().mockReturnValue('mockdb') };
  const mClient = { connect: jest.fn(), db: jest.fn().mockReturnValue(mDb) };
  return { MongoClient: jest.fn(() => mClient) };
});
