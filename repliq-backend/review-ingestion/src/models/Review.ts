import { ObjectId } from 'mongodb';

export interface Review {
  _id?: ObjectId;
  source: string;
  sourceReviewId: string;
  productId: string;
  content: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}
