import { RequestHandler } from 'express';
import { manager, MANAGER_SUBSCRIBE_TYPES, ManagerDefaultSubscribeData, ManagerChatUpdatedSubscribeData } from '@core';
import { Chat as ChatType } from '@interfaces/api-types';

const SUBSCRIBE_TIMEOUT = 30000;

type GetOutput = {
  newChats: ChatType[];
  deletedChatsIds: ChatType['id'][];
  updatedChats: ChatType[];
};
const emptyResponse = { newChats: [], deletedChatsIds: [], updatedChats: [] };

export const get: RequestHandler<Record<string, never>, GetOutput, void> = (req, res) => {
  const { userId } = req.session;

  const timerId = setTimeout(() => {
    res.json(emptyResponse);
    manager.unsubscribe(defaultWatcherId);
    manager.unsubscribe(chatUpdatedWatcherId);
  }, SUBSCRIBE_TIMEOUT);

  res.on('close', () => {
    clearTimeout(timerId);
    manager.unsubscribe(defaultWatcherId);
    manager.unsubscribe(chatUpdatedWatcherId);
  });

  const closeQuery = (data: GetOutput) => {
    clearTimeout(timerId);
    manager.unsubscribe(defaultWatcherId);
    manager.unsubscribe(chatUpdatedWatcherId);

    res.json(data);
  };

  const defaultWatcherId = manager.subscribe<ManagerDefaultSubscribeData>(userId as string, ({ type, payload }) => {
    closeQuery(type === MANAGER_SUBSCRIBE_TYPES.DEFAULT ? { ...payload, updatedChats: [] } : emptyResponse);
  });

  const chatUpdatedWatcherId = manager.subscribe<ManagerChatUpdatedSubscribeData>(
    userId as string,
    ({ type, payload }) => {
      if (type === MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED) {
        const { chatId, onlyForJoined } = payload;
        const chat = manager.getChat(chatId);

        if (chat && (!onlyForJoined || chat.isJoined(userId as string))) {
          closeQuery({ updatedChats: [chat.getChatEntity(userId as string, false)], newChats: [], deletedChatsIds: [] });
        }
      } else {
        closeQuery(emptyResponse);
      }
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED,
  );
};
