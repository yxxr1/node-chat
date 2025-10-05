import 'express-session';
import { UserSettings } from '@controllers/types';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    name: string;
    settings: UserSettings;
  }
}
