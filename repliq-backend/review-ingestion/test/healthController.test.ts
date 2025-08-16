import { healthCheck } from '../src/controllers/healthController';
import * as healthService from '../src/services/healthService';
import * as appleJwtUtil from '../src/utils/appleJwt';
import { Request, Response } from 'express';

describe('healthCheck', () => {
  it('should return health status and appleJwt status', async () => {
    // Mock dependencies
    jest.spyOn(healthService, 'getHealthStatus').mockReturnValue('ok');
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue('mocked-token');

    // Mock req/res
    const req = {} as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    await healthCheck(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        service: 'review-ingestion',
        appleJwt: 'valid',
        message: expect.stringContaining('Health endpoint reached'),
      })
    );
  });
});
