import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
import { createLoggerWithTags } from './utils/logger';
const logger = createLoggerWithTags(['api-gateway']);
app.listen(port, () => {
  logger.info(`api-gateway listening on port ${port}`);
});

import { loggerMiddleware } from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';
import healthRouter from './routes/health';
import proxyRouter from './routes/proxy';
import { rateLimiter } from './utils/rateLimiter';

// Middlewares
app.use(loggerMiddleware);
app.use(rateLimiter);

// Health check route
app.use('/health', healthRouter);

// Proxy routes
app.use('/', proxyRouter);

// Error handler
app.use(errorHandler);
