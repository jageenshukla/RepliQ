import { Db, ObjectId } from 'mongodb';
import { Product } from '../models/Product';

export async function insertProduct(db: Db, product: Product) {
  return db.collection('products').insertOne(product);
}

export async function findProductById(db: Db, id: string) {
  return db.collection('products').findOne({ _id: new ObjectId(id) });
}

export async function findProducts(db: Db, filter = {}) {
  return db.collection('products').find(filter).toArray();
}
