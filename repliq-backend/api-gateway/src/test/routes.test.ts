import healthRouter from '../routes/health';
import proxyRouter from '../routes/proxy';

describe('Routes', () => {
  it('should export health router', () => {
    expect(healthRouter).toBeDefined();
  });

  it('should export proxy router', () => {
    expect(proxyRouter).toBeDefined();
  });
});
