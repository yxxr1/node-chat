import { nanoid } from 'nanoid';
import { Subscribable as SubscribableI, UserId, WatcherCallback, WatcherId, WatchersDictionary } from '@interfaces/core';

export class Subscribable<Data, SubscribeFailureType = never> implements SubscribableI<Data, SubscribeFailureType> {
  _watchers: WatchersDictionary<Data> = {};

  subscribe(userId: UserId, callback: WatcherCallback<Data>): WatcherId | SubscribeFailureType {
    const id = nanoid();

    this._watchers[id] = { id, userId, callback };

    return id;
  }

  unsubscribe(watcherId: WatcherId) {
    delete this._watchers[watcherId];
  }

  closeUserWatchers(userId: UserId): void {
    Object.values(this._watchers).forEach(({ id, userId: watcherUserId }) => {
      if (watcherUserId === userId) {
        this._callWatcher(id, null);
        this.unsubscribe(id);
      }
    });
  }

  _callWatcher(watcherId: WatcherId, data?: Data | null): void {
    if (this._watchers[watcherId]) {
      this._watchers[watcherId].callback(data ?? null);
    }
  }

  _broadcast(data: Data): void {
    Object.keys(this._watchers).forEach((watcherId) => {
      this._callWatcher(watcherId, data);
    });
  }
}
