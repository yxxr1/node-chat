import { CONNECTION_METHODS } from '@const/settings';
import type { UserSettings } from '@model/user';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  connectionMethod: CONNECTION_METHODS.WS,
  theme: 'light',
  isNotificationsEnabled: false,
  isShowNotificationMessageText: true,
};
