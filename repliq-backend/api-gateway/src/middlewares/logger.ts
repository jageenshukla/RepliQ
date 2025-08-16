// src/middlewares/logger.ts
import morgan from 'morgan';

// Use morgan for HTTP request logging
export const loggerMiddleware = morgan('dev');
