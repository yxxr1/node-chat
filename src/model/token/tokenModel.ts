import type { Collection } from 'mongodb';
import { initDb } from '../db';
import type { TokenRecord } from './types';

const TABLE_NAME = 'tokens';

export class TokenModel {
  collection: Collection<TokenRecord>;

  constructor() {
    const db = initDb();

    this.collection = db.collection<TokenRecord>(TABLE_NAME);
  }

  async saveToken(token: string, userId: string) {
    return this.collection.insertOne({ token, userId });
  }

  async checkToken(token: string) {
    return !!(await this.collection.findOne({ token }));
  }

  async deleteToken(token: string) {
    return this.collection.deleteOne({ token });
  }
}

export const tokenModel = new TokenModel();
