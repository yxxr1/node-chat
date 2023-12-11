import { RequestHandler } from 'express';
import { manager, Chat } from '@core';
import { HttpError } from '@utils/errors';

export const post: RequestHandler = (req, res) => {
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

export const get: RequestHandler = (req, res) => {
  const { watch } = req.query;
  const { userId } = req.session;

  if (watch) {
    manager.subscribe(userId as string, res);
  } else {
    const chats = manager.chats.map(({ id, name }) => ({ id, name, messages: [] }));
    const joinedChatsIds = manager.chats
      .filter(({ joinedUsers }) => joinedUsers.includes(req.session.userId as string)).map(({ id }) => id);
    res.json({ chats, joinedChatsIds });
  }
}
