import { RequestHandler } from 'express';
import { manager, Chat } from '@core';
import { HttpError } from '@utils/errors';
import { validateName } from '@utils/validation';
import { Chat as ChatType } from '@interfaces/api-types';

const SUBSCRIBE_TIMEOUT = 30000;

type PostInput = {
  name: ChatType['name'];
};
type PostOutput = ChatType;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { name } = req.body;

  if (!validateName(name)) {
    throw new HttpError(403, 'Invalid name');
  }

  if (manager.chats.find(({ name: existingName }) => existingName === name)) {
    throw new HttpError(403, 'Already exists');
  }

  const chat = new Chat(name, req.session.userId);
  manager.addChat(chat);

  res.json({ id: chat.id, name: chat.name, messages: [] });
};

type GetOutput = {
  chats: ChatType[];
  joinedChatsIds?: ChatType['id'][];
  deletedChatsIds?: ChatType['id'][];
};

export const get: RequestHandler<Record<string, never>, GetOutput, void, { watch?: boolean }> = (req, res) => {
  const { watch } = req.query;

  if (watch) {
    const timerId = setTimeout(() => {
      res.json({ chats: [], deletedChatsIds: [] });
      manager.unsubscribe(watcherId);
    }, SUBSCRIBE_TIMEOUT);

    res.on('close', () => {
      clearTimeout(timerId);
      manager.unsubscribe(watcherId);
    });

    const watcherId = manager.subscribe(req.session.userId as string, (data) => {
      clearTimeout(timerId);
      res.json(data);
      manager.unsubscribe(watcherId);
    });
  } else {
    const chats = manager.chats.map(({ id, name }) => ({ id, name, messages: [] }));
    const joinedChatsIds = manager.getUserJoinedChats(req.session.userId as string).map(({ id }) => id);
    res.json({ chats, joinedChatsIds });
  }
};
