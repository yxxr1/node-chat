import { WSMessageHandler } from '@ws/types';
import { manager } from '@core';
import { Chat } from '@interfaces/api-types';

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
