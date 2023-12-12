import { nanoid } from 'nanoid';
import { Subscribable, WatchersDictionary, ConnectionRecord } from '@interfaces/core';
import { Chat } from './chat';

const MAIN_CHAT_NAME = 'main';

class Manager implements Subscribable {
  chats: Chat[] = []
  _watchers: WatchersDictionary = {}

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

  subscribe(userId: string, callback: ConnectionRecord['callback']) {
    const id = nanoid();

    this._watchers[id] = { id, userId, callback };

    return id;
  }

  unsubscribe(watcherId: string) {
    delete this._watchers[watcherId];
  }

  closeUserWatchers(userId: string) {
    Object.values(this._watchers).forEach(({ id, userId: watcherUserId }) => {
      if (watcherUserId === userId) {
        this._closeWatcher(id);
      }
    });
  }

  _closeWatcher(watcherId: string, data?: { chats?: Partial<Chat>[], deletedChatsIds?: Chat['id'][] }, statusCode?: number) {
    if (!this._watchers[watcherId]) {
      return;
    }

    this._watchers[watcherId].callback(statusCode || 200, { chats: data?.chats ?? [], deletedChatsIds: data?.deletedChatsIds ?? [] });

    delete this._watchers[watcherId];
  }

  _broadcast(data: { chats?: Partial<Chat>[], deletedChatsIds?: Chat['id'][] }) {
    Object.keys(this._watchers).forEach(watcherId => {
      this._closeWatcher(watcherId, data);
    })
  }
}

export const manager = new Manager();
