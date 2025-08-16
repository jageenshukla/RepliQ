import { getDb, checkMongoHealth } from '../utils/mongo';
import { rateLimiter } from '../utils/rateLimiter';

describe('Utils', () => {
  it('should have a getDb function', () => {
    expect(typeof getDb).toBe('function');
  });

  it('should have a checkMongoHealth function', () => {
    expect(typeof checkMongoHealth).toBe('function');
  });

  it('should have a rateLimiter function', () => {
    expect(typeof rateLimiter).toBe('function');
  });
});
