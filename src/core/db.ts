import { MongoClient } from 'mongodb';
import { COMMON_CONFIG } from '@config/common';
import { Chat } from '@interfaces/db-types';

const client = new MongoClient(COMMON_CONFIG.MONGO_URL);

export const db = client.db(COMMON_CONFIG.MONGO_DB_NAME);
export const chatsCollection = db.collection<Chat>('chats');

chatsCollection.createIndex({ id: 1 }, { unique: true });
