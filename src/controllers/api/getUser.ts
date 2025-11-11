import { RequestHandler } from 'express';
import type { User } from '@controllers/types';
import { userModel } from '@model/user';
import { getTokenData } from '@utils/validation';

type Output = User;

export const getUser: RequestHandler<Record<string, never>, Output> = async (req, res) => {
  const { id } = getTokenData(req);
  const user = await userModel.getUser(id);

  if (!user) {
    throw new Error('cant get user');
  }

  res.json({
    id: user.id,
    username: user.username,
    settings: user.settings,
  });
};
