import { nanoid } from 'nanoid';
import { HttpError } from '@utils/errors';
import { Subscribable, WatchersDictionary, UserId, WatcherId, WatcherCallback } from '@interfaces/core';
import { Message, SERVICE_TYPES } from './message'

type Data = Message[];

export class Chat implements Subscribable<Data> {
  id: string
  creatorId?: UserId
  name: string
  _watchers: WatchersDictionary = {}
  joinedUsers: UserId[] = []
  messages: Message[] = []

  constructor(name: string, creatorId?: UserId) {
    this.id = nanoid();
    this.creatorId = creatorId;
    this.name = name;
  }

  _closeWatcher(watcherId: WatcherId, messages?: Data, statusCode?: number): void {
    if (!this._watchers[watcherId]) {
      return;
    }

    this._watchers[watcherId].callback(statusCode || 200, { messages: messages ?? [] });
    delete this._watchers[watcherId];
  }

  _broadcast(messages: Data): void {
    Object.keys(this._watchers).forEach(watcherId => {
      this._closeWatcher(watcherId, messages);
    })
  }

  isJoined(userId: UserId): boolean {
    return this.joinedUsers.includes(userId);
  }

  join(userId: UserId, userName: string | null): Message[] {
    if (!this.isJoined(userId)) {
      this.joinedUsers.push(userId);

      const message = new Message(null, userId, userName, SERVICE_TYPES.CHAT_JOINED);
      this.messages.push(message);
      this._broadcast([message]);
    }

    return this.messages;
  }

  subscribe(userId: UserId, callback: WatcherCallback): WatcherId {
    if (this.isJoined(userId)) {
      const id = nanoid();

      this._watchers[id] = { id, userId, callback };

      return id;
    } else {
      throw new HttpError(403, 'Not joined to this chat');
    }
  }

  unsubscribe(watcherId: WatcherId): void {
    delete this._watchers[watcherId];
  }

  publish(text: string, fromId: UserId, fromName: string | null): Message {
    if (this.isJoined(fromId)) {
      const message = new Message(text, fromId, fromName);

      this.messages.push(message);

      this._broadcast([message]);

      return message;
    } else {
      throw new HttpError(403, 'Not joined to this chat');
    }
  }

  closeUserWatchers(userId: UserId): void {
    Object.values(this._watchers).forEach(({ id, userId: watcherUserId }) => {
      if (watcherUserId === userId) {
        this._closeWatcher(id);
      }
    });
  }

  quit(userId: UserId, userName: string | null): number {
    if (this.isJoined(userId)) {
      this.closeUserWatchers(userId);

      this.joinedUsers = this.joinedUsers.filter(joinedUserId => joinedUserId !== userId);

      const message = new Message(null, userId, userName, SERVICE_TYPES.CHAT_LEFT);
      this.messages.push(message);
      this._broadcast([message]);

      return this.joinedUsers.length;
    } else {
      throw new HttpError(403, 'Not joined to this chat');
    }
  }

  _closeChat(): void {
    Object.keys(this._watchers).forEach(watcherId => {
      this._closeWatcher(watcherId);
    });
    this._watchers = {};
    this.messages = [];
    this.joinedUsers = [];

  }
}
