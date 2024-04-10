import { nanoid } from 'nanoid';
import { Collection, Filter, FindOptions } from 'mongodb';
import { UserId, WatcherId, SubscribeAction } from '@interfaces/core';
import { Chat as ChatApiType } from '@interfaces/api-types';
import { Message as MessageType, Chat as ChatType } from '@interfaces/db-types';
import { MESSAGES_PAGE_SIZE } from '@const/limits';
import { Subscribable, DEFAULT_TYPE, WithUnsubscribeAction, CallbackForAction } from '@core/subscribable';
import { Message, SERVICE_TYPES } from '@core/message';
import { ParametersExceptFirst } from '@utils/types';
import { chatsCollection } from './db';

export const CHAT_SUBSCRIBE_TYPES = {
  DEFAULT: DEFAULT_TYPE,
  CHAT_UPDATED: 'CHAT_UPDATED',
} as const;

export type ChatDefaultSubscribeData = SubscribeAction<(typeof CHAT_SUBSCRIBE_TYPES)['DEFAULT'], { messages: MessageType[] }>;
export type ChatChatUpdatedSubscribeData = SubscribeAction<
  (typeof CHAT_SUBSCRIBE_TYPES)['CHAT_UPDATED'],
  { chatId: ChatType['id']; onlyForJoined: boolean }
>;
export type ChatSubscribeData = WithUnsubscribeAction<ChatDefaultSubscribeData | ChatChatUpdatedSubscribeData>;

export class Chat extends Subscribable<ChatSubscribeData, null> {
  id: string;
  creatorId?: UserId;
  name: string;

  constructor(name: string, creatorId?: UserId, id?: string) {
    super();

    this.id = id ?? nanoid();
    this.creatorId = creatorId;
    this.name = name;

    if (!id) {
      const chat = {
        id: this.id,
        creatorId,
        name,
        joinedUsers: [],
        messages: [],
      };

      chatsCollection.insertOne(chat);
    }
  }

  async subscribe<SubscribeType extends ChatSubscribeData['type'] = typeof CHAT_SUBSCRIBE_TYPES.DEFAULT>(
    userId: UserId | null,
    callback: CallbackForAction<ChatSubscribeData, SubscribeType>,
    type?: SubscribeType,
  ): Promise<WatcherId | null> {
    if (userId === null || (await this.isJoined(userId))) {
      return super.subscribe(userId, callback, type);
    }

    return null;
  }

  async updateChat(...args: ParametersExceptFirst<Collection<ChatType>['updateOne']>): ReturnType<Collection<ChatType>['updateOne']> {
    return await chatsCollection.updateOne({ id: this.id }, ...args);
  }

  async findChat(filter?: Filter<ChatType>, projection?: FindOptions<ChatType>['projection']): Promise<ChatType> {
    return (await chatsCollection.findOne({ ...filter, id: this.id }, { projection })) as ChatType;
  }

  async join(userId: UserId, userName: string | null): Promise<boolean> {
    if (!(await this.isJoined(userId))) {
      await this.updateChat({ $push: { joinedUsers: userId } });

      this._broadcast({ chatId: this.id, onlyForJoined: true }, CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED);
      await this._addMessage(null, userId, userName, SERVICE_TYPES.CHAT_JOINED);

      return true;
    }

    return false;
  }

  async publish(text: string, fromId: UserId, fromName: string | null): Promise<MessageType | null> {
    if (await this.isJoined(fromId)) {
      return this._addMessage(text, fromId, fromName);
    }

    return null;
  }

  async quit(userId: UserId, userName: string | null): Promise<number | null> {
    if (await this.isJoined(userId)) {
      this.closeUserWatchers(userId);

      await this.updateChat({ $pull: { joinedUsers: userId } });

      this._broadcast({ chatId: this.id, onlyForJoined: true }, CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED);
      await this._addMessage(null, userId, userName, SERVICE_TYPES.CHAT_LEFT);

      return (await this.findChat()).joinedUsers.length;
    }

    return null;
  }

  async isJoined(userId: UserId): Promise<boolean> {
    return !!(await this.findChat({ joinedUsers: { $elemMatch: { $eq: userId } } }));
  }

  async getMessages(userId: UserId, ...args: Parameters<Chat['_getMessages']>): Promise<MessageType[] | null> {
    if (await this.isJoined(userId)) {
      return this._getMessages(...args);
    }

    return null;
  }

  async getChatEntity(userId?: UserId | null, withMessages = true): Promise<ChatApiType> {
    const isJoined = !!userId && (await this.isJoined(userId));

    return {
      id: this.id,
      name: this.name,
      joinedCount: isJoined ? (await this.findChat()).joinedUsers.length : null,
      messages: isJoined && withMessages ? await this._getMessages() : [],
    };
  }

  async _addMessage(...messageParams: ConstructorParameters<typeof Message>): Promise<MessageType> {
    const lastMessage = (await this.findChat({}, { messages: { $slice: -1 } })).messages;
    const index = lastMessage.length ? lastMessage[0].index + 1 : 0;
    const message = new Message(...messageParams);
    message.setIndex(index);
    await this.updateChat({ $push: { messages: message } });

    this._broadcast({ messages: [message] }, CHAT_SUBSCRIBE_TYPES.DEFAULT);

    return message;
  }

  async _getMessages(lastMessageId?: MessageType['id'], direction: 1 | -1 = 1, pageSize = MESSAGES_PAGE_SIZE): Promise<MessageType[]> {
    if (lastMessageId) {
      const { messages } = await this.findChat({}, { messages: { $elemMatch: { id: lastMessageId } } });
      const lastMessageIndex = messages ? messages[0].index : -1;

      if (lastMessageIndex === -1) {
        return [];
      }

      if (Math.sign(direction) === 1) {
        return (await this.findChat({}, { messages: { $slice: [lastMessageIndex + 1, pageSize] } })).messages;
      } else {
        const startIndex = pageSize > lastMessageIndex ? 0 : lastMessageIndex - pageSize;
        const count = lastMessageIndex - startIndex;

        if (count === 0) {
          return [];
        }

        return (await this.findChat({}, { messages: { $slice: [startIndex, count] } })).messages;
      }
    }

    return (await this.findChat({}, { messages: { $slice: -pageSize } })).messages;
  }

  _closeChat(): void {
    this._closeAllWatchers();
    chatsCollection.deleteOne({ id: this.id });
  }
}
