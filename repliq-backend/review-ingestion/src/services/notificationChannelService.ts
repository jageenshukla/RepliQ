import { Db, ObjectId } from 'mongodb';
import { NotificationChannel } from '../models/NotificationChannel';

export async function insertNotificationChannel(db: Db, channel: NotificationChannel) {
  return db.collection('notificationChannels').insertOne(channel);
}

export async function findNotificationChannelById(db: Db, id: string) {
  return db.collection('notificationChannels').findOne({ _id: new ObjectId(id) });
}

export async function findNotificationChannels(db: Db, filter = {}) {
  return db.collection('notificationChannels').find(filter).toArray();
}
