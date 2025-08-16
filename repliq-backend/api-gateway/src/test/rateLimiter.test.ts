import { rateLimiter } from '../utils/rateLimiter';

describe('rateLimiter', () => {
  it('should call next()', () => {
    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();
    rateLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should not throw if called multiple times', () => {
    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();
    expect(() => {
      rateLimiter(req, res, next);
      rateLimiter(req, res, next);
    }).not.toThrow();
  });
});
