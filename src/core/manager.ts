import { nanoid } from 'nanoid';
import { Subscribable, WatchersDictionary, WatcherId, WatcherCallback, UserId } from '@interfaces/core';
import { Chat } from './chat';

type Data = {
  chats?: Partial<Chat>[];
  deletedChatsIds?: Chat['id'][];
};

const MAIN_CHAT_NAME = 'main';

class Manager implements Subscribable<Data> {
  chats: Chat[] = []
  _watchers: WatchersDictionary = {}

  constructor() {
    this.chats.push(new Chat(MAIN_CHAT_NAME));
  }

  getChat(chatId: Chat['id']): Chat | undefined {
    return this.chats.find(({ id }) => id === chatId)
  }

  addChat(chat: Chat): void {
    this.chats.push(chat);
    this._broadcast({ chats: [{ id: chat.id, name: chat.name, messages: [] }] });
  }

  deleteChat(chatId: Chat['id']): void {
    this.chats = this.chats.filter((chat) => {
      const match = chat.id === chatId && chat.name !== MAIN_CHAT_NAME;

      if (match) {
        chat._closeChat();
        this._broadcast({ deletedChatsIds: [chatId] });
      }

      return !match;
    });
  }

  subscribe(userId: UserId, callback: WatcherCallback): WatcherId {
    const id = nanoid();

    this._watchers[id] = { id, userId, callback };

    return id;
  }

  unsubscribe(watcherId: WatcherId) {
    delete this._watchers[watcherId];
  }

  closeUserWatchers(userId: UserId): void {
    Object.values(this._watchers).forEach(({ id, userId: watcherUserId }) => {
      if (watcherUserId === userId) {
        this._closeWatcher(id);
      }
    });
  }

  _closeWatcher(watcherId: WatcherId, data?: Data): void {
    if (!this._watchers[watcherId]) {
      return;
    }

    this._watchers[watcherId].callback({ chats: data?.chats ?? [], deletedChatsIds: data?.deletedChatsIds ?? [] });

    delete this._watchers[watcherId];
  }

  _broadcast(data: Data): void {
    Object.keys(this._watchers).forEach(watcherId => {
      this._closeWatcher(watcherId, data);
    })
  }
}

export const manager = new Manager();
