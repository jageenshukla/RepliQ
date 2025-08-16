
import { Request, Response } from 'express';
import { getHealthStatus } from '../services/healthService';
import { logObj } from '../utils/logger';
import { createLoggerWithTags } from '../utils/logger';
import { generateAppleJwt } from '../utils/appleJwt';

const healthLogger = createLoggerWithTags(['health', 'api']);


export const healthCheck = async (req: Request, res: Response) => {
  healthLogger.info('Health endpoint accessed', ['health', 'api']);
  const status = getHealthStatus();

  // Use a valid sample connector ObjectId string (replace with your actual value if needed)
  // Use a valid sample bundleId (replace with your actual value if needed)
  const bundleId = 'jp.co.rakuten.music';

  let appleJwtStatus = 'not tested';
  try {
    const token = await generateAppleJwt(bundleId);
    appleJwtStatus = token ? 'valid' : 'invalid';
  } catch (err) {
    appleJwtStatus = 'error';
    healthLogger.error('Apple JWT generation failed', ['health', 'jwt'], { error: String(err) });
  }

  res.json({
    status,
    service: 'review-ingestion',
    timestamp: new Date().toISOString(),
    appleJwt: appleJwtStatus,
    message: 'Health endpoint reached successfully!'
  });
};
