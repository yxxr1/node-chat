import { RequestHandler } from 'express';
import type { User, UserSettings } from '@controllers/types';
import { validateParams } from '@utils/validation';

type Input = {
  name: User['name'];
  settings?: UserSettings;
};
type Output = User;

export const editUser: RequestHandler<Record<string, never>, Output, Input> = (req, res) => {
  const { name, settings } = validateParams<Input>(req);

  req.session.name = name;

  if (settings) {
    req.session.settings = {
      ...req.session.settings,
      ...settings,
    };
  }

  res.json({
    id: req.session.userId as User['id'],
    name: req.session.name as User['name'],
    settings: req.session.settings as UserSettings,
  });
};
