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

  if (manager.chats.find(({ name: existingName }) => existingName === name)) {
    throw new HttpError(403, 'Already exists');
  }

  const chat = new Chat(name, req.session.userId);
  await chat.init();
  await manager.addChat(chat);

  res.json(await chat.getChatEntity());
};

type GetOutput = {
  chats: ChatType[];
  joinedChatsIds: ChatType['id'][];
};

export const get: RequestHandler<Record<string, never>, GetOutput, void> = async (req, res) => {
  const { userId } = req.session;

  const chats = await Promise.all(manager.chats.map((chat) => chat.getChatEntity(userId as string)));
  const joinedChatsIds = (await manager.getUserJoinedChats(userId as string)).map(({ id }) => id);
  res.json({ chats, joinedChatsIds });
};
