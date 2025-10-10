import { Collection, Filter, FindOptions, MongoClient } from 'mongodb';
import { COMMON_CONFIG } from '@config/common';
import { ParametersExceptFirst } from '@utils/types';
import type { Chat, User, Message, ChatInfo } from './types';

export class ChatsModel {
  client: MongoClient;
  collection: Collection<Chat>;

  constructor() {
    this.client = new MongoClient(COMMON_CONFIG.MONGO_URL);

    const db = this.client.db(COMMON_CONFIG.MONGO_DB_NAME);
    const chatsCollection = db.collection<Chat>('chats');

    chatsCollection.createIndex({ id: 1 }, { unique: true });

    this.collection = chatsCollection;
  }

  async getAllChatIds() {
    return this.collection.find<Pick<Chat, 'id'>>({}, { projection: { _id: 0, id: 1 } });
  }

  async getChatNameById(id: Chat['id']) {
    return this.collection.findOne<Pick<Chat, 'name'>>({ id }, { projection: { name: 1 } });
  }

  async checkChatName(name: Chat['name']) {
    const chatWithName = await this.collection.findOne<Pick<Chat, 'id'>>({ name }, { projection: { id: 1 } });
    return chatWithName !== null;
  }

  async createChat(chat: Chat) {
    const result = await this.collection.insertOne(chat);

    if (!result.insertedId) {
      throw new Error('cannot create chat');
    }

    return result;
  }

  async deleteChat(id: Chat['id']) {
    return this.collection.deleteOne({ id });
  }

  async _updateChat(id: Chat['id'], ...args: ParametersExceptFirst<Collection<Chat>['updateOne']>) {
    const result = await this.collection.updateOne({ id }, ...args);

    if (result.matchedCount !== 1) {
      throw new Error('cannot modify chat');
    }

    return result;
  }

  async addUserToChat(chatId: Chat['id'], userId: User['id']) {
    return this._updateChat(chatId, { $push: { joinedUsers: userId } });
  }

  async removeUserFromChat(chatId: Chat['id'], userId: User['id']) {
    return this._updateChat(chatId, { $pull: { joinedUsers: userId } });
  }

  addMessage(chatId: Chat['id'], message: Message) {
    return this._updateChat(chatId, { $push: { messages: message } });
  }

  async _findChat<T extends object = Partial<Chat>>(filter: Filter<Chat>, projection?: FindOptions<Chat>['projection']): Promise<T | null> {
    return this.collection.findOne<T & Partial<Chat>>(filter, { projection });
  }

  async getChatJoinedUsersCount(chatId: Chat['id']) {
    return (await this._findChat<{ joinedCount: number }>({ id: chatId }, { joinedCount: { $size: '$joinedUsers' } }))?.joinedCount || 0;
  }

  async isJoined(chatId: Chat['id'], userId: User['id']) {
    return !!(await this._findChat({ id: chatId, joinedUsers: { $elemMatch: { $eq: userId } } }));
  }

  async getChatInfo(chatId: Chat['id']): Promise<ChatInfo | null> {
    return this._findChat<ChatInfo>({ id: chatId }, { name: 1, creatorId: 1, joinedCount: { $size: '$joinedUsers' } });
  }

  async getLastMessage(chatId: Chat['id']): Promise<Message | null> {
    return (await this._findChat<{ messages: Message[] }>({ id: chatId }, { messages: { $slice: -1 } }))?.messages[0] || null;
  }
  async getMessageById(chatId: Chat['id'], messageId: Message['id']): Promise<Message | null> {
    return (
      (await this._findChat<{ messages: Message[] }>({ id: chatId }, { messages: { $elemMatch: { id: messageId } } }))?.messages[0] || null
    );
  }
  async getMessagesSlice(chatId: Chat['id'], sliceIndexes: [number, number] | number) {
    return (await this._findChat({ id: chatId }, { messages: { $slice: sliceIndexes } }))?.messages || [];
  }
}

export const chatsModel = new ChatsModel();
