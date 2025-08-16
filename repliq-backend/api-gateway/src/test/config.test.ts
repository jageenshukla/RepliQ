import { services } from '../config/services';

describe('Config', () => {
  it('should export services array', () => {
    expect(Array.isArray(services)).toBe(true);
  });
});
