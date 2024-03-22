import { UserId, SubscribeAction } from '@interfaces/core';
import { Chat as ChatType } from '@interfaces/api-types';
import { Subscribable, DEFAULT_TYPE, WithUnsubscribeAction } from '@core/subscribable';
import { Chat, CHAT_SUBSCRIBE_TYPES, ChatChatUpdatedSubscribeData } from '@core/chat';
import { MAIN_CHAT_NAME } from '@const/common';

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

  constructor() {
    super();

    this.addChat(new Chat(MAIN_CHAT_NAME));
  }

  getChat(chatId: Chat['id']): Chat | undefined {
    return this.chats.find(({ id }) => id === chatId);
  }

  addChat(chat: Chat): void {
    this.chats.push(chat);
    chat.subscribe(
      null,
      ({ type, payload }) => {
        if (type === CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED) {
          this._broadcast<ManagerChatUpdatedSubscribeData>(payload, MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED);
        }
      },
      CHAT_SUBSCRIBE_TYPES.CHAT_UPDATED,
    );

    this._broadcast<ManagerDefaultSubscribeData>({
      newChats: [chat.getChatEntity(null, false)],
      deletedChatsIds: [],
    });
  }

  deleteChat(chatId: Chat['id']): void {
    this.chats = this.chats.filter((chat) => {
      const match = chat.id === chatId && chat.name !== MAIN_CHAT_NAME;

      if (match) {
        chat._closeChat();
        this._broadcast<ManagerDefaultSubscribeData>({ deletedChatsIds: [chatId], newChats: [] });
      }

      return !match;
    });
  }

  getUserJoinedChats(userId: UserId) {
    return this.chats.filter((chat) => chat.isJoined(userId));
  }
}

export const manager = new Manager();
