import { nanoid } from 'nanoid';
import { UserId, WatcherId, SubscribeAction } from '@interfaces/core';
import { Message as MessageType, Chat as ChatType } from '@interfaces/api-types';
import { MESSAGES_PAGE_SIZE } from '@const/limits';
import { Subscribable, DEFAULT_TYPE, WithUnsubscribeAction, CallbackForAction } from '@core/subscribable';
import { Message, SERVICE_TYPES } from '@core/message';

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
  joinedUsers: UserId[] = [];
  _messages: Message[] = [];

  constructor(name: string, creatorId?: UserId) {
    super();

    this.id = nanoid();
    this.creatorId = creatorId;
    this.name = name;
  }

  subscribe<SubscribeType extends ChatSubscribeData['type'] = typeof CHAT_SUBSCRIBE_TYPES.DEFAULT>(
    userId: UserId | null,
    callback: CallbackForAction<ChatSubscribeData, SubscribeType>,
    type?: SubscribeType,
  ): WatcherId | null {
    if (userId === null || this.isJoined(userId)) {
      return super.subscribe(userId, callback, type);
    }

    return null;
  }

  join(userId: UserId, userName: string | null): number {
    if (!this.isJoined(userId)) {
      this.joinedUsers.push(userId);

      this._broadcast({ chatId: this.id, onlyForJoined: true }, CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED);
      this._addMessage(null, userId, userName, SERVICE_TYPES.CHAT_JOINED);
    }

    return this.joinedUsers.length;
  }

  publish(text: string, fromId: UserId, fromName: string | null): Message | null {
    if (this.isJoined(fromId)) {
      return this._addMessage(text, fromId, fromName);
    }

    return null;
  }

  quit(userId: UserId, userName: string | null): number | null {
    if (this.isJoined(userId)) {
      this.closeUserWatchers(userId);

      this.joinedUsers = this.joinedUsers.filter((joinedUserId) => joinedUserId !== userId);

      this._broadcast({ chatId: this.id, onlyForJoined: true }, CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED);
      this._addMessage(null, userId, userName, SERVICE_TYPES.CHAT_LEFT);

      return this.joinedUsers.length;
    }

    return null;
  }

  isJoined(userId: UserId): boolean {
    return this.joinedUsers.includes(userId);
  }

  getMessages(userId: UserId, ...args: Parameters<Chat['_getMessages']>): MessageType[] | null {
    if (this.isJoined(userId)) {
      return this._getMessages(...args);
    }

    return null;
  }

  getChatEntity(userId?: UserId | null, withMessages = true): ChatType {
    const isJoined = !!userId && this.isJoined(userId);

    return {
      id: this.id,
      name: this.name,
      joinedCount: isJoined ? this.joinedUsers.length : null,
      messages: isJoined && withMessages ? this._getMessages() : [],
    };
  }

  _addMessage(...messageParams: ConstructorParameters<typeof Message>): Message {
    const index = this._messages.length ? this._messages[this._messages.length - 1].index + 1 : 0;
    const message = new Message(...messageParams);
    message.setIndex(index);
    this._messages.push(message);

    this._broadcast({ messages: [message] }, CHAT_SUBSCRIBE_TYPES.DEFAULT);

    return message;
  }

  _getMessages(lastMessageId?: Message['id'], direction: 1 | -1 = 1, pageSize = MESSAGES_PAGE_SIZE): Message[] {
    if (lastMessageId) {
      const lastMessageIndex = this._messages.findIndex(({ id }) => id === lastMessageId);

      if (lastMessageIndex === -1) {
        return [];
      }

      if (Math.sign(direction) === 1) {
        return this._messages.slice(lastMessageIndex + 1, lastMessageIndex + pageSize + 1);
      } else {
        const startIndex = lastMessageIndex - pageSize;
        return this._messages.slice(startIndex < 0 ? 0 : startIndex, lastMessageIndex);
      }
    }

    return this._messages.slice(-pageSize);
  }

  _closeChat(): void {
    this._closeAllWatchers();
    this._watchers = {};
    this._messages = [];
    this.joinedUsers = [];
  }
}
