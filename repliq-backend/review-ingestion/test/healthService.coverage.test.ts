import { getHealthStatus } from '../src/services/healthService';

describe('healthService', () => {
  it('should return ok', () => {
    expect(getHealthStatus()).toBe('ok');
  });
});
