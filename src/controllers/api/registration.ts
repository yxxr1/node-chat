import { RequestHandler } from 'express';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { userService } from '@services/user';
import type { AuthData } from '@controllers/types';
import { setRefreshTokenCookie } from '@controllers/utils';

type Input = {
  username: string;
  password: string;
};
type Output = AuthData;

export const registration: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { username, password } = validateParams<Input>(req);

  if (req.headers.authorization) {
    throw new HttpError(403, 'Already authorized');
  }

  try {
    const data = await userService.registration(username, password);

    setRefreshTokenCookie(res, data.refreshToken);
    res.json(data);
  } catch (e: unknown) {
    throw new HttpError(401, (e as Error).message);
  }
};
