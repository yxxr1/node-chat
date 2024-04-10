import { UserId, SubscribeAction } from '@interfaces/core';
import { Chat as ChatType } from '@interfaces/api-types';
import { Subscribable, DEFAULT_TYPE, WithUnsubscribeAction } from '@core/subscribable';
import { Chat, CHAT_SUBSCRIBE_TYPES, ChatChatUpdatedSubscribeData } from '@core/chat';
import { MAIN_CHAT_NAME } from '@const/common';
import { chatsCollection } from './db';

export const MANAGER_SUBSCRIBE_TYPES = {
  DEFAULT: DEFAULT_TYPE,
  CHAT_UPDATED: 'CHAT_UPDATED',
} as const;

export type ManagerDefaultSubscribeData = SubscribeAction<
  (typeof MANAGER_SUBSCRIBE_TYPES)['DEFAULT'],
  { newChats: ChatType[]; deletedChatsIds: ChatType['id'][] }
>;
export type ManagerChatUpdatedSubscribeData = SubscribeAction<
  (typeof MANAGER_SUBSCRIBE_TYPES)['CHAT_UPDATED'],
  ChatChatUpdatedSubscribeData['payload']
>;
export type ManagerSubscribeData = WithUnsubscribeAction<ManagerDefaultSubscribeData | ManagerChatUpdatedSubscribeData>;

class Manager extends Subscribable<ManagerSubscribeData> {
  chats: Chat[] = [];

  async initChats() {
    const chats = await chatsCollection.find().project({ id: 1, creatorId: 1, name: 1 });

    if (await chats.hasNext()) {
      chats.forEach(({ id, creatorId, name }) => {
        this.addChat(new Chat(name, creatorId, id));
      });
    } else {
      this.addChat(new Chat(MAIN_CHAT_NAME));
    }
  }

  getChat(chatId: Chat['id']): Chat | undefined {
    return this.chats.find(({ id }) => id === chatId);
  }

  async addChat(chat: Chat): Promise<void> {
    this.chats.push(chat);
    await chat.subscribe(
      null,
      ({ type, payload }) => {
        if (type === CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED) {
          this._broadcast(payload, MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED);
        }
      },
      CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED,
    );

    this._broadcast(
      {
        newChats: [await chat.getChatEntity(null, false)],
        deletedChatsIds: [],
      },
      MANAGER_SUBSCRIBE_TYPES.DEFAULT,
    );
  }

  deleteChat(chatId: Chat['id']): void {
    this.chats = this.chats.filter((chat) => {
      const match = chat.id === chatId && chat.name !== MAIN_CHAT_NAME;

      if (match) {
        chat._closeChat();
        this._broadcast({ deletedChatsIds: [chatId], newChats: [] }, MANAGER_SUBSCRIBE_TYPES.DEFAULT);
      }

      return !match;
    });
  }

  async getUserJoinedChats(userId: UserId): Promise<Chat[]> {
    const isJoined = await Promise.all(this.chats.map((chat) => chat.isJoined(userId)));

    return this.chats.filter((chat, index) => isJoined[index]);
  }
}

export const manager = new Manager();
manager.initChats();
