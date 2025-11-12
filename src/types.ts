import { UserDto } from '@/services/user';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tokenData?: UserDto;
    }
  }
}
