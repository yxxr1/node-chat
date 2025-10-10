import { RequestHandler } from 'express';
import type { User, UserSettings } from '@controllers/types';

type Output = User;

export const getUser: RequestHandler<Record<string, never>, Output> = (req, res) => {
  res.json({
    id: req.session.userId as User['id'],
    name: req.session.name as User['name'],
    settings: req.session.settings as UserSettings,
  });
};
