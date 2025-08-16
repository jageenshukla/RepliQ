// src/routes/health.ts

import express from 'express';
import axios from 'axios';
import { services } from '../config/services';
import { checkMongoHealth } from '../utils/mongo';
import { createLoggerWithTags } from '../utils/logger';

const logger = createLoggerWithTags(['health', 'api']);

const router = express.Router();

router.get('/', async (_req, res) => {
  const enabledServices = services.filter(svc => svc.enabled);
  const results = await Promise.all(
    enabledServices.map(async (svc) => {
      const healthUrl = svc.url + '/health';
      // Debug log only, do not expose in API response
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`[HealthCheck] Checking ${svc.name} at ${healthUrl}`);
      }
      try {
        await axios.get(healthUrl, { timeout: 2000 });
        return { name: svc.name, status: 'ok' };
      } catch (err: any) {
        let reason = 'unknown error';
        if (err.response) {
          reason = `HTTP ${err.response.status}`;
        } else if (err.code) {
          reason = err.code;
        } else if (err.message) {
          reason = err.message;
        }
        logger.error(`[HealthCheck] ${svc.name} failed: ${reason} (URL: ${healthUrl})`);
        return { name: svc.name, status: 'fail', reason };
      }
    })
  );

  // MongoDB health check with 2s timeout
  const mongoTimeout = 2000;
  const mongoPromise = checkMongoHealth();
  const timeoutPromise = new Promise<boolean>(resolve => setTimeout(() => resolve(false), mongoTimeout));
  const mongoOk = await Promise.race([mongoPromise, timeoutPromise]);
  results.push({ name: 'mongodb', status: mongoOk ? 'ok' : 'fail' });

  const allOk = results.every(r => r.status === 'ok');
  res.status(allOk ? 200 : 503).json({ status: allOk ? 'ok' : 'fail', services: results });
});

export default router;
