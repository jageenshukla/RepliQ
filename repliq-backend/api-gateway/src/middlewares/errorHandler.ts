// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

import { createLoggerWithTags } from '../utils/logger';
const logger = createLoggerWithTags(['error', 'middleware']);
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error', { error: err });
  res.status(500).json({ error: 'Internal server error' });
}
