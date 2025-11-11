import { RequestHandler } from 'express';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { userService } from '@services/user';
import { resetRefreshTokenCookie } from '@controllers/utils';

type Headers = { refreshToken: string };
type Output = Record<string, never>;

export const logout: RequestHandler<Record<string, never>, Output> = async (req, res) => {
  const { refreshToken } = validateParams<Headers>(req);

  try {
    await userService.logout(refreshToken);

    resetRefreshTokenCookie(res);
    res.json({});
  } catch (e: unknown) {
    throw new HttpError(401, (e as Error).message);
  }
};
