import { Response } from 'express';
import { nanoid } from 'nanoid';
import { Subscribable, ConnectionsDictionary } from '@interfaces/core';
import { Chat } from './chat';

const REQUEST_TIMEOUT = 30000;
const MAIN_CHAT_NAME = 'main';

class Manager implements Subscribable {
  chats: Chat[] = []
  connections: ConnectionsDictionary = {}

  constructor() {
    this.chats.push(new Chat(MAIN_CHAT_NAME));
  }

  getChat(chatId: string) {
    return this.chats.find(({ id }) => id === chatId)
  }

  addChat(chat: Chat) {
    this.chats.push(chat);
    this._broadcast({ chats: [{ id: chat.id, name: chat.name, messages: [] }] });
  }

  deleteChat(chatId: string) {
    this.chats = this.chats.filter((chat) => {
      const match = chat.id === chatId && chat.name !== MAIN_CHAT_NAME;

      if (match) {
        chat._closeChat();
        this._broadcast({ deletedChatsIds: [chatId] });
      }

      return !match;
    });
  }

  subscribe(userId: string, res: Response) {
    const id = nanoid();
    const timerId = setTimeout(() => {
      this._closeConnection(id);
    }, REQUEST_TIMEOUT);

    this.connections[id] = { id, res, timerId, userId };

    res.on('close', () => {
      clearTimeout(timerId);

      delete this.connections[id];
    });
  }

  closeUserConnections(userId: string) {
    Object.values(this.connections).forEach(({ id, userId: connectionUserId }) => {
      if (connectionUserId === userId) {
        this._closeConnection(id);
      }
    });
  }

  _closeConnection(connectionId: string, data?: { chats?: Partial<Chat>[], deletedChatsIds?: Chat['id'][] }, statusCode?: number) {
    const connection = this.connections[connectionId];

    if (!connection) {
      return;
    }

    const { res, timerId } = connection;
    res.statusCode = statusCode || 200;
    res.json({ chats: data?.chats ?? [], deletedChatsIds: data?.deletedChatsIds ?? [] });

    clearTimeout(timerId);
    delete this.connections[connectionId];
  }

  _broadcast(data: { chats?: Partial<Chat>[], deletedChatsIds?: Chat['id'][] }) {
    Object.keys(this.connections).forEach(connectionId => {
      this._closeConnection(connectionId, data);
    })
  }
}

export const manager = new Manager();
