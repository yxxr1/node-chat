import { Chat, Message } from '@interfaces/api-types';

export interface SubscribedChat {
  chatId: Chat['id'];
  messages: Message[];
}

export interface WatchChats {
  newChats: Chat[];
  deletedChatsIds: Chat['id'][];
  updatedChats: Chat[];
}
