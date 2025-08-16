import * as dbUtil from '../src/utils/db';
import { Db, ObjectId } from 'mongodb';
import * as connectorService from '../src/services/connectorService';

jest.mock('../src/utils/db', () => ({
  getDb: jest.fn(),
}));

const mockCollection = {
  find: jest.fn(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
};
const mockDb = {
  collection: jest.fn(() => mockCollection),
};

describe('connectorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbUtil.getDb as jest.Mock).mockResolvedValue(mockDb);
    mockDb.collection.mockReturnValue(mockCollection);
  });

  describe('findConnectorByBundleId', () => {
    it('should find connector by bundleId and type', async () => {
      mockCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ _id: '1', config: { bundleId: 'bid' }, type: 'apple' }]) });
      mockCollection.findOne.mockResolvedValue({ _id: '1', config: { bundleId: 'bid' }, type: 'apple' });
      const result = await connectorService.findConnectorByBundleId('bid', 'apple');
      expect(result).toEqual({ _id: '1', config: { bundleId: 'bid' }, type: 'apple' });
    });
  });

  describe('insertConnector', () => {
    it('should insert a valid connector', async () => {
      mockCollection.insertOne.mockResolvedValue({ insertedId: '123' });
      const validConnector = {
        type: 'apple',
        authType: 'jwt',
        config: {
          p8FilePath: 'path',
          keyId: 'kid',
          issuerId: 'iid',
          bundleId: 'bid',
          appId: 'aid',
          apiUrl: 'http://api',
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // @ts-ignore
      const result = await connectorService.insertConnector(validConnector);
      expect(result).toEqual({ insertedId: '123' });
    });
    it('should throw on invalid connector', async () => {
      await expect(connectorService.insertConnector({})).rejects.toThrow();
    });
  });

  describe('findConnectorById', () => {
    it('should find connector by id', async () => {
      const validId = '507f1f77bcf86cd799439011';
      mockCollection.findOne.mockResolvedValue({ _id: validId, config: { bundleId: 'bid' }, type: 'apple' });
      const result = await connectorService.findConnectorById(validId);
      expect(result).toEqual({ _id: validId, config: { bundleId: 'bid' }, type: 'apple' });
    });
    it('should throw on invalid ObjectId', async () => {
      await expect(connectorService.findConnectorById('notanid')).rejects.toThrow();
    });
  });

  describe('findConnectors', () => {
    it('should find connectors with filter', async () => {
      mockCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ _id: '1', config: { bundleId: 'bid' }, type: 'apple' }]) });
      const result = await connectorService.findConnectors({ type: 'apple' });
      expect(result).toEqual([{ _id: '1', config: { bundleId: 'bid' }, type: 'apple' }]);
    });
    it('should find all connectors if no filter', async () => {
      mockCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ _id: '2', config: { bundleId: 'bid2' }, type: 'apple' }]) });
      const result = await connectorService.findConnectors();
      expect(result).toEqual([{ _id: '2', config: { bundleId: 'bid2' }, type: 'apple' }]);
    });
  });
});
