import axios from 'axios';
import { ChannelHandler, NotificationPayload } from '../../types/Notification';
import { logObj } from '../../utils/logger';


export class SlackHandler implements ChannelHandler {
  async sendNotification(payload: NotificationPayload, config: any): Promise<void> {
    const { webhookUrl } = config;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is missing.');
    }

    const slackPayload = (payload.message as any).blocks
      ? { blocks: (payload.message as any).blocks }
      : { text: payload.message as string };

    // Debugging: Log webhook URL and payload
    logObj.debug(`SlackHandler: Using webhook URL: ${webhookUrl}`);
    logObj.debug(`SlackHandler: Sending payload: ${JSON.stringify(slackPayload)}`);

    try {
      const response = await axios.post(webhookUrl, slackPayload);
      logObj.debug('SlackHandler: Slack API response:', response.data);
    } catch (error: any) {
      logObj.error('SlackHandler: Error sending notification to Slack:', error.message);
      throw error;
    }
  }
}
