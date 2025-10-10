import { RequestHandler } from 'express';
import { manager } from '@services/chat';
import type { Chat as ChatType } from '@controllers/types';

type Output = {
  chats: ChatType[];
  joinedChatsIds: ChatType['id'][];
};

export const getChats: RequestHandler<Record<string, never>, Output, void> = async (req, res) => {
  const { userId } = req.session;

  const chats = await manager.getChatEntities(userId as string);
  const joinedChatsIds = (await manager.getUserJoinedChats(userId as string)).map(({ id }) => id);
  res.json({ chats, joinedChatsIds });
};
