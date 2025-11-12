import type { Collection, Filter, FindOptions } from 'mongodb';
import type { User } from '@/model/user';
import type { ParametersExceptFirst } from '@/utils/types';
import type { ChatRecord, Message, ChatInfo } from './types';
import { initDb } from '../db';

const TABLE_NAME = 'chats';

export class ChatsModel {
  collection: Collection<ChatRecord>;

  constructor() {
    const db = initDb();
    const chatsCollection = db.collection<ChatRecord>(TABLE_NAME);

    chatsCollection.createIndex({ id: 1 }, { unique: true });

    this.collection = chatsCollection;
  }

  async getAllChatIds() {
    return this.collection.find<Pick<ChatRecord, 'id'>>({}, { projection: { _id: 0, id: 1 } });
  }

  async getChatNameById(id: ChatRecord['id']) {
    return this.collection.findOne<Pick<ChatRecord, 'name'>>({ id }, { projection: { name: 1 } });
  }

  async checkChatName(name: ChatRecord['name']) {
    const chatWithName = await this.collection.findOne<Pick<ChatRecord, 'id'>>({ name }, { projection: { id: 1 } });
    return chatWithName !== null;
  }

  async createChat(chat: ChatRecord) {
    const result = await this.collection.insertOne(chat);

    if (!result.insertedId) {
      throw new Error('cannot create chat');
    }

    return result;
  }

  async deleteChat(id: ChatRecord['id']) {
    return this.collection.deleteOne({ id });
  }

  async _updateChat(id: ChatRecord['id'], ...args: ParametersExceptFirst<Collection<ChatRecord>['updateOne']>) {
    const result = await this.collection.updateOne({ id }, ...args);

    if (result.matchedCount !== 1) {
      throw new Error('cannot modify chat');
    }

    return result;
  }

  async addUserToChat(chatId: ChatRecord['id'], userId: User['id']) {
    return this._updateChat(chatId, { $push: { joinedUsers: userId } });
  }

  async removeUserFromChat(chatId: ChatRecord['id'], userId: User['id']) {
    return this._updateChat(chatId, { $pull: { joinedUsers: userId } });
  }

  addMessage(chatId: ChatRecord['id'], message: Message) {
    return this._updateChat(chatId, { $push: { messages: message } });
  }

  async _findChat<T extends object = Partial<ChatRecord>>(
    filter: Filter<ChatRecord>,
    projection?: FindOptions<ChatRecord>['projection'],
  ): Promise<T | null> {
    return this.collection.findOne<T & Partial<ChatRecord>>(filter, { projection });
  }

  async getChatJoinedUsersCount(chatId: ChatRecord['id']) {
    return (await this._findChat<{ joinedCount: number }>({ id: chatId }, { joinedCount: { $size: '$joinedUsers' } }))?.joinedCount || 0;
  }

  async isJoined(chatId: ChatRecord['id'], userId: User['id']) {
    return !!(await this._findChat({ id: chatId, joinedUsers: { $elemMatch: { $eq: userId } } }));
  }

  async getChatInfo(chatId: ChatRecord['id']): Promise<ChatInfo | null> {
    return this._findChat<ChatInfo>({ id: chatId }, { name: 1, creatorId: 1, joinedCount: { $size: '$joinedUsers' } });
  }

  async getLastMessage(chatId: ChatRecord['id']): Promise<Message | null> {
    return (await this._findChat<{ messages: Message[] }>({ id: chatId }, { messages: { $slice: -1 } }))?.messages[0] || null;
  }
  async getMessageById(chatId: ChatRecord['id'], messageId: Message['id']): Promise<Message | null> {
    return (
      (await this._findChat<{ messages: Message[] }>({ id: chatId }, { messages: { $elemMatch: { id: messageId } } }))?.messages[0] || null
    );
  }
  async getMessagesSlice(chatId: ChatRecord['id'], sliceIndexes: [number, number] | number): Promise<Message[]> {
    return (await this._findChat({ id: chatId }, { messages: { $slice: sliceIndexes } }))?.messages || [];
  }
}

export const chatsModel = new ChatsModel();
