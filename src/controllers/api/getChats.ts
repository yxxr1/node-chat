import type { RequestHandler } from 'express';
import { manager } from '@/services/chat';
import type { Chat as ChatType } from '@/controllers/types';
import { getTokenData } from '@/utils/validation';

type Output = {
  chats: ChatType[];
  joinedChatsIds: ChatType['id'][];
};

export const getChats: RequestHandler<Record<string, never>, Output, void> = async (req, res) => {
  const { id: userId } = getTokenData(req);

  const chats = await manager.getChatEntities(userId);
  const joinedChatsIds = (await manager.getUserJoinedChats(userId)).map(({ id }) => id);
  res.json({ chats, joinedChatsIds });
};
