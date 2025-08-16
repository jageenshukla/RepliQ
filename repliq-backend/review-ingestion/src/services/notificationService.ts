import axios from 'axios';
import { logObj } from '../utils/logger';


interface NotificationInput {
  title: string;
  productName: string;
  ingestedCount: number;
  message: string;
}

export class NotificationService {
  private static getNotificationUrl() {
    const base = process.env.NOTIFICATION_BASE_URL || 'http://localhost:3004';
    return `${base}/notify`;
  }

  public static async sendNotification({ title, productName, ingestedCount, message }: NotificationInput): Promise<void> {
    const payload = {
      productId: productName,
      type: 'notify',
      message: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: title,
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*📌 Product Name:*\n${productName}`
              },
              {
                type: 'mrkdwn',
                text: `*📊 Ingested Reviews:*\n${ingestedCount}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: '🔔 This message was generated automatically by the RepliQ system.'
              }
            ]
          }
        ]
      }
    };

    try {
      await axios.post(this.getNotificationUrl(), payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logObj.error('Failed to send notification:', ['notification-service'], { error });
      throw new Error('Notification service failed');
    }
  }
}
