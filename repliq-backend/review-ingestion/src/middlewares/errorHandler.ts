import { Request, Response, NextFunction } from 'express';
import { logObj } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logObj.error('Unhandled error', ['middleware'], { error: err });
  res.status(500).json({ error: 'Internal Server Error' });
}
