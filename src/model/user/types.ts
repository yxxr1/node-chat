import { CONNECTION_METHODS, UI_THEMES } from '@/const/settings';

export type UserSettings = {
  connectionMethod: (typeof CONNECTION_METHODS)[keyof typeof CONNECTION_METHODS];
  theme: (typeof UI_THEMES)[keyof typeof UI_THEMES];
  isNotificationsEnabled: boolean;
  isShowNotificationMessageText: boolean;
};

export type UserRecord = {
  id: string;
  username: string;
  passwordHash: string;
  settings: UserSettings;
};

export type UserWithoutCredentials = Omit<UserRecord, 'passwordHash'>;
