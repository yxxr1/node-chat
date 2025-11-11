import { MongoClient } from 'mongodb';
import { COMMON_CONFIG } from '@config/common';

let client: MongoClient;

export const initDb = () => {
  if (!client) {
    client = new MongoClient(COMMON_CONFIG.MONGO_URL);
  }

  return client.db(COMMON_CONFIG.MONGO_DB_NAME);
};
