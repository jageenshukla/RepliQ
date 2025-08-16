import { ObjectId } from 'mongodb';

export interface Product {
  _id?: ObjectId;
  productId: string;
  name: string;
  description: string;
  connectorIds: ObjectId[];
  notificationChannelIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
