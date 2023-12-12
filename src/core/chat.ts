import { nanoid } from 'nanoid';
import { HttpError } from '@utils/errors';
import { Subscribable, WatchersDictionary, ConnectionRecord } from '@interfaces/core';
import { Message, SERVICE_TYPES } from './message'

export class Chat implements Subscribable {
  id: string
  creatorId?: string
  name: string
  _watchers: WatchersDictionary = {}
  joinedUsers: string[] = []
  messages: Message[] = []

  constructor(name: string, creatorId?: string) {
    this.id = nanoid();
    this.creatorId = creatorId;
    this.name = name;
  }

  _closeWatcher(watcherId: string, messages?: Message[], statusCode?: number) {
    if (!this._watchers[watcherId]) {
      return;
    }

    this._watchers[watcherId].callback(statusCode || 200, { messages: messages ?? [] });
    delete this._watchers[watcherId];
  }

  _broadcast(messages: Message[]) {
    Object.keys(this._watchers).forEach(watcherId => {
      this._closeWatcher(watcherId, messages);
    })
  }

  isJoined(userId: string) {
    return this.joinedUsers.includes(userId);
  }

  join(userId: string, userName: string | null) {
    if (!this.isJoined(userId)) {
      this.joinedUsers.push(userId);

      const message = new Message(null, userId, userName, SERVICE_TYPES.CHAT_JOINED);
      this.messages.push(message);
      this._broadcast([message]);
    }

    return { messages: this.messages };
  }

  subscribe(userId: string, callback: ConnectionRecord['callback']) {
    if (this.isJoined(userId)) {
      const id = nanoid();

      this._watchers[id] = { id, userId, callback };

      return id;
    } else {
      throw new HttpError(403, 'Not joined to this chat');
    }
  }

  unsubscribe(watcherId: string) {
    delete this._watchers[watcherId];
  }

  publish(text: string, fromId: string, fromName: string | null) {
    if (this.isJoined(fromId)) {
      const message = new Message(text, fromId, fromName);

      this.messages.push(message);

      this._broadcast([message]);

      return message;
    } else {
      throw new HttpError(403, 'Not joined to this chat');
    }
  }

  closeUserWatchers(userId: string) {
    Object.values(this._watchers).forEach(({ id, userId: watcherUserId }) => {
      if (watcherUserId === userId) {
        this._closeWatcher(id);
      }
    });
  }

  quit(userId: string, userName: string | null) {
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

  _closeChat(){
    Object.keys(this._watchers).forEach(watcherId => {
      this._closeWatcher(watcherId);
    });
    this._watchers = {};
    this.messages = [];
    this.joinedUsers = [];

  }
}
