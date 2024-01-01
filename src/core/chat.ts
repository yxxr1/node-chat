import { nanoid } from 'nanoid';
import { UserId, WatcherId, WatcherCallback } from '@interfaces/core';
import { Message as MessageType } from '@interfaces/api-types';
import { MESSAGES_PAGE_SIZE } from '@const/limits';
import { Subscribable } from '@core/subscribable';
import { Message, SERVICE_TYPES } from '@core/message';

export type ChatSubscribeData = {
  messages: MessageType[];
};

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

  subscribe(userId: UserId, callback: WatcherCallback<ChatSubscribeData>): WatcherId | null {
    if (this.isJoined(userId)) {
      return super.subscribe(userId, callback);
    }

    return null;
  }

  join(userId: UserId, userName: string | null): Message[] {
    if (!this.isJoined(userId)) {
      this.joinedUsers.push(userId);

      this._addMessage(null, userId, userName, SERVICE_TYPES.CHAT_JOINED);
    }

    return this._getMessages();
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

  _addMessage(...messageParams: ConstructorParameters<typeof Message>): Message {
    const index = this._messages.length ? this._messages[this._messages.length - 1].index + 1 : 0;
    const message = new Message(...messageParams);
    message.setIndex(index);
    this._messages.push(message);

    this._broadcast({ messages: [message] });

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
    Object.keys(this._watchers).forEach((watcherId) => {
      this._callWatcher(watcherId, null);
    });
    this._watchers = {};
    this._messages = [];
    this.joinedUsers = [];
  }
}
