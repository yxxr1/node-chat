import type { RequestHandler } from 'express';
import { manager, MANAGER_SUBSCRIBE_TYPES } from '@/services/chat';
import type { WatchChatsPayload } from '@/controllers/types';
import { getTokenData } from '@/utils/validation';

const SUBSCRIBE_TIMEOUT = 30000;

type Output = WatchChatsPayload;
const emptyResponse = { newChats: [], deletedChatsIds: [], updatedChats: [] };

export const chatsSubscribe: RequestHandler<Record<string, never>, Output, void> = async (req, res) => {
  const { id: userId, sessionId } = getTokenData(req);

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
    MANAGER_SUBSCRIBE_TYPES.CHAT_LIST_UPDATED,
    ({ payload }) => {
      closeQuery({ ...payload, updatedChats: [] });
    },
    { userId, sessionId },
    () => closeQuery(emptyResponse),
  );

  const chatUpdatedWatcherId = manager.subscribe(
    MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED,
    async ({ payload }) => {
      const { chatId, onlyForJoined } = payload;

      const chat = manager.getChat(chatId);

      if (chat && (!onlyForJoined || (await chat.isJoined(userId)))) {
        closeQuery({ updatedChats: [await chat.getChatEntity(userId, false)], newChats: [], deletedChatsIds: [] });
      }
    },
    { userId, sessionId },
    () => closeQuery(emptyResponse),
  );
};
