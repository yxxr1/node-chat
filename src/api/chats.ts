import { RequestHandler } from 'express';
import { manager, Chat } from '@core';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { Chat as ChatType } from '@interfaces/api-types';

const SUBSCRIBE_TIMEOUT = 30000;

type PostInput = {
  name: ChatType['name'];
};
type PostOutput = ChatType;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { name } = validateParams<PostInput>(req);

  if (manager.chats.find(({ name: existingName }) => existingName === name)) {
    throw new HttpError(403, 'Already exists');
  }

  const chat = new Chat(name, req.session.userId);
  manager.addChat(chat);

  res.json({ id: chat.id, name: chat.name, messages: [] });
};

type GetOutput =
  | {
      chats: ChatType[];
      joinedChatsIds: ChatType['id'][];
    }
  | {
      chats: ChatType[];
      deletedChatsIds: ChatType['id'][];
    };
type GetInput = {
  watch?: boolean;
};

export const get: RequestHandler<Record<string, never>, GetOutput, void> = (req, res) => {
  const { watch } = validateParams<GetInput>(req);
  const { userId } = req.session;

  if (watch) {
    const timerId = setTimeout(() => {
      res.json({ chats: [], deletedChatsIds: [] });
      manager.unsubscribe(watcherId);
    }, SUBSCRIBE_TIMEOUT);

    res.on('close', () => {
      clearTimeout(timerId);
      manager.unsubscribe(watcherId);
    });

    const watcherId = manager.subscribe(userId as string, (data) => {
      clearTimeout(timerId);
      res.json(data ?? { chats: [], deletedChatsIds: [] });
      manager.unsubscribe(watcherId);
    });
  } else {
    const chats = manager.chats.map((chat) => ({ id: chat.id, name: chat.name, messages: chat.getMessages(userId as string) ?? [] }));
    const joinedChatsIds = manager.getUserJoinedChats(userId as string).map(({ id }) => id);
    res.json({ chats, joinedChatsIds });
  }
};
