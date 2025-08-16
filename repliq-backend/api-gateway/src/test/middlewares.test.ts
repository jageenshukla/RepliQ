import { loggerMiddleware } from '../middlewares/logger';
import { errorHandler } from '../middlewares/errorHandler';

describe('Middlewares', () => {
  it('should have a loggerMiddleware', () => {
    expect(typeof loggerMiddleware).toBe('function');
  });

  it('should have an errorHandler', () => {
    expect(typeof errorHandler).toBe('function');
  });
});
