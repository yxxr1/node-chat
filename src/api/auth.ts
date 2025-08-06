import { RequestHandler } from 'express';
import { nanoid } from 'nanoid';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { manager } from '@core';
import { User, UserSettings } from '@interfaces/api-types';
import { CONNECTION_METHODS } from '@const/settings';

const DEFAULT_USER_SETTINGS: UserSettings = {
  connectionMethod: CONNECTION_METHODS.WS,
  theme: 'light',
  isNotificationsEnabled: false,
  isShowNotificationMessageText: true,
};

type PostInput = {
  name: User['name'] | null;
  settings?: UserSettings;
};
type PostOutput =
  | User
  | {
      id: null;
      name: null;
    };

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = async (req, res) => {
  const { name, settings } = validateParams<PostInput>(req);

  if (name === null) {
    if (!req.session.userId) {
      throw new HttpError(403, 'Not authorized');
    }

    manager.closeUserWatchers(req.session.userId);
    const userJoinedChats = await manager.getUserJoinedChats(req.session.userId as string);
    await Promise.all(
      userJoinedChats.map(async (chat) => {
        const count = await chat.quit(req.session.userId as string, req.session.name as string);

        if (count === 0) {
          await manager.deleteChat(chat.id);
        }
      }),
    );

    req.session.destroy(() => {
      res.json({ id: null, name: null });
    });
  } else {
    if (req.session.userId) {
      throw new HttpError(403, 'Already authorized');
    }

    const id = nanoid();

    req.session.userId = id;
    req.session.name = name;
    req.session.settings = {
      ...DEFAULT_USER_SETTINGS,
      ...settings,
    };

    res.json({ id, name, settings: req.session.settings });
  }
};
