import { nanoid } from 'nanoid';
import { UserId, WatcherCallback, WatcherId, WatchersDictionary, SubscribeAction } from '@interfaces/core';

export const DEFAULT_TYPE = 'DEFAULT' as const;
export const UNSUBSCRIBED_TYPE = 'UNSUBSCRIBED' as const;
export type WithUnsubscribeAction<Actions> = Actions | SubscribeAction<typeof UNSUBSCRIBED_TYPE, Record<string, never>>;
export type CallbackForAction<Actions, ActionType> = WatcherCallback<WithUnsubscribeAction<Extract<Actions, { type: ActionType }>>>;

export class Subscribable<Data extends SubscribeAction, SubscribeFailureType = never> {
  _watchers: WatchersDictionary<WithUnsubscribeAction<any>> = {};

  subscribe<SubscribeType extends Data['type'] = typeof DEFAULT_TYPE>(
    userId: UserId | null,
    callback: CallbackForAction<Data, SubscribeType>,
    type?: SubscribeType,
  ): WatcherId | SubscribeFailureType {
    const id = nanoid();

    this._watchers[id] = { id, userId, callback, type: type ?? DEFAULT_TYPE };

    return id;
  }

  unsubscribe(watcherId: WatcherId) {
    delete this._watchers[watcherId];
  }

  closeUserWatchers(userId: UserId | null): void {
    Object.values(this._watchers).forEach(({ id, userId: watcherUserId }) => {
      if (watcherUserId === userId) {
        this._callWatcher(id, { type: UNSUBSCRIBED_TYPE, payload: {} } as Data);
        this.unsubscribe(id);
      }
    });
  }

  _closeAllWatchers() {
    Object.values(this._watchers).forEach(({ id }) => {
      this._callWatcher(id, { type: UNSUBSCRIBED_TYPE, payload: {} } as Data);
      this.unsubscribe(id);
    });
  }

  _callWatcher(watcherId: WatcherId, data: Data): void {
    this._watchers[watcherId]?.callback(data);
  }

  _broadcast<BroadcastData extends SubscribeAction = Data>(
    payload: BroadcastData['payload'],
    type: BroadcastData['type'] = DEFAULT_TYPE,
  ): void {
    Object.values(this._watchers).forEach(({ id: watcherId, type: watcherType }) => {
      if (watcherType === type) {
        this._callWatcher(watcherId, { type, payload } as Data);
      }
    });
  }
}
