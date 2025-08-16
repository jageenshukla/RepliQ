import * as dbUtil from '../src/utils/db';
jest.mock('../src/services/connectorService', () => ({
  findConnectors: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));
import { generateAppleJwt } from '../src/utils/appleJwt';
import { findConnectors } from '../src/services/connectorService';
import * as fs from 'fs/promises';
import jwt from 'jsonwebtoken';
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('generateAppleJwt', () => {
  beforeEach(() => {
    jest.spyOn(dbUtil, 'getDb').mockResolvedValue({} as any);
    (findConnectors as jest.Mock).mockReset();
    (fs.readFile as jest.Mock).mockReset();
    (jwt.sign as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  it('should return token if all is well', async () => {
    (findConnectors as jest.Mock).mockResolvedValue([{ config: { p8FilePath: 'path', keyId: 'kid', issuerId: 'iid', bundleId: 'bid' } }]);
    (fs.readFile as jest.Mock).mockResolvedValue('PRIVATEKEY');
    (jwt.sign as jest.Mock).mockReturnValue('token');
    const token = await generateAppleJwt('bid');
    expect(token).toBe('token');
  });

  it('should return null if connector not found', async () => {
    (findConnectors as jest.Mock).mockResolvedValue([]);
    const token = await generateAppleJwt('bid');
    expect(token).toBeNull();
  });

  it('should return null if connector config missing', async () => {
    (findConnectors as jest.Mock).mockResolvedValue([{}]);
    const token = await generateAppleJwt('bid');
    expect(token).toBeNull();
  });

  it('should return null and log if fs.readFile fails', async () => {
    (findConnectors as jest.Mock).mockResolvedValue([{ config: { p8FilePath: 'path', keyId: 'kid', issuerId: 'iid', bundleId: 'bid' } }]);
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('fail'));
    const token = await generateAppleJwt('bid');
    expect(token).toBeNull();
  });

  it('should return null and log if jwt.sign throws', async () => {
    (findConnectors as jest.Mock).mockResolvedValue([{ config: { p8FilePath: 'path', keyId: 'kid', issuerId: 'iid', bundleId: 'bid' } }]);
    (fs.readFile as jest.Mock).mockResolvedValue('PRIVATEKEY');
    (jwt.sign as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
    const token = await generateAppleJwt('bid');
    expect(token).toBeNull();
  });
});
