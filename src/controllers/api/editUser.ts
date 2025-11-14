import type { RequestHandler } from 'express';
import type { User, UserSettings } from '@/controllers/types';
import { getTokenData, validateParams } from '@/utils/validation';
import { userModel } from '@/model/user';

type Input = {
  username: User['username'];
  settings?: Partial<UserSettings>;
};
type Output = User;

export const editUser: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { username, settings } = validateParams<Input>(req);
  const { id: userId } = getTokenData(req);

  await userModel.updateUser(userId, { username, settings });
  const user = await userModel.getUser(userId);

  if (!user) {
    throw new Error('cant get user');
  }

  res.json({
    id: user.id,
    username: user.username,
    settings: user.settings,
  });
};
