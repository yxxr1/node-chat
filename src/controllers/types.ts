import type { Message } from '@model/types';

export type { UserSettings, User, Message } from '@model/types';

export type { ChatEntity as Chat } from '@services/chat/types';

export interface SubscribedChatPayload {
  chatId: Chat['id'];
  messages: Message[];
}

export interface WatchChatsPayload {
  newChats: Chat[];
  deletedChatsIds: Chat['id'][];
  updatedChats: Chat[];
}
