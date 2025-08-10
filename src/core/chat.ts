import { nanoid } from 'nanoid';
import { Collection, Filter, FindOptions } from 'mongodb';
import { UserId, WatcherId, SubscribeAction, CallbackForAction, WildcardSubscribeType } from '@interfaces/core';
import { Chat as ChatApiType } from '@interfaces/api-types';
import { Message as MessageType, Chat as ChatType } from '@interfaces/db-types';
import { MESSAGES_PAGE_SIZE } from '@const/limits';
import { Subscribable } from '@core/subscribable';
import { Message, SERVICE_TYPES } from '@core/message';
import { ParametersExceptFirst } from '@utils/types';
import { chatsCollection } from './db';

export const CHAT_SUBSCRIBE_TYPES = {
  NEW_MESSAGES: 'NEW_MESSAGES',
  CHAT_UPDATED: 'CHAT_UPDATED',
} as const;
type ChatSubscribeTypes = typeof CHAT_SUBSCRIBE_TYPES;

type CommonPayload = { chatId: ChatType['id'] };
export type ChatNewMessagesSubscribeAction = SubscribeAction<
  ChatSubscribeTypes['NEW_MESSAGES'],
  CommonPayload & { messages: MessageType[] }
>;
export type ChatChatUpdatedSubscribeAction = SubscribeAction<
  ChatSubscribeTypes['CHAT_UPDATED'],
  CommonPayload & { onlyForJoined: boolean }
>;
export type ChatSubscribeActions = ChatNewMessagesSubscribeAction | ChatChatUpdatedSubscribeAction;

export class Chat extends Subscribable<ChatSubscribeActions> {
  id: string;

  constructor(id?: string) {
    super();

    this.id = id ?? nanoid();
  }

  static async createChat(name: string, creatorId?: UserId): Promise<Chat | null> {
    const chatWithName = await chatsCollection.findOne<Pick<ChatType, 'id'>>({ name }, { projection: { id: 1 } });

    if (chatWithName === null) {
      const newChat = new Chat();

      const result = await chatsCollection.insertOne({
        id: newChat.id,
        creatorId: creatorId,
        name: name,
        joinedUsers: [],
        messages: [],
      });

      if (!result.insertedId) {
        throw new Error('cannot create chat');
      }

      return newChat;
    }

    return null;
  }
  static restoreChat(id: string) {
    return new Chat(id);
  }

  async subscribeIfJoined<SubscribeType extends ChatSubscribeActions['type'] | WildcardSubscribeType>(
    userId: UserId,
    callback: CallbackForAction<ChatSubscribeActions, SubscribeType>,
    type: SubscribeType,
    onUnsubscribed?: () => void,
  ): Promise<WatcherId | null> {
    if (await this.isJoined(userId)) {
      return super.subscribe(userId, callback, type, onUnsubscribed);
    }

    return null;
  }

  async updateChat(...args: ParametersExceptFirst<Collection<ChatType>['updateOne']>): ReturnType<Collection<ChatType>['updateOne']> {
    const result = await chatsCollection.updateOne({ id: this.id }, ...args);

    if (result.matchedCount !== 1) {
      throw new Error('cannot modify chat');
    }

    return result;
  }

  async findChat<Extra extends object>(
    filter?: Filter<ChatType>,
    projection?: FindOptions<ChatType>['projection'],
  ): Promise<(Extra & ChatType) | null> {
    return chatsCollection.findOne<Extra & ChatType>({ ...filter, id: this.id }, { projection });
  }

  async join(userId: UserId, userName: string): Promise<boolean> {
    if (!(await this.isJoined(userId))) {
      await this.updateChat({ $push: { joinedUsers: userId } });

      this._broadcast({ chatId: this.id, onlyForJoined: true }, CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED);
      await this._addMessage(null, userId, userName, SERVICE_TYPES.CHAT_JOINED);

      return true;
    }

    return false;
  }

  async publish(text: string, fromId: UserId, fromName: string): Promise<MessageType | null> {
    if (await this.isJoined(fromId)) {
      return this._addMessage(text, fromId, fromName);
    }

    return null;
  }

  async quit(userId: UserId, userName: string): Promise<number | null> {
    if (await this.isJoined(userId)) {
      await this.updateChat({ $pull: { joinedUsers: userId } });

      this.closeUserWatchers(userId);

      this._broadcast({ chatId: this.id, onlyForJoined: true }, CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED);
      await this._addMessage(null, userId, userName, SERVICE_TYPES.CHAT_LEFT);

      return (await this.findChat())?.joinedUsers.length || 0;
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
    const chat = await this.findChat<{ joinedCount: number }>({}, { name: 1, joinedCount: { $size: '$joinedUsers' } });

    return {
      id: this.id,
      name: chat?.name || '',
      joinedCount: isJoined ? chat?.joinedCount || 0 : null,
      messages: isJoined && withMessages ? await this._getMessages() : [],
    };
  }

  async _addMessage(...messageParams: ConstructorParameters<typeof Message>): Promise<MessageType> {
    const lastMessage = (await this.findChat({}, { messages: { $slice: -1 } }))?.messages || [];
    const index = lastMessage.length ? lastMessage[0].index + 1 : 0;
    const message = new Message(...messageParams);
    message.setIndex(index);
    await this.updateChat({ $push: { messages: message } });

    this._broadcast({ chatId: this.id, messages: [message] }, CHAT_SUBSCRIBE_TYPES.NEW_MESSAGES);

    return message;
  }

  async _getMessages(lastMessageId?: MessageType['id'], direction: 1 | -1 = 1, pageSize = MESSAGES_PAGE_SIZE): Promise<MessageType[]> {
    if (lastMessageId) {
      const { messages } = (await this.findChat({}, { messages: { $elemMatch: { id: lastMessageId } } })) || {};
      const lastMessageIndex = messages ? messages[0].index : -1;

      if (lastMessageIndex === -1) {
        return [];
      }

      if (Math.sign(direction) === 1) {
        return (await this.findChat({}, { messages: { $slice: [lastMessageIndex + 1, pageSize] } }))?.messages || [];
      } else {
        const startIndex = pageSize > lastMessageIndex ? 0 : lastMessageIndex - pageSize;
        const count = lastMessageIndex - startIndex;

        if (count === 0) {
          return [];
        }

        return (await this.findChat({}, { messages: { $slice: [startIndex, count] } }))?.messages || [];
      }
    }

    return (await this.findChat({}, { messages: { $slice: -pageSize } }))?.messages || [];
  }

  async _closeChat(): Promise<void> {
    await chatsCollection.deleteOne({ id: this.id });
    this._closeAllWatchers();
  }
}
