import { RequestHandler } from 'express';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { User, UserSettings } from '@interfaces/api-types';
import { login, logout } from '@core/user';

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

  const session = req.session;

  if (name === null) {
    if (!session.userId) {
      throw new HttpError(403, 'Not authorized');
    }

    await logout(session);

    res.json({ id: null, name: null });
  } else {
    if (session.userId) {
      throw new HttpError(403, 'Already authorized');
    }

    login(session, name, settings);

    res.json({ id: session.id, name: session.name, settings: session.settings });
  }
};
