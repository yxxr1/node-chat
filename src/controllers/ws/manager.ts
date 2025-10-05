import type { Chat } from '@controllers/types';

export class WSConnectionManager {
  subscribedChats: Chat['id'][] = [];

  isSubscribed(chatId: Chat['id']) {
    return this.subscribedChats.includes(chatId);
  }

  addSubscribed(chatId: Chat['id']) {
    this.subscribedChats.push(chatId);
  }

  deleteSubscribed(chatId: Chat['id']) {
    this.subscribedChats = this.subscribedChats.filter((subscribedChatId) => subscribedChatId !== chatId);
  }
}
