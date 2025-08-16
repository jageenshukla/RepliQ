import ProcessReviewService from '../src/services/processReviewService';
import axios from 'axios';

describe('ProcessReviewService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call process-review service with correct payload', async () => {
    const postMock = jest.spyOn(axios, 'post').mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });
    await ProcessReviewService.callProcessReviewService('pid', ['rid1', 'rid2']);
    expect(postMock).toHaveBeenCalledWith(
      expect.stringContaining('/process-review'),
      expect.objectContaining({ productId: 'pid', sourceReviewIds: ['rid1', 'rid2'] }),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('should throw error if axios fails', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('fail'));
    await expect(ProcessReviewService.callProcessReviewService('pid', ['rid'])).rejects.toThrow('fail');
  });
});
