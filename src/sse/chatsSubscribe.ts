import { RequestHandler } from 'express';
import { manager, MANAGER_SUBSCRIBE_TYPES } from '@core';
import { WatchChats } from '@interfaces/subscribe-data';

type SSEData = WatchChats;

export const get: RequestHandler<Record<string, never>, string> = (req, res) => {
  const { userId } = req.session;

  res.on('close', () => {
    manager.unsubscribe(defaultWatcherId);
    manager.unsubscribe(chatUpdatedWatcherId);
  });

  const writeToUser = (data: SSEData) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const defaultWatcherId = manager.subscribe(
    userId as string,
    ({ payload }) => {
      writeToUser({ ...payload, updatedChats: [] });
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_LIST_UPDATED,
    () => res.end(),
  );

  const chatUpdatedWatcherId = manager.subscribe(
    userId as string,
    async ({ payload }) => {
      const { chatId, onlyForJoined } = payload;

      const chat = manager.getChat(chatId);

      if (chat && (!onlyForJoined || (await chat.isJoined(userId as string)))) {
        writeToUser({ updatedChats: [await chat.getChatEntity(userId as string, false)], newChats: [], deletedChatsIds: [] });
      }
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED,
    () => res.end(),
  );
};
