import { WSMessageHandler } from '@ws/types';
import { manager } from '@core';
import { Chat } from '@interfaces/api-types';
import { MAX_MESSAGE_LENGTH } from '@const/limits';

export type PublishPayload = {
  chatId: Chat['id'];
  message: string;
};

export const publish: WSMessageHandler<PublishPayload> = ({ chatId, message }, { userId, name }) => {
  const messageText = message.trim();

  if (!messageText.length || messageText.length > MAX_MESSAGE_LENGTH) {
    return;
  }

  const chat = manager.getChat(chatId);

  if (chat) {
    chat.publish(message, userId, name);
  }
};
