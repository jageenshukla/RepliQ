import { NotificationService } from '../src/services/NotificationService';
import { ChannelHandlerFactory } from '../src/services/ChannelHandlerFactory';
import * as dbModule from '../src/utils/db';

describe('NotificationService', () => {
  const mockDb: any = {
    collection: jest.fn().mockImplementation((name: string) => {
      if (name === 'products') {
        return {
          findOne: jest.fn().mockResolvedValue({
            productId: 'p1',
            notificationChannelIds: ['c1']
          })
        };
      }
      if (name === 'notificationChannels') {
        return {
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([
              { _id: 'c1', type: 'slack', supportedTypes: ['notify'], config: { webhookUrl: 'http://test' } }
            ])
          })
        };
      }
      return {};
    })
  };

  beforeAll(() => {
    jest.spyOn(dbModule, 'getDb').mockResolvedValue(mockDb);
    jest.spyOn(ChannelHandlerFactory, 'getHandler').mockReturnValue({
      sendNotification: jest.fn().mockResolvedValue(undefined)
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should send notification successfully', async () => {
    await expect(
      NotificationService.sendNotification({ productId: 'p1', type: 'notify', message: 'Hello' })
    ).resolves.not.toThrow();
  });

  it('should throw error if productId is missing', async () => {
    // @ts-ignore
    await expect(NotificationService.sendNotification({ type: 'notify', message: 'Hello' })).rejects.toThrow(
      'Invalid payload: productId is required.'
    );
  });

  it('should throw error if product not found', async () => {
    jest.spyOn(mockDb, 'collection').mockImplementationOnce(() => ({
      findOne: jest.fn().mockResolvedValue(null)
    }));
    await expect(
      NotificationService.sendNotification({ productId: 'notfound', type: 'notify', message: 'Hello' })
    ).rejects.toThrow('Product with ID notfound not found.');
  });
});
