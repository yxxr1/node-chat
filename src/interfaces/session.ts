import 'express-session';
import { UserSettings } from '@interfaces/api-types';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    name: string | null;
    settings: UserSettings;
  }
}
