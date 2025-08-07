import { UserId, SubscribeAction } from '@interfaces/core';
import { Chat as ChatApiType } from '@interfaces/api-types';
import { Chat as ChatDbType } from '@interfaces/db-types';
import { Subscribable, DEFAULT_TYPE } from '@core/subscribable';
import { Chat, CHAT_SUBSCRIBE_TYPES, ChatChatUpdatedSubscribeAction } from '@core/chat';
import { MAIN_CHAT_NAME } from '@const/common';
import { chatsCollection } from './db';

export const MANAGER_SUBSCRIBE_TYPES = {
  DEFAULT: DEFAULT_TYPE,
  CHAT_UPDATED: 'CHAT_UPDATED',
} as const;
type ManagerSubscribeTypes = typeof MANAGER_SUBSCRIBE_TYPES;

export type ManagerDefaultSubscribeAction = SubscribeAction<
  ManagerSubscribeTypes['DEFAULT'],
  { newChats: ChatApiType[]; deletedChatsIds: ChatApiType['id'][] }
>;
export type ManagerChatUpdatedSubscribeAction = SubscribeAction<
  ManagerSubscribeTypes['CHAT_UPDATED'],
  ChatChatUpdatedSubscribeAction['payload']
>;
export type ManagerSubscribeActions = ManagerDefaultSubscribeAction | ManagerChatUpdatedSubscribeAction;

class Manager extends Subscribable<ManagerSubscribeActions> {
  chats: Chat[] = [];

  async initChats() {
    const chats = await chatsCollection.find<Pick<ChatDbType, 'id'>>({}, { projection: { _id: 0, id: 1 } });

    if (await chats.hasNext()) {
      let chat;
      while ((chat = await chats.next())) {
        await this.addChat(Chat.restoreChat(chat.id));
      }
    } else {
      const chat = await Chat.createChat(MAIN_CHAT_NAME);

      if (!chat) {
        throw new Error('cannot create main chat');
      }

      await this.addChat(chat);
    }
  }

  getChat(chatId: Chat['id']): Chat | undefined {
    return this.chats.find(({ id }) => id === chatId);
  }
  async getChatEntities(userId: UserId) {
    return Promise.all(this.chats.map((chat) => chat.getChatEntity(userId)));
  }

  async addChat(chat: Chat): Promise<void> {
    this.chats.push(chat);
    await chat.subscribe(
      null,
      ({ payload }) => {
        this._broadcast(payload, MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED);
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

  async deleteChat(chatId: Chat['id']): Promise<void> {
    const dbChat = await chatsCollection.findOne<Pick<ChatDbType, 'name'>>({ id: chatId }, { projection: { name: 1 } });

    if (dbChat && dbChat.name !== MAIN_CHAT_NAME) {
      const chat = this.chats.find(({ id }) => id === chatId);

      if (chat) {
        await chat._closeChat();
        this._broadcast({ deletedChatsIds: [chatId], newChats: [] }, MANAGER_SUBSCRIBE_TYPES.DEFAULT);
        this.chats = this.chats.filter((item) => item !== chat);
      }
    }
  }

  async getUserJoinedChats(userId: UserId): Promise<Chat[]> {
    const isJoined = await Promise.all(this.chats.map((chat) => chat.isJoined(userId)));

    return this.chats.filter((chat, index) => isJoined[index]);
  }
}

export const manager = new Manager();
