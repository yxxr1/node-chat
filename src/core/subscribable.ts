import { nanoid } from 'nanoid';
import {
  UserId,
  WatcherId,
  WatchersDictionary,
  SubscribeAction,
  CallbackForAction,
  PayloadForAction,
  WatcherCallback,
  WildcardSubscribeType,
} from '@interfaces/core';

const WILDCARD_TYPE: WildcardSubscribeType = '*';

export class Subscribable<Actions extends SubscribeAction> {
  _watchers: WatchersDictionary = {};

  subscribe<SubscribeType extends Actions['type'] | WildcardSubscribeType>(
    userId: UserId | null,
    callback: CallbackForAction<Actions, SubscribeType>,
    type: SubscribeType,
    onUnsubscribed?: () => void,
  ): WatcherId {
    const id = nanoid();

    this._watchers[id] = { id, userId, callback: callback as WatcherCallback, type, onUnsubscribed };

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

  _broadcast<BroadcastType extends Actions['type']>(
    payload: PayloadForAction<Actions, BroadcastType>,
    type: BroadcastType,
    extra?: Record<string, unknown>,
  ): void {
    for (const id in this._watchers) {
      const { type: watcherType } = this._watchers[id];

      if (watcherType === type || watcherType === WILDCARD_TYPE) {
        this._watchers[id]?.callback({ type, payload, extra });
      }
    }
  }
}
