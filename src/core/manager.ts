import { UserId } from '@interfaces/core';
import { Chat as ChatType } from '@interfaces/api-types';
import { Subscribable } from '@core/subscribable';
import { Chat } from '@core/chat';

export type ManagerSubscribeData = {
  chats: ChatType[];
  deletedChatsIds: ChatType['id'][];
};

const MAIN_CHAT_NAME = 'main';

class Manager extends Subscribable<ManagerSubscribeData> {
  chats: Chat[] = [];

  constructor() {
    super();

    this.chats.push(new Chat(MAIN_CHAT_NAME));
  }

  getChat(chatId: Chat['id']): Chat | undefined {
    return this.chats.find(({ id }) => id === chatId);
  }

  addChat(chat: Chat): void {
    this.chats.push(chat);
    this._broadcast({ chats: [{ id: chat.id, name: chat.name, messages: [] }], deletedChatsIds: [] });
  }

  deleteChat(chatId: Chat['id']): void {
    this.chats = this.chats.filter((chat) => {
      const match = chat.id === chatId && chat.name !== MAIN_CHAT_NAME;

      if (match) {
        chat._closeChat();
        this._broadcast({ deletedChatsIds: [chatId], chats: [] });
      }

      return !match;
    });
  }

  getUserJoinedChats(userId: UserId) {
    return this.chats.filter((chat) => chat.isJoined(userId));
  }
}

export const manager = new Manager();
