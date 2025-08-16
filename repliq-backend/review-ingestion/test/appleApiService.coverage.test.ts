import * as dbUtil from '../src/utils/db';
jest.mock('../src/services/connectorService', () => ({
  findConnectorById: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
}));

import { AppleApiService } from '../src/services/appleApiService';
import * as appleJwtUtil from '../src/utils/appleJwt';
import axios from 'axios';
import { findConnectorById } from '../src/services/connectorService';
import jwt from 'jsonwebtoken';

const connector = {
  _id: 'cid',
  type: 'apple',
  config: {
    p8FilePath: 'path',
    keyId: 'kid',
    issuerId: 'iid',
    bundleId: 'bid',
    apiUrl: 'http://api'
  }
};

describe('AppleApiService coverage', () => {
  it('should fetchAllApps with fetchAll=false and params undefined', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue('jwt');
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    const response = {
      data: { foo: 'bar' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    };
    jest.spyOn(axios, 'get').mockResolvedValue(response);
    const service = await AppleApiService.createForConnectorId('cid');
    const result = await service.fetchAllApps();
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should refresh JWT if expired', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    let jwtCallCount = 0;
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockImplementation(async () => {
      jwtCallCount++;
      return 'jwt';
    });
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    const service = await AppleApiService.createForConnectorId('cid');
    // First call to getJwt
    await (service as any).getJwt();
    // Simulate expired JWT
    (service as any).jwtExpiresAt = 1;
    (service as any).jwtIssuedAt = 0;
    await (service as any).getJwt();
    expect(jwtCallCount).toBeGreaterThan(1);
  });

  it('should handle fetchCustomerReviews with non-array data and non-object links', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue('jwt');
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    const response = {
      data: { data: null, links: null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    };
    jest.spyOn(axios, 'get').mockResolvedValue(response);
    const service = await AppleApiService.createForConnectorId('cid');
    const result = await service.fetchCustomerReviews('appId');
    expect(result).toEqual({ data: [], pagination: { nextPageUrl: null, hasMore: false } });
  });

  it('should handle fetchCustomerReviews error and log details', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue('jwt');
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    const error = new Error('fail') as any;
    error.response = { data: { errors: [{ code: 'E' }] } };
    error.config = { url: 'url' };
    jest.spyOn(axios, 'get').mockRejectedValue(error);
    const service = await AppleApiService.createForConnectorId('cid');
    await expect(service.fetchCustomerReviews('appId')).rejects.toThrow('fail');
  });
  beforeEach(() => {
    jest.spyOn(dbUtil, 'getDb').mockResolvedValue({} as any);
    (findConnectorById as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  it('should fetch all apps with pagination', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue('jwt');
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    // Simulate two pages
    const firstPage = {
      data: { data: [{ id: 1 }], links: { next: 'next-url' } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    };
    const secondPage = {
      data: { data: [{ id: 2 }], links: {} },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    };
    const getMock = jest.spyOn(axios, 'get');
    getMock.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);
    const service = await AppleApiService.createForConnectorId('cid');
    const result = await service.fetchAllApps({}, true);
    expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }] });
  });

  it('should fetch customer reviews with pagination', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue('jwt');
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    // Simulate two pages
    const firstPage = {
      data: { data: [{ id: 'r1' }], links: { next: 'next-url' } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    };
    const secondPage = {
      data: { data: [{ id: 'r2' }], links: {} },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    };
    const getMock = jest.spyOn(axios, 'get');
    getMock.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);
    const service = await AppleApiService.createForConnectorId('cid');
    // Manually call the private method via any cast for coverage
    const allData = await (service as any).fetchAllPaginatedAppleApi('url', { Authorization: 'Bearer jwt' });
    expect(allData).toEqual([{ id: 'r1' }, { id: 'r2' }]);
  });

  it('should throw if required config is missing', async () => {
    const badConnector = { ...connector, config: { ...connector.config, apiUrl: undefined } };
    (findConnectorById as jest.Mock).mockResolvedValue(badConnector);
    await expect(AppleApiService.createForConnectorId('cid')).rejects.toThrow('Missing required config: apiUrl');
  });

  it('should throw if connector is not found', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(null);
    await expect(AppleApiService.createForConnectorId('cid')).rejects.toThrow('Connector not found');
  });

  it('should throw if JWT generation fails', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue(undefined as any);
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    const service = await AppleApiService.createForConnectorId('cid');
    await expect(service.fetchAllApps()).rejects.toThrow('Failed to generate Apple JWT');
  });

  it('should handle error in fetchAllPaginatedAppleApi', async () => {
    (findConnectorById as jest.Mock).mockResolvedValue(connector);
    jest.spyOn(appleJwtUtil, 'generateAppleJwt').mockResolvedValue('jwt');
    (jwt.decode as jest.Mock).mockReturnValue({ exp: 1000, iat: 0 });
    jest.spyOn(axios, 'get').mockRejectedValue(new Error('fail'));
    const service = await AppleApiService.createForConnectorId('cid');
    await expect((service as any).fetchAllPaginatedAppleApi('url', { Authorization: 'Bearer jwt' })).rejects.toThrow('fail');
  });
});
