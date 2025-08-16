import request from 'supertest';
import express from 'express';
import healthRoutes from '../src/routes/healthRoutes';

describe('Health Check Endpoint', () => {
  const app = express();
  app.use(healthRoutes);

  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'notification' });
  });
});
