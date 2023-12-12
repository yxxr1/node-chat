import { Response } from 'express'
import { nanoid } from 'nanoid';
import { HttpError } from '@utils/errors';
import { Subscribable, ConnectionsDictionary } from '@interfaces/core';
import { Message, SERVICE_TYPES } from './message'

const REQUEST_TIMEOUT = 10000;

export class Chat implements Subscribable {
  id: string
  creatorId?: string
  name: string
  connections: ConnectionsDictionary = {}
  joinedUsers: string[] = []
  messages: Message[] = []

  constructor(name: string, creatorId?: string) {
    this.id = nanoid();
    this.creatorId = creatorId;
    this.name = name;
  }

  _closeConnection(connectionId: string, messages?: Message[], statusCode?: number) {
    if (!this.connections[connectionId]) {
      return;
    }

    const { res, timerId } = this.connections[connectionId];
    res.statusCode = statusCode || 200;
    res.json({ messages: messages ?? [] });

    clearTimeout(timerId);
    delete this.connections[connectionId];
  }

  _broadcast(messages: Message[]) {
    Object.keys(this.connections).forEach(connectionId => {
      this._closeConnection(connectionId, messages);
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

  subscribe(userId: string, res: Response) {
    if (this.isJoined(userId)) {
      const id = nanoid();
      const timerId = setTimeout(() => {
        this._closeConnection(id, []);
      }, REQUEST_TIMEOUT);

      this.connections[id] = { id, res, timerId, userId };

      res.on('close', () => {
        clearTimeout(timerId);

        delete this.connections[id];
      });
    } else {
      throw new HttpError(403, 'Not joined to this chat');
    }
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

  closeUserConnections(userId: string) {
    Object.values(this.connections).forEach(({ id, userId: connectionUserId }) => {
      if (connectionUserId === userId) {
        this._closeConnection(id);
      }
    });
  }

  quit(userId: string, userName: string | null) {
    if (this.isJoined(userId)) {
      this.closeUserConnections(userId);

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
    Object.keys(this.connections).forEach(connectionId => {
      this._closeConnection(connectionId);
    });
    this.connections = {};
    this.messages = [];
    this.joinedUsers = [];

  }
}
