import { errorHandler } from '../middlewares/errorHandler';

describe('errorHandler middleware', () => {
  it('should send 500 and error message', () => {
    const err = new Error('fail');
    const req = {} as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
