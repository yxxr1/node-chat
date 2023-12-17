export type WatcherCallback<Data> = (data: Data, isUnsubscribed: boolean) => void;
export type WatcherId = string;
export type UserId = string;

export type ConnectionRecord = {
  id: WatcherId;
  callback: WatcherCallback;
  userId: UserId;
};
export type WatchersDictionary = {
  [watcherId: WatcherId]: ConnectionRecord;
};

export interface Subscribable<SubscribeData> {
  _watchers: WatchersDictionary;

  _callWatcher(watcherId: WatcherId, data?: Partial<SubscribeData> | null): void;
  _broadcast(data: Partial<SubscribeData>): void;
  closeUserWatchers(userId: UserId): void;
  subscribe(userId: UserId, callback: WatcherCallback<SubscribeData>): WatcherId | null;
  unsubscribe(watcherId: WatcherId): void;
}
