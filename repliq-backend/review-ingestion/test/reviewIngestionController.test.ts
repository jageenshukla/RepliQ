import { ingestReviewsByProductId } from '../src/controllers/reviewIngestionController';
import * as dbUtil from '../src/utils/db';
import * as AppleApiServiceModule from '../src/services/appleApiService';
import * as NotificationServiceModule from '../src/services/notificationService';
import ProcessReviewService from '../src/services/processReviewService';
import { Request, Response } from 'express';

describe('ingestReviewsByProductId', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn(() => ({ json }));
    req = { params: { productId: 'test-product' } };
    res = { json, status };
    jest.clearAllMocks();
    jest.spyOn(dbUtil, 'getDb').mockResolvedValue({} as any);
  });

  it('should return 404 if product not found', async () => {
    jest.spyOn(dbUtil, 'getDb').mockResolvedValue({
      collection: () => ({
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ productId: 'p1' }]) })
      })
    } as any);
    await ingestReviewsByProductId(req as Request, res as Response);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not found') }));
  });

  it('should handle successful ingestion', async () => {
    jest.spyOn(dbUtil, 'getDb').mockResolvedValue({
      collection: (name: string) => {
        if (name === 'products') {
          return {
            findOne: jest.fn().mockResolvedValue({ productId: 'test-product', connectorIds: ['c1'] }),
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ productId: 'p1' }]) })
          };
        }
        if (name === 'connectors') {
          return {
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ _id: 'c1', type: 'apple', config: { appId: 'app1' } }]) })
          };
        }
        if (name === 'reviews') {
          return {
            findOne: jest.fn().mockResolvedValue(null),
            insertOne: jest.fn().mockResolvedValue({ insertedId: 'r1' })
          };
        }
        return {};
      }
    } as any);
    jest.spyOn(AppleApiServiceModule.AppleApiService, 'createForConnectorId').mockResolvedValue({
      fetchCustomerReviews: jest.fn().mockResolvedValue({
        data: [{ id: 'review1' }],
        pagination: { hasMore: false, nextPageUrl: null }
      })
    } as any);
    jest.spyOn(ProcessReviewService, 'callProcessReviewService').mockResolvedValue(undefined);
    jest.spyOn(NotificationServiceModule.NotificationService, 'sendNotification').mockResolvedValue(undefined);
    await ingestReviewsByProductId(req as Request, res as Response);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('should handle duplicate review', async () => {
    jest.spyOn(dbUtil, 'getDb').mockResolvedValue({
      collection: (name: string) => {
        if (name === 'products') {
          return {
            findOne: jest.fn().mockResolvedValue({ productId: 'test-product', connectorIds: ['c1'] }),
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ productId: 'p1' }]) })
          };
        }
        if (name === 'connectors') {
          return {
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ _id: 'c1', type: 'apple', config: { appId: 'app1' } }]) })
          };
        }
        if (name === 'reviews') {
          return {
            findOne: jest.fn().mockResolvedValue({ sourceReviewId: 'review1', source: 'apple' }),
            insertOne: jest.fn()
          };
        }
        return {};
      }
    } as any);
    jest.spyOn(AppleApiServiceModule.AppleApiService, 'createForConnectorId').mockResolvedValue({
      fetchCustomerReviews: jest.fn().mockResolvedValue({
        data: [{ id: 'review1' }],
        pagination: { hasMore: false, nextPageUrl: null }
      })
    } as any);
    jest.spyOn(ProcessReviewService, 'callProcessReviewService').mockResolvedValue(undefined);
    jest.spyOn(NotificationServiceModule.NotificationService, 'sendNotification').mockResolvedValue(undefined);
    await ingestReviewsByProductId(req as Request, res as Response);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('should handle errors and return 500', async () => {
    jest.spyOn(dbUtil, 'getDb').mockRejectedValue(new Error('db error'));
    await ingestReviewsByProductId(req as Request, res as Response);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });
});
