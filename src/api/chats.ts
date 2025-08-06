import { RequestHandler } from 'express';
import { manager, Chat } from '@core';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { Chat as ChatType } from '@interfaces/api-types';

type PostInput = {
  name: ChatType['name'];
};
type PostOutput = ChatType;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = async (req, res) => {
  const { name } = validateParams<PostInput>(req);

  const chat = await Chat.createChat(name, req.session.userId);

  if (chat === null) {
    throw new HttpError(403, 'Already exists');
  }

  await manager.addChat(chat);

  res.json(await chat.getChatEntity());
};

type GetOutput = {
  chats: ChatType[];
  joinedChatsIds: ChatType['id'][];
};

export const get: RequestHandler<Record<string, never>, GetOutput, void> = async (req, res) => {
  const { userId } = req.session;

  const chats = await manager.getChatEntities(userId as string);
  const joinedChatsIds = (await manager.getUserJoinedChats(userId as string)).map(({ id }) => id);
  res.json({ chats, joinedChatsIds });
};
