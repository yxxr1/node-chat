import { RequestHandler } from 'express';
import { manager, MANAGER_SUBSCRIBE_TYPES } from '@services/chat';
import type { WatchChatsPayload } from '@controllers/types';

const SUBSCRIBE_TIMEOUT = 30000;

type Output = WatchChatsPayload;
const emptyResponse = { newChats: [], deletedChatsIds: [], updatedChats: [] };

export const chatsSubscribe: RequestHandler<Record<string, never>, Output, void> = async (req, res) => {
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

  const closeQuery = (data: Output) => {
    clearTimeout(timerId);
    manager.unsubscribe(defaultWatcherId);
    manager.unsubscribe(chatUpdatedWatcherId);

    res.json(data);
  };

  const defaultWatcherId = manager.subscribe(
    userId as string,
    ({ payload }) => {
      closeQuery({ ...payload, updatedChats: [] });
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_LIST_UPDATED,
    () => closeQuery(emptyResponse),
  );

  const chatUpdatedWatcherId = manager.subscribe(
    userId as string,
    async ({ payload }) => {
      const { chatId, onlyForJoined } = payload;

      const chat = manager.getChat(chatId);

      if (chat && (!onlyForJoined || (await chat.isJoined(userId as string)))) {
        closeQuery({ updatedChats: [await chat.getChatEntity(userId as string, false)], newChats: [], deletedChatsIds: [] });
      }
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED,
    () => closeQuery(emptyResponse),
  );
};
