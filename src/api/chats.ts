import { RequestHandler } from 'express';
import { manager, Chat } from '@core';
import { HttpError } from '@utils/errors';
import { Chat as ChatType } from '@interfaces/api-types';

const SUBSCRIBE_TIMEOUT = 30000;

type PostInput = {
  name: ChatType['name'];
};
type PostOutput = ChatType;

export const post: RequestHandler<{}, PostOutput, PostInput> = (req, res) => {
  const { name } = req.body;

  if (!name || !/^[a-zA-Zа-я0-9]{3,12}$/.test(name)) {
    throw new HttpError(403, 'Invalid name');
  }

  if (manager.chats.find(({ name: existingName }) => existingName === name)) {
    throw new HttpError(403, 'Already exists');
  }

  const chat = new Chat(name, req.session.userId);
  manager.addChat(chat);

  res.json({ id: chat.id, name: chat.name, messages: [] });
}

type GetOutput = {
  chats: ChatType[];
  joinedChatsIds?: ChatType['id'][];
  deletedChatsIds?: ChatType['id'][];
};

export const get: RequestHandler<{}, GetOutput, {}, { watch?: boolean }> = (req, res) => {
  const { watch } = req.query;
  const { userId } = req.session;

  if (watch) {
    let watcherId: string;

    const timerId = setTimeout(() => {
      res.json({ chats: [], deletedChatsIds: [] });
      manager.unsubscribe(watcherId);
    }, SUBSCRIBE_TIMEOUT);

    res.on('close', () => {
      clearTimeout(timerId);

      manager.unsubscribe(watcherId);
    });

    watcherId = manager.subscribe(req.session.userId as string, (status, data: GetOutput) => {
      clearTimeout(timerId);
      res.statusCode = status;
      res.json(data);
    });
  } else {
    const chats = manager.chats.map(({ id, name }) => ({ id, name, messages: [] }));
    const joinedChatsIds = manager.chats
      .filter(({ joinedUsers }) => joinedUsers.includes(req.session.userId as string)).map(({ id }) => id);
    res.json({ chats, joinedChatsIds });
  }
}
