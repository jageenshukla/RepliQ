import { Db, ObjectId } from 'mongodb';
import { Review } from '../models/Review';

export async function insertReview(db: Db, review: Review) {
  return db.collection('reviews').insertOne(review);
}

export async function findReviewById(db: Db, id: string) {
  return db.collection('reviews').findOne({ _id: new ObjectId(id) });
}

export async function findReviews(db: Db, filter = {}) {
  return db.collection('reviews').find(filter).toArray();
}
