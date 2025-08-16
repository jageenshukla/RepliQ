import { NotificationPayload } from '../types/Notification';
import { getDb } from '../utils/db';
import { ChannelHandlerFactory } from './ChannelHandlerFactory';
import { logObj } from '../utils/logger';

export class NotificationService {
  static async sendNotification(payload: NotificationPayload) {
    logObj.debug('Received payload:', payload);

    if (!payload.productId) {
      logObj.error('Missing productId in payload:', payload);
      throw new Error('Invalid payload: productId is required.');
    }

    const db = await getDb();
    logObj.debug(`Fetching product details for productId: ${payload.productId}`);
    const product = await db.collection('products').findOne({ productId: payload.productId });

    if (!product) {
      throw new Error(`Product with ID ${payload.productId} not found.`);
    }

    const notificationChannels = await db
      .collection('notificationChannels')
      .find({ _id: { $in: product.notificationChannelIds } })
      .toArray();

    for (const channel of notificationChannels) {
      logObj.debug('Processing channel:', channel);
      if (channel.supportedTypes.includes(payload.type)) {
        const handler = ChannelHandlerFactory.getHandler(channel.type);
        if (handler) {
          await handler.sendNotification(payload, channel.config);
        } else {
          console.warn(`No handler found for channel type: ${channel.type}`);
        }
      }
    }
  }
}
