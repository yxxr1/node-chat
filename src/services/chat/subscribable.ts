import { nanoid } from 'nanoid';
import type {
  WatcherId,
  WatchersDictionary,
  SubscribeAction,
  CallbackForAction,
  PayloadForAction,
  WatcherCallback,
  WildcardSubscribeType,
} from './types';

const WILDCARD_TYPE: WildcardSubscribeType = '*';

export class Subscribable<Actions extends SubscribeAction, Meta extends Record<string, string>> {
  _watchers: WatchersDictionary<Meta> = {};

  subscribe<SubscribeType extends Actions['type'] | WildcardSubscribeType>(
    type: SubscribeType,
    callback: CallbackForAction<Actions, SubscribeType>,
    meta?: Meta,
    onUnsubscribed?: () => void,
  ): WatcherId {
    const id = nanoid();

    this._watchers[id] = { id, type, callback: callback as WatcherCallback, meta, onUnsubscribed };

    return id;
  }

  unsubscribe(watcherId: WatcherId) {
    delete this._watchers[watcherId];
  }

  closeWatchersByMetaKey(key: keyof Meta, value: string): void {
    for (const id in this._watchers) {
      const { meta, onUnsubscribed } = this._watchers[id];

      if (meta && meta[key] === value) {
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
    type: BroadcastType,
    payload: PayloadForAction<Actions, BroadcastType>,
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
