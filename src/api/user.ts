import { RequestHandler } from 'express';
import { User, UserSettings } from '@interfaces/api-types';
import { validateParams } from '@utils/validation';

type PostInput = {
  name: User['name'];
  settings?: UserSettings;
};
type PostOutput = User;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { name, settings } = validateParams<PostInput>(req);

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

type GetOutput = User;

export const get: RequestHandler<Record<string, never>, GetOutput> = (req, res) => {
  res.json({
    id: req.session.userId as User['id'],
    name: req.session.name as User['name'],
    settings: req.session.settings as UserSettings,
  });
};
