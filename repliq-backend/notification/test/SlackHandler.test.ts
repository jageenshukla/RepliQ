import { SlackHandler } from '../src/services/handlers/SlackHandler';
import { NotificationPayload } from '../src/types/Notification';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SlackHandler', () => {
  const handler = new SlackHandler();
  const payload: NotificationPayload = {
    productId: 'p1',
    type: 'notify',
    message: 'Hello Slack!'
  };
  const config = { webhookUrl: 'http://slack-webhook' };


  const axiosResponse = {
    data: 'ok',
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  };

  it('should send notification with text', async () => {
    mockedAxios.post.mockResolvedValue(axiosResponse as any);
    await expect(handler.sendNotification(payload, config)).resolves.not.toThrow();
    expect(mockedAxios.post).toHaveBeenCalledWith('http://slack-webhook', { text: 'Hello Slack!' });
  });

  it('should send notification with blocks if present', async () => {
    const blockPayload = { ...payload, message: { blocks: [{ type: 'section', text: { type: 'plain_text', text: 'Block' } }] } };
    mockedAxios.post.mockResolvedValue(axiosResponse as any);
    await expect(handler.sendNotification(blockPayload, config)).resolves.not.toThrow();
    expect(mockedAxios.post).toHaveBeenCalledWith('http://slack-webhook', { blocks: [{ type: 'section', text: { type: 'plain_text', text: 'Block' } }] });
  });

  it('should throw error if webhookUrl is missing', async () => {
    await expect(handler.sendNotification(payload, {})).rejects.toThrow('Slack webhook URL is missing.');
  });

  it('should throw error if axios fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('fail'));
    await expect(handler.sendNotification(payload, config)).rejects.toThrow('fail');
  });
});
