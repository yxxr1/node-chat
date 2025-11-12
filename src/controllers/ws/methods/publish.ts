import { manager } from '@/services/chat';
import type { Chat } from '@/controllers/types';
import type { WSMessageHandler } from '../types';
import type { WSConnectionManager } from '../manager';

export type PublishPayload = {
  chatId: Chat['id'];
  message: string;
};

type Context = {
  connectionManager: WSConnectionManager;
};

export const publish: WSMessageHandler<PublishPayload, Context> = ({ chatId, message }, { id: userId }) => {
  const chat = manager.getChat(chatId);

  if (chat) {
    chat.publish(message, userId);
  }
};
