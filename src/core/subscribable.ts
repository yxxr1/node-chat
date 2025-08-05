import { nanoid } from 'nanoid';
import { UserId, WatcherId, WatchersDictionary, SubscribeAction, DefaultType, CallbackForAction, WatcherCallback } from '@interfaces/core';

export const DEFAULT_TYPE: DefaultType = 'DEFAULT';

export class Subscribable<Actions extends SubscribeAction> {
  _watchers: WatchersDictionary = {};

  async subscribe<SubscribeType extends Actions['type'] = DefaultType>(
    userId: UserId | null,
    callback: CallbackForAction<Actions, SubscribeType>,
    type?: SubscribeType,
    onUnsubscribed?: () => void,
  ): Promise<WatcherId> {
    const id = nanoid();

    this._watchers[id] = { id, userId, callback: callback as WatcherCallback, type: type ?? DEFAULT_TYPE, onUnsubscribed };

    return id;
  }

  unsubscribe(watcherId: WatcherId) {
    delete this._watchers[watcherId];
  }

  closeUserWatchers(userId: UserId | null): void {
    for (const id in this._watchers) {
      const { userId: watcherUserId, onUnsubscribed } = this._watchers[id];

      if (watcherUserId === userId) {
        onUnsubscribed?.();
        this.unsubscribe(id);
      }
    }
  }

  _closeAllWatchers() {
    for (const id in this._watchers) {
      const { onUnsubscribed } = this._watchers[id];

      onUnsubscribed?.();
      this.unsubscribe(id);
    }
  }

  _broadcast<BroadcastType extends Actions['type'] = DefaultType>(
    payload: Extract<Actions, { type: BroadcastType }>['payload'],
    type?: BroadcastType,
  ): void {
    for (const id in this._watchers) {
      const { type: watcherType } = this._watchers[id];

      if (watcherType === type) {
        this._watchers[id]?.callback(payload);
      }
    }
  }
}
