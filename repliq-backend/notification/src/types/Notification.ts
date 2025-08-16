
export interface NotificationPayload {
  productId: string;
  type: 'notify'; // Future types: 'confirmation', etc.
  message: string | { blocks: any[] };
}

export interface ChannelHandler {
  sendNotification(payload: NotificationPayload, config: any): Promise<void>;
}
