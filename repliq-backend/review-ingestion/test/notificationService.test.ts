import { NotificationService } from '../src/services/notificationService';
import axios from 'axios';

describe('NotificationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification with correct payload', async () => {
    const postMock = jest.spyOn(axios, 'post').mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '' },
    });
    const input = {
      title: 'Test Title',
      productName: 'TestProduct',
      ingestedCount: 5,
      message: 'Test message'
    };
    await NotificationService.sendNotification(input);
    expect(postMock).toHaveBeenCalledWith(
      expect.stringContaining('/notify'),
      expect.objectContaining({
        productId: input.productName,
        type: 'notify',
        message: expect.any(Object)
      }),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('should throw error if axios fails', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('fail'));
    await expect(NotificationService.sendNotification({
      title: 't', productName: 'p', ingestedCount: 1, message: 'm'
    })).rejects.toThrow('Notification service failed');
  });
});
