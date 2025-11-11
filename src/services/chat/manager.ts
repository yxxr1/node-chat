import { chatsModel } from '@model/chats';
import { MAIN_CHAT_NAME } from '@const/common';
import { Subscribable } from './subscribable';
import { Chat, CHAT_SUBSCRIBE_TYPES } from './chat';
import type { ChatChatUpdatedSubscribeAction } from './chat';
import type { UserId, SubscribeAction, ChatEntity } from './types';

export const MANAGER_SUBSCRIBE_TYPES = {
  CHAT_LIST_UPDATED: 'CHAT_LIST_UPDATED',
  CHAT_UPDATED: 'CHAT_UPDATED',
} as const;
type ManagerSubscribeTypes = typeof MANAGER_SUBSCRIBE_TYPES;

export type ManagerChatListUpdatedSubscribeAction = SubscribeAction<
  ManagerSubscribeTypes['CHAT_LIST_UPDATED'],
  { newChats: ChatEntity[]; deletedChatsIds: ChatEntity['id'][] }
>;
export type ManagerChatUpdatedSubscribeAction = SubscribeAction<
  ManagerSubscribeTypes['CHAT_UPDATED'],
  ChatChatUpdatedSubscribeAction['payload']
>;
export type ManagerSubscribeActions = ManagerChatListUpdatedSubscribeAction | ManagerChatUpdatedSubscribeAction;

export class Manager extends Subscribable<ManagerSubscribeActions> {
  chats: Chat[] = [];

  async initChats() {
    const chats = await chatsModel.getAllChatIds();

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

  async addChat(chat: Chat, broadcastExtra?: Record<string, unknown>): Promise<void> {
    this.chats.push(chat);
    chat.subscribe(
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
      MANAGER_SUBSCRIBE_TYPES.CHAT_LIST_UPDATED,
      broadcastExtra,
    );
  }

  async deleteChat(chatId: Chat['id'], broadcastExtra?: Record<string, unknown>): Promise<void> {
    const dbChat = await chatsModel.getChatNameById(chatId);

    if (!dbChat || (dbChat && dbChat.name !== MAIN_CHAT_NAME)) {
      const chat = this.chats.find(({ id }) => id === chatId);

      if (chat) {
        await chat._closeChat();
        this._broadcast({ deletedChatsIds: [chatId], newChats: [] }, MANAGER_SUBSCRIBE_TYPES.CHAT_LIST_UPDATED, broadcastExtra);
        this.chats = this.chats.filter((item) => item !== chat);
      }
    }
  }

  async getUserJoinedChats(userId: UserId): Promise<Chat[]> {
    const chats = [...this.chats];
    const isJoined = await Promise.all(chats.map((chat) => chat.isJoined(userId)));

    return chats.filter((chat, index) => isJoined[index]);
  }
}

export const manager = new Manager();
