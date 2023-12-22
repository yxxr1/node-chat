import { nanoid } from 'nanoid';
import { Subscribable, WatchersDictionary, UserId, WatcherId, WatcherCallback } from '@interfaces/core';
import { Message as MessageType } from '@interfaces/api-types';
import { MESSAGES_PAGE_SIZE } from '@const/limits';
import { Message, SERVICE_TYPES } from './message';

export type ChatSubscribeData = {
  messages: MessageType[];
};

export class Chat implements Subscribable<ChatSubscribeData> {
  id: string;
  creatorId?: UserId;
  name: string;
  _watchers: WatchersDictionary = {};
  joinedUsers: UserId[] = [];
  _messages: Message[] = [];

  constructor(name: string, creatorId?: UserId) {
    this.id = nanoid();
    this.creatorId = creatorId;
    this.name = name;
  }

  join(userId: UserId, userName: string | null): Message[] {
    if (!this.isJoined(userId)) {
      this.joinedUsers.push(userId);

      const message = new Message(null, userId, userName, SERVICE_TYPES.CHAT_JOINED);
      this._messages.push(message);
      this._broadcast({ messages: [message] });
    }

    return this._getMessages();
  }

  subscribe(userId: UserId, callback: WatcherCallback<ChatSubscribeData>): WatcherId | null {
    if (this.isJoined(userId)) {
      const id = nanoid();

      this._watchers[id] = { id, userId, callback };

      return id;
    }

    return null;
  }

  unsubscribe(watcherId: WatcherId): void {
    delete this._watchers[watcherId];
  }

  publish(text: string, fromId: UserId, fromName: string | null): Message | null {
    if (this.isJoined(fromId)) {
      const message = new Message(text, fromId, fromName);
      this._messages.push(message);
      this._broadcast({ messages: [message] });

      return message;
    }

    return null;
  }

  quit(userId: UserId, userName: string | null): number | null {
    if (this.isJoined(userId)) {
      this.closeUserWatchers(userId);

      this.joinedUsers = this.joinedUsers.filter((joinedUserId) => joinedUserId !== userId);

      const message = new Message(null, userId, userName, SERVICE_TYPES.CHAT_LEFT);
      this._messages.push(message);
      this._broadcast({ messages: [message] });

      return this.joinedUsers.length;
    }

    return null;
  }

  isJoined(userId: UserId): boolean {
    return this.joinedUsers.includes(userId);
  }

  closeUserWatchers(userId: UserId): void {
    Object.values(this._watchers).forEach(({ id, userId: watcherUserId }) => {
      if (watcherUserId === userId) {
        this._callWatcher(id, null);
        this.unsubscribe(id);
      }
    });
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

  getMessages(userId: UserId, ...args: Parameters<Chat['_getMessages']>): MessageType[] | null {
    if (this.isJoined(userId)) {
      return this._getMessages(...args);
    }

    return null;
  }

  _callWatcher(watcherId: WatcherId, data?: Partial<ChatSubscribeData> | null): void {
    if (this._watchers[watcherId]) {
      this._watchers[watcherId].callback({ messages: data?.messages ?? [] }, data === null);
    }
  }

  _broadcast(data: Partial<ChatSubscribeData>): void {
    Object.keys(this._watchers).forEach((watcherId) => {
      this._callWatcher(watcherId, data);
    });
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
