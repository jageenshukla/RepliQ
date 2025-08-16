import { ObjectId } from 'mongodb';

export interface NotificationChannel {
  _id?: ObjectId;
  type: string;
  config: {
    webhookUrl?: string;
    channelName?: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
