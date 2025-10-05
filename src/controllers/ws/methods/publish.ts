import { manager } from '@services/chat';
import type { Chat } from '@controllers/types';
import type { WSMessageHandler } from '../types';

export type PublishPayload = {
  chatId: Chat['id'];
  message: string;
};

export const publish: WSMessageHandler<PublishPayload> = ({ chatId, message }, { userId, name }) => {
  const chat = manager.getChat(chatId);

  if (chat) {
    chat.publish(message, userId, name);
  }
};
