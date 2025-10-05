import { nanoid } from 'nanoid';
import { manager } from '@services/chat';
import type { UserSettings } from '@model/types';
import { CONNECTION_METHODS } from '@const/settings';

const DEFAULT_USER_SETTINGS: UserSettings = {
  connectionMethod: CONNECTION_METHODS.WS,
  theme: 'light',
  isNotificationsEnabled: false,
  isShowNotificationMessageText: true,
};

export function login(
  session: Express.Request['session'],
  name: string,
  settings?: UserSettings,
): asserts session is Required<Express.Request['session']> {
  session.userId = nanoid();
  session.name = name;
  session.settings = {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
  };
}

export const logout = async (session: Express.Request['session']) => {
  const userId = session.userId;
  const userName = session.name || '';

  if (userId) {
    return new Promise(async (resolve, reject) => {
      manager.closeUserWatchers(userId);
      const userJoinedChats = await manager.getUserJoinedChats(userId);
      await Promise.all(
        userJoinedChats.map(async (chat) => {
          const count = await chat.quit(userId, userName);

          if (count === 0) {
            await manager.deleteChat(chat.id);
          }
        }),
      );

      session.destroy((err) => (err ? reject(err) : resolve(true)));
    });
  }
};
