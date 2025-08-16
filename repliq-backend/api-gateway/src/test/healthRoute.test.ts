import request from 'supertest';
import express from 'express';
import healthRouter from '../routes/health';

jest.mock('../utils/mongo', () => ({
  checkMongoHealth: jest.fn().mockResolvedValue(true)
}));

jest.mock('../config/services', () => ({
  services: [
    { name: 'mock-service', url: 'http://localhost:1234', path: '/mock', enabled: true }
  ]
}));

import axios from 'axios';
jest.mock('axios');

describe('Health Route', () => {
  // Increase timeout for the suite to handle long-running timer tests
  jest.setTimeout(10000);
  const app = express();
  app.use('/', healthRouter);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return ok status when all services are healthy', async () => {
    (axios.get as jest.Mock).mockResolvedValue({ status: 200 });
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.services)).toBe(true);
  });

  it('should return fail status when a service is unhealthy', async () => {
    (axios.get as jest.Mock).mockRejectedValue({ response: { status: 500 } });
    const res = await request(app).get('/');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('fail');
    expect(Array.isArray(res.body.services)).toBe(true);
    expect(res.body.services.some((s: any) => s.status === 'fail')).toBe(true);
  });

  it('should return fail status when mongo health times out', async () => {
    jest.resetModules();
    const mockCheckMongoHealth = jest.fn().mockImplementation(() => new Promise(() => {})); // never resolves
    jest.doMock('../utils/mongo', () => ({
      checkMongoHealth: mockCheckMongoHealth
    }));
    (axios.get as jest.Mock).mockResolvedValue({ status: 200 });
    const { default: healthRouter } = require('../routes/health');
    const app2 = express();
    app2.use('/', healthRouter);
    const res = await request(app2).get('/');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('fail');
    expect(res.body.services.some((s: any) => s.name === 'mongodb' && s.status === 'fail')).toBe(true);
  });

  it('should handle error branches in health check', async () => {
    (axios.get as jest.Mock).mockRejectedValue({ code: 'ECONNREFUSED', message: 'Connection refused' });
    const res = await request(app).get('/');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('fail');
    expect(res.body.services.some((s: any) => s.status === 'fail')).toBe(true);
  });
});
